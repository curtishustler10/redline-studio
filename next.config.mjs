// Les maquettes des leads du marché français vivent dans le dépôt branto-dashboard et sont
// servies ici, sous redlinestudio.agency/bespoke/<slug>, par réécriture côté serveur : le
// lien envoyé au prospect reste signé Redline Studio. Même montage que fenua-studio-site.
// Surchargeable en local pour viser un branto-dashboard sur un autre port.
const MAQUETTES = process.env.MAQUETTES_ORIGIN ?? "https://branto-dashboard.vercel.app";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lint propre (`pnpm lint`) : il bloque désormais le build, comme les types.
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ["app", "components", "hooks", "lib", "scripts"],
  },
  // Type errors now fail the build: `tsc --noEmit` is clean, keep it that way.
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return {
      // `beforeFiles` : avant le routage de ce site, sinon les préchargements du routeur
      // (`?_rsc=…`) d'une maquette repartent en 404 ici. Ce site n'a rien sous /bespoke.
      beforeFiles: [{ source: "/bespoke/:path*", destination: `${MAQUETTES}/bespoke/:path*` }],
      // `afterFiles` : après les pages et fichiers de ce site, qui gardent la priorité.
      afterFiles: [
        // Visuels des maquettes, référencés en chemins absolus.
        { source: "/sites/:path*", destination: `${MAQUETTES}/sites/:path*` },
        { source: "/og/:path*", destination: `${MAQUETTES}/og/:path*` },
        // Beacon de suivi de consultation (jeton `?k=`).
        { source: "/t", destination: `${MAQUETTES}/t` },
        // Pas de règle /_next : Vercel répond 404 sur /_next/static avant la réécriture.
        // Les bundles des maquettes arrivent en absolu via l'assetPrefix de branto-dashboard.
      ],
    };
  },
  async redirects() {
    // The old JSON-file dashboard (password in the query string) is gone.
    return [
      { source: "/dashboard", destination: "/admin/leads", permanent: true },
      // Maquettes statiques du segment 2 (public/maquette/<slug>-<jeton>/index.html) : le lien envoyé
      // reste court ; la redirection garde l'URL du dossier, donc les chemins relatifs (img/, #ancres).
      { source: "/maquette/:chemin", destination: "/maquette/:chemin/index.html", permanent: false },
    ];
  },
}

export default nextConfig
