import { NextResponse } from "next/server"
import { updateLeadStatus, type LeadStatus } from "@/lib/leads"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url)
  const pwd = searchParams.get("pwd")
  if (pwd !== (process.env.DASHBOARD_PASSWORD ?? "redline")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { status } = await request.json()
  const valid: LeadStatus[] = ["new", "contacted", "closed"]
  if (!valid.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  const lead = updateLeadStatus(params.id, status)
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json(lead)
}
