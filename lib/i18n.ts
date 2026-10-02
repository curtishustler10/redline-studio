export type Lang = "fr" | "en";

const fr = {
  nav: {
    items: ["Bienvenue", "Diagnostic", "Les 5 axes", "Simulateur", "Cas clients", "Ce que vous recevez", "La méthode", "Offres"],
    cta: "Réserver un appel",
    portal: "Mon projet",
  },
  hero: {
    kicker: "Studio web indépendant",
    titleA: "Plus de clients,",
    titleB: "moins de prise\u00A0de\u00A0tête.",
    sub: "Site, réservation, avis Google, pubs : nous relions tout ce qui fait venir vos clients, et nous vous expliquons chaque étape en français normal.",
    cta: "Commencer le diagnostic",
    chips: ["2 minutes", "Gratuit", "Résultat immédiat"],
    note: "tirez le fil",
  },
  diagnostic: {
    title: "Le diagnostic",
    sub: "Trois étapes pour comprendre ce qui freine vos ventes en ligne.",
    steps: [
      { icon: "🎯", title: "Nous auditons votre présence", body: "Site, réservation, avis Google, référencement local : nous mesurons chaque axe et repérons où les clients vous échappent." },
      { icon: "💰", title: "Nous chiffrons le manque à gagner", body: "Avec vos vrais chiffres, nous estimons ce que vous laissez filer chaque mois. Pas d'estimation gonflée." },
      { icon: "⚡", title: "Nous vous remettons un plan clair", body: "Priorités, gains attendus, délais. Vous repartez avec une feuille de route en français normal, que vous travailliez avec nous ou non." },
    ],
  },
  quiz: {
    badge: "Diagnostic interactif · 2 min",
    title: "Quel axe vous fait perdre des ventes ?",
    sub: "5 questions. Nous notons vos 5 axes et vous montrons celui qui est en zone rouge.",
    start: "Démarrer le diagnostic",
    progress: "Question",
    of: "sur",
    back: "Retour",
    bizType: {
      question: "Votre type d'activité",
      options: {
        ecommerce: { label: "E-commerce", hint: "Vente en ligne" },
        b2b: { label: "B2B", hint: "Vente à d'autres entreprises" },
        services: { label: "Prestations de services", hint: "RDV, devis, clients locaux" },
      },
    },
    questionsByType: {
      ecommerce: [
        {
          q: "Vos fiches produits et votre tunnel d'achat poussent-ils à l'achat ?",
          options: ["Oui, un parcours d'achat clair et optimisé", "Correct, mais des frictions subsistent", "Non, peu de ventes viennent du site"],
        },
        {
          q: "Récupérez-vous les emails et relancez-vous les paniers abandonnés ?",
          options: ["Oui, capture d'emails + relance panier automatique", "Je capture des emails, sans relance", "Non, ni capture ni relance"],
        },
        {
          q: "Avez-vous des séquences email automatiques (bienvenue, panier, post-achat) ?",
          options: ["Oui, plusieurs séquences tournent", "Une ou deux, faites à la main", "Aucune séquence"],
        },
        {
          q: "Êtes-vous visible sur Google (Shopping, recherches produits) ?",
          options: ["Oui, je ressors sur mes produits clés", "Un peu, sur ma marque seulement", "Non, invisible sans pub"],
        },
        {
          q: "Comment attirez-vous du trafic vers votre boutique ?",
          options: ["Un canal payant rentable tourne (ads, social)", "Des essais irréguliers", "Presque pas de trafic"],
        },
      ],
      b2b: [
        {
          q: "Votre site inspire-t-il confiance et pousse-t-il à la prise de contact ?",
          options: ["Oui, positionnement clair et appels à l'action", "Correct, mais peu convaincant", "Non, c'est surtout une plaquette"],
        },
        {
          q: "Un visiteur intéressé peut-il facilement demander une démo ou un devis ?",
          options: ["Oui, prise de RDV / formulaire en 1 clic", "Il doit m'écrire ou m'appeler", "Rien n'est prévu, il repart"],
        },
        {
          q: "Relancez-vous automatiquement vos prospects (nurturing, CRM) ?",
          options: ["Oui, séquences et CRM en place", "Relances manuelles, quand j'y pense", "Aucune relance"],
        },
        {
          q: "Vous trouve-t-on sur Google / LinkedIn pour votre expertise ?",
          options: ["Oui, je ressors sur mes sujets clés", "Un peu, sur mon nom d'entreprise", "Non, on ne me trouve pas"],
        },
        {
          q: "Comment générez-vous de nouveaux prospects aujourd'hui ?",
          options: ["Prospection ou ads qui tournent", "Surtout réseau et bouche-à-oreille", "Très peu de nouveaux prospects"],
        },
      ],
      services: [
        {
          q: "Votre site transforme-t-il les visiteurs en demandes (formulaire, appel, devis) ?",
          options: ["Oui, un parcours clair mène à l'action", "Un peu, mais ce n'est pas optimisé", "Non, c'est surtout une vitrine"],
        },
        {
          q: "Quand un visiteur intéressé arrive, que se passe-t-il ?",
          options: ["Il réserve ou laisse ses coordonnées en 1 clic", "Il doit m'écrire ou m'appeler", "Il repart sans laisser de trace"],
        },
        {
          q: "Avez-vous un suivi automatique (email/WhatsApp : confirmations, rappels, relances) ?",
          options: ["Oui, c'est automatisé", "Je le fais à la main, quand j'y pense", "Aucun suivi"],
        },
        {
          q: "Vous trouve-t-on sur Google quand on cherche votre service près de chez vous ?",
          options: ["Oui, je ressors dans les premiers résultats / la carte", "Parfois, sur mon nom seulement", "Non, je suis invisible"],
        },
        {
          q: "Comment attirez-vous de nouveaux visiteurs aujourd'hui ?",
          options: ["Un canal d'acquisition tourne (pub, contenu)", "Surtout du bouche-à-oreille, par à-coups", "Je n'attire quasiment personne"],
        },
      ],
    },
    bricks: {
      site: "Site qui convertit",
      capture: "Capture & réservation",
      followup: "Suivi automatisé",
      seo: "SEO local",
      acquisition: "Acquisition",
    },
    zones: { red: "Zone rouge", warn: "À renforcer", ok: "Solide" },
    result: {
      heading: "Votre diagnostic",
      scoreLabel: "Score écosystème",
      weakestLabel: "Votre plus grosse fuite",
      weakestHint: "C'est l'axe à corriger en priorité pour débloquer des ventes.",
      formTitle: "Recevez votre plan d'action personnalisé",
      formSub: "Nous vous envoyons les priorités et le manque à gagner estimé pour votre cas.",
      name: "Prénom",
      email: "Email",
      submit: "Recevoir mon plan",
      sending: "Envoi…",
      successTitle: "C'est noté ✅",
      successBody: "Nous vous répondons sous 24 h (jours ouvrés) avec votre plan. Un email de confirmation vient de partir. En attendant, jouez avec le simulateur ci-dessous.",
      error: "Une erreur est survenue. Réessayez, ou écrivez-nous directement sur WhatsApp.",
      privacy: "Pas de spam. Vos infos servent uniquement à préparer votre diagnostic.",
      restart: "Refaire le test",
    },
  },
  briques: {
    title: "Les 5 axes d'un écosystème qui vend",
    sub: "Un site n'est qu'un axe. Il en faut cinq pour transformer l'attention en revenus.",
    items: [
      { n: "01", title: "Site qui convertit", body: "Rapide, clair, orienté action. Chaque page a un objectif et le guide vers le clic." },
      { n: "02", title: "Capture & réservation", body: "Formulaire, prise de rendez-vous, devis en ligne : un visiteur intéressé ne repart plus les mains vides." },
      { n: "03", title: "Suivi automatisé", body: "Email et WhatsApp : confirmations, rappels, relances. Le suivi qui fait revenir et acheter." },
      { n: "04", title: "SEO local", body: "Fiche Google, mots-clés de proximité, avis : vous apparaissez là où vos clients cherchent." },
      { n: "05", title: "Acquisition", body: "Publicité ciblée quand c'est pertinent, pour amorcer la pompe et accélérer les résultats." },
    ],
  },
  simulator: {
    title: "Simulateur de chiffre d'affaires",
    sub: "Réglez vos chiffres. Voyez l'écart entre un site seul et un écosystème complet.",
    modes: { ecommerce: "E-commerce", b2b: "B2B" },
    repeatToggle: "Rétention & fréquence",
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
    note: "Estimation indicative basée sur vos réglages. Les résultats réels dépendent de votre marché et de votre budget marketing.",
  },
  cases: {
    title: "Cas clients",
    sub: "Des entreprises réelles, des axes manquants comblés, des résultats.",
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
      { n: "01", title: "Audit", body: "Nous analysons votre présence et vos chiffres." },
      { n: "02", title: "Maquette", body: "Vous voyez votre futur site avant qu'une ligne de code soit écrite." },
      { n: "03", title: "Développement", body: "Site rapide, responsive, sans dette technique." },
      { n: "04", title: "Réservation", body: "Prise de rendez-vous et capture intégrées." },
      { n: "05", title: "SEO local", body: "Fiche Google, mots-clés, structure optimisée." },
      { n: "06", title: "Lancement", body: "Mise en ligne, tests, et nous vous montrons comment tout marche." },
      { n: "07", title: "Acquisition", body: "Publicité ciblée pour amorcer le trafic." },
      { n: "08", title: "Suivi", body: "Nous mesurons, ajustons, et restons votre interlocuteur." },
    ],
  },
  offers: {
    title: "Deux façons de démarrer",
    sub: "Un site qui convertit, ou l'écosystème complet. Vous choisissez, nous vous conseillons honnêtement.",
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
        tagline: "Les 5 axes réunis pour vendre en continu.",
        features: ["Tout le Site Conversion", "★ Moteur de réservation", "★ Suivi email / WhatsApp", "★ SEO local complet", "★ Acquisition & analytics"],
        cta: "Réserver un appel",
        recommended: true,
      },
    ],
    paymentNote: "Paiement en 3× sans frais possible.",
    badge: "Recommandé",
  },
  closing: {
    title: "Votre site travaille pour vous, ou contre vous ?",
    sub: "Faites le diagnostic en 2 minutes, ou parlons-en directement. Dans les deux cas, vous repartez avec au moins une idée.",
    primary: "Commencer le diagnostic",
    secondary: "Réserver un appel",
  },
  portal: {
    title: "Espace client",
    subtitle: "Connectez-vous pour suivre votre projet.",
    email: "Email",
    password: "Mot de passe",
    submit: "Se connecter",
    forgot: "Mot de passe oublié ?",
    noAccountQ: "Pas encore de compte ?",
    noAccountA: "Écrivez-nous, nous vous créons votre accès.",
    back: "← Retour au site",
  },
  footer: {
    rights: "Tous droits réservés.",
    tagline: "Le fil rouge entre vous et vos clients.",
  },
} as const;

