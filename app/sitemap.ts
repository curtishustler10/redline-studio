import type { MetadataRoute } from "next";
import { caseStudies } from "@/lib/cases";

const BASE = "https://redlinestudio.agency";

// Public pages only: /maquette, /apercu, /rdv and /admin stay out on purpose.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, changeFrequency: "weekly", priority: 1 },
    ...caseStudies.map((c) => ({ url: `${BASE}/realisations/${c.slug}`, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
