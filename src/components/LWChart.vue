<template>
  <v-card>
    <v-card-title class="d-flex align-center"
      >{{ ticker }}
      <div class="ml-auto text-body-1">Range: {{ maxRangePct }}%</div></v-card-title
    >
    <div ref="chartContainer"></div>
  </v-card>
</template>

<script>
import { createChart, LineStyle, CrosshairMode } from "lightweight-charts";
export default {
  data() {
    return {
      ws: null,
      chart: null,
      interval: "1m",
      priceData: [],
      volumeData: [],
      priceLines: [],
      priceSeries: null,
      volumeSeries: null,
      maxRangePct: null,
    };
  },
  props: {
    ticker: { type: String, required: true },
    tradeInfo: { type: Object, required: true },
    pricePrecision: { type: Number, default: 2 },
  },
  methods: {
    resizeHandler(container) {
      // Auto resizes the chart when the browser window is resized.
      if (!this.chart || !container) return;
      const dimensions = container.getBoundingClientRect();
      this.chart.resize(dimensions.width, dimensions.height);
    },
    async fetchPriceData() {
      const url = `https://fapi.binance.com/fapi/v1/klines?symbol=${this.ticker}&interval=${this.interval}`;
      const response = await fetch(url);
      const data = await response.json();

      this.priceData = data.map((candle) => ({
        // We convert the epoch to locale and feed it to the chart, since we can't display locale date on crosshair
        time: (new Date(candle[0]).getTime() - new Date(candle[0]).getTimezoneOffset() * 60 * 1000) / 1000,
        open: parseFloat(candle[1]),
        high: parseFloat(candle[2]),
        low: parseFloat(candle[3]),
        close: parseFloat(candle[4]),
      }));

      this.volumeData = data.map((candle) => ({
        time: (new Date(candle[0]).getTime() - new Date(candle[0]).getTimezoneOffset() * 60 * 1000) / 1000,
        value: parseFloat(candle[5]),
        color: candle[4] > candle[1] ? "rgba(111, 185, 143, 0.4)" : "rgba(232, 94, 89, 0.4)",
      }));

      return;
    },
    addVolumeBars() {
      this.volumeSeries = this.chart.addHistogramSeries({
        lineWidth: 2,
        priceFormat: {
          type: "volume",
        },
        priceScaleId: "", // set as an overlay by setting a blank priceScaleId
        priceLineVisible: false,
      });

      this.volumeSeries.setData(this.volumeData);

      // somehow, scaleMargins only works when called through applyOptions
      this.volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.7,
          bottom: 0,
        },
      });
    },
    removeTradeLines() {
      for (let priceLine of this.priceLines) {
        this.priceSeries.removePriceLine(priceLine);
      }

      this.priceLines = [];
    },
    addTradeLines(tradeInfo) {
      if (tradeInfo.entryPrice) {
        this.priceLines.push(
          this.priceSeries.createPriceLine({
            price: parseFloat(tradeInfo.entryPrice),
            color: tradeInfo.side == "BUY" ? "rgba(111, 185, 143, 1)" : "rgba(232, 94, 89, 1)",
            lineWidth: 1,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: `Entry ${tradeInfo.dollarSize.toFixed(2)}`,
          })
        );
      }

      if (tradeInfo.takeProfits) {
        for (let tp of tradeInfo.takeProfits) {
          this.priceLines.push(
            this.priceSeries.createPriceLine({
              price: parseFloat(tp.price),
              color: tp.side == "BUY" ? "rgba(111, 185, 143, 1)" : "rgba(232, 94, 89, 1)",
              lineWidth: 1,
              lineStyle: LineStyle.LargeDashed,
              axisLabelVisible: true,
              title: `TP ${tp.dollarSize.toFixed(2)}`,
            })
          );
        }
      }

      if (tradeInfo.scaleIn) {
        for (let tp of tradeInfo.scaleIn) {
          this.priceLines.push(
            this.priceSeries.createPriceLine({
              price: parseFloat(tp.price),
              color: tp.side == "BUY" ? "rgba(111, 185, 143, 1)" : "rgba(232, 94, 89, 1)",
              lineWidth: 1,
              lineStyle: LineStyle.LargeDashed,
              axisLabelVisible: true,
              title: `LIMIT ${tp.dollarSize.toFixed(2)}`,
            })
          );
        }
      }

      if (tradeInfo.stopLosses) {
        for (let sl of tradeInfo.stopLosses) {
          this.priceLines.push(
            this.priceSeries.createPriceLine({
              price: parseFloat(sl.price),
              color: sl.side == "BUY" ? "rgba(111, 185, 143, 1)" : "rgba(232, 94, 89, 1)",
              lineWidth: 1,
              lineStyle: LineStyle.LargeDashed,
              axisLabelVisible: true,
              title: `SL ${sl.dollarSize.toFixed(2)}`,
            })
          );
        }
      }
    },
    connectToWebSocket() {
      this.ws = new WebSocket(`wss://fstream.binance.com/ws/${this.ticker.toLowerCase()}@kline_${this.interval}`);

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const { k } = message;

        const candle = {
          time: (new Date(k.t).getTime() - new Date(k.t).getTimezoneOffset() * 60 * 1000) / 1000,
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
        };

        const volumeBar = {
          time: (new Date(k.t).getTime() - new Date(k.t).getTimezoneOffset() * 60 * 1000) / 1000,
          value: parseFloat(k.v),
          color: candle.close > candle.open ? "rgba(111, 185, 143, 0.4)" : "rgba(232, 94, 89, 0.4)",
        };

        this.priceData.push(candle);
        this.volumeData.push(volumeBar);
        if (this.priceSeries) {
          this.priceSeries.update(candle);
        }
        if (this.volumeSeries) {
          this.volumeSeries.update(volumeBar);
        }
      };

      /*this.ws.onclose = () => {
        console.log("WebSocket closed. Reconnecting...");
        setTimeout(() => {
          this.connectToWebSocket();
        }, 3000);
      };*/

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.ws.close();
      };
    },
    createChart() {
      this.chart = createChart(this.$refs.chartContainer, {
        height: 300,
        layout: {
          background: "#1f1f1f",
          textColor: "rgba(255, 255, 255, 0.9)",
        },
        grid: {
          vertLines: {
            color: "rgba(42, 46, 57, 0.6)",
          },
          horzLines: {
            color: "rgba(42, 46, 57, 0.6)",
          },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
        },
        rightPriceScale: {
          borderColor: "rgba(56, 61, 72, 0.8)",
        },
        timeScale: {
          borderColor: "rgba(56, 61, 72, 0.8)",
          timeVisible: true,
          secondsVisible: false,
          rightOffset: 15,
        },
      });

      this.priceSeries = this.chart.addCandlestickSeries({
        upColor: "rgba(111, 185, 143, 1)",
        downColor: "rgba(232, 94, 89, 1)",
        borderVisible: false,
        wickVisible: true,
        borderUpColor: "rgba(111, 185, 143, 1)",
        borderDownColor: "rgba(232, 94, 89, 1)",
        wickUpColor: "rgba(111, 185, 143, 1)",
        wickDownColor: "rgba(232, 94, 89, 1)",
        priceFormat: {
          type: "price",
          minMove: 1 / 10 ** this.pricePrecision,
        },
      });

      this.priceSeries.setData(this.priceData);

      this.chart.timeScale().subscribeVisibleLogicalRangeChange(this.onVisibleRangeChanged);
    },
    reloadChartData() {
      if (this.chart) {
        // Reset everything
        this.chart.remove();
        this.chart = null;
        this.priceData = [];
        this.volumeData = [];
        this.priceLines = [];
        this.priceSeries = null;
        this.volumeSeries = null;

        // Create chart
        (async () => {
          await this.fetchPriceData();
          this.createChart();
          this.addVolumeBars();
          this.getPriceRangeOfVisibleRange();

          if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.connectToWebSocket();
          }
        })();
      }
    },
    onVisibleRangeChanged(newVisibleLogicalRange) {
      let visibleBars = this.priceData.slice(Math.round(newVisibleLogicalRange.from));

      // Calculate max top to bottom range
      this.calculateMaxRangePct(visibleBars);
    },
    calculateMaxRangePct(bars) {
      let highestPrice = -Infinity;
      let lowestPrice = Infinity;

      for (const bar of bars) {
        const { high, low } = bar;

        if (high > highestPrice) {
          highestPrice = high;
        }

        if (low < lowestPrice) {
          lowestPrice = low;
        }
      }

      let maxPriceDiff = highestPrice - lowestPrice;

      this.maxRangePct = ((maxPriceDiff / lowestPrice) * 100).toFixed(1);
    },
    getPriceRangeOfVisibleRange() {
      let logicalRange = this.chart.timeScale().getVisibleLogicalRange();
      let visibleBars = this.priceData.slice(Math.round(logicalRange.from));

      // Calculate max top to bottom range
      this.calculateMaxRangePct(visibleBars);
    },
  },
  watch: {
    ticker: function (newTicker) {
      this.reloadChartData();
    },
    tradeInfo: function (newTradeInfo) {
      // Give time to load price series
      setTimeout(() => {
        this.removeTradeLines();
        this.addTradeLines(newTradeInfo);
      }, 1000);
    },
  },
  mounted() {
    (async () => {
      await this.fetchPriceData();
      this.createChart();
      this.addVolumeBars();
      this.connectToWebSocket();
      this.getPriceRangeOfVisibleRange();
    })();

    window.addEventListener("resize", () => this.resizeHandler(this.$refs.chartContainer));
  },
  unmounted() {
    if (this.chart) {
      this.chart.remove();
      this.chart = null;
    }
  },
};
</script>
