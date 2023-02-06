<script setup>
import NewsFeed from './components/NewsFeed.vue'
import TradingPanel from './components/TradingPanel.vue';
import EventLogs from './components/EventLogs.vue';
import api from './api';
</script>

<template>
  <div class="">
    <div class="page-title">
      <h1>News Trading Terminal</h1>
    </div>
    <div class="container-fluid">
      <div class="row">
        <div class="col">
          <NewsFeed
            :symbols="symbols"
            :headlines="news.headlines" 
            :activeHeadline="news.activeHeadline"
            @selectHeadline="onSelectHeadline"/>
        </div>
        <div class="col">
          <TradingPanel
          :maxTradingSize="trading.maxTradingSize"
          :stopLossPct="trading.stopLossPct"
          :takeProfitPct="trading.takeProfitPct"
          :tradingSymbol="trading.tradingSymbol"
          :quoteAsset="trading.quoteAsset"
          :lockSymbol="trading.lockSymbol"
          @trading-size-changed="trading.maxTradingSize=Number($event.target.value)"
          @stop-loss-changed="trading.stopLossPct=Number($event.target.value)"
          @take-profit-changed="trading.takeProfitPct=Number($event.target.value)"
          @trading-symbol-changed="trading.tradingSymbol=$event.target.value"
          @lock-symbol-checked="trading.lockSymbol=$event.target.checked"
          @quote-asset-changed="onQuoteAssetChanged"
          @buy-button-clicked="onBuyButtonClicked"
          @sell-button-clicked="onSellButtonClicked"/>
          <EventLogs :logs="eventLogs"/>
        </div>
      </div>
    </div>
  </div>
  
</template>

<script>
function findSymbolInHeadline(headline, symbols) {
  for(const symbol in symbols)
  {
    let regexName = new RegExp(`\\b${symbol}\\b`, 'i');
    let regexSymbol = new RegExp(`\\b${symbols[symbol]}\\b`, 'i');

    if(regexName.test(headline) || regexSymbol.test(headline)){
      return symbols[symbol];
    }
  }
  return '';
}

// Initialize data
var symbols = api.getNamesAndTickers();
var headlines = api.getNewsHeadlines();

export default {
  data() {
    return {
      symbols: symbols,
      eventLogs: [],
      news: {
        headlines: headlines,
        activeHeadline: 0
      },
      trading: {
        maxTradingSize: 1000,
        stopLossPct: 2,
        takeProfitPct: 2,
        tradingSymbol: findSymbolInHeadline(headlines[0].title, symbols),
        quoteAsset: 'USDT',
        lockSymbol: false,
      } 
    }
  },
  components: { NewsFeed, TradingPanel },
  methods: {
    onSelectHeadline(index) {
      this.news.activeHeadline = index;
      this.trading.tradingSymbol = findSymbolInHeadline(this.news.headlines[index].title, this.symbols);
    },
    onQuoteAssetChanged(quoteAsset) {
      if (quoteAsset != '') {
        this.trading.quoteAsset = quoteAsset;
      }
    },
    onBuyButtonClicked(size) {
      var dollarSize = Number(size.replace('%','')) / 100 * this.trading.maxTradingSize;
      this.eventLogs = [{
        time: new Date().toLocaleTimeString(),
        text: `Bought ${this.trading.tradingSymbol} for ${dollarSize.toLocaleString()} ${this.trading.quoteAsset}`
      }].concat(this.eventLogs);
    },
    onSellButtonClicked(size) {
      var dollarSize = Number(size.replace('%','')) / 100 * this.trading.maxTradingSize;
      this.eventLogs = [{
        time: new Date().toLocaleTimeString(),
        text: `Sold ${this.trading.tradingSymbol} for ${dollarSize.toLocaleString()} ${this.trading.quoteAsset}`
      }].concat(this.eventLogs);
    }
  }
}
</script>

<style scoped>
.page-title {
  margin-top: 20px;
  margin-bottom: 20px;
  text-align: center;
}
</style>
