import Foundation
import Capacitor
import Photos

@objc(RecocolPhotosPlugin)
public class RecocolPhotosPlugin: CAPPlugin {
    private let assetManager = PhotoAssetManager()

    @objc func fetchPhotos(_ call: CAPPluginCall) {
        let limit = call.getInt("limit") ?? 30
        let offset = call.getInt("offset") ?? 0

        // iOS 14+ 호환 권한 체크
        var status: PHAuthorizationStatus
        if #available(iOS 14, *) {
            status = PHPhotoLibrary.authorizationStatus(for: .readWrite)
        } else {
            status = PHPhotoLibrary.authorizationStatus()
        }
        
        // 디버깅용 로그
        print("📸 [RecocolPhotos] PHAuthorizationStatus: \(status.rawValue)")
        // 0: notDetermined, 1: restricted, 2: denied, 3: authorized, 4: limited

        // 권한이 아직 결정되지 않은 경우 요청
        if status == .notDetermined {
            print("📸 [RecocolPhotos] Requesting authorization...")
            if #available(iOS 14, *) {
                PHPhotoLibrary.requestAuthorization(for: .readWrite) { newStatus in
                    DispatchQueue.main.async {
                        print("📸 [RecocolPhotos] New Authorization Status: \(newStatus.rawValue)")
                        if newStatus == .authorized || newStatus == .limited {
                            self.performFetchPhotos(call: call, limit: limit, offset: offset)
                        } else {
                            call.reject("Photo library access denied")
                        }
                    }
                }
            } else {
                PHPhotoLibrary.requestAuthorization { newStatus in
                    DispatchQueue.main.async {
                        print("📸 [RecocolPhotos] New Authorization Status: \(newStatus.rawValue)")
                        if newStatus == .authorized {
                            self.performFetchPhotos(call: call, limit: limit, offset: offset)
                        } else {
                            call.reject("Photo library access denied")
                        }
                    }
                }
            }
            return
        }

        if status != .authorized && status != .limited {
            print("📸 [RecocolPhotos] REJECTED - status is not authorized/limited")
            call.reject("Photo library access not authorized")
            return
        }

        performFetchPhotos(call: call, limit: limit, offset: offset)
    }

    private func performFetchPhotos(call: CAPPluginCall, limit: Int, offset: Int) {
        // 1. [핵심] 사용자 정의 앨범에 속한 모든 사진 ID 수집
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

                // 2. 현재 사진이 앨범에 포함되어 있는지 확인
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
                    "isInAlbum": isInAlbum // 추가된 필드
                ]
                photos.append(photoData)
            }
        }

        call.resolve([
            "photos": photos,
            "totalCount": allPhotos.count
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

        assetManager.loadImage(asset: asset, quality: quality) { base64 in
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
}