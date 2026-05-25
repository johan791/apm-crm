import { NextRequest, NextResponse } from "next/server";
import { exportInvoiceBasisCsv } from "@/lib/actions/invoice-basis";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const csv = await exportInvoiceBasisCsv(id);
    const bom = "﻿";

    return new NextResponse(bom + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="fakturaunderlag-${id}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
