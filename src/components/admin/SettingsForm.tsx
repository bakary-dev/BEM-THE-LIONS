"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SettingsInput } from "@/lib/settings-schema";

type Field = { name: keyof SettingsInput; label: string; type?: string; placeholder?: string };
const GROUPS: { title: string; fields: Field[] }[] = [
  {
    title: "Équipe",
    fields: [
      { name: "teamName", label: "Nom" },
      { name: "city", label: "Ville" },
      { name: "season", label: "Saison", placeholder: "2026-2027" },
      { name: "teamMembersCount", label: "Nombre de membres", type: "number" },
      { name: "winsCount", label: "Victoires", type: "number" },
      { name: "lossesCount", label: "Défaites", type: "number" },
      { name: "previousSeason", label: "Saison précédente", placeholder: "2025-2026" },
    ],
  },
  { title: "WhatsApp", fields: [{ name: "whatsappGroupLink", label: "Lien du groupe", type: "url", placeholder: "https://chat.whatsapp.com/..." }] },
  {
    title: "Responsable / Capitaine",
    fields: [
      { name: "responsibleName", label: "Nom" },
      { name: "responsibleWhatsapp", label: "WhatsApp", type: "tel", placeholder: "+225 07 00 00 00 00" },
      { name: "responsiblePhone", label: "Téléphone", type: "tel", placeholder: "+225 07 00 00 00 00" },
    ],
  },
  {
    title: "Coach",
    fields: [
      { name: "coachName", label: "Nom" },
      { name: "coachWhatsapp", label: "WhatsApp", type: "tel", placeholder: "+225 05 00 00 00 00" },
      { name: "coachPhone", label: "Téléphone", type: "tel", placeholder: "+225 05 00 00 00 00" },
    ],
  },
];

export function SettingsForm({ initial }: { initial: SettingsInput }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setState("saving");
    setErrors({});
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    }).catch(() => null);
    const body = await res?.json().catch(() => ({}));
    if (!res?.ok) {
      setErrors({ ...(body?.fields ?? {}), _: body?.error ?? "Enregistrement impossible." });
      setState("idle");
      return;
    }
    setState("saved");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="space-y-6" data-testid="settings-form">
      {GROUPS.map((g) => (
        <fieldset key={g.title} className="card p-5">
          <legend className="eyebrow px-2">{g.title}</legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.fields.map((f) => (
              <div key={f.name} className={f.name === "whatsappGroupLink" ? "sm:col-span-2 lg:col-span-3" : ""}>
                <label htmlFor={`s-${f.name}`} className="label">{f.label}</label>
                <input
                  id={`s-${f.name}`}
                  name={f.name}
                  type={f.type ?? "text"}
                  min={f.type === "number" ? 0 : undefined}
                  placeholder={f.placeholder}
                  value={String(values[f.name] ?? "")}
                  onChange={(e) => {
                    setValues((v) => ({ ...v, [f.name]: f.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value }));
                    setState("idle");
                  }}
                  className={`input ${errors[f.name] ? "input-error" : ""}`}
                />
                {errors[f.name] && <p className="field-error">{errors[f.name]}</p>}
              </div>
            ))}
          </div>
        </fieldset>
      ))}
      {errors._ && <p className="field-error" role="alert">{errors._}</p>}
      <div className="sticky bottom-20 flex items-center gap-3 md:bottom-4">
        <button type="submit" className="btn-primary shadow-xl" disabled={state === "saving"}>{state === "saving" ? "Enregistrement…" : "Enregistrer les paramètres"}</button>
        {state === "saved" && <span className="rounded-lg bg-ink-800 px-3 py-2 text-sm font-semibold text-green-300" role="status">✅ Paramètres enregistrés</span>}
      </div>
    </form>
  );
}
