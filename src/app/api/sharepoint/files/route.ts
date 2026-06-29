import { NextRequest, NextResponse } from "next/server";
import { listCustomerFiles } from "@/lib/microsoft-graph";

export async function GET(request: NextRequest) {
  const folder = request.nextUrl.searchParams.get("folder");

  if (!folder) {
    return NextResponse.json(
      { error: "Missing folder parameter" },
      { status: 400 }
    );
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
