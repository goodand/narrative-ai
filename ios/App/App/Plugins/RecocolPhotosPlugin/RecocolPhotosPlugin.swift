import Foundation
import Capacitor
import Photos

@objc(RecocolPhotosPlugin)
public class RecocolPhotosPlugin: CAPPlugin {
    private let assetManager = PhotoAssetManager()

    @objc func fetchPhotos(_ call: CAPPluginCall) {
        let limit = call.getInt("limit") ?? 20
        let offset = call.getInt("offset") ?? 0
        
        let status = PHPhotoLibrary.authorizationStatus()
        if status != .authorized && status != .limited {
            call.reject("Photo library access not authorized")
            return
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

                let photoData: [String: Any] = [
                    "id": asset.localIdentifier,
                    "creationDate": asset.creationDate?.iso8601String ?? "",
                    "modificationDate": asset.modificationDate?.iso8601String ?? "",
                    "mediaType": "image",
                    "pixelWidth": asset.pixelWidth,
                    "pixelHeight": asset.pixelHeight,
                    "isFavorite": asset.isFavorite,
                    "isScreenshot": asset.mediaSubtypes.contains(.photoScreenshot),
                    "location": locationDict as Any
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