<template>
  <v-card>
    <v-card-title>Positions ({{ showPositions() ? positions.length : 0 }})</v-card-title>
    <v-table density="compact" fixed-header height="300px">
      <thead>
        <tr>
          <th class="text-center text-subtitle-2 pr-0 pl-2">Account</th>
          <th class="text-center text-subtitle-2 pr-0 pl-2">Ticker</th>
          <th class="text-center text-subtitle-2 pr-0 pl-2">Size</th>
          <th class="text-center text-subtitle-2 pr-0 pl-2">Entry Price</th>
          <th class="text-center text-subtitle-2 pr-0 pl-2">uPNL</th>
          <th class="text-center text-subtitle-2 pr-2 pl-2">Close</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="showPositions()" v-for="(pos, index) in positions">
          <td class="text-center text-subtitle-2 pr-0 pl-2">{{ pos.account }}</td>
          <td class="text-center text-subtitle-2 pr-0 pl-2" @click="onTickerClick(pos.ticker)">{{ pos.ticker.replace("USDT", "") }}</td>
          <td class="text-center text-subtitle-2 pr-0 pl-2" :class="pos.side == 'BUY' ? 'text-green' : 'text-red'">
            {{ formatNumber(pos.size) }}
          </td>
          <td class="text-center text-subtitle-2 pr-0 pl-2">
            {{ formatNumber(pos.entryPrice, pos.ticker).replace("$", "") }}
          </td>
          <td class="text-center text-subtitle-2 pr-0 pl-2" :class="pos.upnl > 0 ? 'text-green' : 'text-red'">
            {{ formatNumber(pos.upnl) }}
          </td>
          <td class="text-center text-subtitle-2 pr-2 pl-2">
            <v-btn size="x-small" rounded="lg" color="red" @click="$emit('close-position', index)">X</v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
  </v-card>
</template>

<script>
import binance from "../binance.js";

var formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 7,
});

export default {
  data() {
    return {
      listenKeys: {},
      userDataStreams: {},
      keepAliveIntervals: {},
      updateAfterTimeout: null,
    };
  },
  props: {
    nbrOfActiveAccounts: { type: Number, required: true },
    apiKeys: { type: Array, required: true },
    positions: { type: Array, required: true },
    pricePrecisions: { type: Object, required: true },
  },
  methods: {
    onTickerClick(ticker) {
      this.$emit("select-symbol", ticker);
    },
    formatNumber(number, ticker) {
      number = parseFloat(number);
      const fixedDecimals = ticker ? this.pricePrecisions[ticker] : 2;
      return formatter.format(number.toFixed(fixedDecimals >= 5 ? 5 : fixedDecimals));
    },
    connectUserDataStream() {
      for (let apiKey of this.apiKeys) {
        if (!apiKey.enabled || this.userDataStreams[apiKey.account]) {
          continue;
        }
        let promise = binance.getUserDataStreamListenKey(apiKey.key, apiKey.secret);
        promise
          .then((response) => response.json())
          .then((data) => {
            if (data.code) {
              const msg = `${apiKey.account}: ${data.msg}`;
              this.$emit("add-debug-log", msg);
              console.error(msg);
              alert(msg);
            } else {
              this.listenKeys[apiKey.account] = data.listenKey;
              this.userDataStreams[apiKey.account] = new WebSocket("wss://fstream.binance.com/ws/" + this.listenKeys[apiKey.account]);
              this.userDataStreams[apiKey.account].onmessage = this.onUserDataStreamMessage;
              this.keepAliveIntervals[apiKey.account] = setInterval(() => {
                if (apiKey.enabled) {
                  binance.keepAliveUserDataStream(apiKey.key, apiKey.secret, this.listenKeys[apiKey.account]);
                } else if (this.keepAliveIntervals[apiKey.account]) {
                  this.closeStream(apiKey.account);
                }
              }, 30000);
            }
          })
          .catch((error) => {
            const msg = `Error in UserDataStream\n${apiKey.account}: ${error}`;
            this.$emit("add-debug-log", msg);
            console.error(msg);
            alert(msg);
          });
      }
    },
    onUserDataStreamMessage(event) {
      let data = JSON.parse(event.data);
      if (data.e === "ACCOUNT_UPDATE") {
        clearTimeout(this.updateAfterTimeout);
        this.updateAfterTimeout = setTimeout(() => {
          this.$emit("update-positions");
        }, 500);
      }
    },
    closeStream(account) {
      if (this.userDataStreams[account]) {
        this.userDataStreams[account].close();
        this.userDataStreams[account] = null;
        clearInterval(this.keepAliveIntervals[account]);
        this.listenKeys[account] = null;
      }
    },
    closeAllStreams() {
      for (let account of Object.keys(this.userDataStreams)) {
        this.closeStream(account);
      }
    },
    showPositions() {
      for (let api of this.apiKeys) {
        if (api.enabled && this.positions.some((pos) => pos.account == api.account)) {
          return true;
        }
      }
      return false;
    },
  },
  mounted() {
    setTimeout(this.connectUserDataStream, 2000);
  },
  unmounted() {
    this.closeAllStreams();
  },
  watch: {
    nbrOfActiveAccounts: function (newNbr) {
      if (newNbr > 0) {
        this.connectUserDataStream();
      } else {
        // Disconnect all user data stream
        this.closeAllStreams();
      }
    },
  },
};
</script>
