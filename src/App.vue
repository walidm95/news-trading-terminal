<script setup>
import NewsFeed from './components/NewsFeed.vue'
import TradingPanel from './components/TradingPanel.vue';
import EventLogs from './components/EventLogs.vue';
import TradingViewChart from './components/TradingViewChart.vue';
import Positions from './components/Positions.vue';
import AccountApiKeys from './components/AccountApiKeys.vue';
import api from './api';
import { BinancePublic, BinancePrivate } from './binance';
import { Coingecko } from './coingecko';
</script>

<template>
  <div style="height: 100vh;">
    <div class="page-title">
      <h1>News Trading Terminal</h1>
    </div>
    <div class="container-fluid">
      <div class="row">
        <div class="col mr-2">
          <div class="row mb-2 flex-fill">
            <NewsFeed
              :symbols="symbols"
              :headlines="news.headlines" 
              :activeHeadline="news.activeHeadline"
              @selectHeadline="onSelectHeadline"/>
          </div>
          <div class="row flex-fill">
            <TradingViewChart :ticker="getTradingSymbolTicker()" :key="tradingViewComponentKey"/>
          </div>
          <div class="row flex-fill">
            <Positions :positions="trading.positions" @close-position="onClosePosition"/>
          </div>
        </div>
        <div class="col">
          <div class="row flex-fill">
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
              @trading-symbol-changed="onSymbolChanged($event.target.value)"
              @lock-symbol-checked="trading.lockSymbol=Boolean($event.target.checked)"
              @quote-asset-changed="onQuoteAssetChanged"
              @buy-button-clicked="onBuyButtonClicked"
              @sell-button-clicked="onSellButtonClicked"/>
          </div>
          <div class="row flex-fill mb-2">
            <EventLogs :logs="eventLogs"/>
          </div>
          <div class="row flex-fill">
            <AccountApiKeys :apiKeys="trading.apiKeys" @add-api-key="onAddApiKey" @delete-api-key="onDeleteApiKey"/>
          </div>
        </div>
      </div>
    </div>
  </div>
  
</template>

<script>
import { ref } from 'vue';

let symbolNames = {};
var livePriceFeed = {};

function findSymbolInHeadline(headline, symbols) {
  for(const symbol in symbols)
  {
    let regexName = new RegExp(`\\b${symbol}\\b`, 'i');
    let regexSymbol = new RegExp(`\\b${symbols[symbol]}\\b`, 'i');

    if(regexName.test(headline) || regexSymbol.test(headline)){
      return symbol;
    }
  }
  return '';
}

function onMarkPriceUpdate(markPrices) {
  for(let markPrice of JSON.parse(markPrices)) {
      livePriceFeed[markPrice.s] = Number(markPrice.p);
  }
}

// Initialize mock data
var headlines = api.getNewsHeadlines();
var positions = api.getPositions();
var apiKeys = api.getApiKeys();

// Initialize Binance and Coingecko
var coingecko = new Coingecko();
var binancePublic = new BinancePublic();
binancePublic.connectMarkPriceStreamWS(onMarkPriceUpdate);
//var binancePrivate = new BinancePrivate();

Promise.allSettled([binancePublic.getExchangeInfo(), coingecko.getAllCoins()]).then((values) => {
  if (values[0].status == 'rejected' || values[1].status == 'rejected') {
    console.log('Error getting exchange info or coins list');
    return;
  }

  let binanceSymbols = values[0].value.symbols;
  let allCoins = values[1].value;

  binanceSymbols.forEach((symbol) => {
    let coinName = allCoins[symbol.baseAsset.replace('1000', '')]
    if (symbol.baseAsset == 'BNB') {
      coinName = 'Binance'
    }
    symbolNames[symbol.baseAsset] = coinName
  });
});


// Required to re-render chart
var tradingViewComponentKey = ref(0);

function forceChartRender() {
  tradingViewComponentKey.value += 1;
}

