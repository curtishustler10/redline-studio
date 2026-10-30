// Shared funnel constants. Single source of truth for the contact CTA targets.
// The main CTA books a call on the site (/rdv): Redline sells to France, where a
// calendar beats a WhatsApp chat on a +689 number. WhatsApp stays for the emails'
// footer and as a secondary way in.
export const BOOKING_HREF = "/rdv";

export const WHATSAPP_NUMBER = "68987058275"; // +689 87 05 82 75

export const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Bonjour, je viens du site Redline Studio et j'aimerais réserver un appel.",
)}`;

// Window event dispatched by the mobile sticky CTA to open the hero diagnostic.
export const START_DIAGNOSTIC_EVENT = "redline:start-diagnostic";

// CustomEvent<"ecommerce" | "b2b"> dispatched when the diagnostic's business-type
// question is answered, so the revenue simulator pre-selects the matching mode.
export const SIM_MODE_EVENT = "redline:sim-mode";
