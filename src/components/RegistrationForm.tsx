"use client";

import { useState } from "react";
import Link from "next/link";
import { GENDERS, STUDY_YEARS, displayName } from "@/modules/recruitment/constants";
import { registrationSchema } from "@/modules/recruitment/validation";
import { CandidateCard, type CardData } from "./CandidateCard";

type Values = {
  lastName: string;
  firstName: string;
  gender: string;
  phone: string;
  email: string;
  studyYear: string;
  fieldOfStudy: string;
  consent: boolean;
};
type Errors = Partial<Record<keyof Values | "_", string>>;

const EMPTY: Values = { lastName: "", firstName: "", gender: "", phone: "", email: "", studyYear: "", fieldOfStudy: "", consent: false };

export function RegistrationForm({ teamName, season }: { teamName: string; season: string }) {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CardData | null>(null);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = registrationSchema.safeParse(values);
    if (!parsed.success) {
      const errs: Errors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof Values;
        if (!errs[k]) errs[k] = issue.message;
      }
      setErrors(errs);
      document.querySelector<HTMLElement>(`[name="${Object.keys(errs)[0]}"]`)?.focus();
      return;
    }
    setSubmitting(true);
    setErrors({});
    try {
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrors({ ...(body.fields ?? {}), _: body.error ?? "Une erreur est survenue. Réessayez." });
        return;
      }
      setResult(body.candidate);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setErrors({ _: "Connexion impossible. Vérifiez votre réseau et réessayez." });
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <section className="mx-auto max-w-2xl text-center" data-testid="registration-success" aria-live="polite">
        <p className="animate-pop-in text-5xl">✅</p>
        <h1 className="mt-3 animate-slide-up font-display text-5xl tracking-wide text-success sm:text-6xl">INSCRIPTION RÉUSSIE ✅</h1>
        <p className="mt-4 animate-slide-up text-lg text-mist-300">
          Félicitations <strong className="text-white">{displayName(result)}</strong>, votre candidature pour le recrutement {teamName}{" "}
          {season} a bien été enregistrée.
        </p>
        <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-mist-400">Votre numéro candidat :</p>
        <p className="font-mono text-4xl font-bold text-gold" data-testid="candidate-number">
          {result.candidateNumber}
        </p>
        <p className="mx-auto mt-4 max-w-md rounded-xl border border-gold/30 bg-gold/10 p-3 text-sm font-semibold text-gold-300">
          Conservez précieusement votre numéro candidat et votre QR Code.
        </p>
        <div className="mt-8">
          <CandidateCard data={result} />
        </div>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/accueil" className="btn-secondary">Retour à l&apos;accueil</Link>
          <Link href="/aide" className="btn-secondary">🆘 Besoin d&apos;aide ?</Link>
        </div>
      </section>
    );
  }

  const field = (name: keyof Values, label: string, input: React.ReactNode) => (
    <div>
      <label htmlFor={name} className="label">
        {label} <span className="text-gold">*</span>
      </label>
      {input}
      {errors[name] && (
        <p className="field-error" id={`${name}-error`} role="alert">
          {errors[name]}
        </p>
      )}
    </div>
  );

  const textInput = (name: keyof Values, props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      id={name}
      name={name}
      value={values[name] as string}
      onChange={(e) => set(name, e.target.value as never)}
      aria-invalid={!!errors[name]}
      aria-describedby={errors[name] ? `${name}-error` : undefined}
      className={`input ${errors[name] ? "input-error" : ""}`}
      {...props}
    />
  );

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto max-w-2xl space-y-8" data-testid="registration-form">
      <fieldset className="card space-y-5 p-5 sm:p-7">
        <legend className="eyebrow px-2">Informations personnelles</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          {field("lastName", "Nom", textInput("lastName", { autoComplete: "family-name", placeholder: "Ex. Kouassi" }))}
          {field("firstName", "Prénom", textInput("firstName", { autoComplete: "given-name", placeholder: "Ex. Aya" }))}
        </div>
        {field(
          "gender",
          "Genre",
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Genre">
            {GENDERS.map((g) => (
              <label
                key={g.value}
                className={`flex min-h-[48px] cursor-pointer items-center justify-center rounded-xl border px-4 font-semibold transition ${
                  values.gender === g.value ? "border-gold bg-gold/15 text-gold" : "border-white/10 bg-ink-700 text-mist-300 hover:border-white/30"
                }`}
              >
                <input
                  type="radio"
                  name="gender"
                  value={g.value}
                  checked={values.gender === g.value}
                  onChange={() => set("gender", g.value)}
                  className="sr-only"
                />
                {g.label}
              </label>
            ))}
          </div>,
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          {field("phone", "Numéro de téléphone", textInput("phone", { type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "07 00 00 00 00" }))}
          {field("email", "Email", textInput("email", { type: "email", inputMode: "email", autoComplete: "email", placeholder: "prenom.nom@email.com" }))}
        </div>
      </fieldset>

      <fieldset className="card space-y-5 p-5 sm:p-7">
        <legend className="eyebrow px-2">Informations académiques</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          {field(
            "studyYear",
            "Année d'étude",
            <select
              id="studyYear"
              name="studyYear"
              value={values.studyYear}
              onChange={(e) => set("studyYear", e.target.value)}
              aria-invalid={!!errors.studyYear}
              className={`input ${errors.studyYear ? "input-error" : ""}`}
            >
              <option value="">Choisir…</option>
              {STUDY_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>,
          )}
          {field("fieldOfStudy", "Filière", textInput("fieldOfStudy", { placeholder: "Ex. Marketing" }))}
        </div>
      </fieldset>

      <div>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-ink-800 p-4">
          <input
            type="checkbox"
            name="consent"
            checked={values.consent}
            onChange={(e) => set("consent", e.target.checked)}
            className="mt-0.5 h-6 w-6 shrink-0 accent-[#F5B700]"
          />
          <span className="text-sm text-mist-300">
            J&apos;accepte que mes informations soient utilisées dans le cadre du processus de recrutement {teamName} {season}.
          </span>
        </label>
        {errors.consent && <p className="field-error" role="alert">{errors.consent}</p>}
      </div>

      <p className="text-sm text-mist-400">L&apos;inscription ne garantit pas la sélection dans l&apos;équipe. La sélection est décidée par les responsables.</p>

      {errors._ && (
        <p className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm font-semibold text-red-300" role="alert" data-testid="form-error">
          {errors._}
        </p>
      )}

      <button type="submit" className="btn-primary w-full text-base" disabled={submitting}>
        {submitting ? "Envoi en cours…" : "Envoyer ma candidature"}
      </button>
    </form>
  );
}
