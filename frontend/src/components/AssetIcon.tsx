import { useState } from "react";
import type { MarketAsset } from "../types/market";
import "../styles/asset-icon.css";

type AssetArtwork = { src: string; label: string; title: string; flag?: boolean };

// Brand artwork is served locally. Sources and the flags' license are in THIRD_PARTY_NOTICES.md.
const artwork: Record<string, AssetArtwork> = {
  petrobras: { src: "/asset-icons/petrobras.ico", label: "BR", title: "Marca Petrobras" },
  vale: { src: "/asset-icons/vale.png", label: "V", title: "Marca Vale" },
  ibovespa: { src: "/asset-icons/b3.png", label: "B3", title: "B3 · bolsa responsável pelo Ibovespa" },
  bitcoin: { src: "/asset-icons/bitcoin.png", label: "₿", title: "Bitcoin" },
  dolar: { src: "/asset-icons/us.svg", label: "US$", title: "Dólar americano / real brasileiro", flag: true },
  euro: { src: "/asset-icons/eu.svg", label: "€", title: "Euro / real brasileiro", flag: true },
  libra: { src: "/asset-icons/gb.svg", label: "£", title: "Libra esterlina / real brasileiro", flag: true },
  iene: { src: "/asset-icons/jp.svg", label: "¥", title: "Iene japonês / real brasileiro", flag: true },
};

type AssetIconProps = {
  asset: Pick<MarketAsset, "id" | "ticker">;
  size?: "small" | "medium" | "large";
};

export default function AssetIcon({ asset, size = "medium" }: AssetIconProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const mark = artwork[asset.id];
  const gold = asset.id === "ouro";

  return <span
    className={`asset-icon asset-icon-${size} asset-icon-${asset.id}${mark?.flag ? " asset-icon-flag" : ""}`}
    title={gold ? "Ouro futuro · barras de ouro" : mark?.title ?? asset.ticker}
    aria-hidden="true"
  >
    {gold ? <svg className="asset-icon-gold" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="m11 5-4 9h18l-4-9H11Z" fill="#f7cb62" stroke="#ffe1a0" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="m6 16-4 10h13l-3-10H6Z" fill="#dca63d" stroke="#f7cf77" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="m20 16-3 10h13l-4-10h-6Z" fill="#e9b64b" stroke="#ffe1a0" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M11 8h7M6 23h5m9 0h5" stroke="#fff0be" strokeWidth="1.1" strokeLinecap="round" />
    </svg> : mark && failedSource !== mark.src ? <>
      <img className="asset-icon-image" src={mark.src} alt="" width={32} height={32} decoding="async" onError={() => setFailedSource(mark.src)} />
      {mark.flag && <img className="asset-icon-quote-currency" src="/asset-icons/br.svg" alt="" width={16} height={12} decoding="async" />}
    </> : <span className="asset-icon-fallback">{mark?.label ?? asset.ticker.slice(0, 2)}</span>}
  </span>;
}
