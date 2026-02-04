import Foundation
import Photos
import UIKit

class PhotoAssetManager {
    private let imageManager = PHImageManager.default()
    
    func loadImage(asset: PHAsset, quality: String, completion: @escaping (String?) -> Void) {
        let options = PHImageRequestOptions()
        options.isNetworkAccessAllowed = true
        options.deliveryMode = .highQualityFormat
        
        var targetSize: CGSize
        if quality == "thumbnail" {
            targetSize = CGSize(width: 300, height: 300)
            options.resizeMode = .exact
        } else {
            targetSize = PHImageManagerMaximumSize
            options.resizeMode = .none
        }
        
        imageManager.requestImage(for: asset, targetSize: targetSize, contentMode: .aspectFill, options: options) { (image, info) in
            guard let image = image else {
                completion(nil)
                return
            }
            
            let imageData = image.jpegData(compressionQuality: 0.8)
            let base64String = imageData?.base64EncodedString()
            completion(base64String)
        }
    }
    
    static func findAsset(id: String) -> PHAsset? {
        let options = PHFetchOptions()
        let result = PHAsset.fetchAssets(withLocalIdentifiers: [id], options: options)
        return result.firstObject
    }
}
