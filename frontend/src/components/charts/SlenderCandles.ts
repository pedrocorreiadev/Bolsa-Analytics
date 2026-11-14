import {
  customSeriesDefaultOptions,
  type CustomData,
  type CustomSeriesOptions,
  type CustomSeriesWhitespaceData,
  type ICustomSeriesPaneRenderer,
  type ICustomSeriesPaneView,
  type PaneRendererCustomData,
  type Time,
} from "lightweight-charts";

export interface CandleData extends CustomData<Time> {
  open: number;
  high: number;
  low: number;
  close: number;
}

class CandleRenderer implements ICustomSeriesPaneRenderer {
  private data: PaneRendererCustomData<Time, CandleData> | null = null;

  update(data: PaneRendererCustomData<Time, CandleData>) {
    this.data = data;
  }

  draw(...[target, priceConverter]: Parameters<ICustomSeriesPaneRenderer["draw"]>) {
    const data = this.data;
    if (!data?.visibleRange) return;

    const { from, to } = data.visibleRange;
    target.useBitmapCoordinateSpace(({ context, horizontalPixelRatio: xRatio, verticalPixelRatio: yRatio }) => {
      // Cap the body, not the time scale: short histories still fill the plot.
      const spacing = data.barSpacing * (data.conflationFactor || 1);
      const bodyWidth = Math.max(1, Math.floor(Math.min(7, spacing * 0.65) * xRatio));
      const wickWidth = Math.min(bodyWidth, Math.max(1, Math.floor(xRatio)));
      // Matching parity keeps the wick centered inside pixel-aligned bodies.
      const alignedWidth = bodyWidth > wickWidth && (bodyWidth - wickWidth) % 2 !== 0 ? bodyWidth - 1 : bodyWidth;

      for (let index = from; index < to; index += 1) {
        const bar = data.bars[index];
        if (!bar) continue;
        const candle = bar.originalData;
        const open = priceConverter(candle.open);
        const high = priceConverter(candle.high);
        const low = priceConverter(candle.low);
        const close = priceConverter(candle.close);
        if (open === null || high === null || low === null || close === null) continue;

        const x = Math.round(bar.x * xRatio);
        const top = Math.round(Math.min(open, close) * yRatio);
        const bottom = Math.round(Math.max(open, close) * yRatio);
        const wickTop = Math.round(Math.min(high, low) * yRatio);
        const wickBottom = Math.round(Math.max(high, low) * yRatio);
        context.fillStyle = bar.barColor;
        context.fillRect(x - Math.floor(wickWidth / 2), wickTop, wickWidth, Math.max(1, wickBottom - wickTop + 1));
        context.fillRect(x - Math.floor(alignedWidth / 2), top, alignedWidth, Math.max(1, bottom - top + 1));
      }
    });
  }
}

/** OHLC series with narrow bodies even when fitContent expands the bar spacing. */
export default class SlenderCandles implements ICustomSeriesPaneView<Time, CandleData> {
  private candleRenderer = new CandleRenderer();

  renderer() {
    return this.candleRenderer;
  }

  update(data: PaneRendererCustomData<Time, CandleData>) {
    this.candleRenderer.update(data);
  }

  priceValueBuilder(point: CandleData) {
    return [point.low, point.high, point.close];
  }

  isWhitespace(point: CandleData | CustomSeriesWhitespaceData<Time>): point is CustomSeriesWhitespaceData<Time> {
    return !("open" in point && "high" in point && "low" in point && "close" in point);
  }

  defaultOptions(): CustomSeriesOptions {
    return { ...customSeriesDefaultOptions };
  }
}
