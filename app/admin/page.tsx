import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, verifyAdmin } from "@/lib/admin-auth";
import { adminLogin } from "./actions";
import { ERR_MESSAGES } from "./_lib/ui";

export const dynamic = "force-dynamic";

export default function AdminLogin({ searchParams }: { searchParams: { err?: string } }) {
  if (verifyAdmin(cookies().get(ADMIN_COOKIE)?.value)) redirect("/admin/leads");
  const err = searchParams.err ? ERR_MESSAGES[searchParams.err] : null;

  return (
    <main className="min-h-screen flex items-center justify-center px-5">
      <form action={adminLogin} className="w-full max-w-sm bg-white border border-[#E4D8C6] rounded-2xl p-8">
        <p className="text-lg font-semibold">
          redline <span className="font-normal text-[#6F655C]">studio</span>
        </p>
        <h1 className="mt-6 text-2xl font-semibold">Espace admin</h1>
        <label htmlFor="password" className="mt-6 block text-sm text-[#6F655C]">
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          autoComplete="current-password"
          className="mt-2 w-full rounded-xl border border-[#E4D8C6] bg-[#FBF6EE] px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#C8321F]"
        />
        {err && (
          <p role="alert" className="mt-3 text-sm text-[#C8321F]">
            {err}
          </p>
        )}
        <button type="submit" className="mt-6 w-full rounded-full bg-[#C8321F] py-3 font-semibold text-white hover:bg-[#B32A1F] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#C8321F]">
          Se connecter
        </button>
      </form>
    </main>
  );
}
