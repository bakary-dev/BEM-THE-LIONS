import { telLink, whatsappLink } from "@/lib/contact";
import type { PublicSettings } from "@/lib/settings";

type Contact = { role: string; icon: string; name: string; whatsapp: string; phone: string };

function ContactCard({ contact }: { contact: Contact }) {
  const wa = whatsappLink(contact.whatsapp);
  const tel = telLink(contact.phone);
  return (
    <div className="card flex flex-col gap-4 p-5" data-testid="help-contact">
      <div>
        <p className="eyebrow">
          {contact.icon} {contact.role}
        </p>
        <p className="mt-2 text-xl font-bold">{contact.name || "Coordonnées bientôt disponibles"}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {wa ? (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-whatsapp w-full text-base">
            💬 WhatsApp
          </a>
        ) : (
          <span className="btn-secondary w-full opacity-50">WhatsApp indisponible</span>
        )}
        {tel ? (
          <a href={tel} className="btn-secondary w-full text-base">
            📞 Appeler
          </a>
        ) : (
          <span className="btn-secondary w-full opacity-50">Téléphone indisponible</span>
        )}
      </div>
    </div>
  );
}

export function HelpContacts({ settings, compact = false }: { settings: PublicSettings; compact?: boolean }) {
  const contacts: Contact[] = [
    {
      role: "Responsable basketball / Capitaine",
      icon: "👤",
      name: settings.responsibleName,
      whatsapp: settings.responsibleWhatsapp,
      phone: settings.responsiblePhone,
    },
    {
      role: "Coach basketball",
      icon: "🏀",
      name: settings.coachName,
      whatsapp: settings.coachWhatsapp,
      phone: settings.coachPhone,
    },
  ];
  return (
    <section aria-labelledby="help-title" className="animate-slide-up">
      <h2 id="help-title" className={`font-display tracking-wide ${compact ? "text-3xl" : "text-4xl sm:text-5xl"}`}>
        🆘 BESOIN D&apos;AIDE ?
      </h2>
      <p className="mt-3 max-w-2xl text-mist-300">
        Une question ? Un retard à signaler ? Une absence ou un empêchement ? Contactez directement un responsable de l&apos;équipe.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {contacts.map((c) => (
          <ContactCard key={c.role} contact={c} />
        ))}
      </div>
    </section>
  );
}
