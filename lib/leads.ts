import fs from "fs"
import path from "path"

export type LeadStatus = "new" | "contacted" | "closed"

export type Lead = {
  id: string
  name: string
  email: string
  service: string
  message: string
  createdAt: string
  status: LeadStatus
}

const LEADS_FILE = path.join(process.cwd(), "data", "leads.json")

function ensureFile() {
  const dir = path.dirname(LEADS_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(LEADS_FILE)) fs.writeFileSync(LEADS_FILE, "[]", "utf-8")
}

export function getLeads(): Lead[] {
  ensureFile()
  try {
    return JSON.parse(fs.readFileSync(LEADS_FILE, "utf-8")) as Lead[]
  } catch {
    return []
  }
}

export function saveLead(data: Omit<Lead, "id" | "createdAt" | "status">): Lead {
  const leads = getLeads()
  const lead: Lead = {
    ...data,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString(),
    status: "new",
  }
  leads.unshift(lead)
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), "utf-8")
  return lead
}

export function updateLeadStatus(id: string, status: LeadStatus): Lead | null {
  const leads = getLeads()
  const idx = leads.findIndex((l) => l.id === id)
  if (idx === -1) return null
  leads[idx].status = status
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), "utf-8")
  return leads[idx]
}
