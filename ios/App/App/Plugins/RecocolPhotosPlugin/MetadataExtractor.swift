import Foundation
import Photos

class MetadataExtractor {
    static func extractMetadata(for asset: PHAsset,
                                allowNetworkAccess: Bool = false,
                                completion: @escaping (PhotoMetadata?) -> Void) {

        RecocolTimeout.finishOnce(timeout: 5.0, fallback: nil as PhotoMetadata?) { finish in
            let options = PHContentEditingInputRequestOptions()
            options.isNetworkAccessAllowed = allowNetworkAccess

            asset.requestContentEditingInput(with: options) { (input, info) in
                guard let url = input?.fullSizeImageURL,
                      let imageSource = CGImageSourceCreateWithURL(url as CFURL, nil),
                      let properties = CGImageSourceCopyPropertiesAtIndex(imageSource, 0, nil) as? [String: Any] else {
                    finish(nil)
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

                finish(metadata)
            }
        } completion: { result in
            completion(result)
        }
    }
}
