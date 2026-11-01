import { useEffect, useRef, type KeyboardEvent } from "react";
import {
  createChart, CandlestickSeries, LineSeries, HistogramSeries, ColorType, CrosshairMode,
  type IChartApi, type ISeriesApi, type SeriesType, type Time,
} from "lightweight-charts";
import type { MarketHistory, OHLCVPoint } from "../types/market";
import { formatMarketDate, formatMarketValue } from "../utils/formatMarket";
import "../styles/candles.css";

type MarketChartProps = {
  history: MarketHistory;
  mode?: "candles" | "line";
  compact?: boolean;
  syncId?: string;
  height?: number;
};

type Peer = {
  chart: IChartApi;
  series: ISeriesApi<SeriesType>;
  points: Map<string, OHLCVPoint>;
  showPoint: (point: OHLCVPoint | null) => void;
};
const chartGroups = new Map<string, Set<Peer>>();
let synchronizing = false;

function dateKey(time: Time): string {
  if (typeof time === "string") return time;
  if (typeof time === "number") return new Date(time * 1000).toISOString().slice(0, 10);
  return `${time.year}-${String(time.month).padStart(2, "0")}-${String(time.day).padStart(2, "0")}`;
}

export default function MarketChart({ history, mode = "candles", compact = false, syncId, height }: MarketChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const announcementRef = useRef<HTMLParagraphElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const selectionRef = useRef(0);
  const selectPointRef = useRef<((index: number) => void) | null>(null);
  const hasVolume = history.data.some((point) => point.volume !== null);

  useEffect(() => {
    const container = containerRef.current;
    const tooltip = tooltipRef.current;
    if (!container || !tooltip || history.data.length === 0) return;

    const chart = createChart(container, {
      width: Math.max(container.clientWidth, 1),
      height: container.clientHeight || (compact ? 320 : 480),
      layout: {
        background: { type: ColorType.Solid, color: "#0c0e11" },
        textColor: "#989fa9", fontFamily: '"Cascadia Code", Consolas, monospace', fontSize: 11,
        attributionLogo: true,
        panes: { separatorColor: "#292d34", separatorHoverColor: "#675333", enableResize: true },
      },
      grid: { vertLines: { color: "#1c2026" }, horzLines: { color: "#1c2026" } },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#858d98", labelBackgroundColor: "#414750" },
        horzLine: { color: "#858d98", labelBackgroundColor: "#414750" },
      },
      rightPriceScale: { borderColor: "#30353e", scaleMargins: { top: 0.1, bottom: 0.08 }, minimumWidth: compact ? 68 : 84 },
      timeScale: { borderColor: "#30353e", timeVisible: false, secondsVisible: false, rightOffset: 2, minBarSpacing: 2 },
      localization: {
        locale: "pt-BR",
        priceFormatter: (value: number) => value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: history.asset === "dolar" ? 4 : 2 }),
        timeFormatter: (time: Time) => formatMarketDate(dateKey(time)),
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
    });
    chartRef.current = chart;

    const precision = history.asset === "dolar" ? 4 : 2;
    const priceFormat = { type: "price" as const, precision, minMove: 10 ** -precision };
    let mainSeries: ISeriesApi<SeriesType>;
    if (mode === "line") {
      const series = chart.addSeries(LineSeries, { color: "#e9a748", lineWidth: 2, priceFormat, lastValueVisible: true, crosshairMarkerVisible: true });
      series.setData(history.data.map((point) => ({ time: point.date, value: point.close })));
      mainSeries = series;
    } else {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: "#64cc9a", downColor: "#f38282", wickUpColor: "#64cc9a", wickDownColor: "#f38282",
        borderVisible: false, priceFormat,
      });
      series.setData(history.data.map((point) => ({ time: point.date, open: point.open, high: point.high, low: point.low, close: point.close })));
      mainSeries = series;
    }
    if (hasVolume) {
      const volume = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceLineVisible: false, lastValueVisible: false }, 1);
      volume.setData(history.data.map((point) => point.volume === null
        ? { time: point.date }
        : { time: point.date, value: point.volume, color: point.close >= point.open ? "#387453" : "#925050" }));
      chart.panes()[1]?.setHeight(compact ? 75 : 100);
    }

    const points = new Map(history.data.map((point) => [point.date, point]));
    const showPoint = (point: OHLCVPoint | null) => {
      const chosen = point ?? history.data.at(-1);
      if (!chosen) return;
      const values = [
        ["Sessão", formatMarketDate(chosen.date)],
        ["Abertura", formatMarketValue(chosen.open, history.currency, history.unit)],
        ["Máxima", formatMarketValue(chosen.high, history.currency, history.unit)],
        ["Mínima", formatMarketValue(chosen.low, history.currency, history.unit)],
        ["Fechamento", formatMarketValue(chosen.close, history.currency, history.unit)],
        ["Volume", chosen.volume === null ? "Não informado" : chosen.volume.toLocaleString("pt-BR")],
      ];
      const fragment = document.createDocumentFragment();
      for (const [label, value] of values) {
        const item = document.createElement("span");
        const key = document.createElement("small");
        key.textContent = label;
        const text = document.createElement("strong");
        text.textContent = value;
        item.append(key, text);
        fragment.append(item);
      }
      tooltip.replaceChildren(fragment);
      tooltip.dataset.active = point ? "true" : "false";
    };
    showPoint(history.data.at(-1) ?? null);
    selectionRef.current = history.data.length - 1;

    const peer: Peer = { chart, series: mainSeries, points, showPoint };
    if (syncId) {
      const group = chartGroups.get(syncId) ?? new Set<Peer>();
      group.add(peer);
      chartGroups.set(syncId, group);
    }
    const synchronizeCrosshair = (time: Time | undefined) => {
      if (!syncId || synchronizing) return;
      synchronizing = true;
      try {
        for (const other of chartGroups.get(syncId) ?? []) {
          if (other === peer) continue;
          const point = time === undefined ? null : other.points.get(dateKey(time)) ?? null;
          if (point && time !== undefined) other.chart.setCrosshairPosition(point.close, time, other.series);
          else other.chart.clearCrosshairPosition();
          other.showPoint(point);
        }
      } finally { synchronizing = false; }
    };
    const crosshairHandler: Parameters<IChartApi["subscribeCrosshairMove"]>[0] = (event) => {
      if (synchronizing) return;
      const point = event.time === undefined ? null : points.get(dateKey(event.time)) ?? null;
      showPoint(point);
      if (point) selectionRef.current = history.data.findIndex((item) => item.date === point.date);
      synchronizeCrosshair(event.time);
    };
    const rangeHandler: Parameters<ReturnType<IChartApi["timeScale"]>["subscribeVisibleTimeRangeChange"]>[0] = (range) => {
      if (!range || !syncId || synchronizing) return;
      synchronizing = true;
      try {
        for (const other of chartGroups.get(syncId) ?? []) {
          if (other === peer) continue;
          const current = other.chart.timeScale().getVisibleRange();
          if (!current || dateKey(current.from) !== dateKey(range.from) || dateKey(current.to) !== dateKey(range.to)) other.chart.timeScale().setVisibleRange(range);
        }
      } finally { synchronizing = false; }
    };
    chart.subscribeCrosshairMove(crosshairHandler);
    chart.timeScale().subscribeVisibleTimeRangeChange(rangeHandler);
    chart.timeScale().fitContent();

    selectPointRef.current = (index: number) => {
      const bounded = Math.max(0, Math.min(history.data.length - 1, index));
      const point = history.data[bounded];
      selectionRef.current = bounded;
      showPoint(point);
      if (announcementRef.current) {
        announcementRef.current.textContent = `${formatMarketDate(point.date)}. Abertura ${formatMarketValue(point.open, history.currency, history.unit)}. Máxima ${formatMarketValue(point.high, history.currency, history.unit)}. Mínima ${formatMarketValue(point.low, history.currency, history.unit)}. Fechamento ${formatMarketValue(point.close, history.currency, history.unit)}. Volume ${point.volume === null ? "não informado" : point.volume.toLocaleString("pt-BR")}.`;
      }
      chart.setCrosshairPosition(point.close, point.date, mainSeries);
      synchronizeCrosshair(point.date);
      const visible = chart.timeScale().getVisibleLogicalRange();
      if (visible && (bounded < visible.from || bounded > visible.to)) {
        const width = visible.to - visible.from;
        chart.timeScale().setVisibleLogicalRange({ from: bounded - width / 2, to: bounded + width / 2 });
      }
    };
    const resize = new ResizeObserver(() => {
      chart.applyOptions({ width: Math.max(container.clientWidth, 1), height: Math.max(container.clientHeight, 180) });
    });
    resize.observe(container);

    return () => {
      resize.disconnect();
      chart.unsubscribeCrosshairMove(crosshairHandler);
      chart.timeScale().unsubscribeVisibleTimeRangeChange(rangeHandler);
      if (syncId) {
        const group = chartGroups.get(syncId);
        group?.delete(peer);
        if (group?.size === 0) chartGroups.delete(syncId);
      }
      selectPointRef.current = null;
      chartRef.current = null;
      chart.remove();
    };
  }, [history, mode, compact, syncId, hasVolume]);

  function zoom(factor: number) {
    const chart = chartRef.current;
    const range = chart?.timeScale().getVisibleLogicalRange();
    if (!chart || !range) return;
    const size = Math.max(4, Math.min(history.data.length + 5, (range.to - range.from) * factor));
    const center = (range.from + range.to) / 2;
    chart.timeScale().setVisibleLogicalRange({ from: center - size / 2, to: center + size / 2 });
  }

  function pan(direction: number) {
    const chart = chartRef.current;
    const range = chart?.timeScale().getVisibleLogicalRange();
    if (!chart || !range) return;
    const shift = Math.max(1, (range.to - range.from) * 0.2) * direction;
    chart.timeScale().setVisibleLogicalRange({ from: range.from + shift, to: range.to + shift });
  }

  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const direction = event.key === "ArrowLeft" ? -1 : 1;
      if (event.shiftKey) pan(direction);
      else selectPointRef.current?.(selectionRef.current + direction);
    } else if (event.key === "+" || event.key === "=") { event.preventDefault(); zoom(0.7); }
    else if (event.key === "-") { event.preventDefault(); zoom(1.4); }
    else if (event.key === "0" || event.key === "Home") { event.preventDefault(); chartRef.current?.timeScale().fitContent(); }
  }

  if (history.data.length === 0) return <div className="state-message" role="status">Nenhum registro OHLC disponível.</div>;

  return (
    <div className={`market-chart ${compact ? "market-chart-compact" : ""}`}>
      <div className="market-chart-tools" role="group" aria-label={`Controles do gráfico ${history.ticker}`}>
        <span>{mode === "candles" ? "Candles OHLC" : "Linha de fechamento"}{hasVolume ? " + volume" : ""}</span>
        <div>
          <button type="button" onClick={() => pan(-1)} aria-label="Deslocar gráfico para a esquerda">←</button>
          <button type="button" onClick={() => pan(1)} aria-label="Deslocar gráfico para a direita">→</button>
          <button type="button" onClick={() => zoom(0.7)} aria-label="Aproximar gráfico">+</button>
          <button type="button" onClick={() => zoom(1.4)} aria-label="Afastar gráfico">−</button>
          <button type="button" onClick={() => chartRef.current?.timeScale().fitContent()}>Ajustar</button>
        </div>
      </div>
      <div ref={tooltipRef} className="ohlc-tooltip mono" aria-label="Valores da sessão sob o cursor" />
      <p ref={announcementRef} className="sr-only" aria-live="polite" aria-atomic="true" />
      <div
        ref={containerRef}
        className="market-chart-surface"
        style={height === undefined ? undefined : { height }}
        tabIndex={0}
        role="group"
        aria-label={`Gráfico de ${history.ticker}. Setas percorrem as sessões; Shift e setas deslocam a janela; mais e menos ajustam zoom; zero ajusta todo o histórico.`}
        onKeyDown={handleKey}
      />
      <div className="market-chart-help"><span>Arraste para deslocar · rolagem ou pinça para zoom</span><span>Teclado: ← → · + − · 0</span></div>
      <div className="chart-attribution">TradingView Lightweight Charts™ · Copyright © 2025 <a href="https://www.tradingview.com/" target="_blank" rel="noreferrer">TradingView, Inc.</a></div>
      {!hasVolume && <p className="volume-unavailable">Volume não informado pela fonte para esta série.</p>}
    </div>
  );
}
