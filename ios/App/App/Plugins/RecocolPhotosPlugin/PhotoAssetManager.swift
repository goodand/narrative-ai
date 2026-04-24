import Foundation
import Photos
import UIKit

class PhotoAssetManager {
    private let imageManager = PHImageManager.default()

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

        return rendered.jpegData(compressionQuality: 0.6)
    }

    func loadImage(asset: PHAsset,
                   quality: String,
                   thumbSize: CGFloat = 250,
                   allowNetworkAccess: Bool = false,
                   completion: @escaping (String?) -> Void) {

        RecocolTimeout.finishOnceWithCancel(timeout: 10.0, fallback: nil as String?) { finish, setCancel in
            let options = PHImageRequestOptions()
            options.deliveryMode = .highQualityFormat

            var targetSize: CGSize
            var compression: CGFloat = 0.8

            if quality == "thumbnail" {
                options.isNetworkAccessAllowed = false
                targetSize = CGSize(width: thumbSize, height: thumbSize)
                options.resizeMode = .exact
                compression = 0.6
            } else if quality == "analysis" {
                // AI 분석용 최적화 경로 (User Strategy #1)
                options.isNetworkAccessAllowed = false // iCloud 다운로드 차단
                targetSize = CGSize(width: 1024, height: 1024)
                options.resizeMode = .fast
                compression = 0.7
            } else {
                options.isNetworkAccessAllowed = allowNetworkAccess
                targetSize = PHImageManagerMaximumSize
                options.resizeMode = .none
            }

            let requestId = self.imageManager.requestImage(for: asset, targetSize: targetSize, contentMode: .aspectFill, options: options) { (image, info) in
                guard let image = image else {
                    if quality != "thumbnail" {
                        finish(nil)
                        return
                    }

                    let dataOptions = PHImageRequestOptions()
                    dataOptions.deliveryMode = .highQualityFormat
                    dataOptions.resizeMode = .none
                    dataOptions.version = .current
                    dataOptions.isNetworkAccessAllowed = false

                    let fallbackRequestId = self.imageManager.requestImageDataAndOrientation(for: asset, options: dataOptions) { data, _, _, info2 in
                        let inCloud = (info?[PHImageResultIsInCloudKey] as? Bool) ?? false
                        let inCloud2 = (info2?[PHImageResultIsInCloudKey] as? Bool) ?? false

                        if let data, let thumbData = self.makeThumbnailJPEGData(from: data, thumbSize: thumbSize) {
                            finish(thumbData.base64EncodedString())
                        } else {
                            if !(inCloud || inCloud2) {
                                print("📸 [PhotoAssetManager] thumbnail fallback failed: \(asset.localIdentifier)")
                            }
                            finish(nil)
                        }
                    }

                    setCancel {
                        self.imageManager.cancelImageRequest(fallbackRequestId)
                    }
                    return
                }

                let imageData = image.jpegData(compressionQuality: compression)
                let base64String = imageData?.base64EncodedString()
                finish(base64String)
            }

            setCancel {
                self.imageManager.cancelImageRequest(requestId)
            }
        } completion: { result in
            completion(result)
        }
    }

    static func findAsset(id: String) -> PHAsset? {
        let options = PHFetchOptions()
        let result = PHAsset.fetchAssets(withLocalIdentifiers: [id], options: options)
        return result.firstObject
    }
}
