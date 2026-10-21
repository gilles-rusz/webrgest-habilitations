"use client";

import { Lock, LoaderCircle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { Session } from "./App";

export function Login({ expired, onLogin }: { expired: boolean; onLogin: (s: Session) => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    setBusy(false);
    if (res?.ok && data?.session) onLogin(data.session);
    else setError(data?.error || "Connexion impossible.");
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-[#141729] p-4">
      <form onSubmit={submit} className="sheet-in w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center gap-2.5">
          <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-[#141729]">
            <Image src="/globe.png" alt="" width={38} height={38} priority />
          </span>
          <p className="text-[15px] font-black tracking-wide">
            WEB RG EST <span className="font-semibold italic tracking-normal text-[#c9962a]">/ Habilitations</span>
          </p>
        </div>
        <h1 className="mt-5 flex items-center gap-2 text-xl font-black">
          <Lock size={20} className="text-teal-600" /> Accès démo
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {expired ? "Votre accès a expiré. Entrez à nouveau votre code." : "Entrez le code d'accès fourni par Web RG Est."}
        </p>
        <input
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoComplete="one-time-code"
          placeholder="Code d'accès"
          className="mt-4 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-base outline-none focus:border-teal-500"
        />
        {error && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
        <button disabled={busy} className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-teal-600 font-bold text-white disabled:opacity-50">
          {busy && <LoaderCircle size={18} className="animate-spin" />} Se connecter
        </button>
      </form>
    </div>
  );
}
