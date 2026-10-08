"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GENDERS, STUDY_YEARS } from "@/modules/recruitment/constants";

type Values = { lastName: string; firstName: string; gender: string; phone: string; email: string; studyYear: string; fieldOfStudy: string };

export function CandidateEditForm({ candidateId, initial }: { candidateId: string; initial: Values }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrors({});
    const res = await fetch(`/api/admin/candidates/${candidateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    }).catch(() => null);
    const body = await res?.json().catch(() => ({}));
    if (!res?.ok) {
      setErrors({ ...(body?.fields ?? {}), _: body?.error ?? "Enregistrement impossible." });
      setStatus("idle");
      return;
    }
    setStatus("saved");
    router.refresh();
  }

  const input = (name: keyof Values, label: string, type = "text") => (
    <div>
      <label htmlFor={`edit-${name}`} className="label">{label}</label>
      <input id={`edit-${name}`} type={type} value={values[name]} onChange={(e) => setValues((v) => ({ ...v, [name]: e.target.value }))} className={`input ${errors[name] ? "input-error" : ""}`} />
      {errors[name] && <p className="field-error">{errors[name]}</p>}
    </div>
  );

  return (
    <form onSubmit={save} className="space-y-4" data-testid="edit-form">
      <div className="grid gap-4 sm:grid-cols-2">
        {input("lastName", "Nom")}
        {input("firstName", "Prénom")}
        <div>
          <label htmlFor="edit-gender" className="label">Genre</label>
          <select id="edit-gender" value={values.gender} onChange={(e) => setValues((v) => ({ ...v, gender: e.target.value }))} className="input">
            {GENDERS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="edit-studyYear" className="label">Année d&apos;étude</label>
          <select id="edit-studyYear" value={values.studyYear} onChange={(e) => setValues((v) => ({ ...v, studyYear: e.target.value }))} className="input">
            {STUDY_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {input("fieldOfStudy", "Filière")}
        {input("phone", "Téléphone", "tel")}
        <div className="sm:col-span-2">{input("email", "Email", "email")}</div>
      </div>
      {errors._ && <p className="field-error" role="alert">{errors._}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={status === "saving"}>{status === "saving" ? "Enregistrement…" : "Enregistrer les modifications"}</button>
        {status === "saved" && <span className="text-sm font-semibold text-green-300" role="status">✅ Modifications enregistrées</span>}
      </div>
    </form>
  );
}
