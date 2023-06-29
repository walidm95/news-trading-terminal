<script setup>
import NewsFeed from "./NewsFeed.vue";
import TradingPanel from "./TradingPanel.vue";
import TradinViewChart from "./TradingViewChart.vue";
import LWChart from "./LWChart.vue";
import Positions from "./Positions.vue";
import DebugLogs from "./DebugLogs.vue";
</script>

<script>
import binance from "../binance";

export default {
  data() {
    return {
      version: null,
      newTradeSound: new Audio("/new_trade.mp3"),
      clientsThatTraded: [],
      nbrOfActiveAccounts: null,
      binanceFuturesPing: null,
      binanceFuturesPingLoop: null,
      precisionFormat: { price: {}, quantity: {} },
      tickSize: {},
      livePriceFeed: {},
      leverageBrackets: {},
      maxLevAndMaxNotional: { 0: "0", 1: 0 },
      symbols: [],
      debugLogs: [],
      news: {
        headlines: [],
        activeHeadlineIndex: 0,
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
      generalTradingSettings: {},
      newsFeedSettings: {},
    };
  },
  props: {
    cognitoIdToken: { type: Object, required: true },
  },
  methods: {
    getMaxLeverageAndNotional() {
      let ticker = this.trading.tradingSymbol + this.trading.quoteAsset;

      if (!this.leverageBrackets || !this.leverageBrackets[ticker]) {
        return;
      }

      let leverageBracket = Object.entries(this.leverageBrackets[ticker]);
      return leverageBracket[leverageBracket.length - 1];
    },
    getTickSize() {
      if (this.trading.tradingSymbol + this.trading.quoteAsset in this.tickSize) return this.tickSize[this.trading.tradingSymbol + this.trading.quoteAsset];
      else return 0.01;
    },
    getPricePrecision() {
      if (this.trading.tradingSymbol + this.trading.quoteAsset in this.precisionFormat.price) return this.precisionFormat.price[this.trading.tradingSymbol + this.trading.quoteAsset];
      else return 2;
    },
    getQuantityPrecision() {
      if (this.trading.tradingSymbol + this.trading.quoteAsset in this.precisionFormat.quantity) return this.precisionFormat.quantity[this.trading.tradingSymbol + this.trading.quoteAsset];
      else return 2;
    },
    async getBinanceExchangeInfo() {
      try {
        let response = await fetch("https://fapi.binance.com/fapi/v1/exchangeInfo");
        let exchangeInfo = await response.json();
        return exchangeInfo;
      } catch (error) {
        this.debugLogs.unshift(`error on getBinanceExchangeInfo: ${error}`);
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
            this.debugLogs.unshift(`error on getBinanceMaxLeverageBrackets: ${data.msg}`);
          } else {
            for (let symbol of data) {
              this.leverageBrackets[symbol.symbol] = {};
              for (let bracket of symbol.brackets) {
                this.leverageBrackets[symbol.symbol][bracket.initialLeverage] = bracket.notionalCap;
              }
            }
          }

          this.maxLevAndMaxNotional = this.getMaxLeverageAndNotional();
        })
        .catch((error) => {
          this.debugLogs.unshift(`error on getBinanceMaxLeverageBrackets: ${error}`);
          console.error(error);
        });
    },
    getBinanceSymbolsWithNames() {
      Promise.allSettled([this.getBinanceExchangeInfo(), this.getCoinNames()]).then((values) => {
        let symbolNames = {};
        if (values[0].status == "rejected" || values[1].status == "rejected") {
          const msg = "Error getting exchange info or coins list";
          this.debugLogs.unshift(msg);
          console.log(msg);
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
      }
    },
    onToggleApiKey(index) {
      this.trading.apiKeys[index].enabled = !this.trading.apiKeys[index].enabled;
      localStorage.setItem("apiKeys", JSON.stringify(this.trading.apiKeys));
    },
    onUpdateHeadlines(headlines) {
      this.news.headlines = headlines;
    },
    onActiveHeadlineChanged(index) {
      this.news.activeHeadlineIndex = index;
    },
    onDebugLog(msg) {
      this.debugLogs.unshift(msg);
    },
    onSymbolChanged(symbol) {
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
      } else {
        var temp = this.trading.tradingSymbol;
        this.trading.tradingSymbol = "";
        this.$nextTick(function () {
          this.trading.tradingSymbol = temp;
        });
      }

      this.maxLevAndMaxNotional = this.getMaxLeverageAndNotional();

      this.fetchOpenOrders();
    },
    onAddApiKey(data) {
      if (data.key != "" && data.secret != "" && data.account != "") {
        this.trading.apiKeys.push({
          userId: this.cognitoIdToken.payload["cognito:username"],
          account: data.account,
          key: data.key,
          secret: data.secret,
          enabled: data.enabled,
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
    onClickedByOtherTrader(args) {
      if (!this.clientsThatTraded.some((item) => item.trader_id === args.trader_id && item.headline_id === args.headline_id)) {
        this.clientsThatTraded.push(args);

        const headline = this.news.headlines.find((h) => h.id === args.headline_id);
        if (headline) {
          headline.nbrOfTrades = this.clientsThatTraded.length;

          // Only play sound if client has the headline on his news feed
          if (this.generalTradingSettings.playTraderNotification) {
            this.newTradeSound.play();
          }
        }
      }
    },
    onOpenPosition(position) {
      let clientPositions = JSON.parse(localStorage.getItem("clientPositions")) || [];
      clientPositions.push(position);
      localStorage.setItem("clientPositions", JSON.stringify(clientPositions));
    },
    onClosePosition(index) {
      let position = this.trading.positions[index];

      let apiKey;
      for (let key of this.trading.apiKeys) {
        if (!key.enabled) {
          continue;
        }
        if (key.account == position.account) {
          apiKey = key;
          break;
        }
      }

      let promise = binance.executeCloseMarketOrder(apiKey.key, apiKey.secret, position.ticker, position.side == "BUY" ? "SELL" : "BUY", position.units);
      promise
        .then((response) => {
          const msg = response.ok ? "Position closed" : "Error while closing position";
          this.debugLogs.unshift(msg);
          console.log(msg);

          this.trading.positions.splice(index, 1);
          localStorage.setItem("clientPositions", JSON.stringify(this.trading.positions));

          // Cancel stop loss/take profit orders
          let clientOrderIds = [];
          for (let order of this.trading.openOrders) {
            if (order.symbol == position.ticker && order.account == position.account) {
              clientOrderIds.push(order.clientOrderId);
            }
          }

          if (clientOrderIds.length == 0) {
            console.log("No orders to cancel");
            this.debugLogs.unshift("No orders to cancel");
            return;
          }

          // Execute
          this.cancelOrdersForSymbol(apiKey.key, apiKey.secret, position.ticker, clientOrderIds);
        })
        .catch((error) => {
          this.debugLogs.unshift(`error on onClosePosition: ${error}`);
          console.error(error);
        });
    },
    cancelOrdersForSymbol(apiKey, apiSecret, ticker, clientOrderIds) {
      if (clientOrderIds.length > 10) {
        const msg = "Cancelling " + clientOrderIds.length + " orders in batches of 10";
        this.debugLogs.unshift(msg);
        console.log(msg);
        let promises = [];
        for (let i = 0; i < clientOrderIds.length; i += 5) {
          if (i + 5 > clientOrderIds.length) promises.push(binance.cancelMultipleOrders(apiKey, apiSecret, ticker, clientOrderIds.slice(i), true));
          else promises.push(binance.cancelMultipleOrders(apiKey, apiSecret, ticker, clientOrderIds.slice(i, i + 10), true));
        }

        Promise.allSettled(promises)
          .then((data) => {
            if (data.code) {
              alert(data.msg);
              this.debugLogs.unshift(`error on cancelOrdersForSymbol: ${data.msg}`);
            }

            // Fetch positions
            this.trading.chartTradeInfo = {};
            this.fetchOpenPositions();
          })
          .catch((error) => {
            this.debugLogs.unshift(`error on cancelOrdersForSymbol: ${error}`);
            console.error(error);
          });
      } else {
        const msg = "Cancelling " + clientOrderIds.length + " orders";
        this.debugLogs.unshift(msg);
        console.log(msg);

        binance
          .cancelMultipleOrders(apiKey, apiSecret, ticker, clientOrderIds, true)
          .then((data) => {
            if (data.code) {
              alert(data.msg);
              this.debugLogs.unshift(`error on cancelMultipleOrders: ${data.msg}`);
            }

            // Fetch positions
            this.trading.chartTradeInfo = {};
            this.fetchOpenPositions();
          })
          .catch((error) => {
            this.debugLogs.unshift(`error on cancelMultipleOrders: ${error}`);
            console.error(error);
          });
      }
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
      this.fetchOpenPositions();
    },
    fetchOpenOrders() {
      this.trading.openOrders = [];

      for (let pos of this.trading.positions) {
        let api = this.trading.apiKeys.filter((a) => a.account == pos.account)[0];
        if (api && api.enabled) {
          let clientOrders = [];
          binance
            .getOrders(api.key, api.secret, pos.symbol)
            .then((response) => {
              let data = response.json();
              data.then((orders) => {
                for (let order of orders) {
                  if (order.clientOrderId.startsWith("ntt_")) {
                    order.account = api.account;
                    clientOrders.push(order);
                  }
                }

                this.trading.openOrders.push(...clientOrders);
                this.trading.chartTradeInfo = this.getTradeInfo();
              });
            })
            .catch((error) => {
              this.debugLogs.unshift(`error on fetchOpenOrders: ${error}`);
              console.error(error);
            });
        }
      }
    },
    cancelOrdersWithoutPosition() {
      let orderIdsToCancel = {};

      for (let order of this.trading.openOrders) {
        if (!this.trading.positions.some((position) => position.ticker == order.symbol)) {
          orderIdsToCancel[order.symbol] = orderIdsToCancel[order.symbol] ? orderIdsToCancel[order.symbol] : [];
          orderIdsToCancel[order.symbol].push(order.clientOrderId);
        }
      }

      for (let symbol of Object.keys(orderIdsToCancel)) {
        for (let apiKey of this.trading.apiKeys) {
          if (!apiKey.enabled) {
            continue;
          }
          this.cancelOrdersForSymbol(apiKey.key, apiKey.secret, symbol, orderIdsToCancel[symbol]);
        }
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
        if (!apiKey.enabled) {
          continue;
        }
        binance
          .getAccount(apiKey.key, apiKey.secret)
          .then(
            (response) => {
              let data = response.json();
              data.then((response) => {
                if (response.code) {
                  const msg = `${apiKey.account}: ${response.msg}`;
                  this.debugLogs.unshift(`error on fetchOpenPositions: ${msg}`);
                  console.error(msg);
                  alert(msg);
                  return;
                }
                let account = response;

                this.trading.accountBalances[apiKey.account] = parseFloat(account.totalWalletBalance);

                if (account.positions == undefined) {
                  this.trading.positions = positions;
                  return;
                }

                for (let position of account.positions) {
                  // Only add positions that were traded through the app
                  if (position.positionAmt != 0 && clientPositions.some((clientPosition) => clientPosition.ticker === position.symbol)) {
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

                // Reset clientPositions
                if (this.resetClientPositionTimeout) {
                  clearTimeout(this.resetClientPositionTimeout);
                }
                this.resetClientPositionTimeout = setTimeout(() => {
                  localStorage.setItem("clientPositions", JSON.stringify(positions));
                  this.trading.positions = positions;

                  this.fetchOpenOrders();
                }, 500);
              });
            },
            (error) => {
              this.debugLogs.unshift(`error on fetchOpenPositions: ${error}`);
              console.error(error);
              alert(error);
            }
          )
          .catch((error) => {
            this.debugLogs.unshift(`error on fetchOpenPositions: ${error}`);
            console.error(error);
            //alert(error);
          });
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
    getNewsFeedSettings() {
      this.newsFeedSettings = JSON.parse(localStorage.getItem("newsFeedSettings")) || {
        useTreeOfAlpha: true,
        useDB: false,
        playHeadlineNotification: true,
        showOnlyHeadlineWithColoredKeywork: false,
        keywords: {
          highlight: [],
          ignore: [],
        },
      };
    },
    getGeneralTradingSettings() {
      this.generalTradingSettings = JSON.parse(localStorage.getItem("generalTradingSettings")) || {
        playTraderNotification: true,
        showPositions: true,
        showChart: true,
        showDebugLogs: false,
        smallSizePct: 25,
        mediumSizePct: 50,
        bigSizePct: 100,
        nbrOfSplitOrders: 5,
      };
    },
    setNbrOfActiveAccounts() {
      // Update nbr of active accounts
      this.nbrOfActiveAccounts = this.trading.apiKeys.filter((api) => api.enabled).length;
    },
    onUpdateNewsFeedSettings(newsFeedSettings) {
      this.newsFeedSettings.playHeadlineNotification = newsFeedSettings.playHeadlineNotification;
      this.newsFeedSettings.onlyColoredKeywords = newsFeedSettings.onlyColoredKeywords;
      this.newsFeedSettings.useTreeOfAlpha = newsFeedSettings.useTreeOfAlpha;
      this.newsFeedSettings.useDB = newsFeedSettings.useDB;
      this.newsFeedSettings.keywords = newsFeedSettings.keywords;
      localStorage.setItem("newsFeedSettings", JSON.stringify(this.newsFeedSettings));
    },
    onUpdateGeneralTradingSettings(generalTradingSettings) {
      localStorage.setItem("generalTradingSettings", JSON.stringify(generalTradingSettings));

      this.setNbrOfActiveAccounts();

      // Hijacking this event to update positions in case api keys were added/removed
      this.fetchOpenPositions();
    },
    onResetGeneralTradingSettings() {
      localStorage.setItem("generalTradingSettings", JSON.stringify({}));
      this.getGeneralTradingSettings();
    },
  },
  mounted: function () {
    this.connectBinanceMarkPriceStreamWS();
    this.getBinanceSymbolsWithNames();

    this.trading.apiKeys = JSON.parse(localStorage.getItem("apiKeys")) || [];
    for (let i = 0; i < this.trading.apiKeys.length; i++) {
      if (this.trading.apiKeys[i].enabled == undefined) {
        this.trading.apiKeys[i].enabled = true;
      }
      if (this.trading.apiKeys[i].userId != this.cognitoIdToken.payload["cognito:username"]) {
        this.onDeleteApiKey(i);
      }
    }

    this.fetchOpenPositions();
    //this.getBinanceMaxLeverageBrackets(); // Not using for now

    //this.binanceFuturesPingLoop = setInterval(this.calculateBinanceFuturesPing, 2000); // Not using for now

    this.getGeneralTradingSettings();
    this.getNewsFeedSettings();
    this.setNbrOfActiveAccounts();
  },
  beforeDestroy() {
    clearInterval(this.binanceFuturesPing);
  },
};
</script>

<template>
  <v-main>
    <v-container fluid>
      <v-row>
        <v-col>
          <NewsFeed
            class="top-panels"
            :symbols="symbols"
            :quote-asset="trading.quoteAsset"
            :live-price-feed="livePriceFeed"
            :news-feed-settings="newsFeedSettings"
            @symbol-from-headline="onSymbolChanged"
            @update-headlines="onUpdateHeadlines"
            @active-headline-index-changed="onActiveHeadlineChanged"
            @add-debug-log="onDebugLog"
            @update-news-feed-settings="onUpdateNewsFeedSettings"
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
            @update-general-trading-settings="onUpdateGeneralTradingSettings"
            @reset-general-trading-settings="onResetGeneralTradingSettings"
            @position-opened="onOpenPosition"
            @lock-symbol-toggled="onLockSymbolToggled"
            @quote-asset-changed="onQuoteAssetChanged"
            @toggle-api-key="onToggleApiKey"
            @add-debug-log="onDebugLog"
            @clicked-by-other-trader="onClickedByOtherTrader"
            :tick-size="getTickSize()"
            :latest-price="livePriceFeed[trading.tradingSymbol + trading.quoteAsset]"
            :price-precision="precisionFormat.price[trading.tradingSymbol + trading.quoteAsset]"
            :quantity-precision="precisionFormat.quantity[trading.tradingSymbol + trading.quoteAsset]"
            :cognito-id-token="cognitoIdToken"
            :accounts-positions="trading.positions"
            :general-settings="generalTradingSettings"
            :active-headline="news.headlines[news.activeHeadlineIndex] || {}"
            :active-headline-index="news.activeHeadlineIndex"
          ></TradingPanel>
        </v-col>
      </v-row>
      <v-row v-if="generalTradingSettings.showChart || generalTradingSettings.showPositions">
        <v-col v-if="generalTradingSettings.showChart">
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
        <v-col v-if="generalTradingSettings.showPositions">
          <Positions
            class="bottom-panels"
            :nbr-of-active-accounts="nbrOfActiveAccounts"
            :api-keys="trading.apiKeys"
            :positions="trading.positions"
            :pricePrecisions="precisionFormat.price"
            @close-position="onClosePosition"
            @select-symbol="onSymbolChanged"
            @update-positions="onUpdatePosition"
          />
        </v-col>
      </v-row>
      <v-row class="pl-2" v-if="generalTradingSettings.showDebugLogs">
        <DebugLogs style="width: 99%; height: 300px" :logs="debugLogs"></DebugLogs>
      </v-row>
    </v-container>
  </v-main>
</template>

<style scoped>
.top-panels {
  height: 450px;
}
.bottom-panels {
  height: 350px;
}
</style>
