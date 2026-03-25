import Foundation
import Capacitor
import Photos
import UIKit

private enum DailyCurationTime {
    static func dayKey(resetHour: Int = 17, now: Date = Date(), timeZone: TimeZone = .current) -> String {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = timeZone
        let hour = cal.component(.hour, from: now)

        let base: Date
        if hour < resetHour {
            let start = cal.startOfDay(for: now)
            base = cal.date(byAdding: .day, value: -1, to: start) ?? start
        } else {
            base = cal.startOfDay(for: now)
        }

        let y = cal.component(.year, from: base)
        let m = cal.component(.month, from: base)
        let d = cal.component(.day, from: base)
        return String(format: "%04d-%02d-%02d", y, m, d)
    }
}

private struct DailyCurationItem: Codable {
    let assetId: String
    let score: Int
    let flags: [String]
    let createdAt: TimeInterval
}

private struct DailyCurationCache: Codable {
    let dayKey: String
    let items: [DailyCurationItem]
    let version: Int
}

private final class DailyCurationStore {
    private let appliedKey = "daily_curation_applied_v1"
    private let pendingKey = "daily_curation_pending_v1"
    private let mutationKey = "daily_curation_mutation_daykey_v1"
    private let skipMapKey = "daily_curation_skipmap_v1"

    func loadApplied() -> DailyCurationCache? { decode(appliedKey) }
    func saveApplied(_ cache: DailyCurationCache) { encode(appliedKey, cache) }

    func loadPending() -> DailyCurationCache? { decode(pendingKey) }
    func savePending(_ cache: DailyCurationCache) { encode(pendingKey, cache) }

    func markMutation(dayKey: String) {
        UserDefaults.standard.set(dayKey, forKey: mutationKey)
    }

    func mutationDayKey() -> String? {
        UserDefaults.standard.string(forKey: mutationKey)
    }

    func loadSkipMap() -> [String: String] {
        UserDefaults.standard.dictionary(forKey: skipMapKey) as? [String: String] ?? [:]
    }

    func saveSkipMap(_ map: [String: String]) {
        UserDefaults.standard.set(map, forKey: skipMapKey)
    }

    func markSkipped(assetId: String, dayKey: String) {
        var map = loadSkipMap()
        map[assetId] = dayKey
        saveSkipMap(map)
    }

    private func decode<T: Decodable>(_ key: String) -> T? {
        guard let data = UserDefaults.standard.data(forKey: key) else { return nil }
        return try? JSONDecoder().decode(T.self, from: data)
    }

    private func encode<T: Encodable>(_ key: String, _ value: T) {
        guard let data = try? JSONEncoder().encode(value) else { return }
        UserDefaults.standard.set(data, forKey: key)
    }
}

private final class DailyCurationEngine {
    struct Config {
        var limitMax: Int = 6
        var fetchOldLimit: Int = 2500
        var fetchOldYears: Int = 1
        var burstDayThreshold: Int = 30
        var largePixelThreshold: Int = 20_000_000
    }

    private let cfg: Config

    init(cfg: Config = .init()) {
        self.cfg = cfg
    }