export default {
  data() {
    return {
      symbols: Object.keys(symbolNames),
      eventLogs: [],
      news: {
        headlines: headlines,
        activeHeadline: 0
      },
      trading: {
        maxTradingSize: 1000,
        stopLossPct: 2,
        takeProfitPct: 2,
        tradingSymbol: "BTC",
        quoteAsset: 'USDT',
        lockSymbol: false,
        positions: positions,
        apiKeys: apiKeys
      } 
    }
  },
  components: { NewsFeed, TradingPanel },
  methods: {
    onSelectHeadline(index) {
      this.news.activeHeadline = index;
      if(!this.trading.lockSymbol) {
        this.trading.tradingSymbol = findSymbolInHeadline(this.news.headlines[index].title, symbolNames);
        forceChartRender();
      }
    },
    onQuoteAssetChanged(quoteAsset) {
      if (quoteAsset != '') {
        this.trading.quoteAsset = quoteAsset;
        forceChartRender();
      }
    },
    onBuyButtonClicked(size) {
      var dollarSize = Number(size.replace('%','')) / 100 * this.trading.maxTradingSize;

      this.eventLogs = [{
        time: new Date().toLocaleTimeString(),
        text: `Bought ${this.trading.tradingSymbol} for ${dollarSize.toLocaleString()} ${this.trading.quoteAsset}`
      }].concat(this.eventLogs);

      // Add to positions screen (mock)
      for(var i in this.trading.apiKeys)
      { 
        this.trading.positions.push({
          account: this.trading.apiKeys[i].name,
          symbol: this.trading.tradingSymbol + this.trading.quoteAsset,
          side: 'BUY',
          size: dollarSize,
          entry: livePriceFeed[this.trading.tradingSymbol + this.trading.quoteAsset],
          uPnl: dollarSize * 0.03
        });
      }
    },
    onSellButtonClicked(size) {
      var dollarSize = Number(size.replace('%','')) / 100 * this.trading.maxTradingSize;
      this.eventLogs = [{
        time: new Date().toLocaleTimeString(),
        text: `Sold ${this.trading.tradingSymbol} for ${dollarSize.toLocaleString()} ${this.trading.quoteAsset}`
      }].concat(this.eventLogs);

      // Add to positions screen (mock)
      for(var i in this.trading.apiKeys)
      { 
        this.trading.positions.push({
          account: this.trading.apiKeys[i].name,
          symbol: this.trading.tradingSymbol + this.trading.quoteAsset,
          side: 'SELL',
          size: dollarSize,
          entry: livePriceFeed[this.trading.tradingSymbol + this.trading.quoteAsset],
          uPnl: dollarSize * -0.03
        });
      }
    },
    getTradingSymbolTicker() {
      return "BINANCE:" + this.trading.tradingSymbol + this.trading.quoteAsset + "PERP";
    },
    onSymbolChanged(symbol) {
      symbol = symbol.toUpperCase();
      if (Object.keys(symbolNames).includes(symbol))
      {
        this.trading.tradingSymbol = symbol;
        forceChartRender();
      } else
      {
        var temp = this.trading.tradingSymbol;
        this.trading.tradingSymbol = "";
        this.$nextTick(function() {
          this.trading.tradingSymbol = temp;
        });
      }
    },
    onAddApiKey(event) {
      // Note: might exist a cleaner way to do this
      var inputs = event.target.parentElement.parentElement.getElementsByTagName("input");

      if (inputs[0].value != "" && inputs[1].value != "" && inputs[2].value != "")
      {
        this.trading.apiKeys.push({
          name: inputs[0].value,
          key: inputs[1].value,
          secret: inputs[2].value
        });

        // Log event
        this.eventLogs = [{
          time: new Date().toLocaleTimeString(),
          text: `Added API key '${inputs[1].value}'`
        }].concat(this.eventLogs);

        // Reset inputs
        inputs[0].value = "";
        inputs[1].value = "";
        inputs[2].value = "";
      }
    },
    onDeleteApiKey(index) {
      var apiKeyName = this.trading.apiKeys[index].name;

      this.trading.apiKeys.splice(index, 1);

      // Log event
      this.eventLogs = [{
          time: new Date().toLocaleTimeString(),
          text: `Deleted API key '${apiKeyName}'`
        }].concat(this.eventLogs);
    },
    onClosePosition(index) {
      var position = this.trading.positions[index];

      this.trading.positions.splice(index, 1);

      // Log event
      this.eventLogs = [{
          time: new Date().toLocaleTimeString(),
          text: `Close ${position.symbol} position on '${position.account}' account`
        }].concat(this.eventLogs);
    }
  }
}
</script>

<style scoped>
.page-title {
  margin-bottom: 30px;
  text-align: center;
}
</style>
