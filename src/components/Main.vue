<script setup>
import NewsFeed from "./NewsFeed.vue";
import TradingPanel from "./TradingPanel.vue";
import TradinViewChart from "./TradingViewChart.vue";
import LWChart from "./LWChart.vue";
import Positions from "./Positions.vue";
</script>

<script>
import { ref } from "vue";
import binance from "../binance";
import { getVersion } from "@tauri-apps/api/app";

// Required to re-render chart
var tradingViewComponentKey = ref(0);
function forceChartRender() {
  tradingViewComponentKey.value += 1;
}

export default {
  data() {
    return {
      version: null,
      newTradeSound: new Audio("/new_trade.mp3"),
      clientsThatTraded: [],
      selectedHeadline: null,
      binanceFuturesPing: null,
      binanceFuturesPingLoop: null,
      precisionFormat: { price: {}, quantity: {} },
      tickSize: {},
      livePriceFeed: {},
      leverageBrackets: {},
      maxLevAndMaxNotional: { 0: "0", 1: 0 },
      symbols: [],
      news: {
        headlines: [],
        activeHeadline: 0,
      },
      trading: {
        tradingSymbol: "BTC",
        quoteAsset: "USDT",
        positions: [],
        openOrders: [],
        apiKeys: [],
        lockSymbol: false,
        chartTradeInfo: {},
        accountBalances: {},
      },
      generalSettings: {},
    };
  },
  props: {
    cognitoIdToken: { type: Object, required: true },
  },
  methods: {
    async getAppVersion() {
      this.version = await getVersion();
    },
    getMaxLeverageAndNotional() {
      let ticker = this.trading.tradingSymbol + this.trading.quoteAsset;

      if (!this.leverageBrackets || !this.leverageBrackets[ticker]) {
        return;
      }

      let leverageBracket = Object.entries(this.leverageBrackets[ticker]);
      return leverageBracket[leverageBracket.length - 1];
    },
    getTickSize() {
      if (this.trading.tradingSymbol + this.trading.quoteAsset in this.tickSize)
        return this.tickSize[this.trading.tradingSymbol + this.trading.quoteAsset];
      else return 0.01;
    },
    getPricePrecision() {
      if (this.trading.tradingSymbol + this.trading.quoteAsset in this.precisionFormat.price)
        return this.precisionFormat.price[this.trading.tradingSymbol + this.trading.quoteAsset];
      else return 2;
    },
    getQuantityPrecision() {
      if (this.trading.tradingSymbol + this.trading.quoteAsset in this.precisionFormat.quantity)
        return this.precisionFormat.quantity[this.trading.tradingSymbol + this.trading.quoteAsset];
      else return 2;
    },
    async getBinanceExchangeInfo() {
      try {
        let response = await fetch("https://fapi.binance.com/fapi/v1/exchangeInfo");
        let exchangeInfo = await response.json();
        return exchangeInfo;
      } catch (error) {
        console.error(error);
      }
    },
    connectBinanceMarkPriceStreamWS() {
      let ws = new WebSocket("wss://fstream.binance.com/ws/!markPrice@arr@1s");
      ws.onmessage = (event) => {
        let data = JSON.parse(event.data);
        for (let item of data) {
          this.livePriceFeed[item.s] = Number(item.p);
        }

        // Update positions unrealized PnL
        for (let position of this.trading.positions) {
          let ticker = position.ticker;
          let markPrice = this.livePriceFeed[ticker];
          let currentSize = position.units * markPrice;
          let unrealizedPnl = (currentSize - position.units * position.entryPrice) * (position.side == "BUY" ? 1 : -1);
          position.upnl = unrealizedPnl;
          position.markPrice = markPrice;
          position.size = currentSize;
        }
      };
    },
    async getBinanceMaxLeverageBrackets() {
      if (this.trading.apiKeys.length == 0) {
        return;
      }
      let apiKey = this.trading.apiKeys[0];
      let promise = binance.getNotionalAndLeverageBrackets(apiKey.key, apiKey.secret);
      promise
        .then((response) => response.json())
        .then((data) => {
          if (data.code) {
            alert(data.msg);
          } else {
            for (let symbol of data) {
              this.leverageBrackets[symbol.symbol] = {};
              for (let bracket of symbol.brackets) {
                this.leverageBrackets[symbol.symbol][bracket.initialLeverage] = bracket.notionalCap;
              }
            }
          }

          this.maxLevAndMaxNotional = this.getMaxLeverageAndNotional();
        });
    },
    getBinanceSymbolsWithNames() {
      Promise.allSettled([this.getBinanceExchangeInfo(), this.getCoinNames()]).then((values) => {
        let symbolNames = {};
        if (values[0].status == "rejected" || values[1].status == "rejected") {
          console.log("Error getting exchange info or coins list");
          return;
        }

        let binanceSymbols = values[0].value.symbols;
        let allCoins = values[1].value;

        binanceSymbols.forEach((symbol) => {
          let coinName = allCoins[symbol.baseAsset.replace("1000", "")];
          if (symbol.baseAsset == "BNB") {
            coinName = "Binance";
          }
          symbolNames[symbol.baseAsset] = coinName;

          // Set price precisions
          this.precisionFormat.price[symbol.symbol] = symbol.pricePrecision;
          this.precisionFormat.quantity[symbol.symbol] = symbol.quantityPrecision;

          // Set tick sizes
          this.tickSize[symbol.symbol] = Number(symbol.filters[0].tickSize);
        });

        this.symbols = symbolNames;
      });
    },
    onQuoteAssetChanged(quoteAsset) {
      if (quoteAsset != "") {
        this.trading.quoteAsset = quoteAsset;
        forceChartRender();
      }
    },
    onSymbolChanged(symbol) {
      this.selectedHeadline = this.news.headlines[0];
      this.clientsThatTraded = [];

      if (this.trading.lockSymbol) {
        return;
      }

      symbol = symbol.toUpperCase().replace(this.trading.quoteAsset, "");

      if (symbol == this.trading.tradingSymbol) {
        return;
      }

      if (Object.keys(this.symbols).includes(symbol)) {
        this.trading.tradingSymbol = symbol;
        forceChartRender();
      } else {
        var temp = this.trading.tradingSymbol;
        this.trading.tradingSymbol = "";
        this.$nextTick(function () {
          this.trading.tradingSymbol = temp;
        });
      }

      this.maxLevAndMaxNotional = this.getMaxLeverageAndNotional();
    },
    onAddApiKey(data) {
      if (data.key != "" && data.secret != "" && data.account != "") {
        this.trading.apiKeys.push({
          userId: this.cognitoIdToken.payload["cognito:username"],
          account: data.account,
          key: data.key,
          secret: data.secret,
        });

        localStorage.setItem("apiKeys", JSON.stringify(this.trading.apiKeys));
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
        if (this.generalSettings.playTraderNotification) {
          this.newTradeSound.play();
        }
      }
    },
    onOpenPosition(position) {
      let clientPositions = JSON.parse(localStorage.getItem("clientPositions")) || [];
      clientPositions.push(position.ticker);
      localStorage.setItem("clientPositions", JSON.stringify(clientPositions));

      this.fetchOpenPositions();
    },
    onClosePosition(index) {
      let position = this.trading.positions[index];

      let apiKey;
      for (let key of this.trading.apiKeys) {
        if (key.account == position.account) {
          apiKey = key;
          break;
        }
      }

      let promise = binance.executeCloseMarketOrder(
        apiKey.key,
        apiKey.secret,
        position.ticker,
        position.side == "BUY" ? "SELL" : "BUY",
        position.units
      );
      promise
        .then((response) => {
          console.log(response);
          this.trading.positions.splice(index, 1);

          // Cancel stop loss/take profit orders
          let clientOrderIds = [];
          for (let order of this.trading.openOrders) {
            if (order.symbol == position.ticker && order.account == position.account) {
              clientOrderIds.push(order.clientOrderId);
            }
          }

          if (clientOrderIds.length == 0) {
            return;
          }

          // Execute
          let allPromises;
          if (clientOrderIds.length > 10) {
            console.log("Cancelling " + clientOrderIds.length + " orders in batches of 10");
            let promises = [];
            for (let i = 0; i < clientOrderIds.length; i += 5) {
              if (i + 5 > clientOrderIds.length)
                promises.push(binance.cancelMultipleOrders(apiKey.key, apiKey.secret, position.ticker, clientOrderIds.slice(i), true));
              else promises.push(binance.cancelMultipleOrders(apiKey.key, apiKey.secret, position.ticker, clientOrderIds.slice(i, i + 10), true));
            }

            Promise.allSettled(promises)
              .then((data) => {
                if (data.code) {
                  alert(data.msg);
                }

                // Fetch positions
                this.trading.chartTradeInfo = {};
                this.fetchOpenPositions();
              })
              .catch((error) => {
                console.error(error);
              });
          } else {
            binance
              .cancelMultipleOrders(apiKey.key, apiKey.secret, position.ticker, clientOrderIds, true)
              .then((data) => {
                if (data.code) {
                  alert(data.msg);
                }

                // Fetch positions
                this.trading.chartTradeInfo = {};
                this.fetchOpenPositions();
              })
              .catch((error) => {
                console.error(error);
              });
          }
        })
        .catch((error) => {
          console.error(error);
        });
    },
    getTradeInfo() {
      let tradeInfo = {};

      // Check if there is an open position for trading symbol
      let openPosition = this.trading.positions.filter((pos) => pos.ticker == this.trading.tradingSymbol + this.trading.quoteAsset);
      if (openPosition.length > 0) {
        openPosition = openPosition[0];
        tradeInfo.entryPrice = openPosition.entryPrice;
        tradeInfo.side = openPosition.side;
        tradeInfo.dollarSize = openPosition.size;

        // Get open orders for open position
        let scaleIn = [];
        let takeProfits = [];
        let stopLosses = [];
        for (let order of this.trading.openOrders) {
          if (order.symbol == openPosition.ticker && order.type == "TAKE_PROFIT_MARKET") {
            takeProfits.push({
              price: order.stopPrice,
              side: order.side,
              dollarSize: order.origQty * order.stopPrice,
            });
          } else if (order.symbol == openPosition.ticker && order.type == "LIMIT") {
            scaleIn.push({
              price: order.price,
              side: order.side,
              dollarSize: order.origQty * order.price,
            });
          } else if (order.symbol == openPosition.ticker && order.origType == "STOP_MARKET") {
            stopLosses.push({
              price: order.stopPrice,
              side: order.side,
              dollarSize: order.origQty * order.stopPrice,
            });
          }
        }

        tradeInfo.takeProfits = takeProfits;
        tradeInfo.stopLosses = stopLosses;
        tradeInfo.scaleIn = scaleIn;
      }

      return tradeInfo;
    },
    onUpdatePosition() {
      // Fetch account data from API, max once per second
      if (this.trading.apiKeys.length == 0) {
        return;
      }

      this.fetchOpenPositions();
    },
    fetchOpenOrders() {
      let clientOrders = [];
      for (let apiKey of this.trading.apiKeys) {
        binance.getOrders(apiKey.key, apiKey.secret).then((response) => {
          let data = response.json();
          data.then((orders) => {
            for (let order of orders) {
              if (order.clientOrderId.startsWith("ntt_")) {
                order.account = apiKey.account;
                clientOrders.push(order);
              }
            }
            this.trading.openOrders = clientOrders;
            this.trading.chartTradeInfo = this.getTradeInfo();
          });
        });
      }
    },
    fetchOpenPositions() {
      let clientPositions = JSON.parse(localStorage.getItem("clientPositions")) || [];

      let positions = [];
      if (this.trading.apiKeys.length == 0) {
        this.trading.positions = positions;
        return;
      }

      this.trading.accountBalances = {};
      for (let apiKey of this.trading.apiKeys) {
        binance.getAccount(apiKey.key, apiKey.secret).then(
          (response) => {
            let data = response.json();
            data.then((account) => {
              this.trading.accountBalances[apiKey.account] = parseFloat(account.totalWalletBalance);

              if (account.positions == undefined) {
                this.trading.positions = positions;
                return;
              }

              for (let position of account.positions) {
                // Only add positions that were traded through the app
                if (position.positionAmt != 0 && clientPositions.includes(position.symbol)) {
                  let positionData = {
                    ticker: position.symbol,
                    side: position.positionAmt > 0 ? "BUY" : "SELL",
                    units: Math.abs(position.positionAmt),
                    entryPrice: position.entryPrice,
                    account: apiKey.account,
                    upnl: position.unrealizedProfit,
                    markPrice: this.livePriceFeed[position.symbol],
                    size: parseFloat(position.notional),
                  };

                  positions.push(positionData);
                }
              }
              this.trading.positions = positions;

              // Reset clientPositions
              clientPositions = [];
              for (let position of positions) {
                clientPositions.push(position.ticker);
              }
              localStorage.setItem("clientPositions", JSON.stringify(clientPositions));
            });

            this.fetchOpenOrders();
          },
          (error) => {
            alert(error);
          }
        );
      }
    },
    async getCoinNames() {
      let resp = await fetch("https://www.binance.com/bapi/capital/v2/public/capital/config/getAll");
      let body = await resp.json();

      let coinNames = {};
      for (let coin of body.data) {
        coinNames[coin.coin] = coin.name;
      }

      return coinNames;
    },
    async calculateBinanceFuturesPing() {
      let start = new Date().getTime();
      let resp = await fetch("https://fapi.binance.com/fapi/v1/ping");
      //let body = await resp.json();
      let end = new Date().getTime();

      this.binanceFuturesPing = end - start;
    },
    getGeneralSettings() {
      this.generalSettings = JSON.parse(localStorage.getItem("generalSettings")) || {
        playTraderNotification: true,
        playHeadlineNotification: true,
        nbrOfOrdersForScaling: 10,
      };
    },
    setGeneralSettings(generalSettings) {
      if (
        generalSettings.playHeadlineNotification != null &&
        generalSettings.playTraderNotification != null &&
        generalSettings.nbrOfOrdersForScaling != null
      ) {
        localStorage.setItem("generalSettings", JSON.stringify(generalSettings));
        this.generalSettings = generalSettings;
      }

      // Hijacking this event to update positions in case api keys were added/removed
      this.fetchOpenPositions();
    },
  },
  mounted: function () {
    this.getAppVersion();

    this.connectBinanceMarkPriceStreamWS();
    this.getBinanceSymbolsWithNames();

    this.trading.apiKeys = JSON.parse(localStorage.getItem("apiKeys")) || [];
    for (let i = 0; i < this.trading.apiKeys.length; i++) {
      if (this.trading.apiKeys[i].userId != this.cognitoIdToken.payload["cognito:username"]) {
        this.onDeleteApiKey(i);
      }
    }

    this.fetchOpenPositions();
    this.getBinanceMaxLeverageBrackets();

    this.binanceFuturesPingLoop = setInterval(this.calculateBinanceFuturesPing, 2000);

    this.getGeneralSettings();
  },
  beforeDestroy() {
    clearInterval(this.binanceFuturesPing);
  },
};
</script>