    func compute(dayKey: String, now: Date = Date(), excludeDayKey: String?, store: DailyCurationStore) -> DailyCurationCache {
        let candidates = fetchOldCandidates(now: now)
        let dayCounts = computeDayCounts(candidates)
        let skipSet = buildSkipSet(currentDayKey: dayKey, excludeDayKey: excludeDayKey, store: store)

        var scored: [(PHAsset, Int, [String])] = []
        scored.reserveCapacity(candidates.count)

        let cutoff = Calendar.current.date(byAdding: .year, value: -cfg.fetchOldYears, to: now) ?? now

        for asset in candidates {
            if asset.isFavorite { continue }
            if skipSet.contains(asset.localIdentifier) { continue }

            var score = 0
            var flags: [String] = []

            if let dt = asset.creationDate, dt <= cutoff {
                score += 10
                flags.append("old")
            }

            if asset.mediaSubtypes.contains(.photoScreenshot) {
                score += 25
                flags.append("screenshot")
            }

            if let dt = asset.creationDate {
                let dk = dayKeyOf(dt)
                if (dayCounts[dk] ?? 0) >= cfg.burstDayThreshold {
                    score += 5
                    flags.append("burst_day")
                }
            }

            if asset.pixelWidth * asset.pixelHeight >= cfg.largePixelThreshold {
                score += 20
                flags.append("large")
            }

            scored.append((asset, score, flags))
        }

        scored.sort {
            if $0.1 != $1.1 { return $0.1 > $1.1 }
            let d0 = $0.0.creationDate ?? .distantPast
            let d1 = $1.0.creationDate ?? .distantPast
            return d0 < d1
        }

        let topK = Array(scored.prefix(250))
        var final: [DailyCurationItem] = []
        final.reserveCapacity(cfg.limitMax)

        for (asset, base, baseFlags) in topK {
            if isInUserAlbum(asset: asset) { continue }
            var flags = baseFlags
            flags.append("unorganized")
            final.append(.init(assetId: asset.localIdentifier,
                               score: base + 30,
                               flags: flags,
                               createdAt: Date().timeIntervalSince1970))
            if final.count >= cfg.limitMax { break }
        }

        if final.count < min(3, cfg.limitMax) {
            for (asset, base, baseFlags) in topK {
                if final.contains(where: { $0.assetId == asset.localIdentifier }) { continue }
                var score = base
                var flags = baseFlags
                if isInUserAlbum(asset: asset) {
                    score -= 100
                    flags.append("in_album")
                } else {
                    score += 30
                    flags.append("unorganized")
                }
                final.append(.init(assetId: asset.localIdentifier,
                                   score: score,
                                   flags: flags,
                                   createdAt: Date().timeIntervalSince1970))
                if final.count >= min(3, cfg.limitMax) { break }
            }
        }

        return DailyCurationCache(dayKey: dayKey, items: final, version: 1)
    }

    private func fetchOldCandidates(now: Date) -> [PHAsset] {
        let options = PHFetchOptions()
        options.fetchLimit = cfg.fetchOldLimit
        options.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: true)]
        if let cutoff = Calendar.current.date(byAdding: .year, value: -cfg.fetchOldYears, to: now) {
            options.predicate = NSPredicate(format: "creationDate <= %@", cutoff as NSDate)
        }

        let result = PHAsset.fetchAssets(with: .image, options: options)
        var out: [PHAsset] = []
        out.reserveCapacity(min(result.count, cfg.fetchOldLimit))
        result.enumerateObjects { asset, _, _ in out.append(asset) }

        // Fallback: 오래된 사진 조건에서 0건이면 최근 사진까지 포함해 재시도
        if out.isEmpty {
            let fallbackOptions = PHFetchOptions()
            fallbackOptions.fetchLimit = cfg.fetchOldLimit
            fallbackOptions.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: true)]
            let fallbackResult = PHAsset.fetchAssets(with: .image, options: fallbackOptions)
            fallbackResult.enumerateObjects { asset, _, _ in out.append(asset) }
        }
        return out
    }

    private func computeDayCounts(_ assets: [PHAsset]) -> [String: Int] {
        var map: [String: Int] = [:]
        for asset in assets {
            guard let date = asset.creationDate else { continue }
            map[dayKeyOf(date), default: 0] += 1
        }
        return map
    }

    private func dayKeyOf(_ date: Date) -> String {
        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = .current
        let y = cal.component(.year, from: date)
        let m = cal.component(.month, from: date)
        let d = cal.component(.day, from: date)
        return String(format: "%04d-%02d-%02d", y, m, d)
    }

    private func isInUserAlbum(asset: PHAsset) -> Bool {
        let collections = PHAssetCollection.fetchAssetCollectionsContaining(asset, with: .album, options: nil)
        var found = false
        collections.enumerateObjects { collection, _, stop in
            if collection.assetCollectionSubtype == .albumRegular {
                found = true
                stop.pointee = true
            }
        }
        return found
    }

    private func buildSkipSet(currentDayKey: String, excludeDayKey: String?, store: DailyCurationStore) -> Set<String> {
        let activeDayKeys = Set([currentDayKey, excludeDayKey].compactMap { $0 })
        guard !activeDayKeys.isEmpty else { return [] }
        let map = store.loadSkipMap()
        let ids = map.compactMap { key, value in activeDayKeys.contains(value) ? key : nil }
        return Set(ids)
    }
}

