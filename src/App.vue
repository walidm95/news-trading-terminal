<script setup>
import NewsFeed from './components/NewsFeed.vue'
import TradingPanel from './components/TradingPanel.vue';
import TradingViewChart from './components/TradingViewChart.vue';
import Positions from './components/Positions.vue';
import AccountApiKeys from './components/AccountApiKeys.vue';

import { Authenticator } from "@aws-amplify/ui-vue";
import "@aws-amplify/ui-vue/styles.css";

import { Amplify } from 'aws-amplify';
import awsconfig from './aws-exports';

Amplify.configure(awsconfig);
</script>

<template>
  <div style="height: 100vh;">
    <div class="container-fluid">
      <authenticator :hide-sign-up="true" :login-mechanisms="['email']">
        <template v-slot:header>
          <div style="padding: var(--amplify-space-large); text-align: center">
            <!--img
              class="amplify-image"
              alt="Amplify logo"
              src="https://docs.amplify.aws/assets/logo-dark.svg"
            /-->
            <h1>News Trading Terminal</h1>
          </div>
        </template>
        <template v-slot="{ user, signOut }" >
          <h4 class="text-center p-2"><small class="float-left text-secondary">{{ version }}</small>News Trading Terminal<small class="float-right" :class="binanceFuturesPing > 500 ? 'text-danger' : 'text-secondary'">{{ binanceFuturesPing }} ms</small></h4>
          <div class="row">
            <div class="col mr-2 column-panel">
              <div class="row mb-2 flex-fill">
                <NewsFeed 
                  :symbols="symbols"
                  :livePriceFeed="livePriceFeed" 
                  :quoteAsset="trading.quoteAsset" 
                  @symbol-from-headline="onSymbolChanged"/>
              </div>
              <div class="row mb-2 flex-fill">
                <TradingViewChart :ticker="getTradingViewSymbolTicker()" :key="tradingViewComponentKey"/>
              </div>
            </div>
            <div class="col">
              <div class="row flex-fill mb-2">
                <TradingPanel
                  :selectedHeadline="selectedHeadline"
                  :tradingSymbol="trading.tradingSymbol"
                  :quoteAsset="trading.quoteAsset"
                  :apiKeys="trading.apiKeys"
                  :livePriceFeed="livePriceFeed"
                  :pricePrecision="getPricePrecision()"
                  :quantityPrecision="getQuantityPrecision()"
                  :tickSize="getTickSize()"
                  :lockSymbol="trading.lockSymbol"
                  :maxLevAndMaxNotional="maxLevAndMaxNotional"
                  :cognitoIdToken="user.signInUserSession.idToken"
                  :clickedByTradersNbr="clientsThatTraded.length"
                  @trading-size-changed="trading.maxTradingSize=Number($event.target.value)"
                  @stop-loss-changed="trading.stopLossPct=Number($event.target.value)"
                  @take-profit-changed="trading.takeProfitPct=Number($event.target.value)"
                  @trading-symbol-changed="onSymbolChanged($event.target.value)"
                  @quote-asset-changed="onQuoteAssetChanged"
                  @position-opened="onOpenPosition"
                  @lock-symbol-toggled="onLockSymbolToggled"
                  @clicked-by-other-trader="onClickedByOtherTrader"/>
              </div>
              <div class="row flex-fill mb-2" style="height: 345px">
                <AccountApiKeys :apiKeys="trading.apiKeys" :username="user.username" @add-api-key="onAddApiKey($event, user.username)" @delete-api-key="onDeleteApiKey"/>
              </div>
            </div>
          </div>
          <div class="row flex-fill">
            <Positions 
              :positions="trading.positions" 
              :pricePrecisions="precisionFormat.price" 
              @close-position="onClosePosition" 
              @select-symbol="onSymbolChanged"
              @refresh-positions="fetchOpenPositions"
              @update-positions="onUpdatePosition"/>
          </div>   
          <button class="float-right" @click="signOut">Sign Out</button>
        </template>
      </authenticator>
    </div>
  </div>
  
</template>

<style scoped>
.column-panel {
  height: 100%;
  width: 50%;
}
</style>

<script>
import { ref } from 'vue';
import binance from './binance'
import { getVersion } from '@tauri-apps/api/app';

// Required to re-render chart
var tradingViewComponentKey = ref(0);
function forceChartRender() {
  tradingViewComponentKey.value += 1;
}

