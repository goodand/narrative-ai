import Foundation
import Photos

class MetadataExtractor {
    static func extractMetadata(for asset: PHAsset, completion: @escaping (PhotoMetadata?) -> Void) {
        let options = PHContentEditingInputRequestOptions()
        options.isNetworkAccessAllowed = true
        
        asset.requestContentEditingInput(with: options) { (input, info) in
            guard let url = input?.fullSizeImageURL,
                  let imageSource = CGImageSourceCreateWithURL(url as CFURL, nil),
                  let properties = CGImageSourceCopyPropertiesAtIndex(imageSource, 0, nil) as? [String: Any] else {
                completion(nil)
                return
            }
            
            let exif = properties[kCGImagePropertyExifDictionary as String] as? [String: Any] ?? [:]
            let tiff = properties[kCGImagePropertyTIFFDictionary as String] as? [String: Any] ?? [:]
            
            let metadata = PhotoMetadata(
                exif: exif,
                cameraMake: tiff[kCGImagePropertyTIFFMake as String] as? String,
                cameraModel: tiff[kCGImagePropertyTIFFModel as String] as? String,
                lensModel: exif[kCGImagePropertyExifLensModel as String] as? String,
                focalLength: exif[kCGImagePropertyExifFocalLength as String] as? Double,
                exposureTime: exif[kCGImagePropertyExifExposureTime as String] as? Double,
                iso: (exif[kCGImagePropertyExifISOSpeedRatings as String] as? [Int])?.first
            )
            
            completion(metadata)
        }
    }
}