@objc(RecocolPhotosPlugin)
public class RecocolPhotosPlugin: CAPPlugin {
    private let assetManager = PhotoAssetManager()
    private let curationStore = DailyCurationStore()

    @objc func fetchPhotos(_ call: CAPPluginCall) {
        let limit = call.getInt("limit") ?? 30
        let offset = call.getInt("offset") ?? 0

        // 권한 검증 로직은 getDailyCuration과 동일하게 재사용
        ensurePhotoLibraryAuthorized(call: call) {
            self.performFetchPhotos(call: call, limit: limit, offset: offset)
        }
    }

    private func performFetchPhotos(call: CAPPluginCall, limit: Int, offset: Int) {
        let userAlbums = PHAssetCollection.fetchAssetCollections(with: .album, subtype: .any, options: nil)
        var assetIdsInAlbums = Set<String>()

        userAlbums.enumerateObjects { (collection, _, _) in
            let assetsInAlbum = PHAsset.fetchAssets(in: collection, options: nil)
            assetsInAlbum.enumerateObjects { (asset, _, _) in
                assetIdsInAlbums.insert(asset.localIdentifier)
            }
        }

        let fetchOptions = PHFetchOptions()
        fetchOptions.sortDescriptors = [NSSortDescriptor(key: "creationDate", ascending: false)]

        let allPhotos = PHAsset.fetchAssets(with: .image, options: fetchOptions)
        var photos: [[String: Any]] = []

        let startIndex = min(offset, allPhotos.count)
        let endIndex = min(offset + limit, allPhotos.count)

        if startIndex < endIndex {
            for i in startIndex..<endIndex {
                let asset = allPhotos.object(at: i)

                var locationDict: [String: Double]? = nil
                if let location = asset.location {
                    locationDict = [
                        "latitude": location.coordinate.latitude,
                        "longitude": location.coordinate.longitude,
                        "altitude": location.altitude
                    ]
                }

                let resources = PHAssetResource.assetResources(for: asset)
                let fileSize = resources.first?.value(forKey: "fileSize") as? Int64 ?? 0

                let isInAlbum = assetIdsInAlbums.contains(asset.localIdentifier)

                let photoData: [String: Any] = [
                    "id": asset.localIdentifier,
                    "creationDate": asset.creationDate?.iso8601String ?? "",
                    "modificationDate": asset.modificationDate?.iso8601String ?? "",
                    "mediaType": "image",
                    "pixelWidth": asset.pixelWidth,
                    "pixelHeight": asset.pixelHeight,
                    "fileSize": fileSize,
                    "isFavorite": asset.isFavorite,
                    "isScreenshot": asset.mediaSubtypes.contains(.photoScreenshot),
                    "location": locationDict as Any,
                    "isInAlbum": isInAlbum
                ]
                photos.append(photoData)
            }
        }

        call.resolve([
            "photos": photos,
            "totalCount": allPhotos.count
        ])
    }

    @objc func getDailyCuration(_ call: CAPPluginCall) {
        ensurePhotoLibraryAuthorized(call: call) {
            self.performGetDailyCuration(call)
        }
    }

