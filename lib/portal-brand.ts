// Whose brand a client space wears. Most projects are Redline Studio's; a project
// for a partner studio (Ergoligne is a Fenua Studio client) is hosted here but the
// client sees only that studio: fonts, colours, header, footer, tab title, icon
// and its own login form at /portal/<slug>. Pure: importable anywhere.

export type Brand = "redline" | "fenua";

export function brandOf(value: unknown): Brand {
  return value === "fenua" ? "fenua" : "redline";
}

/** "Ergoligne (Fenua Studio)": how Curtis's internal emails name a partner studio's client. */
export function clientLabel(clientName: string, brand: Brand): string {
  return brand === "fenua" ? `${clientName} (Fenua Studio)` : clientName;
}

export const FENUA = {
  name: "Fenua Studio",
  footer: "Fenua Studio · Studio digital au fenua · hello@fenuastudio.agency · +689 87 05 82 75",
  email: "hello@fenuastudio.agency",
  icon: "/fenua/icon.png",
  mark: "/fenua/mark.svg",
} as const;
