import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import {
  createChart, LineSeries, HistogramSeries, ColorType, CrosshairMode,
  type IChartApi, type ISeriesApi, type SeriesType, type Time,
} from "lightweight-charts";
import type { MarketHistory, OHLCVPoint } from "../types/market";
import { formatMarketDate, formatMarketValue } from "../utils/formatMarket";
import { CHART_COLORS } from "../utils/chartTheme";
import SlenderCandles from "./charts/SlenderCandles";
import "../styles/candles.css";
import "../styles/market-chart.css";

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
  const rootRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const announcementRef = useRef<HTMLParagraphElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const selectionRef = useRef(0);
  const selectPointRef = useRef<((index: number) => void) | null>(null);
  const clearSelectionRef = useRef<(() => void) | null>(null);
  const gridVisibleRef = useRef(true);
  const [gridVisible, setGridVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const helpId = useId();
  const hasVolume = history.data.some((point) => point.volume !== null);

  useEffect(() => {
    const updateFullscreen = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener("fullscreenchange", updateFullscreen);
    return () => document.removeEventListener("fullscreenchange", updateFullscreen);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const tooltip = tooltipRef.current;
    if (!container || !tooltip || history.data.length === 0) return;

    const chart = createChart(container, {
      width: Math.max(container.clientWidth, 1),
      height: container.clientHeight || (compact ? 320 : 480),
      layout: {
        background: { type: ColorType.Solid, color: CHART_COLORS.background },
        textColor: CHART_COLORS.text, fontFamily: '"Segoe UI", system-ui, sans-serif', fontSize: 11,
        attributionLogo: true,
        panes: { separatorColor: CHART_COLORS.border, separatorHoverColor: "#4b5972", enableResize: true },
      },
      grid: {
        vertLines: { color: CHART_COLORS.grid, visible: gridVisibleRef.current },
        horzLines: { color: CHART_COLORS.grid, visible: gridVisibleRef.current },
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: { color: "#69758b", labelBackgroundColor: "#34415a", width: 1, style: 2 },
        horzLine: { color: "#69758b", labelBackgroundColor: "#34415a", width: 1, style: 2 },
      },
      rightPriceScale: { borderColor: CHART_COLORS.border, scaleMargins: { top: 0.12, bottom: 0.1 }, minimumWidth: compact ? 68 : 80 },
      timeScale: { borderColor: CHART_COLORS.border, timeVisible: false, secondsVisible: false, rightOffset: 4, minBarSpacing: 2, barSpacing: 9, lockVisibleTimeRangeOnResize: true },
      localization: {
        locale: "pt-BR",
        priceFormatter: (value: number) => value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: history.unit === "currency" && Math.abs(value) < 10 ? 4 : 2 }),
        timeFormatter: (time: Time) => formatMarketDate(dateKey(time)),
      },
      handleScroll: { mouseWheel: false, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
    });
    chartRef.current = chart;

    const precision = history.unit === "currency" && history.data.some((point) => Math.abs(point.close) < 10) ? 4 : 2;
    const priceFormat = { type: "price" as const, precision, minMove: 10 ** -precision };
    let mainSeries: ISeriesApi<SeriesType>;
    if (mode === "line") {
      const series = chart.addSeries(LineSeries, {
        color: CHART_COLORS.primary, lineWidth: 2, priceFormat, lastValueVisible: true,
        crosshairMarkerVisible: true, crosshairMarkerRadius: 4,
        crosshairMarkerBorderColor: CHART_COLORS.primary, crosshairMarkerBackgroundColor: CHART_COLORS.background,
        priceLineColor: CHART_COLORS.primary, priceLineWidth: 1, priceLineStyle: 2,
      });
      series.setData(history.data.map((point) => ({ time: point.date, value: point.close })));
      mainSeries = series;
    } else {
      const series = chart.addCustomSeries(new SlenderCandles(), {
        priceFormat, priceLineWidth: 1, priceLineStyle: 2,
      });
      series.setData(history.data.map((point) => ({
        time: point.date, open: point.open, high: point.high, low: point.low, close: point.close,
        color: point.close >= point.open ? CHART_COLORS.up : CHART_COLORS.down,
      })));
      mainSeries = series;
    }
    if (hasVolume) {
      const volume = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceLineVisible: false, lastValueVisible: false }, 1);
      volume.setData(history.data.map((point) => point.volume === null
        ? { time: point.date }
        : { time: point.date, value: point.volume, color: point.close >= point.open ? CHART_COLORS.volumeUp : CHART_COLORS.volumeDown }));
      chart.panes()[1]?.setHeight(compact ? 75 : 100);
      volume.priceScale().applyOptions({ scaleMargins: { top: 0.15, bottom: 0 }, borderVisible: false });
    }

    const points = new Map(history.data.map((point) => [point.date, point]));
    const pointIndexes = new Map(history.data.map((point, index) => [point.date, index]));
    const numberFormatter = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: precision });
    const showPoint = (point: OHLCVPoint | null) => {
      const chosen = point ?? history.data.at(-1);
      if (!chosen) return;
      selectionRef.current = pointIndexes.get(chosen.date) ?? history.data.length - 1;
      const change = chosen.close - chosen.open;
      const changePercent = chosen.open === 0 ? null : (change / chosen.open) * 100;
      const sign = change >= 0 ? "+" : "";
      const values = [
        [point ? "Sessão selecionada" : "Última sessão", formatMarketDate(chosen.date)],
        ["Abertura", numberFormatter.format(chosen.open)],
        ["Máxima", numberFormatter.format(chosen.high)],
        ["Mínima", numberFormatter.format(chosen.low)],
        ["Fechamento", numberFormatter.format(chosen.close)],
        ["Variação A → F", `${sign}${numberFormatter.format(change)}${changePercent === null ? "" : ` (${sign}${changePercent.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%)`}`],
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
      tooltip.dataset.direction = change >= 0 ? "up" : "down";
    };
    showPoint(null);
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
      if (point) selectionRef.current = pointIndexes.get(point.date) ?? selectionRef.current;
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

    clearSelectionRef.current = () => {
      chart.clearCrosshairPosition();
      showPoint(null);
      if (announcementRef.current) announcementRef.current.textContent = "";
      selectionRef.current = history.data.length - 1;
      synchronizeCrosshair(undefined);
    };

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
      clearSelectionRef.current = null;
      chartRef.current = null;
      chart.remove();
    };
  }, [history, mode, compact, syncId, hasVolume]);

  function fitChart() {
    for (const pane of chartRef.current?.panes() ?? []) pane.priceScale("right").applyOptions({ autoScale: true });
    chartRef.current?.timeScale().fitContent();
    clearSelectionRef.current?.();
  }

  function toggleGrid() {
    const visible = !gridVisibleRef.current;
    gridVisibleRef.current = visible;
    setGridVisible(visible);
    chartRef.current?.applyOptions({ grid: { vertLines: { visible }, horzLines: { visible } } });
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === rootRef.current) await document.exitFullscreen();
      else await rootRef.current?.requestFullscreen();
    } catch {
      if (announcementRef.current) announcementRef.current.textContent = "Não foi possível abrir a tela cheia neste navegador.";
    }
  }

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
    else if (event.key === "0" || event.key === "Home") { event.preventDefault(); fitChart(); }
    else if (event.key === "End") { event.preventDefault(); selectPointRef.current?.(history.data.length - 1); }
    else if (event.key === "Escape") { clearSelectionRef.current?.(); }
  }

  if (history.data.length === 0) return <div className="state-message" role="status">Nenhum registro OHLC disponível.</div>;

  return (
    <div ref={rootRef} className={`market-chart financial-chart ${compact ? "market-chart-compact" : ""}`}>
      <div className="market-chart-tools" role="group" aria-label={`Controles do gráfico ${history.ticker}`}>
        <span className="chart-instrument"><strong>{history.ticker}</strong><span>{mode === "candles" ? "Candles" : "Fechamento"}</span><span className="chart-unit">{history.unit === "points" ? "Pontos" : history.currency}</span></span>
        <div className="chart-tool-actions">
          <button type="button" onClick={() => pan(-1)} aria-label="Deslocar gráfico para a esquerda" title="Deslocar para a esquerda (Shift + ←)">←</button>
          <button type="button" onClick={() => pan(1)} aria-label="Deslocar gráfico para a direita" title="Deslocar para a direita (Shift + →)">→</button>
          <span className="chart-tool-divider" aria-hidden="true" />
          <button type="button" onClick={() => zoom(0.7)} aria-label="Aproximar gráfico" title="Aproximar (+)">+</button>
          <button type="button" onClick={() => zoom(1.4)} aria-label="Afastar gráfico" title="Afastar (−)">−</button>
          <button type="button" onClick={fitChart} title="Ajustar todo o histórico (0)">Ajustar</button>
          <span className="chart-tool-divider" aria-hidden="true" />
          <button type="button" onClick={toggleGrid} aria-pressed={gridVisible} title={gridVisible ? "Ocultar grade do gráfico" : "Mostrar grade do gráfico"}>Grade</button>
          <button type="button" onClick={toggleFullscreen} aria-pressed={fullscreen} disabled={!document.fullscreenEnabled} title={fullscreen ? "Sair da tela cheia (Esc)" : "Abrir gráfico em tela cheia"}>{fullscreen ? "Sair" : "Tela cheia"}</button>
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
        aria-describedby={helpId}
        aria-label={`Gráfico de ${history.ticker}. Setas percorrem as sessões; Shift e setas deslocam a janela; mais e menos ajustam zoom; zero ajusta todo o histórico.`}
        onKeyDown={handleKey}
      />
      <div className="chart-direction-legend" aria-label="Legenda do gráfico">
        {mode === "candles" ? <><span><i className="chart-key chart-key-up" aria-hidden="true" />Alta <small>fechamento ≥ abertura</small></span><span><i className="chart-key chart-key-down" aria-hidden="true" />Baixa <small>fechamento &lt; abertura</small></span></> : <span><i className="chart-key chart-key-line" aria-hidden="true" />Preço de fechamento</span>}
        {hasVolume && <span className="chart-volume-label">Volume no painel inferior</span>}
      </div>
      <div id={helpId} className="market-chart-help"><span>Arraste para navegar · role ou use pinça para zoom</span><span>Teclado: ← → sessões · + − zoom · 0 ajustar</span></div>
      <div className="chart-attribution">TradingView Lightweight Charts™ · Copyright © 2025 <a href="https://www.tradingview.com/" target="_blank" rel="noreferrer">TradingView, Inc.</a></div>
      {!hasVolume && <p className="volume-unavailable">Volume não informado pela fonte para esta série.</p>}
    </div>
  );
}
