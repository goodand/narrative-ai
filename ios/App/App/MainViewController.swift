import UIKit
import Capacitor

class MainViewController: CAPBridgeViewController {

    override open func capacitorDidLoad() {
        // 로컬 플러그인 수동 등록 (Capacitor 6 필수)
        bridge?.registerPluginInstance(RecocolPhotosPlugin())
        print("✅ [MainViewController] RecocolPhotosPlugin 등록 완료")
    }
}
