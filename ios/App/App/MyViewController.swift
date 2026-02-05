import UIKit
import Capacitor

class MyViewController: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        super.capacitorDidLoad()
        // RecocolPhotosPlugin을 브릿지에 수동으로 등록
        bridge?.registerPluginInstance(RecocolPhotosPlugin())
        print("📸 [RecocolPhotos] Plugin manually registered in MyViewController")
    }
}