const en = {
  nav: {
    items: ["Welcome", "Diagnostic", "The 5 pillars", "Simulator", "Case studies", "What you get", "The method", "Offers"],
    cta: "Book a call",
    portal: "My project",
  },
  hero: {
    kicker: "Independent web studio",
    titleA: "More customers,",
    titleB: "less hassle.",
    sub: "Website, bookings, Google reviews, ads: we connect everything that brings customers to your door, and explain every step in plain English.",
    cta: "Start the diagnostic",
    chips: ["2 minutes", "Free", "Instant result"],
    note: "pull the thread",
  },
  diagnostic: {
    title: "The diagnostic",
    sub: "Three steps to understand what's holding back your online sales.",
    steps: [
      { icon: "🎯", title: "We audit your presence", body: "Site, bookings, Google reviews, local search: we measure every pillar and find where customers slip away." },
      { icon: "💰", title: "We put a number on what you're missing", body: "Using your real figures, we estimate what slips away each month. No inflated guesses." },
      { icon: "⚡", title: "We hand you a clear plan", body: "Priorities, expected gains, timelines. You leave with a plain-English roadmap, whether you work with us or not." },
    ],
  },
  quiz: {
    badge: "Interactive diagnostic · 2 min",
    title: "Which pillar is costing you sales?",
    sub: "5 questions. We score your 5 pillars and show you the one in the red zone.",
    start: "Start the diagnostic",
    progress: "Question",
    of: "of",
    back: "Back",
    bizType: {
      question: "Your business type",
      options: {
        ecommerce: { label: "E-commerce", hint: "Selling online" },
        b2b: { label: "B2B", hint: "Selling to other businesses" },
        services: { label: "Services", hint: "Bookings, quotes, local clients" },
      },
    },
    questionsByType: {
      ecommerce: [
        {
          q: "Do your product pages and checkout drive purchases?",
          options: ["Yes, a clear optimised buying journey", "Okay, but there's friction", "No, few sales come from the site"],
        },
        {
          q: "Do you capture emails and recover abandoned carts?",
          options: ["Yes, email capture + automatic cart recovery", "I capture emails, but no recovery", "No capture or recovery"],
        },
        {
          q: "Do you have automated email flows (welcome, cart, post-purchase)?",
          options: ["Yes, several flows running", "One or two, done manually", "No flows"],
        },
        {
          q: "Are you visible on Google (Shopping, product searches)?",
          options: ["Yes, I rank for my key products", "A little, on my brand only", "No, invisible without ads"],
        },
        {
          q: "How do you drive traffic to your store?",
          options: ["A profitable paid channel is running (ads, social)", "Irregular experiments", "Almost no traffic"],
        },
      ],
      b2b: [
        {
          q: "Does your site build trust and prompt contact?",
          options: ["Yes, clear positioning and calls to action", "Okay, but not convincing", "No, it's mostly a brochure"],
        },
        {
          q: "Can an interested visitor easily request a demo or quote?",
          options: ["Yes, booking / form in one click", "They have to email or call me", "Nothing set up, they leave"],
        },
        {
          q: "Do you follow up with prospects automatically (nurturing, CRM)?",
          options: ["Yes, sequences and CRM in place", "Manual follow-ups, when I remember", "No follow-up"],
        },
        {
          q: "Are you found on Google / LinkedIn for your expertise?",
          options: ["Yes, I rank for my key topics", "A little, on my company name", "No, I'm not found"],
        },
        {
          q: "How do you generate new prospects today?",
          options: ["Outbound or ads running", "Mostly network and word of mouth", "Very few new prospects"],
        },
      ],
      services: [
        {
          q: "Does your site turn visitors into enquiries (form, call, quote)?",
          options: ["Yes, a clear path leads to action", "Somewhat, but it's not optimised", "No, it's mostly a brochure"],
        },
        {
          q: "When an interested visitor lands, what happens?",
          options: ["They book or leave details in one click", "They have to email or call me", "They leave without a trace"],
        },
        {
          q: "Do you have automated follow-up (email/WhatsApp: confirmations, reminders, win-backs)?",
          options: ["Yes, it's automated", "I do it by hand, when I remember", "No follow-up"],
        },
        {
          q: "Are you found on Google when someone searches your service nearby?",
          options: ["Yes, I show up in top results / the map", "Sometimes, only on my name", "No, I'm invisible"],
        },
        {
          q: "How do you attract new visitors today?",
          options: ["A working acquisition channel (ads, content)", "Mostly word-of-mouth, in bursts", "I attract almost no one"],
        },
      ],
    },
    bricks: {
      site: "A converting site",
      capture: "Capture & booking",
      followup: "Automated follow-up",
      seo: "Local SEO",
      acquisition: "Acquisition",
    },
    zones: { red: "Red zone", warn: "Needs work", ok: "Solid" },
    result: {
      heading: "Your diagnostic",
      scoreLabel: "Ecosystem score",
      weakestLabel: "Your biggest leak",
      weakestHint: "This is the pillar to fix first to unlock sales.",
      formTitle: "Get your personalised action plan",
      formSub: "We'll send you the priorities and the estimated lost revenue for your case.",
      name: "First name",
      email: "Email",
      submit: "Get my plan",
      sending: "Sending…",
      successTitle: "Got it ✅",
      successBody: "We'll reply within 24 hours (business days) with your plan. A confirmation email is on its way. Meanwhile, play with the simulator below.",
      error: "Something went wrong. Try again, or message us directly on WhatsApp.",
      privacy: "No spam. Your details are only used to prepare your diagnostic.",
      restart: "Retake the test",
    },
  },
  briques: {
    title: "The 5 pillars of an ecosystem that sells",
    sub: "A website is just one pillar. It takes five to turn attention into revenue.",
    items: [
      { n: "01", title: "A converting site", body: "Fast, clear, action-driven. Every page has a goal and guides toward the click." },
      { n: "02", title: "Capture & booking", body: "Forms, appointments, online quotes: an interested visitor no longer leaves empty-handed." },
      { n: "03", title: "Automated follow-up", body: "Email and WhatsApp: confirmations, reminders, win-backs. The follow-up that brings people back." },
      { n: "04", title: "Local SEO", body: "Google profile, local keywords, reviews: you show up where your customers search." },
      { n: "05", title: "Acquisition", body: "Targeted ads when it makes sense, to prime the pump and speed up results." },
    ],
  },
  simulator: {
    title: "Revenue simulator",
    sub: "Set your numbers. See the gap between a website alone and a full ecosystem.",
    modes: { ecommerce: "E-commerce", b2b: "B2B" },
    repeatToggle: "Retention & frequency",
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
    note: "Indicative estimate based on your settings. Real results depend on your market and marketing budget.",
  },
  cases: {
    title: "Case studies",
    sub: "Real businesses, missing pillars filled, results.",
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
      { n: "02", title: "Mockup", body: "You see your future site before a line of code is written." },
      { n: "03", title: "Development", body: "Fast, responsive site with no technical debt." },
      { n: "04", title: "Booking", body: "Appointments and capture built in." },
      { n: "05", title: "Local SEO", body: "Google profile, keywords, optimised structure." },
      { n: "06", title: "Launch", body: "Go-live, testing, and we show you how everything works." },
      { n: "07", title: "Acquisition", body: "Targeted ads to prime traffic." },
      { n: "08", title: "Follow-up", body: "We measure, adjust, and stay your point of contact." },
    ],
  },
  offers: {
    title: "Two ways to start",
    sub: "A converting site, or the full ecosystem. You choose, we give you an honest recommendation.",
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
        tagline: "All 5 pillars together to sell continuously.",
        features: ["Everything in Conversion Site", "★ Booking engine", "★ Email / WhatsApp follow-up", "★ Full local SEO", "★ Acquisition & analytics"],
        cta: "Book a call",
        recommended: true,
      },
    ],
    paymentNote: "3 interest-free instalments available.",
    badge: "Recommended",
  },
  closing: {
    title: "Your website works for you, or against you?",
    sub: "Take the 2-minute diagnostic, or let's just talk. Either way, you leave with at least one idea.",
    primary: "Start the diagnostic",
    secondary: "Book a call",
  },
  portal: {
    title: "Client portal",
    subtitle: "Log in to track your project.",
    email: "Email",
    password: "Password",
    submit: "Log in",
    forgot: "Forgot password?",
    noAccountQ: "Not yet an account?",
    noAccountA: "Message us and we'll set up your access.",
    back: "← Back to site",
  },
  footer: {
    rights: "All rights reserved.",
    tagline: "The red thread between you and your customers.",
  },
} as const;

export const dictionaries = { fr, en };
export type Dict = typeof fr | typeof en;
