import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createLead, ensureBookingToken } from "@/lib/crm";

// Public way in to the booking calendar (the site's main CTA). It asks only what
// we need to prepare the call, creates the lead, then hands over to the personal
// booking page /rdv/<token>, which already owns slots, phone and confirmations.
// Always a NEW lead: matching an existing email would let anyone open someone
// else's booking page by typing their address.

export const metadata: Metadata = {
  title: "Réserver un appel de 30 minutes · Redline Studio",
  description: "Nous regardons votre boutique ensemble pendant 30 minutes, et vous repartez avec au moins une correction à faire.",
  alternates: { canonical: "/rdv" },
};

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

async function start(formData: FormData) {
  "use server";
  const val = (k: string, max: number) => String(formData.get(k) ?? "").trim().slice(0, max);
  // Honeypot: hidden from people, filled by bots. Send them home without a lead.
  if (val("website", 200)) redirect("/");
  const name = val("name", 200);
  const email = val("email", 320).toLowerCase();
  const shop = val("shop", 300);
  if (!name || !EMAIL.test(email)) redirect("/rdv?err=1");
  let token: string;
  try {
    const lead = await createLead({
      name,
      email,
      lang: "fr",
      source: "form",
      service: "Appel de 30 min (site)",
      message: shop ? `Boutique : ${shop}` : undefined,
    });
    token = await ensureBookingToken(lead.id);
  } catch (e) {
    console.error("[RDV] lead not saved", JSON.stringify({ name, email, shop }), (e as Error).message);
    redirect("/rdv?err=server");
  }
  redirect(`/rdv/${token}`);
}

const field = "w-full rounded-xl border border-[#E4D8C6] bg-white px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#C8321F]";

export default function RdvStartPage({ searchParams }: { searchParams: { err?: string } }) {
  const err = searchParams.err === "server"
    ? "Un souci de notre côté. Réessayez dans un instant, ou écrivez-nous à hello@redlinestudio.agency."
    : searchParams.err ? "Indiquez votre prénom et une adresse email valide." : null;
  return (
    <main className="min-h-screen bg-[#FBF6EE] text-[#1E1A17]">
      <div className="mx-auto max-w-xl px-5 py-12">
        <a href="/" className="text-lg font-semibold">
          redline <span className="font-normal text-[#6F655C]">studio</span>
        </a>
        <h1 className="mt-10 font-serif text-4xl leading-tight md:text-5xl">Réservez 30 minutes sur votre boutique</h1>
        <p className="mt-3 text-[#6F655C]">
          Nous regardons ensemble où vos clientes décrochent : page produit, panier, emails. Vous repartez avec au moins une correction à faire, que vous travailliez avec nous ou non.
        </p>
        <ul className="mt-5 space-y-1 text-sm text-[#6F655C]">
          <li>· Nous vous appelons : rien à installer</li>
          <li>· Vous choisissez le créneau à l&apos;étape suivante</li>
          <li>· Confirmation et invitation agenda par email</li>
        </ul>

        {err && <p role="alert" className="mt-8 rounded-2xl bg-[#C8321F]/10 p-5 font-medium text-[#C8321F]">{err}</p>}

        <form action={start} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm text-[#6F655C]">Prénom</span>
            <input name="name" required autoComplete="given-name" className={field} />
          </label>
          <label className="block">
            <span className="text-sm text-[#6F655C]">Email</span>
            <input name="email" type="email" required autoComplete="email" className={field} />
          </label>
          <label className="block">
            <span className="text-sm text-[#6F655C]">Adresse de votre boutique (facultatif, pour préparer l&apos;appel)</span>
            <input name="shop" type="text" inputMode="url" placeholder="votreboutique.fr" className={field} />
          </label>
          <div aria-hidden className="absolute -left-[9999px]">
            <input name="website" tabIndex={-1} autoComplete="off" />
          </div>
          <button className="w-full rounded-full bg-[#C8321F] py-4 text-base font-semibold text-white hover:bg-[#B32A1F] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C8321F] focus-visible:ring-offset-2 sm:w-auto sm:px-10">
            Choisir mon créneau →
          </button>
          <p className="text-xs text-[#6F655C]">Vos informations servent uniquement à préparer et confirmer l&apos;appel.</p>
        </form>
      </div>
    </main>
  );
}