    private func performGetDailyCuration(_ call: CAPPluginCall) {
        let limit = max(call.getInt("limit") ?? 6, 1)
        let thumbSize = CGFloat(call.getDouble("thumbSize") ?? 420)
        let transport = call.getString("transport") ?? "base64"
        let forceRefresh = call.getBool("forceRefresh") ?? false
        let todayKey = DailyCurationTime.dayKey(resetHour: 17)
        let hasMutationToday = (curationStore.mutationDayKey() == todayKey)

        if let applied = curationStore.loadApplied(),
           applied.dayKey == todayKey,
           !forceRefresh,
           !hasMutationToday,
           !applied.items.isEmpty {
            returnWithThumbs(call: call, cache: applied, limit: limit, thumbSize: thumbSize, transport: transport, fromCache: true, needsRefresh: false)
            return
        }

        if let applied = curationStore.loadApplied(),
           applied.dayKey != todayKey,
           !forceRefresh,
           !applied.items.isEmpty {
            preparePendingToday(todayKey: todayKey)
            returnWithThumbs(call: call, cache: applied, limit: limit, thumbSize: thumbSize, transport: transport, fromCache: true, needsRefresh: true)
            return
        }

        if let pending = curationStore.loadPending(),
           pending.dayKey == todayKey,
           !pending.items.isEmpty,
           !forceRefresh,
           !hasMutationToday {
            curationStore.saveApplied(pending)
            returnWithThumbs(call: call, cache: pending, limit: limit, thumbSize: thumbSize, transport: transport, fromCache: false, needsRefresh: false)
            return
        }

        DispatchQueue.global(qos: .userInitiated).async {
            let engine = DailyCurationEngine(cfg: .init(limitMax: max(6, limit)))
            let yesterdayKey = self.yesterdayKey(of: todayKey)
            let cache = engine.compute(dayKey: todayKey, excludeDayKey: yesterdayKey, store: self.curationStore)
            self.curationStore.saveApplied(cache)
            self.returnWithThumbs(call: call, cache: cache, limit: limit, thumbSize: thumbSize, transport: transport, fromCache: false, needsRefresh: false)
        }
    }

    private func ensurePhotoLibraryAuthorized(call: CAPPluginCall, onAuthorized: @escaping () -> Void) {
        let status = PHPhotoLibrary.authorizationStatus()
        print("📸 [RecocolPhotos] PHAuthorizationStatus: \(status.rawValue)")

        if status == .notDetermined {
            PHPhotoLibrary.requestAuthorization { newStatus in
                DispatchQueue.main.async {
                    var isAuthorized = newStatus == .authorized
                    if #available(iOS 14, *) {
                        if newStatus == .limited {
                            isAuthorized = true
                        }
                    }

                    if isAuthorized {
                        onAuthorized()
                    } else {
                        call.reject("Photo library access denied")
                    }
                }
            }
            return
        }

