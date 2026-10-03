import fs from "node:fs";
import path from "node:path";

const fixturesDir = path.join(process.cwd(), "test", "fixtures");

function createElf64Buffer(pAlign) {
  const buf = Buffer.alloc(128, 0);
  // ELF Magic
  buf[0] = 0x7f;
  buf[1] = 0x45; // 'E'
  buf[2] = 0x4c; // 'L'
  buf[3] = 0x46; // 'F'
  buf[4] = 0x02; // 64-bit
  buf[5] = 0x01; // Little Endian
  buf[6] = 0x01; // ELF Version 1

  buf.writeUInt16LE(0x0003, 16); // ET_DYN
  buf.writeUInt16LE(0x00b7, 18); // EM_AARCH64
  buf.writeUInt32LE(0x00000001, 20); // EV_CURRENT

  // e_phoff at offset 32 (starts at 64)
  buf.writeBigUInt64LE(BigInt(64), 32);
  buf.writeUInt16LE(64, 52); // e_ehsize
  buf.writeUInt16LE(56, 54); // e_phentsize
  buf.writeUInt16LE(1, 56);  // e_phnum (1 program header)

  // Program header at offset 64
  const phOffset = 64;
  buf.writeUInt32LE(0x00000001, phOffset + 0); // PT_LOAD
  buf.writeUInt32LE(0x00000005, phOffset + 4); // PF_R | PF_X
  buf.writeBigUInt64LE(BigInt(0), phOffset + 8);
  buf.writeBigUInt64LE(BigInt(0), phOffset + 16);
  buf.writeBigUInt64LE(BigInt(0), phOffset + 24);
  buf.writeBigUInt64LE(BigInt(128), phOffset + 32);
  buf.writeBigUInt64LE(BigInt(128), phOffset + 40);
  buf.writeBigUInt64LE(BigInt(pAlign), phOffset + 48); // p_align

  return buf;
}

// 1. Android Good
const androidGoodDir = path.join(fixturesDir, "android-good");
fs.mkdirSync(path.join(androidGoodDir, "app", "src", "main", "jniLibs", "arm64-v8a"), { recursive: true });

fs.writeFileSync(
  path.join(androidGoodDir, "app", "build.gradle"),
  `android {
    defaultConfig {
        minSdkVersion 24
        targetSdkVersion 35
    }
}`
);

fs.writeFileSync(
  path.join(androidGoodDir, "app", "src", "main", "AndroidManifest.xml"),
  `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application android:allowBackup="false">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`
);

fs.writeFileSync(
  path.join(androidGoodDir, "app", "src", "main", "jniLibs", "arm64-v8a", "libgood.so"),
  createElf64Buffer(0x4000) // 16 KB aligned
);

// 2. Android Bad
const androidBadDir = path.join(fixturesDir, "android-bad");
fs.mkdirSync(path.join(androidBadDir, "app", "src", "main", "jniLibs", "arm64-v8a"), { recursive: true });

fs.writeFileSync(
  path.join(androidBadDir, "app", "build.gradle"),
  `android {
    defaultConfig {
        minSdkVersion 21
        targetSdkVersion 33
    }
}`
);

fs.writeFileSync(
  path.join(androidBadDir, "app", "src", "main", "AndroidManifest.xml"),
  `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <application android:allowBackup="true">
        <activity android:name=".MainActivity">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
            </intent-filter>
        </activity>
    </application>
</manifest>`
);

fs.writeFileSync(
  path.join(androidBadDir, "app", "src", "main", "jniLibs", "arm64-v8a", "libbad.so"),
  createElf64Buffer(0x1000) // 4 KB aligned (Bad)
);

// Sensitive files that must be skipped
fs.writeFileSync(path.join(androidBadDir, "release.keystore"), "DUMMY_KEYSTORE_CONTENT");
fs.writeFileSync(path.join(androidBadDir, ".env"), "SECRET_API_KEY=12345");

// 3. iOS Good
const iosGoodDir = path.join(fixturesDir, "ios-good");
fs.mkdirSync(iosGoodDir, { recursive: true });

fs.writeFileSync(
  path.join(iosGoodDir, "Info.plist"),
  `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>com.example.game</string>
    <key>NSUserTrackingUsageDescription</key>
    <string>Size daha iyi reklamlar sunabilmemiz için takip iznine ihtiyacımız var.</string>
</dict>
</plist>`
);

fs.writeFileSync(
  path.join(iosGoodDir, "PrivacyInfo.xcprivacy"),
  `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>CA92.1</string>
            </array>
        </dict>
    </array>
</dict>
</plist>`
);

fs.writeFileSync(
  path.join(iosGoodDir, "GameManager.swift"),
  `import Foundation
import AppTrackingTransparency

class GameManager {
    func requestTracking() {
        ATTrackingManager.requestTrackingAuthorization { status in
            print("Status: \\(status)")
        }
    }
}`
);

// 4. iOS Bad
const iosBadDir = path.join(fixturesDir, "ios-bad");
fs.mkdirSync(iosBadDir, { recursive: true });

fs.writeFileSync(
  path.join(iosBadDir, "Info.plist"),
  `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>com.example.badgame</string>
</dict>
</plist>`
);

fs.writeFileSync(
  path.join(iosBadDir, "PrivacyInfo.xcprivacy"),
  `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array/>
        </dict>
    </array>
</dict>
</plist>`
);

fs.writeFileSync(
  path.join(iosBadDir, "Tracker.swift"),
  `import Foundation
import AppTrackingTransparency

class Tracker {
    func track() {
        ATTrackingManager.requestTrackingAuthorization { _ in }
    }
}`
);

fs.writeFileSync(path.join(iosBadDir, "Auth.p12"), "DUMMY_CERT");

console.log("Fixtures generated successfully.");
