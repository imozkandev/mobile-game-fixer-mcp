import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const problemsDir = path.join(rootDir, "knowledge", "problems");
const rulesDir = path.join(rootDir, "knowledge", "rules");
const checklistsDir = path.join(rootDir, "knowledge", "checklists");
const runbooksDir = path.join(rootDir, "knowledge", "runbooks");
const seedDir = path.join(rootDir, "knowledge-seed");

fs.mkdirSync(problemsDir, { recursive: true });
fs.mkdirSync(rulesDir, { recursive: true });
fs.mkdirSync(checklistsDir, { recursive: true });
fs.mkdirSync(runbooksDir, { recursive: true });
fs.mkdirSync(seedDir, { recursive: true });

// 44 Problem Definitions in English (with TR & EN search keywords)
const problems = [
  {
    id: "M-01",
    title: "Device overheating & thermal throttling dropping frame rate",
    category: "performance",
    severity: "high",
    platforms: ["android", "ios"],
    engines: ["unity", "godot", "unreal", "any"],
    symptoms: [
      "FPS drops significantly after 10-15 minutes of gameplay",
      "Device gets hot to the touch",
      "Battery drains rapidly",
      "Game overheats and drops frames",
      "oyun 10 dakika sonra isiniyor ve fps dusuyor",
      "Thermal throttling alerts in device logs"
    ],
    keywords: [
      "overheating", "thermal", "throttling", "fps drop", "frame rate", "drops frames",
      "battery drain", "hot device", "cpu throttling", "gpu throttling", "isinma", "sicak", "fps dusuyor"
    ],
    causes: [
      "Target frame rate is uncapped or unnecessarily set to 60/120 FPS on budget hardware",
      "Expensive computational or physics calculations executing every frame in Update() loop",
      "Heavy alpha overdraw and unoptimized full-screen transparent particles"
    ],
    solution: [
      { step: 1, action: "Cap target frame rate based on game genre (e.g., Application.targetFrameRate = 30 or 60).", effort: "low" },
      { step: 2, action: "Listen to device thermal status APIs and dynamically lower rendering resolution or shadow cascades when device enters severe thermal state.", effort: "medium" },
      { step: 3, action: "Profile transparent UI panels and particle systems to eliminate overlapping alpha fillrate bottlenecks.", effort: "medium" }
    ],
    prevention: ["Conduct 30-minute continuous play sessions on mid/low-tier release builds while monitoring thermal profiling curves."],
    tools: [{ name: "guard_engine_code", project: "game-forge-mcp", coverage: "partial" }],
    related: ["M-03", "M-04", "M-07"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-02",
    title: "Silent crash / Out of Memory (OOM) termination on low-RAM devices",
    category: "memory",
    severity: "critical",
    platforms: ["android", "ios"],
    engines: ["unity", "godot", "unreal", "any"],
    symptoms: [
      "Game crashes silently on 2GB or 3GB RAM devices without error stack trace",
      "Low memory warning from OS followed by immediate process kill",
      "Game restarts from splash screen when returning from background",
      "düşük ram'li telefonlarda oyun kendi kendine kapanıyor",
      "Out of memory crash on 2GB devices"
    ],
    keywords: [
      "oom", "out of memory", "low ram", "crash on low ram", "memory budget", "texture memory",
      "lmk", "low memory killer", "silent crash", "ram yetersiz", "bellek yetersiz", "kapaniyor"
    ],
    causes: [
      "Uncompressed or excessively high-resolution textures (4K textures on mobile)",
      "Unused asset bundles and scene assets staying resident in memory",
      "Large audio clips set to 'Decompress on Load' occupying high RAM"
    ],
    solution: [
      { step: 1, action: "Enforce ASTC texture compression and clamp maximum texture sizes (under 2048px on mobile).", effort: "low" },
      { step: 2, action: "Change large background music and voice-over audio to 'Compressed in Memory' or 'Streaming'.", effort: "low" },
      { step: 3, action: "Invoke Resources.UnloadUnusedAssets() and Addressables.Release() on scene transitions.", effort: "medium" }
    ],
    prevention: ["Run automated stress tests on 2GB virtual devices and maintain total memory budget under 400MB."],
    tools: [{ name: "analyze_build_budget", project: "game-forge-mcp", coverage: "partial" }],
    related: ["M-01", "M-03", "M-28"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-03",
    title: "Periodic micro-stutters and frametime spikes from Garbage Collection (GC)",
    category: "performance",
    severity: "high",
    platforms: ["android", "ios"],
    engines: ["unity", "godot", "unreal", "any"],
    symptoms: [
      "Micro-stutter every few seconds during gameplay",
      "Profiler displays frequent GC.Alloc allocations and GC.Collect spikes",
      "oyun arada donuyor, GC",
      "Frametime hitching during combat or movement"
    ],
    keywords: [
      "gc", "garbage collection", "stutter", "micro stutter", "gc alloc", "gc spike",
      "frametime spike", "heap allocation", "object pool", "donuyor", "takilma"
    ],
    causes: [
      "Allocating new objects (e.g. `new List()`, string concatenations) inside Update/FixedUpdate loops",
      "Boxing/unboxing value types and LINQ queries in per-frame logic",
      "Instantiating and destroying bullets, particles, and enemies without Object Pooling"
    ],
    solution: [
      { step: 1, action: "Replace runtime string concatenations with StringBuilder or pre-allocated cached buffers.", effort: "low" },
      { step: 2, action: "Implement Object Pooling for frequently spawned entities (projectiles, visual FX, damage popups).", effort: "medium" },
      { step: 3, action: "Convert foreach loops and LINQ expressions in hot paths to indexed for-loops to eliminate iterator heap allocation.", effort: "medium" }
    ],
    prevention: ["Aim for zero bytes (0 B) GC.Alloc per frame in all active gameplay states."],
    tools: [],
    related: ["M-01", "M-02"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-04",
    title: "Excessive overdraw and particle alpha blending causing GPU fillrate bottlenecks",
    category: "rendering",
    severity: "medium",
    platforms: ["android", "ios"],
    engines: ["unity", "godot", "unreal", "any"],
    symptoms: [
      "FPS drops severely during dense particle explosions or when UI overlay is open",
      "Overdraw debug view reveals intense white/pink overlapping areas"
    ],
    keywords: ["overdraw", "gpu bound", "fillrate", "alpha blending", "particles", "transparent ui", "raycast target"],
    causes: ["Multiple overlapping full-screen transparent particle effects", "Invisible UI panels retaining active 'Raycast Target' flags"],
    solution: [
      { step: 1, action: "Disable 'Raycast Target' on all decorative or non-interactive UI Text and Image elements.", effort: "low" },
      { step: 2, action: "Clamp Max Particles and scale down particle quad dimensions.", effort: "medium" }
    ],
    prevention: ["Inspect overdraw visualization in engine viewport before approving VFX."],
    tools: [],
    related: ["M-01", "M-05"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-05",
    title: "High Draw Call & SetPass Call count causing CPU render bottleneck",
    category: "rendering",
    severity: "medium",
    platforms: ["android", "ios"],
    engines: ["unity", "godot", "unreal", "any"],
    symptoms: ["CPU rendering thread time increases when many small objects are visible", "Draw Calls exceed 200+ on mobile"],
    keywords: ["draw call", "setpass", "batching", "dynamic batching", "gpu instancing", "sprite atlas"],
    causes: ["Multiple unique materials and individual un-batched textures", "Lack of Sprite Atlases for 2D/UI elements"],
    solution: [
      { step: 1, action: "Pack 2D sprites and UI graphics into unified Sprite Atlases.", effort: "low" },
      { step: 2, action: "Enable GPU Instancing or Static Batching on meshes sharing identical materials.", effort: "medium" }
    ],
    prevention: ["Keep total mobile draw calls within 100-150 binned calls."],
    tools: [],
    related: ["M-01", "M-04"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-06",
    title: "Shader compilation stutter when visual effects trigger for the first time",
    category: "rendering",
    severity: "medium",
    platforms: ["android", "ios"],
    engines: ["unity", "godot", "unreal", "any"],
    symptoms: ["Game freezes for 0.5s the very first time a skill or explosion triggers, then runs smoothly afterwards"],
    keywords: ["shader stutter", "shader compilation", "shader warmup", "shader pre-warming", "vulkan shader", "pso cache"],
    causes: ["Compiling shader variants on-demand at runtime rather than pre-warming during splash loading"],
    solution: [
      { step: 1, action: "Trigger Shader Warmup (e.g. Shader.WarmupAllShaders) on the loading splash screen.", effort: "low" },
      { step: 2, action: "Strip unused shader keywords and build a Shader Variant Collection.", effort: "medium" }
    ],
    prevention: ["Profile initial gameplay sessions on Vulkan and Metal to record all used shader variants."],
    tools: [],
    related: ["M-03"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-07",
    title: "Rapid battery drain and background power consumption",
    category: "performance",
    severity: "medium",
    platforms: ["android", "ios"],
    engines: ["unity", "godot", "unreal", "any"],
    symptoms: ["Game drains 40% battery in 1 hour", "Device heats up even on static menu screens"],
    keywords: ["battery drain", "power consumption", "wakelock", "background drain", "menu fps", "pil tuketimi"],
    causes: ["Rendering static UI/menus at uncapped 60/120 FPS", "Keeping location/GPS or continuous network polling active in background"],
    solution: [
      { step: 1, action: "Lower target FPS to 30 on static menu and inventory screens.", effort: "low" },
      { step: 2, action: "Pause network polling loops and audio when app transitions to background.", effort: "low" }
    ],
    prevention: ["Audit energy impact with Android Battery Historian and Xcode Energy Gauge."],
    tools: [],
    related: ["M-01", "M-38"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-08",
    title: "Touch input latency and sluggish control response",
    category: "device",
    severity: "medium",
    platforms: ["android", "ios"],
    engines: ["unity", "godot", "unreal", "any"],
    symptoms: ["Noticeable delay between finger tap and on-screen character action in fast-paced games"],
    keywords: ["input lag", "touch latency", "input latency", "v-sync buffer", "dokunmatik gecikmesi"],
    causes: ["V-Sync triple-buffering queue", "Decoupled FixedUpdate physics logic vs input polling"],
    solution: [
      { step: 1, action: "Poll touch inputs directly in Update() loop rather than FixedUpdate().", effort: "low" },
      { step: 2, action: "Set Max Queued Frames in rendering settings to 1 or 2.", effort: "low" }
    ],
    prevention: ["Measure input latency with high-speed camera recordings during QA."],
    tools: [],
    related: ["M-01"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-09",
    title: "Screen notch, dynamic island, and aspect ratio UI clipping",
    category: "device",
    severity: "medium",
    platforms: ["android", "ios"],
    engines: ["unity", "godot", "unreal", "any"],
    symptoms: ["Buttons hidden beneath camera cutouts or dynamic island", "UI clipped on tablets with 4:3 ratios"],
    keywords: ["notch", "cutout", "safe area", "aspect ratio", "dynamic island", "centik", "ui clipping"],
    causes: ["Fixed pixel coordinates ignoring Screen.safeArea in UI layout hierarchies"],
    solution: [
      { step: 1, action: "Attach a dynamic Safe Area script that binds main UI panels to Screen.safeArea rect.", effort: "low" },
      { step: 2, action: "Use proportional stretch anchors for full-screen canvasses.", effort: "low" }
    ],
    prevention: ["Test across varied device resolutions using Unity Device Simulator."],
    tools: [],
    related: ["M-36", "M-37"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-10",
    title: "Google Play upload rejection due to outdated Target SDK API level",
    category: "store_policy",
    severity: "critical",
    platforms: ["android"],
    engines: ["any"],
    symptoms: [
      "güncelleme play'e yüklenmiyor target api hatası",
      "Your app currently targets API level X and must target at least API level Y",
      "Play Console blocks new APK/AAB release submission",
      "Google Play Target API 35 requirement rejection"
    ],
    keywords: [
      "target api", "targetsdk", "targetsdkversion", "api level", "play console", "target api hatasi",
      "google play requirement", "android 15", "api 35", "api 36"
    ],
    causes: ["targetSdkVersion in build.gradle is lower than Google Play's mandatory annual threshold"],
    solution: [
      { step: 1, action: "Update targetSdkVersion to at least the required level (API 35+) in build.gradle or Project Settings.", effort: "low" },
      { step: 2, action: "Update AndroidManifest permissions and foreground service declarations mandated by the new API level.", effort: "medium" },
      { step: 3, action: "Upgrade 3rd party SDKs to versions compatible with the new target API.", effort: "medium" }
    ],
    prevention: ["Track Google Play annual Target SDK deadlines (typically August/November)."],
    tools: [],
    related: ["M-11", "M-12"],
    sources: [
      { url: "https://developer.android.com/google/play/requirements/target-sdk", type: "primary", title: "Google Play Target SDK Requirements" }
    ],
    verifiedAt: "2026-10-04",
    confidence: "policy"
  },
  {
    id: "M-11",
    title: "Android 16 KB page-size (ELF alignment) incompatibility for native libraries",
    category: "store_policy",
    severity: "critical",
    platforms: ["android"],
    engines: ["any"],
    symptoms: [
      "native kütüphane 16 kb hatası",
      "16 KB page size alignment error",
      "Native .so shared library is not aligned to 16 KB page boundaries",
      "Native crash on Android 15+ devices when loading native libraries",
      "Play Console 16 KB page size warning"
    ],
    keywords: [
      "16 kb", "16kb", "page size", "elf", "p_align", "alignment", "native library",
      "libfoo.so", "ndk", "16 kb hatasi", "sayfa boyutu", "android 15"
    ],
    causes: ["Native C/C++ `.so` shared libraries built with 4 KB (0x1000) PT_LOAD alignment instead of 16 KB (0x4000)"],
    solution: [
      { step: 1, action: "Recompile native C/C++ code using Android NDK r28+ with `-Wl,-z,max-page-size=16384` linker flag.", effort: "medium" },
      { step: 2, action: "Request 16 KB compliant binaries from 3rd party SDK providers (analytics, ads, audio).", effort: "medium" }
    ],
    prevention: ["Enforce automated CI checks verifying all 64-bit .so binaries have `PT_LOAD p_align >= 0x4000`."],
    tools: [],
    related: ["M-10", "M-12"],
    sources: [
      { url: "https://developer.android.com/guide/practices/page-sizes", type: "primary", title: "Support 16 KB page sizes" }
    ],
    verifiedAt: "2026-10-04",
    confidence: "policy"
  },
  {
    id: "M-12",
    title: "Google Play 64-bit requirement and Android App Bundle (AAB) mandate",
    category: "store_policy",
    severity: "high",
    platforms: ["android"],
    engines: ["any"],
    symptoms: ["Play Console rejects APK containing only 32-bit armeabi-v7a", "Rejection when uploading raw APK instead of AAB"],
    keywords: ["64 bit", "arm64-v8a", "aab", "app bundle", "32 bit", "google play 64 bit"],
    causes: ["ARM64 architecture unchecked in build settings or standalone APK uploaded"],
    solution: [
      { step: 1, action: "Enable ARM64 and ARMv7 architectures with IL2CPP backend.", effort: "low" },
      { step: 2, action: "Generate Android App Bundle (.aab) for release submission.", effort: "low" }
    ],
    prevention: ["Configure CI build pipeline to output .aab exclusively for release tracks."],
    tools: [],
    related: ["M-10", "M-11"],
    sources: [
      { url: "https://developer.android.com/distribute/best-practices/develop/64-bit", type: "primary", title: "64-bit requirement" }
    ],
    verifiedAt: "2026-10-04",
    confidence: "policy"
  },
  {
    id: "M-13",
    title: "Apple Privacy Manifest (PrivacyInfo.xcprivacy) & Required Reason API rejection",
    category: "store_policy",
    severity: "critical",
    platforms: ["ios"],
    engines: ["any"],
    symptoms: [
      "apple privacy manifest yüzünden reddedildi",
      "ITMS-91053: Missing API declaration in Privacy Manifest",
      "Empty or missing NSPrivacyAccessedAPITypeReasons in PrivacyInfo.xcprivacy",
      "App Store Connect submission rejection"
    ],
    keywords: [
      "privacy manifest", "xcprivacy", "privacyinfo", "required reason", "itms-91053",
      "nsprivacyaccessedapitypes", "apple privacy", "app store rejected"
    ],
    causes: ["Using sensitive APIs (UserDefaults, File Timestamp, Disk Space) without declaring approved reason codes in PrivacyInfo.xcprivacy"],
    solution: [
      { step: 1, action: "Add PrivacyInfo.xcprivacy to your Xcode project root.", effort: "low" },
      { step: 2, action: "Populate NSPrivacyAccessedAPITypes with Apple standard reason codes (NSPrivacyAccessedAPITypeReasons).", effort: "medium" },
      { step: 3, action: "Upgrade 3rd party SDKs to versions shipping valid privacy manifests.", effort: "medium" }
    ],
    prevention: ["Generate a Privacy Report in Xcode Organizer before submitting build to App Store."],
    tools: [],
    related: ["M-14", "M-19"],
    sources: [
      { url: "https://developer.apple.com/documentation/bundleresources/privacy_manifest_files", type: "primary", title: "Privacy Manifest Files" }
    ],
    verifiedAt: "2026-10-04",
    confidence: "policy"
  },
  {
    id: "M-14",
    title: "iOS App Tracking Transparency (ATT) and IDFA tracking description missing",
    category: "store_policy",
    severity: "critical",
    platforms: ["ios"],
    engines: ["any"],
    symptoms: [
      "Guideline 5.1.2 - Legal - Privacy - Data Use and Sharing rejection",
      "Collecting IDFA without requesting ATTrackingManager authorization",
      "Missing NSUserTrackingUsageDescription in Info.plist",
      "App tracking transparency missing key"
    ],
    keywords: ["att", "app tracking transparency", "idfa", "nstracking", "nsusertrackingusagedescription", "guideline 5.1.2"],
    causes: ["Advertising SDK attempting to read IDFA without prompting ATT authorization dialog or missing description string"],
    solution: [
      { step: 1, action: "Add NSUserTrackingUsageDescription key to Info.plist with a clear explanation for users.", effort: "low" },
      { step: 2, action: "Call ATTrackingManager.requestTrackingAuthorization before initializing ad networks.", effort: "medium" }
    ],
    prevention: ["Configure ad SDKs to run in non-personalized mode when tracking is denied."],
    tools: [],
    related: ["M-13", "M-19"],
    sources: [
      { url: "https://developer.apple.com/app-store/user-privacy-and-data-use/", type: "primary", title: "User Privacy and Data Use" }
    ],
    verifiedAt: "2026-10-04",
    confidence: "policy"
  },
  {
    id: "M-15",
    title: "Age rating and content declaration mismatch on store consoles",
    category: "store_policy",
    severity: "high",
    platforms: ["android", "ios"],
    engines: ["any"],
    symptoms: ["Rejection because game themes (violence, gambling themes, IAP) conflict with IARC/Apple questionnaire answers"],
    keywords: ["age rating", "content rating", "iarc", "esrb", "pegi", "apple age rating", "yas siniri"],
    causes: ["Store content questionnaire filled out inconsistently with actual in-game features"],
    solution: [
      { step: 1, action: "Retake content rating questionnaires on Play Console and App Store Connect matching current build content.", effort: "low" }
    ],
    prevention: ["Re-evaluate age ratings whenever introducing new character skins, combat, or social features."],
    tools: [],
    related: ["M-16", "M-18"],
    sources: [
      { url: "https://support.google.com/googleplay/android-developer/answer/9866151", type: "primary", title: "Google Play Content Ratings" }
    ],
    verifiedAt: "2026-10-04",
    confidence: "policy"
  },
  {
    id: "M-16",
    title: "Loot box / Gacha probability disclosure missing causing store rejection",
    category: "store_policy",
    severity: "critical",
    platforms: ["android", "ios"],
    engines: ["any"],
    symptoms: [
      "loot box oranları gösterilmediği için reddedildi",
      "Guideline 3.1.1 - In-App Purchase (Loot Box Drop Rates)",
      "Google Play Games of Chance Policy rejection",
      "Gacha loot box rates undisclosed"
    ],
    keywords: [
      "loot box", "gacha", "drop rates", "odds disclosure", "loot box oranlari", "guideline 3.1.1", "sans kutusu"
    ],
    causes: ["Failing to disclose percentage odds prior to purchase for randomized virtual goods (chests, wheels, card packs)"],
    solution: [
      { step: 1, action: "Add a visible info button on all gacha/chest screens displaying drop rates (%) per rarity tier.", effort: "low" },
      { step: 2, action: "Verify client displayed odds match server probability tables.", effort: "medium" }
    ],
    prevention: ["Integrate standard drop rate modal dialogs into all loot/chest prefabs."],
    tools: [],
    related: ["M-15", "M-20"],
    sources: [
      { url: "https://developer.apple.com/app-store/review/guidelines/#in-app-purchase", type: "primary", title: "App Store Review Guidelines 3.1.1" },
      { url: "https://support.google.com/googleplay/android-developer/answer/9858738", type: "primary", title: "Google Play Monetization Policy" }
    ],
    verifiedAt: "2026-10-04",
    confidence: "policy"
  },
  {
    id: "M-17",
    title: "In-app account deletion mechanism missing for user-authenticated games",
    category: "store_policy",
    severity: "critical",
    platforms: ["android", "ios"],
    engines: ["any"],
    symptoms: ["Rejection under App Store Guideline 5.1.1 for apps offering account creation without in-app delete flow"],
    keywords: ["account deletion", "delete account", "guideline 5.1.1", "hesap silme", "privacy deletion"],
    causes: ["Games with account sign-in failing to provide an immediate 'Delete Account and Data' option in settings"],
    solution: [
      { step: 1, action: "Add a prominent 'Delete Account' button inside Game Settings.", effort: "medium" },
      { step: 2, action: "Trigger backend purge of personal records and cloud saves upon confirmed deletion request.", effort: "medium" }
    ],
    prevention: ["Design account deletion flows alongside account registration from day one."],
    tools: [],
    related: ["M-13", "M-19"],
    sources: [
      { url: "https://developer.apple.com/support/offering-account-deletion-in-your-app/", type: "primary", title: "Offering account deletion in your app" }
    ],
    verifiedAt: "2026-10-04",
    confidence: "policy"
  },
  {
    id: "M-18",
    title: "Children's privacy policy violation (COPPA / Google Play Families Policy)",
    category: "store_policy",
    severity: "critical",
    platforms: ["android", "ios"],
    engines: ["any"],
    symptoms: ["Rejection for serving uncertified ads or collecting identifiers in child-targeted titles"],
    keywords: ["coppa", "families policy", "designed for families", "age gate", "child privacy", "cocuk politikasi"],
    causes: ["Using ad SDKs not certified under Google Play Self-Certified Ads SDK Program in games targeted at kids"],
    solution: [
      { step: 1, action: "Restrict ad networks to Google Play Families certified SDKs with personalized ads disabled.", effort: "medium" },
      { step: 2, action: "Implement a neutral Age Gate screen on first launch.", effort: "low" }
    ],
    prevention: ["Initialize analytics and ad libraries with child-directed flags (`tagForChildDirectedTreatment`)."],
    tools: [],
    related: ["M-15", "M-19"],
    sources: [
      { url: "https://support.google.com/googleplay/android-developer/answer/9893335", type: "primary", title: "Google Play Families Policy" }
    ],
    verifiedAt: "2026-10-04",
    confidence: "policy"
  },
  {
    id: "M-19",
    title: "Missing, broken, or non-compliant Privacy Policy URL",
    category: "store_policy",
    severity: "high",
    platforms: ["android", "ios"],
    engines: ["any"],
    symptoms: ["Store upload warning or rejection because privacy policy URL returns 404 or lacks data disclosure"],
    keywords: ["privacy policy", "privacy url", "gdpr", "kvkk", "gizlilik politikasi"],
    causes: ["Privacy URL link is broken or does not disclose embedded 3rd party SDK telemetry"],
    solution: [
      { step: 1, action: "Deploy an active HTTPS privacy policy webpage detailing all 3rd party SDK data practices and update store consoles.", effort: "low" }
    ],
    prevention: ["Verify privacy policy URL is publicly accessible prior to release submission."],
    tools: [],
    related: ["M-13", "M-17"],
    sources: [
      { url: "https://support.google.com/googleplay/android-developer/answer/9870001", type: "primary", title: "Privacy Policy Requirements" }
    ],
    verifiedAt: "2026-10-04",
    confidence: "policy"
  },
  {
    id: "M-20",
    title: "IAP transaction billed but items not delivered to user account",
    category: "iap",
    severity: "critical",
    platforms: ["android", "ios"],
    engines: ["any"],
    symptoms: [
      "para çekildi ama ürün gelmedi",
      "IAP payment deducted item not delivered",
      "User was charged but gems/coins were not credited",
      "Game crashed before transaction finished",
      "Pending transactions lingering in store queue"
    ],
    keywords: [
      "iap", "payment deducted", "item not delivered", "finishtransaction", "consumeasync",
      "restore purchases", "pending transaction", "para cekildi", "urun gelmedi", "satin alma"
    ],
    causes: [
      "Calling `finishTransaction` / `consumeAsync` before local/server inventory is securely saved",
      "Missing transaction listener on game startup to process pending/interrupted purchases"
    ],
    solution: [
      { step: 1, action: "Initialize a persistent Transaction Observer on game startup to catch pending purchases.", effort: "medium" },
      { step: 2, action: "Never call `finishTransaction` / `consumeAsync` until item is confirmed and saved.", effort: "medium" },
      { step: 3, action: "Provide a 'Restore Purchases' button in Settings.", effort: "low" }
    ],
    prevention: ["Test IAP flow under network disconnect and app force-kill scenarios in sandbox mode."],
    tools: [],
    related: ["M-21", "M-25"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-21",
    title: "Fake IAP exploit & missing server-side receipt validation",
    category: "iap",
    severity: "critical",
    platforms: ["android", "ios"],
    engines: ["any"],
    symptoms: ["Cheaters obtaining free IAP items using Lucky Patcher or mocked StoreKit responses"],
    keywords: ["fake iap", "receipt validation", "server side validation", "storekit receipt", "fatura dogrulama"],
    causes: ["Validating purchases only on client side without authoritative server verification"],
    solution: [
      { step: 1, action: "Validate all purchase receipts via server-to-server calls to Google Play RTDN and Apple App Store Server API.", effort: "high" }
    ],
    prevention: ["Grant inventory items only after receiving verified server confirmation."],
    tools: [],
    related: ["M-20", "M-34"],
    sources: [
      { url: "https://developer.apple.com/documentation/storekit/in-app_purchase/validating_receipts_with_the_app_store", type: "primary", title: "Validating receipts with the App Store" }
    ],
    verifiedAt: "2026-10-04",
    confidence: "policy"
  },
  {
    id: "M-22",
    title: "Mass player churn at specific game level (Difficulty Cliff / Churn Spike)",
    category: "liveops",
    severity: "high",
    platforms: ["android", "ios"],
    engines: ["any"],
    symptoms: [
      "oyuncular 7. seviyede bırakıyor",
      "players quitting at level 7",
      "Sudden drop-off spike in level completion funnel analytics",
      "Level completion duration increases 10x",
      "Difficulty spike churn"
    ],
    keywords: [
      "churn", "dropoff", "level 7", "difficulty cliff", "funnel analytics", "retention drop",
      "oyuncular birakiyor", "seviyede birakiyor", "zorluk dengesi"
    ],
    causes: [
      "Introducing an unexplained game mechanic without proper tutorial",
      "Exponential difficulty jump in enemy health or puzzle complexity"
    ],
    solution: [
      { step: 1, action: "Inspect attempt count and failure ratios for the churned level in analytics.", effort: "low" },
      { step: 2, action: "Smooth difficulty curve and provide dynamic hints after repeated failures.", effort: "medium" },
      { step: 3, action: "A/B test tuned level configurations via Remote Config.", effort: "medium" }
    ],
    prevention: ["Set up granular funnel telemetry for the first 15 levels prior to launch."],
    tools: [],
    related: ["M-40"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "heuristic"
  },
  {
    id: "M-23",
    title: "Player churn due to aggressive or ill-timed push notifications",
    category: "liveops",
    severity: "medium",
    platforms: ["android", "ios"],
    engines: ["any"],
    symptoms: ["High notification opt-out rates and negative store reviews regarding midnight spam"],
    keywords: ["push notifications", "quiet hours", "frequency capping", "timezone push", "bildirim spami"],
    causes: ["Broadcasting push messages without respecting user timezone or setting frequency caps"],
    solution: [
      { step: 1, action: "Enforce Quiet Hours (22:00 - 08:00 local time) on all automated notifications.", effort: "low" },
      { step: 2, action: "Cap daily notification frequency to maximum 1-2 valuable alerts.", effort: "medium" }
    ],
    prevention: ["Request notification permissions after user completes an engaging action (e.g. chest unlocking)."],
    tools: [],
    related: ["M-22"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-24",
    title: "Game audio muting or freezing after ad video playback",
    category: "audio",
    severity: "high",
    platforms: ["android", "ios"],
    engines: ["any"],
    symptoms: ["Background music ceases or game stutters after closing an interstitial or rewarded ad"],
    keywords: ["ad audio loss", "audio focus", "avplayer interrupt", "ad crash", "reklam sesi"],
    causes: ["Ad SDK taking audio focus / AVAudioSession and failing to return focus on ad dismissal"],
    solution: [
      { step: 1, action: "Manually re-activate AudioListener / AVAudioSession in OnAdClosed callback.", effort: "low" },
      { step: 2, action: "Set Time.timeScale = 0 and mute game audio while ad is playing.", effort: "low" }
    ],
    prevention: ["Test all ad formats with headphones connected and silent mode toggled."],
    tools: [],
    related: ["M-39", "M-43"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-25",
    title: "Save game progress reset when switching to a new device",
    category: "savegame",
    severity: "critical",
    platforms: ["android", "ios"],
    engines: ["any"],
    symptoms: [
      "yeni telefonda ilerleme sıfırlandı",
      "save progress reset on new phone",
      "Save file not restoring on new device",
      "Cloud save synchronization failure",
      "Player starts from level 1 on new phone"
    ],
    keywords: [
      "save", "cloud save", "progress reset", "new phone", "google play games save", "icloud save",
      "ilerleme sifirlandi", "kayit silindi", "savegame"
    ],
    causes: [
      "Storing game progress only in local storage (PlayerPrefs/local file) without cloud backup",
      "Missing authentication link to Google Play Games / Apple Game Center"
    ],
    solution: [
      { step: 1, action: "Integrate Google Play Games Saved Games and Apple iCloud / Game Center Cloud Save.", effort: "medium" },
      { step: 2, action: "Load cloud save data when a user logs in on a new device instead of empty local template.", effort: "medium" },
      { step: 3, action: "Use timestamps and checksums to resolve sync conflicts in favor of higher progress.", effort: "medium" }
    ],
    prevention: ["Sync local saves to cloud immediately upon critical milestones (level complete, IAP)."],
    tools: [],
    related: ["M-26", "M-27"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-26",
    title: "Save data corruption and loss during game version migration (Save Migration)",
    category: "savegame",
    severity: "critical",
    platforms: ["android", "ios"],
    engines: ["any"],
    symptoms: [
      "Existing players lose inventory or high scores after updating the app",
      "Crash on startup when parsing old save files with new fields",
      "Save schema migration failure"
    ],
    keywords: ["save migration", "schema version", "data loss", "save corruption", "surum yukseltme", "kayit bozuldu"],
    causes: ["Adding new required JSON keys without writing schema migration logic for older save versions"],
    solution: [
      { step: 1, action: "Always embed an explicit integer `schemaVersion` inside the save data payload.", effort: "low" },
      { step: 2, action: "Execute sequential migration functions (e.g. v1->v2->v3) populating default values.", effort: "medium" }
    ],
    prevention: ["Include historical sample save files in automated CI test suites."],
    tools: [],
    related: ["M-25", "M-27"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-27",
    title: "Offline gameplay progress overwritten by cloud save conflict",
    category: "savegame",
    severity: "high",
    platforms: ["android", "ios"],
    engines: ["any"],
    symptoms: ["Offline progress made on airplane mode gets overwritten by older cloud save upon reconnecting"],
    keywords: ["cloud conflict", "offline progress", "save conflict", "merge save", "kayit cakismasi"],
    causes: ["Relying blindly on server timestamp rather than comparing gameplay progression milestones"],
    solution: [
      { step: 1, action: "Present a conflict resolution dialog ('Local Progress (Lvl 15)' vs 'Cloud (Lvl 10)').", effort: "medium" },
      { step: 2, action: "Implement smart merging for currency and unlocked levels.", effort: "medium" }
    ],
    prevention: ["Structure save data with event-sourcing or additive delta tracking."],
    tools: [],
    related: ["M-25", "M-26"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-28",
    title: "Google Play Android Vitals crash & ANR threshold exceeded",
    category: "crash",
    severity: "critical",
    platforms: ["android"],
    engines: ["any"],
    symptoms: [
      "çökme oranı vitals eşiğine yaklaştı",
      "Play Console Bad Behavior Threshold warning",
      "User-perceived crash rate or ANR rate exceeded 1.09% threshold",
      "Game discoverability reduced in Google Play search"
    ],
    keywords: [
      "vitals", "android vitals", "crash rate", "anr rate", "bad behavior", "play console vitals",
      "cokme orani", "anr orani", "vitals esigi"
    ],
    causes: ["Main thread blocking over 5 seconds (ANRs) or crashes clustered on specific device models"],
    solution: [
      { step: 1, action: "Identify top crashing devices and stack traces from Play Console Vitals dashboard.", effort: "low" },
      { step: 2, action: "Move file I/O, heavy JSON parsing, and SDK initialization off the main UI thread.", effort: "medium" }
    ],
    prevention: ["Test startup flows with Android StrictMode enabled."],
    tools: [],
    related: ["M-02", "M-29", "M-30"],
    sources: [
      { url: "https://developer.android.com/topic/performance/vitals/core", type: "primary", title: "Core Android Vitals" }
    ],
    verifiedAt: "2026-10-04",
    confidence: "policy"
  },
  {
    id: "M-29",
    title: "iOS EXC_BAD_ACCESS / SIGSEGV native memory crash",
    category: "crash",
    severity: "critical",
    platforms: ["ios"],
    engines: ["any"],
    symptoms: [
      "Game terminates instantly to home screen without C# exceptions",
      "Xcode logs EXC_BAD_ACCESS (KERN_INVALID_ADDRESS)",
      "iOS native SIGSEGV crash"
    ],
    keywords: ["exc_bad_access", "sigsegv", "native crash", "dangling pointer", "use after free", "ios crash"],
    causes: ["Accessing deallocated C++ memory (Use-after-free), null pointer dereference, or P/Invoke marshalling errors"],
    solution: [
      { step: 1, action: "Symbolicate crash logs using corresponding dSYM files to pinpoint exact failing frame.", effort: "medium" },
      { step: 2, action: "Enable Address Sanitizer (ASan) and Zombie Objects in Xcode scheme.", effort: "medium" }
    ],
    prevention: ["Pin IntPtr lifecycles in native C/C++ bridges to prevent premature garbage collection."],
    tools: [],
    related: ["M-02", "M-28"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-30",
    title: "Engine unhandled exception causing silent game freeze",
    category: "crash",
    severity: "high",
    platforms: ["android", "ios"],
    engines: ["any"],
    symptoms: ["NullReferenceException in asynchronous callback breaks main loop without crash reporter capture"],
    keywords: ["unhandled exception", "nullreferenceexception", "silent crash", "crashlytics", "sessiz cokme"],
    causes: ["Uncaught exceptions inside async tasks breaking the engine rendering loop"],
    solution: [
      { step: 1, action: "Attach global exception handlers (AppDomain.CurrentDomain.UnhandledException / Application.logMessageReceived).", effort: "low" },
      { step: 2, action: "Integrate Crashlytics / Sentry for real-time error telemetry.", effort: "medium" }
    ],
    prevention: ["Use null-conditional operators (`?.`) and defensive checks in async callbacks."],
    tools: [],
    related: ["M-28"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-31",
    title: "Network disconnects and packet loss on unstable mobile connections",
    category: "networking",
    severity: "medium",
    platforms: ["android", "ios"],
    engines: ["any"],
    symptoms: ["Player gets disconnected and thrown to title screen on weak 3G/subway connectivity"],
    keywords: ["network retry", "exponential backoff", "timeout", "packet loss", "baglanti koptu", "zayif internet"],
    causes: ["Short network timeout thresholds without automated retry policies"],
    solution: [
      { step: 1, action: "Implement Exponential Backoff with Jitter for network retries (at least 3 attempts).", effort: "low" },
      { step: 2, action: "Display a non-blocking 'Reconnecting...' modal rather than quitting the match.", effort: "low" }
    ],
    prevention: ["Test gameplay under simulated 50% packet loss using Network Link Conditioner."],
    tools: [],
    related: ["M-32"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-32",
    title: "Launch day backend overload & server outage (Launch Spike)",
    category: "launch",
    severity: "critical",
    platforms: ["android", "ios"],
    engines: ["any"],
    symptoms: [
      "lansmanda sunucu çöktü",
      "server down on launch day with 503 error",
      "Auth server returns 503 Service Unavailable",
      "Database connection pool exhaustion on launch day",
      "All players disconnected during launch"
    ],
    keywords: [
      "launch spike", "server crash", "503 service unavailable", "backend outage", "rate limit",
      "connection pool", "login queue", "lansman", "sunucu coktu"
    ],
    causes: [
      "Thundering Herd effect from thousands of concurrent user logins",
      "Serving static configuration files directly from primary database instead of CDN"
    ],
    solution: [
      { step: 1, action: "Place all static game configs and downloadable assets behind a CDN (Cloudflare/CloudFront).", effort: "low" },
      { step: 2, action: "Enable rate limiting and a dynamic Login Queue.", effort: "medium" },
      { step: 3, action: "Trigger Kill Switch flags to temporarily disable non-critical features (chat, leaderboards).", effort: "medium" }
    ],
    prevention: ["Perform load testing at 5x expected peak concurrent users (CCU) 1 week before launch."],
    tools: [],
    related: ["M-31", "M-40"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-33",
    title: "Device clock manipulation exploit for unlimited energy and timed rewards",
    category: "security",
    severity: "medium",
    platforms: ["android", "ios"],
    engines: ["any"],
    symptoms: ["Players advancing phone clock by 1 day to bypass energy cooldowns and collect daily rewards"],
    keywords: ["time exploit", "device clock", "energy exploit", "server time", "trusted timestamp", "saat hilesi"],
    causes: ["Validating countdown timers using local `DateTime.Now` instead of trusted server timestamps"],
    solution: [
      { step: 1, action: "Validate time-gated rewards using trusted server NTP or backend timestamps.", effort: "medium" },
      { step: 2, action: "For offline states, track elapsed duration using monotonic uptime clocks (`SystemClock.elapsedRealtime`).", effort: "medium" }
    ],
    prevention: ["Detect abrupt forward/backward time jumps and lock reward collection."],
    tools: [],
    related: ["M-34"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-34",
    title: "Memory manipulation and cheat engine coin/health hacking",
    category: "security",
    severity: "high",
    platforms: ["android", "ios"],
    engines: ["any"],
    symptoms: ["Players modifying currency and health values in memory using GameGuardian or Cheat Engine"],
    keywords: ["memory hack", "cheat engine", "gameguardian", "obscured types", "bellek manipülasyonu", "hile"],
    causes: ["Storing sensitive economy and health variables as plain integers/floats in memory"],
    solution: [
      { step: 1, action: "Use XOR-encrypted memory wrappers (e.g. Anti-Cheat Toolkit ObscuredTypes).", effort: "low" },
      { step: 2, action: "Make critical purchases and reward calculations server-authoritative.", effort: "high" }
    ],
    prevention: ["Enable code obfuscation (ProGuard / Unity Obfuscator) in release builds."],
    tools: [],
    related: ["M-21", "M-33"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-35",
    title: "Turkish 'i' uppercase/lowercase conversion bug breaking keys and enums",
    category: "localization",
    severity: "high",
    platforms: ["android", "ios"],
    engines: ["any"],
    symptoms: [
      "türkçe büyük harf i sorunu",
      "Turkish i uppercase conversion bug",
      "String enum parsing or JSON key lookup fails on Turkish locale devices",
      "String.ToUpper() produces 'İTEM_İD' instead of 'ITEM_ID', breaking dictionary lookups",
      "Turkish-i bug"
    ],
    keywords: [
      "turkish i", "i sorunu", "case conversion", "toupper", "tolower", "cultureinvariant",
      "string comparison", "enum parse", "turkce", "buyuk harf i"
    ],
    causes: [
      "Using `str.ToUpper()` or `str.ToLower()` without CultureInfo.InvariantCulture, transforming `i->İ` on Turkish locales"
    ],
    solution: [
      { step: 1, action: "Always use `ToUpperInvariant()` or `StringComparison.OrdinalIgnoreCase` for internal IDs, JSON keys, and Enum parsing.", effort: "low" },
      { step: 2, action: "Apply culture-specific casing only when rendering text to user interface.", effort: "low" }
    ],
    prevention: ["Run unit tests with current culture set to `tr-TR`."],
    tools: [],
    related: ["M-36", "M-37"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-36",
    title: "Right-to-Left (RTL) Arabic & Hebrew text disjointed and reversed layout",
    category: "localization",
    severity: "medium",
    platforms: ["android", "ios"],
    engines: ["any"],
    symptoms: [
      "Arabic letters disconnected and displayed in reverse order",
      "RTL Arabic text disjointed",
      "UI progress bars and buttons aligning to wrong edge"
    ],
    keywords: ["rtl", "arabic", "hebrew", "bidi", "textmeshpro rtl", "sagdan sola", "arapca"],
    causes: ["Default text component lacking BiDi (Bi-directional) and Arabic glyph shaping algorithms"],
    solution: [
      { step: 1, action: "Enable TextMeshPro RTL support and integrate an Arabic shaping plugin.", effort: "low" },
      { step: 2, action: "Apply a layout mirroring script to invert X-anchors on RTL locales.", effort: "medium" }
    ],
    prevention: ["Verify localized builds with a native Arabic speaker before release."],
    tools: [],
    related: ["M-09", "M-35", "M-37"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-37",
    title: "Localized text clipping and overflow on buttons (German/Russian translations)",
    category: "localization",
    severity: "low",
    platforms: ["android", "ios"],
    engines: ["any"],
    symptoms: ["German/Russian button text overflows boundaries or gets truncated into 'EINVERST...'"],
    keywords: ["text overflow", "truncation", "auto size", "german text overflow", "metin sigmiyor", "ceviri"],
    causes: ["Fixed width button containers assuming short English word lengths"],
    solution: [
      { step: 1, action: "Enable 'Auto Size' (Min/Max font size clamping) on UI text elements.", effort: "low" },
      { step: 2, action: "Use Content Size Fitter and Horizontal Layout Groups for dynamic button resizing.", effort: "low" }
    ],
    prevention: ["Test UI with pseudo-localization (+30% character length) during UI development."],
    tools: [],
    related: ["M-09", "M-35"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-38",
    title: "Game failing to pause properly when backgrounded, playing audio",
    category: "device",
    severity: "medium",
    platforms: ["android", "ios"],
    engines: ["any"],
    symptoms: ["Game music continues playing and draining battery after user presses Home button"],
    keywords: ["background pause", "onapplicationpause", "background audio", "lifecycle", "arka plan"],
    causes: ["Failing to pause audio listener and rendering clock in OnApplicationPause / OnApplicationFocus"],
    solution: [
      { step: 1, action: "Set `AudioListener.pause = true` and `Time.timeScale = 0` in application pause callbacks.", effort: "low" }
    ],
    prevention: ["Test home button and incoming phone call interruptions on physical hardware."],
    tools: [],
    related: ["M-07", "M-24"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-39",
    title: "Audio cutout and buzzing when connecting or disconnecting Bluetooth headphones",
    category: "audio",
    severity: "medium",
    platforms: ["android", "ios"],
    engines: ["any"],
    symptoms: [
      "All game audio mutes permanently when connecting or disconnecting AirPods / Bluetooth headphones",
      "Bluetooth disconnect audio mute"
    ],
    keywords: ["bluetooth headphones", "audio route change", "airpods", "audio reset", "ses kesilmesi"],
    causes: ["Audio engine failing to adapt to sample rate changes when audio routing changes"],
    solution: [
      { step: 1, action: "Listen to audio configuration change events and call `AudioSettings.Reset()` to re-initialize drivers.", effort: "medium" }
    ],
    prevention: ["Perform headset plug/unplug tests during active gameplay QA."],
    tools: [],
    related: ["M-24", "M-38"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-40",
    title: "Emergency live fix without waiting for store approval (Remote Config / Kill Switch)",
    category: "liveops",
    severity: "high",
    platforms: ["android", "ios"],
    engines: ["any"],
    symptoms: [
      "hata var ama mağaza onayı beklemek istemiyorum",
      "Critical live bug discovered, need immediate shutdown without store update",
      "Store review takes days but economy exploit requires instant mitigation",
      "Kill switch remote config panic"
    ],
    keywords: [
      "kill switch", "remote config", "hotfix", "feature flag", "emergency fix", "live ops",
      "magaza onayi beklemeden", "canli mudahale", "hata var"
    ],
    causes: ["Mobile store review cycles taking 1-3 days, preventing instant hotfixes for live economy exploits"],
    solution: [
      { step: 1, action: "Define boolean Feature Flags (Kill Switches) in Firebase Remote Config for every major feature/event.", effort: "low" },
      { step: 2, action: "Disable the problematic mini-game or event by flipping the Remote Config flag to false.", effort: "low" },
      { step: 3, action: "Enforce `minimum_supported_version` parameter if a mandatory client update is required.", effort: "medium" }
    ],
    prevention: ["Gate all online events, IAP bundles, and mini-games behind Remote Config flags."],
    tools: [],
    related: ["M-32", "M-41"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-41",
    title: "Malformed Remote Config payload causing global startup crash",
    category: "liveops",
    severity: "critical",
    platforms: ["android", "ios"],
    engines: ["any"],
    symptoms: ["All active players crash upon startup after publishing a new Remote Config update"],
    keywords: ["bad remote config", "json parse crash", "config validation", "kill switch crash", "bad payload"],
    causes: ["Typing invalid data types (null or string where number expected) in Remote Config console"],
    solution: [
      { step: 1, action: "Wrap all Remote Config JSON parsing in try-catch with safe fallback defaults.", effort: "low" },
      { step: 2, action: "Enforce sanity boundaries on parsed numeric values (e.g. if FPS <= 0 default to 60).", effort: "low" }
    ],
    prevention: ["Roll out Remote Config changes progressively to 1% user cohort first."],
    tools: [],
    related: ["M-40"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-42",
    title: "Initial download package size exceeding store cellular OTA limits",
    category: "liveops",
    severity: "medium",
    platforms: ["android", "ios"],
    engines: ["any"],
    symptoms: ["Players unable to download game over cellular data without Wi-Fi, lowering conversion rates"],
    keywords: ["download size", "ota limit", "cellular limit", "play asset delivery", "on-demand resources"],
    causes: ["Bundling all game scenes, audio, and high-res assets directly inside main binary"],
    solution: [
      { step: 1, action: "Implement Google Play Asset Delivery (PAD) or Addressables to keep initial base package under 150MB.", effort: "high" },
      { step: 2, action: "Download subsequent level assets dynamically in background.", effort: "medium" }
    ],
    prevention: ["Audit build size reports to strip unused editor textures and temporary assets."],
    tools: [],
    related: ["M-02"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-43",
    title: "Ad mediation SDK blocking main UI thread during initial startup (ANR)",
    category: "networking",
    severity: "high",
    platforms: ["android", "ios"],
    engines: ["any"],
    symptoms: ["Black screen for 5 seconds on startup or Android 'App Not Responding' (ANR) warning"],
    keywords: ["admob anr", "main thread lock", "ad mediation", "startup anr", "black screen startup"],
    causes: ["Synchronously initializing multiple ad mediation network adapters on main thread"],
    solution: [
      { step: 1, action: "Initialize ad SDKs on a background thread or defer until after the first loading screen.", effort: "low" },
      { step: 2, action: "Include only actively used mediation adapters.", effort: "low" }
    ],
    prevention: ["Verify main thread is not blocked for more than 500ms during cold startup."],
    tools: [],
    related: ["M-28", "M-44"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  },
  {
    id: "M-44",
    title: "3rd party SDK dependency and duplicate class conflict",
    category: "store_policy",
    severity: "high",
    platforms: ["android", "ios"],
    engines: ["any"],
    symptoms: ["Gradle build error 'Duplicate class found' or iOS linker error 'duplicate symbols for architecture'"],
    keywords: ["duplicate class", "dependency conflict", "gradle conflict", "duplicate symbol", "androidx conflict"],
    causes: ["Multiple SDKs bundling different versions of shared dependencies (e.g. AndroidX Core or Play Services)"],
    solution: [
      { step: 1, action: "Enforce single dependency version in Gradle via `resolutionStrategy.force` or Android Dependency Manager.", effort: "medium" },
      { step: 2, action: "Deduplicate overlapping CocoaPods dependencies in Podfile for iOS.", effort: "medium" }
    ],
    prevention: ["Inspect dependency tree (`./gradlew app:dependencies`) when adding new SDKs."],
    tools: [],
    related: ["M-10", "M-43"],
    sources: [],
    verifiedAt: "2026-10-04",
    confidence: "established"
  }
];

// Write individual problem files
for (const p of problems) {
  const filePath = path.join(problemsDir, `${p.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(p, null, 2), "utf-8");
}
console.log(`Wrote ${problems.length} problem files in English.`);

// Synonyms (International / TR & EN)
const synonyms = {
  "overheating": ["overheating", "thermal", "throttling", "throttle", "hot", "overheats", "isinma", "sicak", "hararet"],
  "crash": ["crash", "oom", "out of memory", "abnormal exit", "force close", "killed", "terminated", "exception", "cokme", "kapaniyor"],
  "fps": ["fps", "framerate", "frame rate", "drops frames", "kare hizi", "kare dususu"],
  "stutter": ["stutter", "micro stutter", "lag", "hitch", "freeze", "takilma", "donma", "kare atlamasi"],
  "gc": ["gc", "garbage collection", "gc alloc", "gc spike", "heap allocation", "bellek copu"],
  "savegame": ["save", "savegame", "progress", "cloud save", "sync", "data loss", "migration", "reset", "kayit", "ilerleme"],
  "store_rejection": ["rejection", "rejected", "policy", "violation", "store review", "guideline", "itms", "magaza", "red"],
  "target_api": ["target api", "targetsdk", "targetsdkversion", "api level", "api version", "hedef api"],
  "page_size": ["16 kb", "16kb", "page size", "elf", "p_align", "alignment", "shared object", "sayfa boyutu"],
  "privacy": ["privacy manifest", "xcprivacy", "nsprivacyaccessedapitypes", "required reason", "privacy policy", "gizlilik"],
  "tracking": ["att", "tracking", "app tracking transparency", "idfa", "nstracking", "izleme"],
  "gacha": ["loot box", "gacha", "drop rate", "odds", "probability", "chest", "kasa", "oranlar", "sans kutusu"],
  "iap": ["iap", "in-app purchase", "billing", "receipt", "finishTransaction", "consumeAsync", "restore purchases", "payment", "satin alma", "odeme"],
  "churn": ["churn", "dropoff", "level drop", "retention", "difficulty cliff", "terk", "oyuncular birakiyor"],
  "vitals": ["vitals", "android vitals", "crash rate", "anr", "anr rate", "bad behavior"],
  "backend": ["server", "backend", "launch", "outage", "downtime", "503", "sunucu", "lansman"],
  "turkish_i": ["turkish i", "case conversion", "dotless i", "toupper", "tolower", "cultureinvariant", "turkce", "i sorunu"],
  "kill_switch": ["kill switch", "remote config", "feature flag", "hotfix", "ota", "uzaktan ayar"],
  "battery": ["battery", "battery drain", "power consumption", "wakelock", "pil", "sarj"],
  "rendering": ["shader", "overdraw", "draw call", "gpu", "vulkan", "metal", "batching", "render"]
};
fs.writeFileSync(path.join(rootDir, "knowledge", "synonyms.json"), JSON.stringify(synonyms, null, 2), "utf-8");
console.log("Wrote synonyms.json in English.");

// Store Rules
const storeRules = [
  {
    id: "play-target-api",
    platform: "android",
    title: "Google Play Target API Level Requirement (API 35+)",
    appliesTo: "All new app submissions and updates on Google Play",
    effectiveDate: "2026-11-01",
    kind: "deadline",
    problemIds: ["M-10"],
    checkId: "android-target-sdk",
    source: {
      url: "https://developer.android.com/google/play/requirements/target-sdk",
      type: "primary",
      title: "Target API level requirements for Google Play apps"
    },
    verifiedAt: "2026-10-04"
  },
  {
    id: "play-16kb-page-size",
    platform: "android",
    title: "Android 16 KB Page Size Alignment Mandate",
    appliesTo: "All apps targeting Android 15+ containing native C/C++ (.so) shared libraries",
    effectiveDate: "2027-02-01",
    kind: "deadline",
    problemIds: ["M-11"],
    checkId: "android-elf-16kb-alignment",
    source: {
      url: "https://developer.android.com/guide/practices/page-sizes",
      type: "primary",
      title: "Support 16 KB page sizes"
    },
    verifiedAt: "2026-10-04"
  },
  {
    id: "ios-xcode-sdk-version",
    platform: "ios",
    title: "Xcode and iOS SDK Minimum Version Requirement (iOS 18 / Xcode 16)",
    appliesTo: "All iOS apps submitted to the App Store",
    effectiveDate: "2026-04-25",
    kind: "deadline",
    problemIds: ["M-13"],
    checkId: "ios-xcode-version",
    source: {
      url: "https://developer.apple.com/ios/submit/",
      type: "primary",
      title: "Submitting iOS Apps to the App Store"
    },
    verifiedAt: "2026-10-04"
  },
  {
    id: "ios-privacy-manifest",
    platform: "ios",
    title: "PrivacyInfo.xcprivacy and Required Reason API Declaration",
    appliesTo: "All iOS apps and 3rd party SDKs accessing sensitive APIs (UserDefaults, File Timestamps)",
    effectiveDate: "2024-05-01",
    kind: "deadline",
    problemIds: ["M-13"],
    checkId: "ios-privacy-manifest-check",
    source: {
      url: "https://developer.apple.com/documentation/bundleresources/privacy_manifest_files",
      type: "primary",
      title: "Privacy manifest files"
    },
    verifiedAt: "2026-10-04"
  },
  {
    id: "ios-att-tracking",
    platform: "ios",
    title: "App Tracking Transparency (ATT) & NSUserTrackingUsageDescription",
    appliesTo: "All iOS apps collecting telemetry or advertising identifiers (IDFA)",
    kind: "requirement",
    problemIds: ["M-14"],
    checkId: "ios-att-check",
    source: {
      url: "https://developer.apple.com/app-store/user-privacy-and-data-use/",
      type: "primary",
      title: "User Privacy and Data Use"
    },
    verifiedAt: "2026-10-04"
  },
  {
    id: "play-closed-testing-personal-account",
    platform: "android",
    title: "14-Day 20-Tester Closed Testing Requirement for Personal Play Console Accounts",
    appliesTo: "All personal Google Play developer accounts created after Nov 13, 2023",
    kind: "requirement",
    problemIds: ["M-10"],
    source: {
      url: "https://support.google.com/googleplay/android-developer/answer/14151465",
      type: "secondary",
      title: "Google Play closed testing requirements"
    },
    verifiedAt: "2026-10-04"
  }
];
fs.writeFileSync(path.join(rulesDir, "store-rules.json"), JSON.stringify(storeRules, null, 2), "utf-8");
console.log("Wrote store-rules.json in English.");

// Prelaunch Checklist
const checklists = [
  {
    id: "chk-target-sdk",
    text: "Target SDK level meets mandatory Google Play annual requirement (API 35+)?",
    area: "Platform Compliance",
    platforms: ["android"],
    problemIds: ["M-10"]
  },
  {
    id: "chk-16kb-alignment",
    text: "All 64-bit .so native libraries aligned to 16 KB boundaries (p_align >= 0x4000)?",
    area: "Platform Compliance",
    platforms: ["android"],
    problemIds: ["M-11"]
  },
  {
    id: "chk-privacy-manifest",
    text: "PrivacyInfo.xcprivacy included with valid non-empty Required Reason codes?",
    area: "Privacy & Security",
    platforms: ["ios"],
    problemIds: ["M-13"]
  },
  {
    id: "chk-att-permission",
    text: "If ad tracking is active, NSUserTrackingUsageDescription defined in Info.plist with ATTrackingManager prompt?",
    area: "Privacy & Security",
    platforms: ["ios"],
    requires: { monetization: ["ads"] },
    problemIds: ["M-14"]
  },
  {
    id: "chk-loot-box-rates",
    text: "Drop rates (%) for gacha/chests clearly disclosed to user before purchase?",
    area: "Monetization",
    platforms: ["android", "ios"],
    requires: { monetization: ["gacha"] },
    problemIds: ["M-16"]
  },
  {
    id: "chk-account-deletion",
    text: "In-app account and personal data deletion option provided in Settings for registered accounts?",
    area: "Store Policies",
    platforms: ["android", "ios"],
    problemIds: ["M-17"]
  },
  {
    id: "chk-iap-finish-transaction",
    text: "IAP items saved before finishing transactions and pending receipts processed on startup?",
    area: "Monetization",
    platforms: ["android", "ios"],
    requires: { monetization: ["iap"] },
    problemIds: ["M-20"]
  },
  {
    id: "chk-cloud-save-migration",
    text: "Save schema versioning defined and backward-compatibility migrations verified?",
    area: "Data & Savegame",
    platforms: ["android", "ios"],
    problemIds: ["M-25", "M-26"]
  },
  {
    id: "chk-remote-kill-switch",
    text: "Remote Config Kill Switch feature flags configured for all live events and online modes?",
    area: "Live-Ops & Launch",
    platforms: ["android", "ios"],
    problemIds: ["M-40"]
  },
  {
    id: "chk-kids-coppa-policy",
    text: "Child-directed titles using certified ad SDKs with personalized tracking disabled?",
    area: "Children Policy",
    platforms: ["android", "ios"],
    requires: { kids: true },
    problemIds: ["M-18"]
  }
];
fs.writeFileSync(path.join(checklistsDir, "prelaunch.json"), JSON.stringify(checklists, null, 2), "utf-8");
console.log("Wrote prelaunch.json in English.");

// Launch Runbook
const runbook = {
  phases: {
    "t-1": {
      title: "1 Day Before Launch (T-1)",
      steps: [
        "Verify clean install of final release build on test hardware and validate cloud save restore.",
        "Verify Remote Config fallback defaults and live kill switch flags in production dashboard.",
        "Conduct load testing on backend auth/game servers and verify database connection pool limits.",
        "Audit IAP Sandbox and live store pricing matching in-game economy tables."
      ],
      decisionRules: [
        "If critical OOM crash or billing transaction loss is detected, halt launch immediately (No-Go).",
        "Do not commence staged rollout until all P0 pre-launch checklist items are green."
      ]
    },
    "hour-1": {
      title: "First Hour of Launch (Hour-1)",
      steps: [
        "Initiate Staged Rollout at 5% - 10% cohort allocation.",
        "Monitor real-time server CPU, memory, API latency, and 5xx error spikes in telemetry.",
        "Track Crashlytics / Sentry for fatal cold startup exceptions."
      ],
      decisionRules: [
        "If server error rate exceeds 2%, throttle login queue rate and divert static asset traffic to CDN.",
        "If fatal crash rate exceeds 1% in first 100 users, halt staged rollout."
      ]
    },
    "hour-6": {
      title: "Hour 6 of Launch (Hour-6)",
      steps: [
        "Analyze Google Play Vitals Crash and ANR rates.",
        "Verify IAP conversion and transaction fulfillment (un-delivered purchase rate must be 0%).",
        "Inspect level completion funnel analytics for early levels (Levels 1-5)."
      ],
      decisionRules: [
        "If Vitals metrics are healthy below thresholds, increase rollout to 25%.",
        "If a specific device family exhibits repeated crashes, exclude that device tier temporarily."
      ]
    },
    "day-1": {
      title: "24 Hours Post Launch (Day-1)",
      steps: [
        "Expand rollout to 50% or 100%.",
        "Evaluate Day-1 (D1) Retention and average session durations.",
        "Gather player community feedback and monitor store star ratings."
      ],
      decisionRules: [
        "If D1 retention is significantly below targets, prepare Remote Config A/B test for onboarding difficulty."
      ]
    }
  }
};
fs.writeFileSync(path.join(runbooksDir, "launch-day.json"), JSON.stringify(runbook, null, 2), "utf-8");
console.log("Wrote launch-day.json in English.");

// Seed Markdown Guide in English
let mdContent = `# Mobile Game Troubleshooting & Store Compliance Guide (44 Cases)\n\n`;
for (const p of problems) {
  mdContent += `### ${p.id} · ${p.title}\n\n`;
  mdContent += `**Category:** ${p.category} | **Severity:** ${p.severity} | **Confidence:** ${p.confidence}\n\n`;
  mdContent += `**Symptoms:**\n${p.symptoms.map((s) => `- ${s}`).join("\n")}\n\n`;
  mdContent += `**Causes:**\n${p.causes.map((c) => `- ${c}`).join("\n")}\n\n`;
  mdContent += `**Solution:**\n${p.solution.map((s) => `${s.step}. ${s.action}`).join("\n")}\n\n`;
  mdContent += `**Prevention:**\n${p.prevention.map((pr) => `- ${pr}`).join("\n")}\n\n`;
  if (p.sources.length > 0) {
    mdContent += `**Sources:**\n${p.sources.map((src) => `- [${src.title || src.url}](${src.url}) (${src.type})`).join("\n")}\n\n`;
  }
  mdContent += `*Verified Date:* ${p.verifiedAt}\n\n---\n\n`;
}

fs.writeFileSync(path.join(seedDir, "mobile-game-troubleshooting-guide.md"), mdContent, "utf-8");
console.log("Wrote seed guide markdown in English.");
