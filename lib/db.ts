// The single point of contact with Postgres.
//
// SERVER-ONLY. Never import this module — directly or transitively — from a
// "use client" component: it reads the service-role key, which bypasses RLS and
// must never reach a browser bundle. RLS is on with zero policies, so the anon
// key grants nothing; this client is the only way in.
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required: refusing to start against an unknown database.`);
  return value;
}

export function getDb(): SupabaseClient {
  if (client) return client;
  client = createClient(required("SUPABASE_URL"), required("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
    // Next 14 caches server-side fetch() by default. supabase-js goes through fetch, so
    // without this a page could serve a stale query (seen: /rdv not showing a RDV just
    // booked). CRM data must always be read live.
    global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
  });
  return client;
}
