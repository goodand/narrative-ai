import Foundation
import Photos
import UIKit

class PhotoAssetManager {
    private let imageManager = PHImageManager.default()
    
    func loadImage(asset: PHAsset, quality: String, thumbSize: CGFloat = 250, completion: @escaping (String?) -> Void) {
        let options = PHImageRequestOptions()
        options.deliveryMode = .highQualityFormat
        
        var targetSize: CGSize
        var compression: CGFloat = 0.8
        
        if quality == "thumbnail" {
            options.isNetworkAccessAllowed = false
            targetSize = CGSize(width: thumbSize, height: thumbSize)
            options.resizeMode = .exact
            compression = 0.6
        } else {
            options.isNetworkAccessAllowed = true
            targetSize = PHImageManagerMaximumSize
            options.resizeMode = .none
        }
        
        imageManager.requestImage(for: asset, targetSize: targetSize, contentMode: .aspectFill, options: options) { (image, info) in
            guard let image = image else {
                completion(nil)
                return
            }
            
            let imageData = image.jpegData(compressionQuality: compression)
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