export default {
  data() {
    return {
      version: null,
      lastAccountFetch: null,
      newTradeSound: new Audio('/new_trade.mp3'),
      clientsThatTraded: [],
      selectedHeadline: null,
      binanceFuturesPing: null,
      binanceFuturesPingLoop: null,
      precisionFormat: {price:{}, quantity:{}},
      tickSize: {},
      livePriceFeed: {},
      leverageBrackets: {},
      maxLevAndMaxNotional: {0: '0', 1: 0},
      symbols: [],
      news: {
        headlines: [],
        activeHeadline: 0
      },
      trading: {
        tradingSymbol: "BTC",
        quoteAsset: 'USDT',
        positions: [],
        apiKeys: [],
        lockSymbol: false
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
    async getAppVersion() {
      this.version = await getVersion();
    },
    getMaxLeverageAndNotional() {
      let ticker = this.trading.tradingSymbol + this.trading.quoteAsset

      if (!this.leverageBrackets || !this.leverageBrackets[ticker]) {
        return
      }
      
      let leverageBracket = Object.entries(this.leverageBrackets[ticker])
      return leverageBracket[leverageBracket.length - 1]
    },
    getTickSize() {
      if(this.trading.tradingSymbol + this.trading.quoteAsset in this.tickSize)
        return this.tickSize[this.trading.tradingSymbol + this.trading.quoteAsset]
      else
        return 0.01
    },
    getPricePrecision() {
      if(this.trading.tradingSymbol + this.trading.quoteAsset in this.precisionFormat.price)
        return this.precisionFormat.price[this.trading.tradingSymbol + this.trading.quoteAsset]
      else
        return 2
    },
    getQuantityPrecision() {
      if(this.trading.tradingSymbol + this.trading.quoteAsset in this.precisionFormat.quantity)
        return this.precisionFormat.quantity[this.trading.tradingSymbol + this.trading.quoteAsset]
      else
        return 2
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

        // Update positions unrealized PnL
        for (let position of this.trading.positions) {
          let ticker = position.ticker
          let markPrice = this.livePriceFeed[ticker]
          let currentSize = position.units * markPrice
          let unrealizedPnl = (currentSize - position.units * position.entryPrice) * (position.side == 'BUY' ? 1 : -1)
          position.upnl = unrealizedPnl
          position.markPrice = markPrice
          position.size = currentSize
        }
      }
    },
    async getBinanceMaxLeverageBrackets() {
      if(this.trading.apiKeys.length == 0) {
        return
      }
      let apiKey = this.trading.apiKeys[0]
      let promise = binance.getNotionalAndLeverageBrackets(apiKey.key, apiKey.secret)
      promise.then(response => response.json())
      .then(data => {
          if (data.code) {
              alert(data.msg);
          } else {
              for(let symbol of data) {
                this.leverageBrackets[symbol.symbol] = {}
                for(let bracket of symbol.brackets) {
                  this.leverageBrackets[symbol.symbol][bracket.initialLeverage] = bracket.notionalCap
                }
              }
          }

          this.maxLevAndMaxNotional = this.getMaxLeverageAndNotional()
      });
    },
    getBinanceSymbolsWithNames() {
      Promise.allSettled([this.getBinanceExchangeInfo(), this.getCoinNames()]).then((values) => {
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

          // Set price precisions
          this.precisionFormat.price[symbol.symbol] = symbol.pricePrecision
          this.precisionFormat.quantity[symbol.symbol] = symbol.quantityPrecision

          // Set tick sizes
          this.tickSize[symbol.symbol] = Number(symbol.filters[0].tickSize)
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
    getTradingViewSymbolTicker() {
      return "BINANCE:" + this.trading.tradingSymbol + this.trading.quoteAsset + "PERP";
    },
    onSymbolChanged(symbol) {
      this.selectedHeadline = this.news.headlines[0]
      this.clientsThatTraded = []

      if(this.trading.lockSymbol) {
        return
      }

      symbol = symbol.toUpperCase().replace(this.trading.quoteAsset, '');

      if(symbol == this.trading.tradingSymbol) {
        return
      }
      
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

      this.maxLevAndMaxNotional = this.getMaxLeverageAndNotional()
    },
    onAddApiKey(event, username) {
      // Note: might exist a cleaner way to do this
      var inputs = event.target.parentElement.parentElement.getElementsByTagName("input");

      if (inputs[0].value != "" && inputs[1].value != "" && inputs[2].value != "")
      {
        this.trading.apiKeys.push({
          user: username,
          name: inputs[0].value,
          key: inputs[1].value,
          secret: inputs[2].value
        });

        localStorage.setItem("apiKeys", JSON.stringify(this.trading.apiKeys));

        // Reset inputs
        inputs[0].value = "";
        inputs[1].value = "";
        inputs[2].value = "";
      }
    },
    onDeleteApiKey(index) {
      this.trading.apiKeys.splice(index, 1);
      localStorage.setItem("apiKeys", JSON.stringify(this.trading.apiKeys));
    },
    onLockSymbolToggled() {
      this.trading.lockSymbol = !this.trading.lockSymbol;
    },
    onClickedByOtherTrader(trader_id) {
      if (!this.clientsThatTraded.includes(trader_id)) {
        this.clientsThatTraded.push(trader_id);
        this.newTradeSound.play()
      }
    },
    onOpenPosition(position) {
      let inAppPositions = JSON.parse(localStorage.getItem('inAppPositions')) || [];
      inAppPositions.push(position.ticker);
      localStorage.setItem('inAppPositions', JSON.stringify(inAppPositions));

      this.fetchOpenPositions();
    },
    onClosePosition(index) {
      let position = this.trading.positions[index];
      
      let apiKey
      for (let key of this.trading.apiKeys) {
        if (key.name == position.account) {
          apiKey = key;
          break;
        }
      }

      let promise = binance.executeCloseMarketOrder(apiKey.key, apiKey.secret, position.ticker, position.side == 'BUY' ? 'SELL' : 'BUY', position.units)
      promise.then((response) => {
        console.log(response);
        this.trading.positions.splice(index, 1);

        // Cancel stop loss/take profit orders
        // TODO: we dont need to cancel reduce only limit orders if we close the position, they get cancelled automatically
        let openOrders = JSON.parse(localStorage.getItem('openOrders')) || [];
        let orderIds = []
        for (let order of openOrders) {
          if (order.ticker == position.ticker && order.accountName == position.account) {
            orderIds.push(order.orderId)
          }
        }

        if(orderIds.length == 0) {
          return;
        }

        let cancelOrdersPromise = binance.cancelMultipleOrders(apiKey.key, apiKey.secret, position.ticker, orderIds)
        cancelOrdersPromise.then(response => response.json())
        .then((data) =>{
          if (data.code) {
              alert(data.msg);
          } else {
            for(let order of data) {
              if (order.status == 'CANCELED') {
                for (let i = 0; i < openOrders.length; i++) {
                  if (openOrders[i].orderId == order.orderId) {
                    openOrders.splice(i, 1);
                    break;
                  }
                }
              }
            }
            localStorage.setItem('openOrders', JSON.stringify(openOrders));
          }

          // Fetch positions
          this.fetchOpenPositions()
        }).catch((error) => {
          console.error(error);
        });
      }).catch((error) => {
        console.error(error);
      });
    },
    onUpdatePosition() {
      // Fetch account data from API, max once per second
      if (this.trading.apiKeys.length == 0) {
        return;
      }

      let now = new Date().getTime();
      if (now - this.lastAccountFetch < 1000) {
        return;
      }
      this.lastAccountFetch = now;

      this.fetchOpenPositions()
    },
    fetchOpenPositions() {
      let inAppPositions = JSON.parse(localStorage.getItem('inAppPositions')) || [];

      // TODO: handle multiple api keys
      let positions = []
      if (this.trading.apiKeys.length == 0) {
        this.trading.positions = positions;
        return;
      }
      binance.getAccount(this.trading.apiKeys[0].key, this.trading.apiKeys[0].secret).then((response) => {
        let data = response.json()
        data.then(account => {
          if(account.positions == undefined) {
            this.trading.positions = positions;
            return;
          }

          for(let position of account.positions) {
            // Only add positions that were traded through the app
            if (position.positionAmt != 0 && inAppPositions.includes(position.symbol)) {
              let positionData = {
                ticker: position.symbol,
                side: position.positionAmt > 0 ? 'BUY' : 'SELL',
                units: Math.abs(position.positionAmt),
                entryPrice: position.entryPrice,
                account: this.trading.apiKeys[0].name,
                upnl: position.unrealizedProfit,
                markPrice: position.markPrice,
                size: position.positionAmt * position.markPrice
              }

              positions.push(positionData);
            }
          }
          this.trading.positions = positions;

          // Reset inAppPositions
          inAppPositions = [];
          for(let position of positions) {
              inAppPositions.push(position.ticker);
          }
          localStorage.setItem('inAppPositions', JSON.stringify(inAppPositions));
        })
      }, (error) => {
        alert(error)
      });
    },
    async getCoinNames() {
      let resp = await fetch('https://www.binance.com/bapi/capital/v2/public/capital/config/getAll');
      let body = await resp.json();

      let coinNames = {}
      for(let coin of body.data) {
        coinNames[coin.coin] = coin.name
      }

      return coinNames
    },
    async calculateBinanceFuturesPing() {
      let start = new Date().getTime();
      let resp = await fetch('https://fapi.binance.com/fapi/v1/ping');
      //let body = await resp.json();
      let end = new Date().getTime();

      this.binanceFuturesPing = end - start;

    },
  },
  mounted: function() {
    this.getAppVersion();
    
    this.connectBinanceMarkPriceStreamWS();
    this.getBinanceSymbolsWithNames();

    this.trading.apiKeys = localStorage.getItem("apiKeys") ? JSON.parse(localStorage.getItem("apiKeys")) : [];

    this.fetchOpenPositions();
    this.getBinanceMaxLeverageBrackets();
    
    this.binanceFuturesPingLoop = setInterval(this.calculateBinanceFuturesPing, 2000);
  },
  beforeDestroy() {
    clearInterval(this.binanceFuturesPing);
  }
}
</script>

<style scoped>
.page-title {
  margin-bottom: 30px;
  text-align: center;
}
</style>