<template>
  <v-app-bar title="News Trading Terminal" style="text-align: center"></v-app-bar>
  <v-main>
    <v-container fluid>
      <v-row>
        <v-col>
          <NewsFeed
            class="top-panels"
            :symbols="symbols"
            :quote-asset="trading.quoteAsset"
            :live-price-feed="livePriceFeed"
            :play-notification-sound="generalSettings.playHeadlineNotification"
            @symbol-from-headline="onSymbolChanged"
          ></NewsFeed>
        </v-col>
        <v-col>
          <TradingPanel
            class="top-panels"
            :api-keys="trading.apiKeys"
            :trading-symbol="trading.tradingSymbol"
            :quote-asset="trading.quoteAsset"
            :accountsBalance="trading.accountBalances"
            :lockSymbol="trading.lockSymbol"
            @trading-symbol-changed="onSymbolChanged"
            @add-api-key="onAddApiKey"
            @delete-api-key="onDeleteApiKey"
            @update-general-settings="setGeneralSettings"
            @position-opened="onOpenPosition"
            @lock-symbol-toggled="onLockSymbolToggled"
            @quote-asset-changed="onQuoteAssetChanged"
            :tick-size="getTickSize()"
            :latest-price="livePriceFeed[trading.tradingSymbol + trading.quoteAsset]"
            :price-precision="precisionFormat.price[trading.tradingSymbol + trading.quoteAsset]"
            :quantity-precision="precisionFormat.quantity[trading.tradingSymbol + trading.quoteAsset]"
            :cognito-id-token="cognitoIdToken"
            :clicked-by-traders-nbr="0"
            :accounts-positions="trading.positions"
            :selected-headline="news.headlines[news.activeHeadline]"
            :general-settings="generalSettings"
          ></TradingPanel>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <!--TradinViewChart
            class="bottom-panels"
            :ticker="`${trading.tradingSymbol}${trading.quoteAsset}.P`"
            :key="tradingViewComponentKey"
          ></TradinViewChart-->
          <LWChart
            class="bottom-panels"
            :ticker="`${trading.tradingSymbol}${trading.quoteAsset}`"
            :trade-info="trading.chartTradeInfo"
            :price-precision="precisionFormat.price[trading.tradingSymbol + trading.quoteAsset]"
          ></LWChart>
        </v-col>
        <v-col>
          <Positions
            class="bottom-panels"
            :positions="trading.positions"
            :pricePrecisions="precisionFormat.price"
            @close-position="onClosePosition"
            @select-symbol="onSymbolChanged"
            @refresh-positions="fetchOpenPositions"
            @update-positions="onUpdatePosition"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-main>
  <v-footer>{{ version }}</v-footer>
</template>

<style scoped>
.top-panels {
  height: 450px;
}
.bottom-panels {
  height: 350px;
}
</style>
