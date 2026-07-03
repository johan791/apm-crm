import { NextRequest, NextResponse } from "next/server";
import { listCustomerFiles } from "@/lib/microsoft-graph";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const folder = request.nextUrl.searchParams.get("folder");

  if (!folder) {
    return NextResponse.json(
      { error: "Missing folder parameter" },
      { status: 400 }
    );
  }

  // Kundmappar är enkla namn utan sökvägsseparatorer. Avvisa allt som kan
  // användas för path traversal ut ur kundmappen.
  if (folder.includes("..") || folder.includes("/") || folder.includes("\\")) {
    return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
  }

  try {
    const files = await listCustomerFiles(folder);
    return NextResponse.json({ files });
  } catch (error) {
    console.error("SharePoint API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch files from SharePoint" },
      { status: 500 }
    );
  }
}
