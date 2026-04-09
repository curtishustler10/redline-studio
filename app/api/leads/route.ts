import { NextResponse } from "next/server"
import { getLeads, saveLead } from "@/lib/leads"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const pwd = searchParams.get("pwd")
  if (pwd !== (process.env.DASHBOARD_PASSWORD ?? "redline")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return NextResponse.json(getLeads())
}

export async function POST(request: Request) {
  const body = await request.json()
  const { name, email, service, message } = body

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email required" }, { status: 400 })
  }

  const lead = saveLead({
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    service: String(service ?? "").trim(),
    message: String(message ?? "").trim(),
  })

  return NextResponse.json(lead, { status: 201 })
}
