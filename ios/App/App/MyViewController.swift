import UIKit
import Capacitor

class MyViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()

        // Capacitor 6: 로컬 플러그인 수동 등록
        // 브릿지가 로드된 후 인스턴스를 직접 등록하여 'not implemented' 에러 해결
        if let bridge = self.bridge {
            bridge.registerPluginInstance(RecocolPhotosPlugin())
            print("📸 [RecocolPhotos] Plugin manually registered in MyViewController")
        }
    }
}
