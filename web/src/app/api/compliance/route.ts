import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { checkStoreCompliance } from "../../../../../dist/core/compliance/index.js";
import { getProjectRootDir } from "@/lib/engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { preset, customPath, platform = "both", xcodeVersion } = body;

    let targetPath = customPath;
    const projectRoot = getProjectRootDir();

    if (preset) {
      if (preset === "android-good") targetPath = path.join(projectRoot, "test", "fixtures", "android-good");
      else if (preset === "android-bad") targetPath = path.join(projectRoot, "test", "fixtures", "android-bad");
      else if (preset === "ios-good") targetPath = path.join(projectRoot, "test", "fixtures", "ios-good");
      else if (preset === "ios-bad") targetPath = path.join(projectRoot, "test", "fixtures", "ios-bad");
    }

    if (!targetPath) {
      return NextResponse.json({ error: "Lütfen bir proje yolu belirtin veya hazır bir test fixture seçin." }, { status: 400 });
    }

    const report = checkStoreCompliance({
      projectPath: targetPath,
      platform,
      xcodeVersion
    });

    return NextResponse.json(report);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Uyum taraması sırasında hata oluştu." }, { status: 500 });
  }
}
