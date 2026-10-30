export function formatMarketValue(value: number, currency: string, unit?: string) {
  if (!Number.isFinite(value)) return "—";
  if (unit === "points") return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} pts`;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: currency === "BRL" && value < 10 ? 4 : 2,
  }).format(value);
}

export function formatMarketDate(date: string) {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  return parts ? `${parts[3]}/${parts[2]}/${parts[1]}` : date;
}

export function formatMarketPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}
