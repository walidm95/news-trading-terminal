<script setup>
import NewsFeed from './components/NewsFeed.vue'
import TradingPanel from './components/TradingPanel.vue';
import TradingViewChart from './components/TradingViewChart.vue';
import Positions from './components/Positions.vue';
import AccountApiKeys from './components/AccountApiKeys.vue';
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
            <NewsFeed :symbols="symbols" @symbol-from-headline="onSymbolChanged"/>
          </div>
          <div class="row mb-2 flex-fill">
            <TradingViewChart :ticker="getTradingSymbolTicker()" :key="tradingViewComponentKey"/>
          </div>
        </div>
        <div class="col">
          <div class="row flex-fill mb-2">
            <TradingPanel
              :tradingSymbol="trading.tradingSymbol"
              :quoteAsset="trading.quoteAsset"
              :apiKeys="trading.apiKeys"
              :livePriceFeed="livePriceFeed"
              @trading-size-changed="trading.maxTradingSize=Number($event.target.value)"
              @stop-loss-changed="trading.stopLossPct=Number($event.target.value)"
              @take-profit-changed="trading.takeProfitPct=Number($event.target.value)"
              @trading-symbol-changed="onSymbolChanged($event.target.value)"
              @lock-symbol-toggled="trading.lockSymbol=!trading.lockSymbol"
              @quote-asset-changed="onQuoteAssetChanged"
              @positions-opened="onPositionsOpened"/>
          </div>
          <div class="row flex-fill mb-2" style="height: 345px">
            <AccountApiKeys :apiKeys="trading.apiKeys" @add-api-key="onAddApiKey" @delete-api-key="onDeleteApiKey"/>
          </div>
        </div>
      </div>
      <div class="row flex-fill">
        <Positions :positions="trading.positions" @close-position="onClosePosition"/>
      </div>
    </div>
  </div>
  
</template>

<script>
import { ref } from 'vue';

// Required to re-render chart
var tradingViewComponentKey = ref(0);
function forceChartRender() {
  tradingViewComponentKey.value += 1;
}

export default {
  data() {
    return {
      livePriceFeed: {},
      symbols: [],
      news: {
        headlines: [],
        activeHeadline: 0
      },
      trading: {
        maxTradingSize: 1000,
        stopLossPct: 2,
        takeProfitPct: 2,
        tradingSymbol: "BTC",
        quoteAsset: 'USDT',
        lockSymbol: false,
        positions: [],
        apiKeys: []
      },
      dollarsFormatter: new Intl.NumberFormat("en-US", {
        style:"currency",
        currency: "USD",
        maximumFractionDigits: 5
      }),
    }
  },
  components: { NewsFeed, TradingPanel },
  methods: {
    async getCoinsFromCoingecko() {
      let allCoins = {}
      try {
          let response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=250&page=1&sparkline=false')
          let coins = await response.json()

          // Get second page
          response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=volume_desc&per_page=250&page=2&sparkline=false')
          coins = coins.concat(await response.json())

          let excludedIds = ['wormhole', 'binance-peg', 'wrapped', 'bsc', 'binemon']
          
          for (let coin of coins) {
              if(excludedIds.some(excludedId => coin.id.includes(excludedId))) {
                  continue
              }

              allCoins[coin.symbol.toUpperCase()] = coin.name         
          }

          return allCoins

      } catch (error) {
          console.error(error)
      }
    },
    async getBinanceExchangeInfo() {
      try {
        let response = await fetch('https://fapi.binance.com/fapi/v1/exchangeInfo')
        let exchangeInfo = await response.json()
        return exchangeInfo
      } catch (error) {
        console.error(error)
      }
    },
    connectBinanceMarkPriceStreamWS() {
      let ws = new WebSocket('wss://fstream.binance.com/ws/!markPrice@arr@1s')
      ws.onmessage = (event) => {
        let data = JSON.parse(event.data)
        for (let item of data) {
          this.livePriceFeed[item.s] = Number(item.p)
        }
      }
    },
    getBinanceSymbolsWithNames() {
      Promise.allSettled([this.getBinanceExchangeInfo(), this.getCoinsFromCoingecko()]).then((values) => {
        let symbolNames = {}
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

        this.symbols = symbolNames
      });
    },
    onQuoteAssetChanged(quoteAsset) {
      if (quoteAsset != '') {
        this.trading.quoteAsset = quoteAsset;
        forceChartRender();
      }
    },
    getTradingSymbolTicker() {
      return "BINANCE:" + this.trading.tradingSymbol + this.trading.quoteAsset + "PERP";
    },
    onPositionsOpened(positions) {
      this.trading.positions.unshift(...positions);
    },
    onSymbolChanged(symbol) {
      symbol = symbol.toUpperCase();
      if (Object.keys(this.symbols).includes(symbol))
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

        // Reset inputs
        inputs[0].value = "";
        inputs[1].value = "";
        inputs[2].value = "";
      }
    },
    onDeleteApiKey(index) {
      var apiKeyName = this.trading.apiKeys[index].name;

      this.trading.apiKeys.splice(index, 1);
    },
    onClosePosition(index) {
      var position = this.trading.positions[index];

      this.trading.positions.splice(index, 1);
    }
  },
  mounted: function() {
    console.log("App mounted")

    this.connectBinanceMarkPriceStreamWS();
    this.getBinanceSymbolsWithNames();

  }
}
</script>

<style scoped>
.page-title {
  margin-bottom: 30px;
  text-align: center;
}
</style>
