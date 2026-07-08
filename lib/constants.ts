// Shared funnel constants. Single source of truth for the contact CTA target so
// the number can't drift between the nav and the offers/closing CTAs.
// CTAs open WhatsApp (Curtis's line) — his market converts on WhatsApp, not email.
export const WHATSAPP_NUMBER = "68987058275"; // +689 87 05 82 75

export const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Bonjour, je viens du site Redline Studio et j'aimerais réserver un appel.",
)}`;

// Window event dispatched by the mobile sticky CTA to open the hero diagnostic.
export const START_DIAGNOSTIC_EVENT = "redline:start-diagnostic";
