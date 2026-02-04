import Foundation

struct PhotoMetadata {
    let exif: [String: Any]
    let cameraMake: String?
    let cameraModel: String?
    let lensModel: String?
    let focalLength: Double?
    let exposureTime: Double?
    let iso: Int?

    func toJS() -> [String: Any] {
        return [
            "exif": exif,
            "cameraMake": cameraMake ?? "",
            "cameraModel": cameraModel ?? "",
            "lensModel": lensModel ?? "",
            "focalLength": focalLength ?? 0,
            "exposureTime": exposureTime ?? 0,
            "iso": iso ?? 0
        ]
    }
}
