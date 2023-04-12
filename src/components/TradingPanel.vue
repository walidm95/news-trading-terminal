<script setup>
import TradingSettingsDialog from "./TradingSettingsDialog.vue";
import TradingButton from "./TradingButton.vue";
</script>

<script>
import binance from "../binance";
import { ExecutionMode, ApiRoutes } from "../constants";

export default {
  data() {
    return {
      maxSize: null,
      selectedEntryMode: null,
      selectedExitMode: null,
      stopLoss: null,
      takeProfit: null,
      scaleFrom: null,
      scaleTo: null,
      nbrScaleOrders: null,
      marketProportion: null,
      entryScaleTo: null,
      symbolLocked: false,
      density: "compact",
      nttWs: null,
      wsAlive: false,
      pingInterval: null,
      pingTimeout: null,
      pingIntervalTime: 5000,
      pingTimeoutTime: 2000,
    };
  },
  props: {
    tradingSymbol: { type: String, required: true },
    quoteAsset: { type: String, required: true },
    lockSymbol: { type: Boolean, required: true },
    accountsBalance: { type: Object, required: true },
    accountsPositions: { type: Array, required: true },
    apiKeys: { type: Array, required: true },
    latestPrice: { type: Array, required: true },
    pricePrecision: { type: Array, required: true },
    quantityPrecision: { type: Array, required: true },
    tickSize: { type: Number, required: true },
    cognitoIdToken: { type: Object, required: true },
    clickedByTradersNbr: { type: Number, required: true },
    activeHeadline: { type: Object, required: true },
    activeHeadlineIndex: { type: Number, required: true },
    generalSettings: { type: Object, required: true },
  },
  methods: {
    formatQuantityPrecision(quantity) {
      return quantity.toFixed(this.quantityPrecision);
    },
    formatPricePrecision(price) {
      // Round based on tick size
      price -= price % this.tickSize;
      return price.toFixed(this.pricePrecision);
    },
    onExecuteTrade(args) {
      let dollarSize = args[0];
      let side = args[1];
      console.log(`${side} ${dollarSize} of ${this.tradingSymbol}`);

      for (let api of this.apiKeys) {
        // Send trade message to websocket
        if (this.nttWs && this.activeHeadlineIndex == 0 && this.activeHeadline && this.tradingSymbol == this.activeHeadline.symbol) {
          this.nttWs.send(
            JSON.stringify({
              action: "trade",
              data: {
                trader_id: this.cognitoIdToken.payload.email,
                ticker: this.tradingSymbol + this.quoteAsset,
                size: `${(dollarSize / this.maxSize) * 100}%`,
                side: side,
                entryPrice: this.latestPrice,
                newsHeadline: this.activeHeadline ? this.activeHeadline : "N/A",
              },
            })
          );
        }

        // Execute Binance order
        let formattedQuantity = this.formatQuantityPrecision(dollarSize / this.latestPrice);
        let ticker = this.tradingSymbol + this.quoteAsset;

        let marketOrderPromise;
        if (this.selectedEntryMode == ExecutionMode.entry.MARKET) {
          marketOrderPromise = binance.executeMarketOrder(api.key, api.secret, ticker, side, formattedQuantity);
        } else if (this.selectedEntryMode == ExecutionMode.entry.MKT_SCALE) {
          // Market order the desired portion
          let dollarSizeToMarket = dollarSize * (this.marketProportion / 100);
          let formattedQtyToMarket = this.formatQuantityPrecision(dollarSizeToMarket / this.latestPrice);
          marketOrderPromise = binance.executeMarketOrder(api.key, api.secret, ticker, side, formattedQtyToMarket);

          let formattedQtyToLimit = this.formatQuantityPrecision((dollarSize - dollarSizeToMarket) / this.latestPrice);
          this.executeScaleOrders(
            api.key,
            api.secret,
            side,
            formattedQtyToLimit,
            this.generalSettings.nbrOfOrdersForScaling,
            0,
            this.entryScaleTo,
            false,
            false
          ).then((data) => {
            if (data.code) {
              alert(data.msg);
            } else {
              console.log("Scale in limit orders placed");
            }
          });
        }

        if (!marketOrderPromise) {
          alert("Error executing order");
          return;
        }

        marketOrderPromise
          .then((response) => response.json())
          .then((data) => {
            if (data.code) {
              alert(data.msg);
            } else {
              this.$emit("position-opened", {
                account: api.name,
                ticker: this.tradingSymbol + this.quoteAsset,
                size: dollarSize,
                side: side,
                entryPrice: this.latestPrice,
                markPrice: this.latestPrice,
                upnl: 0,
                units: Number(data.origQty),
              });

              // Take profit
              let takeProfitPromise;
              if (this.selectedExitMode == ExecutionMode.exit.LIMIT) {
                let takeProfitPrice = side == "BUY" ? this.latestPrice * (1 + this.takeProfit / 100) : this.latestPrice * (1 - this.takeProfit / 100);
                takeProfitPrice = this.formatPricePrecision(takeProfitPrice);

                takeProfitPromise = binance.executeLimitOrder(
                  api.key,
                  api.secret,
                  ticker,
                  side == "BUY" ? "SELL" : "BUY",
                  formattedQuantity,
                  takeProfitPrice,
                  "true"
                );
              } else if (this.selectedExitMode == ExecutionMode.exit.SCALE) {
                takeProfitPromise = this.executeScaleOrders(
                  api.key,
                  api.secret,
                  side == "BUY" ? "SELL" : "BUY",
                  dollarSize / this.latestPrice,
                  this.generalSettings.nbrOfOrdersForScaling,
                  this.scaleFrom,
                  this.scaleTo,
                  true,
                  true
                );
              }

              if (takeProfitPromise) {
                takeProfitPromise
                  .then((response, error) => {
                    if (error) {
                      alert("error sending orders");
                      return;
                    }
                    if (response.ok == undefined) {
                      return response;
                    } else if (response.ok) {
                      return response.json();
                    } else {
                      return response.text().then((text) => Promise.reject(text));
                    }
                  })
                  .then((orders, error) => {
                    if (error) {
                      alert("error sending orders");
                      return;
                    }

                    if (this.selectedExitMode == ExecutionMode.exit.LIMIT) {
                      // orders is only one order if its limit mode
                      orders = [orders];
                    }
                    for (let order of orders) {
                      if (order.code) {
                        alert(order.msg);
                        continue;
                      }

                      console.log("Take profit(s) orders placed");
                    }
                  });
              }
            }
          });

        // Stop loss
        if (this.stopLoss > 0) {
          let stopLossPrice = side == "BUY" ? this.latestPrice * (1 - this.stopLoss / 100) : this.latestPrice * (1 + this.stopLoss / 100);
          let stopLossPromise = binance.executeStopLossOrder(
            api.key,
            api.secret,
            ticker,
            side == "BUY" ? "SELL" : "BUY",
            formattedQuantity,
            this.formatPricePrecision(stopLossPrice)
          );

          stopLossPromise
            .then((response) => response.json())
            .then((data) => {
              if (data.code) {
                alert(data.msg);
              } else {
                console.log("Stop loss order placed");
              }
            });
        }
      }
    },
    executeScaleOrders(apiKey, apiSecret, side, quantity, nbrOfOrders, scaleFromPct, scaleToPct, reduceOnly, takeProfitOrder) {
      // Build list of orders
      let orders = [];
      let scaleFromPrice = this.latestPrice * (1 + ((side == "SELL" ? 1 : -1) * scaleFromPct) / 100);
      let scaleToPrice = this.latestPrice * (1 + ((side == "SELL" ? 1 : -1) * scaleToPct) / 100);
      let priceIncrement = side == "SELL" ? (scaleToPrice - scaleFromPrice) / nbrOfOrders : (scaleFromPrice - scaleToPrice) / nbrOfOrders;

      // Must respect the expected format of the Binance API
      for (let i = 1; i <= nbrOfOrders; i++) {
        let order;
        if (takeProfitOrder) {
          order = {
            type: "TAKE_PROFIT_MARKET",
            symbol: this.tradingSymbol + this.quoteAsset,
            side: side,
            quantity: this.formatQuantityPrecision(quantity / nbrOfOrders),
            stopPrice: this.formatPricePrecision(scaleFromPrice + (side == "SELL" ? 1 : -1) * priceIncrement * i),
            reduceOnly: reduceOnly.toString(),
          };
        } else {
          order = {
            type: "LIMIT",
            timeInForce: "GTC",
            symbol: this.tradingSymbol + this.quoteAsset,
            side: side,
            quantity: this.formatQuantityPrecision(quantity / nbrOfOrders),
            price: this.formatPricePrecision(scaleFromPrice + (side == "SELL" ? 1 : -1) * priceIncrement * i),
            reduceOnly: reduceOnly.toString(),
          };
        }

        orders.push(order);
      }

      // Execute
      if (orders.length > 5) {
        console.log("Executing " + orders.length + " orders in batches of 5");
        let promises = [];
        for (let i = 0; i < orders.length; i += 5) {
          if (i + 5 > orders.length) promises.push(binance.executeMultipleOrders(apiKey, apiSecret, orders.slice(i)));
          else promises.push(binance.executeMultipleOrders(apiKey, apiSecret, orders.slice(i, i + 5)));
        }

        return Promise.allSettled(promises);
      } else {
        return binance.executeMultipleOrders(apiKey, apiSecret, orders);
      }
    },
    loadTradingParams() {
      let tradingParams = JSON.parse(localStorage.getItem("tradingParams")) || {};

      if (Object.keys(tradingParams).length != 0) {
        this.maxSize = tradingParams.maxSize;
        this.selectedEntryMode = tradingParams.selectedEntryMode;
        this.selectedExitMode = tradingParams.selectedExitMode;
        this.stopLoss = tradingParams.stopLoss;
        this.takeProfit = tradingParams.takeProfit;
        this.scaleFrom = tradingParams.scaleFrom;
        this.scaleTo = tradingParams.scaleTo;
        this.nbrScaleOrders = tradingParams.nbrScaleOrders;
        this.marketProportion = tradingParams.marketProportion;
        this.entryScaleTo = tradingParams.entryScaleTo;
      }
    },
    storeTradingParams() {
      let tradingParams = {
        maxSize: this.maxSize,
        selectedEntryMode: this.selectedEntryMode,
        selectedExitMode: this.selectedExitMode,
        stopLoss: this.stopLoss,
        takeProfit: this.takeProfit,
        scaleFrom: this.scaleFrom,
        scaleTo: this.scaleTo,
        nbrScaleOrders: this.nbrScaleOrders,
        marketProportion: this.marketProportion,
        entryScaleTo: this.entryScaleTo,
      };

      localStorage.setItem("tradingParams", JSON.stringify(tradingParams));
    },
    onAddApiKey(data) {
      this.$emit("add-api-key", data);
    },
    onDeleteApiKey(index) {
      this.$emit("delete-api-key", index);
    },
    onUpdateGeneralSettings(settings) {
      this.$emit("update-general-settings", settings);
    },
    connectNttWs() {
      //Get websocket api key
      let headers = new Headers();
      headers.append("Authorization", this.cognitoIdToken.jwtToken);

      let url = ApiRoutes.GET_WS_API_KEY + `?user_id=${this.cognitoIdToken.payload["cognito:username"]}`;
      let requestOptions = new Request(url, {
        method: "GET",
        headers: headers,
        redirect: "follow",
      });

      fetch(requestOptions)
        .then((response) => response.text())
        .then((result) => {
          let api_key = result.split('"').join("");
          let wsUrl = ApiRoutes.CONNECT_WS + `?user_id=${this.cognitoIdToken.payload["cognito:username"]}&api_key=${api_key}`;
          this.nttWs = new WebSocket(wsUrl);
          this.nttWs.onopen = () => {
            this.wsAlive = true;
            this.pingInterval = setInterval(this.pingWebsocket, this.pingIntervalTime);
          };
          this.nttWs.onerror = (error) => {
            console.log("nttWs error");
            console.log(error);
          };
          this.nttWs.onclose = () => {
            console.log("nttWs close");
            clearTimeout(this.pingTimeout);
          };
          this.nttWs.onmessage = (event) => {
            if (!event.data) {
              return;
            }

            let data = JSON.parse(event.data);

            if (data["action"] == "pong") {
              clearTimeout(this.pingTimeout);
              return;
            }

            if (data["action"] == "trade") {
              this.$emit("clicked-by-other-trader", data["data"]["trader_id"]);
            }
          };
        })
        .catch((error) => console.log("error", error));
    },
    pingWebsocket() {
      this.nttWs.send(JSON.stringify({ action: "ping" }));
      this.pingTimeout = setTimeout(() => {
        this.wsAlive = false;
        this.nttWs.close();
        clearInterval(this.pingInterval);
        this.connectNttWs();
      }, this.pingTimeoutTime);
    },
    getTotalAccountsBalance() {
      let total = 0;
      for (let account of Object.keys(this.accountsBalance)) {
        total += this.accountsBalance[account];
      }
      return total.toFixed(2);
    },
    getTotalPositionsNotional() {
      let total = 0;
      for (let pos of this.accountsPositions) {
        total += pos.size;
      }
      return total.toFixed(2);
    },
  },
  mounted() {
    this.loadTradingParams();
    this.connectNttWs();
  },
  beforeUnmount() {
    if (this.nttWs) {
      this.nttWs.close();
    }
    clearInterval(this.pingInterval);
    clearTimeout(this.pingTimeout);
  },
};
</script>

