<script setup>
import NewsFeed from './components/NewsFeed.vue'
import TradingPanel from './components/TradingPanel.vue';
import api from './api';
</script>

<template>
  <div class="page-title">
    <h1>News Trading Terminal</h1>
  </div>
  <div class="container-fluid">
    <div class="row">
      <div class="col-7">
        <NewsFeed
          :symbols="symbols"
          :headlines="news.headlines" 
          :activeHeadline="news.activeHeadline"
          @selectHeadline="onSelectHeadline"/>
      </div>
      <div class="col-5">
        <TradingPanel
          :maxTradingSize="trading.maxTradingSize" 
          :stopLossPct="trading.stopLossPct"
          :takeProfitPct="trading.takeProfitPct"
          :tradingSymbol="trading.tradingSymbol"
          @trading-size-changed="trading.maxTradingSize=Number($event.target.value)"
          @stop-loss-changed="trading.stopLossPct=Number($event.target.value)"
          @take-profit-changed="trading.takeProfitPct=Number($event.target.value)"
          @trading-symbol-changed="trading.tradingSymbol=$event.target.value"/>
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
  return null;
}

// Initialize data
var symbols = api.getNamesAndTickers();
var headlines = api.getNewsHeadlines();
var eventLogs = api.getEventLogs();

export default {
  data() {
    return {
      symbols: symbols,
      eventLogs: eventLogs,
      news: {
        headlines: headlines,
        activeHeadline: 0
      },
      trading: {
        maxTradingSize: 100,
        stopLossPct: 2,
        takeProfitPct: 2,
        tradingSymbol: findSymbolInHeadline(headlines[0].title, symbols)
      } 
    }
  },
  components: { NewsFeed, TradingPanel },
  methods: {
    onSelectHeadline(index) {
      this.news.activeHeadline = index;
      this.trading.tradingSymbol = findSymbolInHeadline(this.news.headlines[index].title, this.symbols);
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
