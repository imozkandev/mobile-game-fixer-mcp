import Foundation
import AppTrackingTransparency

class GameManager {
    func requestTracking() {
        ATTrackingManager.requestTrackingAuthorization { status in
            print("Status: \(status)")
        }
    }
}