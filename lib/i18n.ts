export type Lang = "fr" | "en";

const fr = {
  nav: {
    items: ["Bienvenue", "Diagnostic", "Les 5 briques", "Simulateur", "Cas clients", "Ce que vous recevez", "La méthode", "Offres"],
    cta: "Réserver un appel",
  },
  hero: {
    kicker: "Studio web · conversion & écosystèmes",
    titleA: "Un site seul ne vend pas.",
    titleB: "Un écosystème, oui.",
    sub: "La plupart des sites sont de jolies brochures qui ne rapportent rien. Nous construisons l'écosystème complet — site qui convertit, réservation, suivi, SEO local, acquisition — pour transformer vos visiteurs en clients.",
    cta: "Commencer le diagnostic",
    chips: ["5 briques analysées", "12 min", "100% personnalisé"],
  },
  diagnostic: {
    title: "Le diagnostic",
    sub: "Trois étapes pour comprendre ce qui freine vos ventes en ligne.",
    steps: [
      { icon: "🎯", title: "On audite votre présence", body: "Site, réservation, avis, référencement local : on mesure chaque brique et on repère les fuites." },
      { icon: "💰", title: "On chiffre le manque à gagner", body: "Avec vos chiffres réels, on estime le chiffre d'affaires que vous laissez sur la table chaque mois." },
      { icon: "⚡", title: "On vous remet un plan clair", body: "Priorités, gains attendus, délais. Vous repartez avec une feuille de route actionnable, sans jargon." },
    ],
  },
  briques: {
    title: "Les 5 briques d'un écosystème qui vend",
    sub: "Un site n'est qu'une brique. Il en faut cinq pour transformer l'attention en revenus.",
    items: [
      { n: "01", title: "Site qui convertit", body: "Rapide, clair, orienté action. Chaque page a un objectif et le guide vers le clic." },
      { n: "02", title: "Capture & réservation", body: "Formulaire, prise de rendez-vous, devis en ligne : on ne laisse jamais repartir un visiteur intéressé." },
      { n: "03", title: "Suivi automatisé", body: "Email et WhatsApp : confirmations, rappels, relances. Le suivi qui fait revenir et acheter." },
      { n: "04", title: "SEO local", body: "Fiche Google, mots-clés de proximité, avis : on vous rend visible là où vos clients cherchent." },
      { n: "05", title: "Acquisition", body: "Publicité ciblée quand c'est pertinent, pour amorcer la pompe et accélérer les résultats." },
    ],
  },
  simulator: {
    title: "Simulateur de chiffre d'affaires",
    sub: "Réglez vos chiffres. Voyez l'écart entre un site seul et un écosystème complet.",
    inputs: {
      visitors: "Visiteurs / mois",
      capture: "Taux de capture",
      conversion: "Taux de conversion",
      basket: "Panier moyen",
      frequency: "Fréquence d'achat / an",
      retention: "Rétention",
    },
    outputs: {
      leads: "Leads captés",
      clients: "Clients",
      monthly: "CA mensuel",
      yearly: "CA annuel",
    },
    compareSite: "Site seul",
    compareEco: "Écosystème Redline",
    note: "Estimation indicative basée sur vos réglages. Les résultats réels dépendent de votre marché.",
  },
  cases: {
    title: "Cas clients",
    sub: "Des entreprises réelles, des briques manquantes comblées, des résultats.",
    items: [
      { sector: "Institut de beauté · Paris", quote: "Réservation en ligne, suivi fidélité, paiement sur place.", problem: "Tout passait par téléphone et Instagram : créneaux perdus, no-shows, aucune base client.", missing: "Capture & réservation + suivi", fix: "Plateforme de réservation multi-prestations, comptes clients, rappels automatiques.", metric: "+40%", metricLabel: "de réservations en ligne" },
      { sector: "Resort · Bali", quote: "Site de réservation bilingue, calendrier en temps réel.", problem: "Aucun moyen de réserver en ligne, demandes éparpillées sur WhatsApp.", missing: "Site qui convertit + réservation", fix: "Site bilingue EN/RU, calendrier, formulaire qualifié, automatisations.", metric: "8+", metricLabel: "demandes qualifiées dès le lancement" },
      { sector: "Marque cheveux · DTC", quote: "Diagnostic ROAS et tunnel d'achat optimisé.", problem: "Budget publicitaire brûlé, panier abandonné, ROAS sous l'objectif.", missing: "Acquisition + suivi", fix: "Tableau de bord ROAS, relances panier, merchandising salon.", metric: "3,48x", metricLabel: "ROAS au pic" },
    ],
  },
  deliverables: {
    title: "Ce que vous recevez",
    sub: "Du concret, livré clé en main.",
    items: [
      { icon: "🖥️", label: "Site sur-mesure" },
      { icon: "📅", label: "Moteur de réservation" },
      { icon: "📍", label: "Configuration SEO local" },
      { icon: "📊", label: "Tableau de bord analytics" },
      { icon: "✉️", label: "Suivi email / WhatsApp" },
      { icon: "🛡️", label: "Plan de maintenance" },
      { icon: "🎨", label: "Identité & visuels" },
      { icon: "🚀", label: "Mise en ligne & formation" },
    ],
  },
  method: {
    title: "La méthode",
    sub: "Huit étapes, de l'audit à la croissance.",
    steps: [
      { n: "01", title: "Audit", body: "On analyse votre présence et vos chiffres." },
      { n: "02", title: "Design", body: "Maquettes orientées conversion, validées avec vous." },
      { n: "03", title: "Développement", body: "Site rapide, responsive, sans dette technique." },
      { n: "04", title: "Réservation", body: "Prise de rendez-vous et capture intégrées." },
      { n: "05", title: "SEO local", body: "Fiche Google, mots-clés, structure optimisée." },
      { n: "06", title: "Lancement", body: "Mise en ligne, tests, formation à la prise en main." },
      { n: "07", title: "Acquisition", body: "Publicité ciblée pour amorcer le trafic." },
      { n: "08", title: "Suivi", body: "Mesure, ajustements, croissance continue." },
    ],
  },
  offers: {
    title: "Deux façons de démarrer",
    sub: "Un site qui convertit, ou l'écosystème complet. Vous choisissez.",
    tiers: [
      {
        name: "Site Conversion",
        price: "1 490 €",
        tagline: "Le site qui transforme vos visiteurs en demandes.",
        features: ["Site 5 pages sur-mesure", "Formulaire de capture", "Fiche Google Business", "Optimisé mobile & rapide", "Mise en ligne incluse"],
        cta: "Réserver un appel",
        recommended: false,
      },
      {
        name: "Écosystème complet",
        price: "2 890 €",
        tagline: "Les 5 briques réunies pour vendre en continu.",
        features: ["Tout le Site Conversion", "★ Moteur de réservation", "★ Suivi email / WhatsApp", "★ SEO local complet", "★ Acquisition & analytics"],
        cta: "Réserver un appel",
        recommended: true,
      },
    ],
    paymentNote: "Paiement en 3× sans frais possible.",
    badge: "Recommandé",
  },
  closing: {
    title: "Votre site travaille pour vous, ou contre vous.",
    sub: "Faites le diagnostic, voyez le manque à gagner, et décidez en connaissance de cause.",
    primary: "Commencer le diagnostic",
    secondary: "Réserver un appel",
  },
  footer: {
    rights: "Tous droits réservés.",
    tagline: "Studio web — conversion & écosystèmes.",
  },
} as const;

