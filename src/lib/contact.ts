/** Lien WhatsApp direct à partir d'un numéro (formats acceptés : +225 07…, 07…, 2250…). */
export function whatsappLink(phone: string): string | null {
  const digits = toInternationalDigits(phone);
  return digits ? `https://wa.me/${digits}` : null;
}

/** Lien d'appel téléphonique (tel:). */
export function telLink(phone: string): string | null {
  const digits = toInternationalDigits(phone);
  return digits ? `tel:+${digits}` : null;
}

/** Numéro au format international sans « + » (Côte d'Ivoire par défaut pour les numéros à 10 chiffres). */
export function toInternationalDigits(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return null;
  const hasPlus = trimmed.startsWith("+") || trimmed.startsWith("00");
  let digits = trimmed.replace(/\D/g, "");
  if (trimmed.startsWith("00")) digits = digits.slice(2);
  if (!hasPlus && digits.length === 10) digits = `225${digits}`;
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}