        var isAuthorized = status == .authorized
        if #available(iOS 14, *) {
            if status == .limited {
                isAuthorized = true
            }
        }

        if !isAuthorized {
            call.reject("Photo library access not authorized")
            return
        }

        onAuthorized()
    }

    @objc func recordCurationAction(_ call: CAPPluginCall) {
        guard let assetId = call.getString("assetId"),
              let action = call.getString("action"),
              let dayKey = call.getString("dayKey") else {
            call.reject("missing params")
            return
        }

        if action == "skipped" || action == "recorded" {
            curationStore.markSkipped(assetId: assetId, dayKey: dayKey)
            curationStore.markMutation(dayKey: dayKey)
        } else if action == "deleted" {
            curationStore.markMutation(dayKey: dayKey)
        }

        call.resolve(["ok": true])
    }

    @objc func getPhotoSummary(_ call: CAPPluginCall) {
        guard let assetId = call.getString("assetId"),
              let asset = PhotoAssetManager.findAsset(id: assetId) else {
            call.reject("Asset not found")
            return
        }

        let includeFileSize = call.getBool("includeFileSize") ?? false

        var locationDict: [String: Double]? = nil
        if let location = asset.location {
            locationDict = [
                "latitude": location.coordinate.latitude,
                "longitude": location.coordinate.longitude,
                "altitude": location.altitude
            ]
        }

        var fileSize: Int64 = 0
        if includeFileSize {
            let resources = PHAssetResource.assetResources(for: asset)
            fileSize = resources.first?.value(forKey: "fileSize") as? Int64 ?? 0
        }

        call.resolve([
            "id": asset.localIdentifier,
            "creationDate": asset.creationDate?.iso8601String ?? "",
            "pixelWidth": asset.pixelWidth,
            "pixelHeight": asset.pixelHeight,
            "fileSize": fileSize,
            "location": locationDict as Any
        ])
    }

    @objc func getPhotoMetadata(_ call: CAPPluginCall) {
        guard let assetId = call.getString("assetId"),
              let asset = PhotoAssetManager.findAsset(id: assetId) else {
            call.reject("Asset not found")
            return
        }

        MetadataExtractor.extractMetadata(for: asset) { metadata in
            if let metadata = metadata {
                call.resolve(metadata.toJS())
            } else {
                call.reject("Failed to extract metadata")
            }
        }
    }

    @objc func loadImageData(_ call: CAPPluginCall) {
        guard let assetId = call.getString("assetId"),
              let quality = call.getString("quality"),
              let asset = PhotoAssetManager.findAsset(id: assetId) else {
            call.reject("Invalid parameters or asset not found")
            return
        }

        let thumbSize = CGFloat(call.getDouble("thumbSize") ?? 250)

        assetManager.loadImage(asset: asset, quality: quality, thumbSize: thumbSize) { base64 in
            if let base64 = base64 {
                call.resolve(["base64": base64])
            } else {
                call.reject("Failed to load image data")
            }
        }
    }

    @objc func deletePhoto(_ call: CAPPluginCall) {
        guard let assetId = call.getString("assetId"),
              let asset = PhotoAssetManager.findAsset(id: assetId) else {
            call.reject("Asset not found")
            return
        }

        PHPhotoLibrary.shared().performChanges({
            PHAssetChangeRequest.deleteAssets([asset] as NSArray)
        }) { success, error in
            if success {
                call.resolve(["success": true])
            } else {
                call.reject(error?.localizedDescription ?? "Delete failed")
            }
        }
    }

    private func preparePendingToday(todayKey: String) {
        if let pending = curationStore.loadPending(), pending.dayKey == todayKey, !pending.items.isEmpty {
            return
        }

        DispatchQueue.global(qos: .utility).async {
            let engine = DailyCurationEngine(cfg: .init(limitMax: 6))
            let yesterdayKey = self.yesterdayKey(of: todayKey)
            let pending = engine.compute(dayKey: todayKey, excludeDayKey: yesterdayKey, store: self.curationStore)
            self.curationStore.savePending(pending)
        }
    }

    private func yesterdayKey(of dayKey: String) -> String? {
        let parts = dayKey.split(separator: "-").map(String.init)
        guard parts.count == 3,
              let year = Int(parts[0]),
              let month = Int(parts[1]),
              let day = Int(parts[2]) else {
            return nil
        }

        var cal = Calendar(identifier: .gregorian)
        cal.timeZone = .current
        var comp = DateComponents()
        comp.year = year
        comp.month = month
        comp.day = day

        guard let date = cal.date(from: comp),
              let prev = cal.date(byAdding: .day, value: -1, to: date) else {
            return nil
        }

        let y = cal.component(.year, from: prev)
        let m = cal.component(.month, from: prev)
        let d = cal.component(.day, from: prev)
        return String(format: "%04d-%02d-%02d", y, m, d)
    }

    private func returnWithThumbs(call: CAPPluginCall,
                                  cache: DailyCurationCache,
                                  limit: Int,
                                  thumbSize: CGFloat,
                                  transport: String,
                                  fromCache: Bool,
                                  needsRefresh: Bool) {
        let candidateIds = cache.items.map { $0.assetId }
        let want = min(limit, cache.items.count)

        fetchThumbsSkippingICloud(candidateIds: candidateIds, thumbSize: thumbSize, want: want, transport: transport) { thumbs in
            var out: [[String: Any]] = []
            out.reserveCapacity(thumbs.count)

            for thumb in thumbs {
                guard let item = cache.items.first(where: { $0.assetId == thumb.assetId }) else { continue }
                out.append([
                    "assetId": item.assetId,
                    "score": item.score,
                    "flags": item.flags,
                    "thumb": thumb.payload
                ])
            }

            // 썸네일 생성 실패가 연쇄로 발생하면(예: PHPhotosErrorDomain 3303), 후보 자체는 반환해 홈이 비지 않게 유지
            if out.isEmpty && !cache.items.isEmpty {
                for item in cache.items.prefix(max(1, want)) {
                    var flags = item.flags
                    flags.append("thumb_unavailable")
                    out.append([
                        "assetId": item.assetId,
                        "score": item.score,
                        "flags": flags,
                        "thumb": ""
                    ])
                }
            }

            DispatchQueue.main.async {
                call.resolve([
                    "dayKey": cache.dayKey,
                    "fromCache": fromCache,
                    "needsRefresh": needsRefresh,
                    "items": out
                ])
            }
        }
    }

    private struct ThumbPayload {
        let assetId: String
        let payload: String
    }

    private func makeThumbnailJPEGData(from data: Data, thumbSize: CGFloat) -> Data? {
        guard let image = UIImage(data: data) else { return nil }

        let target = CGSize(width: thumbSize, height: thumbSize)
        let scale = max(target.width / image.size.width, target.height / image.size.height)
        let drawSize = CGSize(width: image.size.width * scale, height: image.size.height * scale)
        let origin = CGPoint(x: (target.width - drawSize.width) / 2, y: (target.height - drawSize.height) / 2)
        let renderer = UIGraphicsImageRenderer(size: target)
        let rendered = renderer.image { _ in
            image.draw(in: CGRect(origin: origin, size: drawSize))
        }
        return rendered.jpegData(compressionQuality: 0.75)
    }

    // 썸네일 transport(file/base64) 변환 로직을 한 곳으로 모아 중복을 줄인다.
    private func buildThumbPayload(from data: Data, transport: String) -> String {
        if transport == "file" {
            let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent("dc_\(UUID().uuidString).jpg")
            do {
                try data.write(to: tempURL)
                return tempURL.absoluteString
            } catch {
                // 파일 저장 실패 시 base64로 안전하게 폴백
                return "data:image/jpeg;base64,\(data.base64EncodedString())"
            }
        }
        return "data:image/jpeg;base64,\(data.base64EncodedString())"
    }

    private func fetchThumbsSkippingICloud(candidateIds: [String],
                                           thumbSize: CGFloat,
                                           want: Int,
                                           transport: String,
                                           completion: @escaping ([ThumbPayload]) -> Void) {
        if want <= 0 {
            completion([])
            return
        }

        var results: [ThumbPayload] = []
        results.reserveCapacity(want)

        let manager = PHImageManager.default()
        let options = PHImageRequestOptions()
        options.deliveryMode = .fastFormat
        options.resizeMode = .fast
        options.isNetworkAccessAllowed = false
        let target = CGSize(width: thumbSize, height: thumbSize)

        func step(_ idx: Int) {
            if results.count >= want || idx >= candidateIds.count {
                completion(results)
                return
            }

            let id = candidateIds[idx]
            let fetch = PHAsset.fetchAssets(withLocalIdentifiers: [id], options: nil)
            guard let asset = fetch.firstObject else {
                step(idx + 1)
                return
            }

            manager.requestImage(for: asset, targetSize: target, contentMode: .aspectFill, options: options) { image, info in
                let inCloud = (info?[PHImageResultIsInCloudKey] as? Bool) ?? false

                if let image, let data = image.jpegData(compressionQuality: 0.75) {
                    let payload = self.buildThumbPayload(from: data, transport: transport)
                    results.append(.init(assetId: id, payload: payload))
                    step(idx + 1)
                    return
                }

                // requestImage 실패 시 requestImageDataAndOrientation으로 한 번 더 시도
                let dataOptions = PHImageRequestOptions()
                dataOptions.deliveryMode = .highQualityFormat
                dataOptions.resizeMode = .none
                dataOptions.version = .current
                dataOptions.isNetworkAccessAllowed = false

                manager.requestImageDataAndOrientation(for: asset, options: dataOptions) { data, _, _, info2 in
                    let inCloud2 = (info2?[PHImageResultIsInCloudKey] as? Bool) ?? false
                    if let data,
                       let thumbData = self.makeThumbnailJPEGData(from: data, thumbSize: thumbSize) {
                        let payload = self.buildThumbPayload(from: thumbData, transport: transport)
                        results.append(.init(assetId: id, payload: payload))
                    } else if inCloud || inCloud2 {
                        print("📸 [DailyCuration] iCloud-only skipped: \(id)")
                    } else {
                        print("📸 [DailyCuration] thumb fetch failed: \(id)")
                    }
                    step(idx + 1)
                }
            }
        }

        step(0)
    }
}
