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
              :tradingSymbol="trading.tradingSymbol"
              :quoteAsset="trading.quoteAsset"
              :apiKeys="trading.apiKeys"
              :livePriceFeed="livePriceFeed"
              :precisionFormat="precisionFormat"
              @trading-size-changed="trading.maxTradingSize=Number($event.target.value)"
              @stop-loss-changed="trading.stopLossPct=Number($event.target.value)"
              @take-profit-changed="trading.takeProfitPct=Number($event.target.value)"
              @trading-symbol-changed="onSymbolChanged($event.target.value)"
              @lock-symbol-toggled="trading.lockSymbol=!trading.lockSymbol"
              @quote-asset-changed="onQuoteAssetChanged"
              @position-opened="onPositionOpened"/>
          </div>
          <div class="row flex-fill mb-2" style="height: 345px">
            <AccountApiKeys :apiKeys="trading.apiKeys" @add-api-key="onAddApiKey" @delete-api-key="onDeleteApiKey"/>
          </div>
        </div>
      </div>
      <div class="row flex-fill">
        <Positions :positions="trading.positions" :pricePrecisions="precisionFormat.price" @close-position="onClosePosition" @select-symbol="onSymbolChanged"/>
      </div>
    </div>
  </div>
  
</template>

<style scoped>
.column-panel {
  height: 100%;
  width: 500px;
}
</style>

<script>
import { ref } from 'vue';
import binance from './binance'

// Required to re-render chart
var tradingViewComponentKey = ref(0);
function forceChartRender() {
  tradingViewComponentKey.value += 1;
}

export default {
  data() {
    return {
      precisionFormat: {price:{}, quantity:{}},
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
    onPositionOpened(position) {
      // Fetch positions
      this.fetchOpenPositions()
    },
    onSymbolChanged(symbol) {
      symbol = symbol.toUpperCase().replace(this.trading.quoteAsset, '');

      if(symbol == this.trading.tradingSymbol) {
        return;
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
        }).catch((error) => {
          console.error(error);
        });
      }).catch((error) => {
        console.error(error);
      });
    },
    fetchOpenPositions() {
      // TODO: handle multiple api keys
      let positions = []
      binance.getAccount(this.trading.apiKeys[0].key, this.trading.apiKeys[0].secret).then((response) => {
        let data = response.json()
        data.then(account => {
          for(let position of account.positions) {
            if (position.positionAmt != 0) {
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
    }
  },
  mounted: function() {
    console.log("App mounted")

    this.connectBinanceMarkPriceStreamWS();
    this.getBinanceSymbolsWithNames();

    this.trading.apiKeys = localStorage.getItem("apiKeys") ? JSON.parse(localStorage.getItem("apiKeys")) : [];

    this.fetchOpenPositions();
    
  }
}
</script>

<style scoped>
.page-title {
  margin-bottom: 30px;
  text-align: center;
}
</style>