const en = {
  nav: {
    items: ["Welcome", "Diagnostic", "The 5 bricks", "Simulator", "Case studies", "What you get", "The method", "Offers"],
    cta: "Book a call",
  },
  hero: {
    kicker: "Web studio · conversion & ecosystems",
    titleA: "A website alone doesn't sell.",
    titleB: "An ecosystem does.",
    sub: "Most websites are pretty brochures that earn nothing. We build the full ecosystem — a converting site, booking, follow-up, local SEO, acquisition — to turn your visitors into customers.",
    cta: "Start the diagnostic",
    chips: ["5 bricks analysed", "12 min", "100% tailored"],
  },
  diagnostic: {
    title: "The diagnostic",
    sub: "Three steps to understand what's holding back your online sales.",
    steps: [
      { icon: "🎯", title: "We audit your presence", body: "Site, booking, reviews, local search: we measure every brick and find the leaks." },
      { icon: "💰", title: "We quantify the lost revenue", body: "Using your real numbers, we estimate the revenue you leave on the table every month." },
      { icon: "⚡", title: "We hand you a clear plan", body: "Priorities, expected gains, timelines. You leave with an actionable roadmap, no jargon." },
    ],
  },
  briques: {
    title: "The 5 bricks of an ecosystem that sells",
    sub: "A website is just one brick. It takes five to turn attention into revenue.",
    items: [
      { n: "01", title: "A converting site", body: "Fast, clear, action-driven. Every page has a goal and guides toward the click." },
      { n: "02", title: "Capture & booking", body: "Forms, appointments, online quotes: we never let an interested visitor walk away." },
      { n: "03", title: "Automated follow-up", body: "Email and WhatsApp: confirmations, reminders, win-backs. The follow-up that brings people back." },
      { n: "04", title: "Local SEO", body: "Google profile, local keywords, reviews: we make you visible where your customers search." },
      { n: "05", title: "Acquisition", body: "Targeted ads when it makes sense, to prime the pump and speed up results." },
    ],
  },
  simulator: {
    title: "Revenue simulator",
    sub: "Set your numbers. See the gap between a website alone and a full ecosystem.",
    inputs: {
      visitors: "Visitors / month",
      capture: "Capture rate",
      conversion: "Conversion rate",
      basket: "Average basket",
      frequency: "Purchases / year",
      retention: "Retention",
    },
    outputs: {
      leads: "Leads captured",
      clients: "Customers",
      monthly: "Monthly revenue",
      yearly: "Annual revenue",
    },
    compareSite: "Website alone",
    compareEco: "Redline ecosystem",
    note: "Indicative estimate based on your settings. Real results depend on your market.",
  },
  cases: {
    title: "Case studies",
    sub: "Real businesses, missing bricks filled, results.",
    items: [
      { sector: "Beauty salon · Paris", quote: "Online booking, loyalty tracking, pay on site.", problem: "Everything ran through phone and Instagram: lost slots, no-shows, no customer base.", missing: "Capture & booking + follow-up", fix: "Multi-service booking platform, customer accounts, automated reminders.", metric: "+40%", metricLabel: "online bookings" },
      { sector: "Resort · Bali", quote: "Bilingual booking site, real-time calendar.", problem: "No way to book online, requests scattered across WhatsApp.", missing: "Converting site + booking", fix: "EN/RU bilingual site, calendar, qualified form, automations.", metric: "8+", metricLabel: "qualified requests at launch" },
      { sector: "Hair brand · DTC", quote: "ROAS diagnostic and optimised purchase funnel.", problem: "Ad budget burned, carts abandoned, ROAS below target.", missing: "Acquisition + follow-up", fix: "ROAS dashboard, cart win-backs, salon merchandising.", metric: "3.48x", metricLabel: "peak ROAS" },
    ],
  },
  deliverables: {
    title: "What you get",
    sub: "Concrete work, delivered turnkey.",
    items: [
      { icon: "🖥️", label: "Custom website" },
      { icon: "📅", label: "Booking engine" },
      { icon: "📍", label: "Local SEO setup" },
      { icon: "📊", label: "Analytics dashboard" },
      { icon: "✉️", label: "Email / WhatsApp follow-up" },
      { icon: "🛡️", label: "Maintenance plan" },
      { icon: "🎨", label: "Branding & visuals" },
      { icon: "🚀", label: "Launch & training" },
    ],
  },
  method: {
    title: "The method",
    sub: "Eight steps, from audit to growth.",
    steps: [
      { n: "01", title: "Audit", body: "We analyse your presence and your numbers." },
      { n: "02", title: "Design", body: "Conversion-focused mockups, validated with you." },
      { n: "03", title: "Development", body: "Fast, responsive site with no technical debt." },
      { n: "04", title: "Booking", body: "Appointments and capture built in." },
      { n: "05", title: "Local SEO", body: "Google profile, keywords, optimised structure." },
      { n: "06", title: "Launch", body: "Go-live, testing, hands-on training." },
      { n: "07", title: "Acquisition", body: "Targeted ads to prime traffic." },
      { n: "08", title: "Follow-up", body: "Measure, adjust, grow continuously." },
    ],
  },
  offers: {
    title: "Two ways to start",
    sub: "A converting site, or the full ecosystem. You choose.",
    tiers: [
      {
        name: "Conversion Site",
        price: "€1,490",
        tagline: "The site that turns visitors into enquiries.",
        features: ["Custom 5-page site", "Capture form", "Google Business profile", "Mobile-optimised & fast", "Launch included"],
        cta: "Book a call",
        recommended: false,
      },
      {
        name: "Full Ecosystem",
        price: "€2,890",
        tagline: "All 5 bricks together to sell continuously.",
        features: ["Everything in Conversion Site", "★ Booking engine", "★ Email / WhatsApp follow-up", "★ Full local SEO", "★ Acquisition & analytics"],
        cta: "Book a call",
        recommended: true,
      },
    ],
    paymentNote: "3 interest-free instalments available.",
    badge: "Recommended",
  },
  closing: {
    title: "Your website works for you, or against you.",
    sub: "Run the diagnostic, see the lost revenue, and decide with eyes open.",
    primary: "Start the diagnostic",
    secondary: "Book a call",
  },
  footer: {
    rights: "All rights reserved.",
    tagline: "Web studio — conversion & ecosystems.",
  },
} as const;

export const dictionaries = { fr, en };
export type Dict = typeof fr | typeof en;