<template>
  <v-card>
    <v-card-title
      >Trading Panel<TradingSettingsDialog
        class="float-right"
        :api-keys="apiKeys"
        :general-settings="generalSettings"
        @add-api-key="onAddApiKey"
        @delete-api-key="onDeleteApiKey"
        @update-general-settings="onUpdateGeneralSettings"
        @close-dialog="onCloseDialog()"
      ></TradingSettingsDialog
    ></v-card-title>
    <v-card-text>
      <h4>
        Balance: {{ getTotalAccountsBalance() }}<span class="float-right">Exposure: {{ getTotalPositionsNotional() }}</span>
      </h4>
      &nbsp;
      <v-form>
        <v-row>
          <v-col class="pb-0">
            <v-select
              hide-details="auto"
              :density="density"
              class="text-truncate"
              v-model="selectedEntryMode"
              label="Entry Mode"
              :items="Object.values(ExecutionMode.entry)"
              @update:modelValue="storeTradingParams"
            ></v-select>
          </v-col>
          <v-col class="pb-0" v-show="selectedEntryMode == ExecutionMode.entry.MKT_SCALE">
            <v-text-field
              hide-details="auto"
              :density="density"
              label="Market Portion"
              suffix="%"
              v-model="marketProportion"
              type="number"
              hint="% of trading size"
              @update:modelValue="storeTradingParams"
            >
            </v-text-field>
          </v-col>
          <v-col class="pb-0" v-show="selectedEntryMode == ExecutionMode.entry.MKT_SCALE">
            <v-text-field
              hide-details="auto"
              :density="density"
              label="Scale to"
              suffix="%"
              v-model="entryScaleTo"
              type="number"
              hint="away from current price"
              @update:modelValue="storeTradingParams"
            >
            </v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col class="pb-0">
            <v-select
              hide-details="auto"
              :density="density"
              v-model="selectedExitMode"
              label="Exit Mode"
              :items="Object.values(ExecutionMode.exit)"
              @update:modelValue="storeTradingParams"
            ></v-select>
          </v-col>
          <v-col class="pb-0" v-show="selectedExitMode == ExecutionMode.exit.LIMIT">
            <v-text-field
              hide-details="auto"
              :density="density"
              label="Take Profit"
              suffix="%"
              v-model="takeProfit"
              type="number"
              @update:modelValue="storeTradingParams"
            >
            </v-text-field>
          </v-col>
          <v-col class="pb-0" v-show="selectedExitMode == ExecutionMode.exit.SCALE">
            <v-text-field
              hide-details="auto"
              :density="density"
              label="From"
              suffix="%"
              v-model="scaleFrom"
              type="number"
              @update:modelValue="storeTradingParams"
            >
            </v-text-field>
          </v-col>
          <v-col class="pb-0" v-show="selectedExitMode == ExecutionMode.exit.SCALE">
            <v-text-field
              hide-details="auto"
              :density="density"
              label="To"
              suffix="%"
              v-model="scaleTo"
              type="number"
              @update:modelValue="storeTradingParams"
            >
            </v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col class="pb-0">
            <v-text-field
              hide-details="auto"
              :density="density"
              label="Max Size"
              prefix="$"
              v-model="maxSize"
              @update:modelValue="storeTradingParams"
            ></v-text-field>
          </v-col>
          <v-col class="pb-0">
            <v-text-field
              hide-details="auto"
              :density="density"
              label="Stop Loss"
              suffix="%"
              v-model="stopLoss"
              type="number"
              @update:modelValue="storeTradingParams"
            >
            </v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col class="pb-0">
            <div style="display: flex; align-items: center">
              <v-text-field
                hide-details="auto"
                :disabled="lockSymbol"
                :density="density"
                label="Trading Symbol"
                :model-value="tradingSymbol"
                @focusout="$emit('trading-symbol-changed', $event.target.value)"
              ></v-text-field>
              &nbsp; &nbsp;
              <span class="float-right">
                <v-icon :icon="lockSymbol ? 'mdi-lock' : 'mdi-lock-open-variant'" @click="$emit('lock-symbol-toggled')"></v-icon>
              </span>
            </div>
          </v-col>
          <v-col class="pb-5">
            <v-select
              hide-details="auto"
              :disabled="lockSymbol"
              :density="density"
              :model-value="quoteAsset"
              label="Quote Asset"
              :items="['USDT', 'BUSD']"
              @update:modelValue="$emit('quote-asset-changed', $event)"
            ></v-select>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-row justify="center">
              <TradingButton :amount="maxSize * 0.25" side="BUY" @execute-trade="onExecuteTrade"></TradingButton>
              <TradingButton :amount="maxSize * 0.5" side="BUY" @execute-trade="onExecuteTrade"></TradingButton>
              <TradingButton :amount="maxSize" side="BUY" @execute-trade="onExecuteTrade"></TradingButton>
              <TradingButton :amount="maxSize * 0.25" side="SELL" @execute-trade="onExecuteTrade"></TradingButton>
              <TradingButton :amount="maxSize * 0.5" side="SELL" @execute-trade="onExecuteTrade"></TradingButton>
              <TradingButton :amount="maxSize" side="SELL" @execute-trade="onExecuteTrade"></TradingButton>
            </v-row>
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>
  </v-card>
</template>
