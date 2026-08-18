export function formatPrice(value: number, currency = "NPR") {
  const amount = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
  return `${currency === "NPR" ? "Rs." : currency} ${amount}`;
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function generateCode(prefix: string) {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `${prefix}-${out}`;
}