import Foundation
import AppTrackingTransparency

class Tracker {
    func track() {
        ATTrackingManager.requestTrackingAuthorization { _ in }
    }
}