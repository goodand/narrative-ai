import Foundation
import Photos

struct PhotoAsset {
    let id: String
    let creationDate: Date?
    let modificationDate: Date?
    let mediaType: String
    let pixelWidth: Int
    let pixelHeight: Int
    let isFavorite: Bool
    let isScreenshot: Bool
    let location: [String: Double]?

    func toJS() -> [String: Any] {
        var dict: [String: Any] = [
            "id": id,
            "creationDate": creationDate?.iso8601String ?? "",
            "modificationDate": modificationDate?.iso8601String ?? "",
            "mediaType": mediaType,
            "pixelWidth": pixelWidth,
            "pixelHeight": pixelHeight,
            "isFavorite": isFavorite,
            "isScreenshot": isScreenshot
        ]
        
        if let location = location {
            dict["location"] = location
        }
        
        return dict
    }
}