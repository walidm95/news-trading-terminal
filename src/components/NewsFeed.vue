<script setup>
import NewsItem from "./NewsItem.vue";
</script>

<script>
//TODO: remove it and fetch it from http api
const TREE_API_KEY = "f82ff6449777948ce45809afca68017db54d86c02d0409ee5d2b223eaefc52b2";

export default {
  data() {
    return {
      notification_sound: new Audio("/new_headline.mp3"),
      headlines: [],
      activeHeadline: 0,
      newsWebsocket: null,
      wsAlive: false,
      pingInterval: null,
      pingTimeout: null,
      pingIntervalTime: 5000,
      pingTimeoutTime: 2000,
    };
  },
  props: {
    quoteAsset: { type: String, required: true },
    symbols: { type: Object, required: true },
    livePriceFeed: { type: Object, required: true },
    playNotificationSound: { type: Boolean, required: true },
    nbrOfTradesLatestHeadline: { type: Number, required: true },
  },
  methods: {
    onSelectHeadline(index) {
      this.$emit("active-headline-index-changed", index);

      this.activeHeadline = index;
      this.$emit("symbol-from-headline", this.headlines[index].symbol);
    },
    connectNewsFeedWs() {
      if (this.pingTimeout) {
        clearTimeout(this.pingTimeout);
      }

      this.newsWebsocket = new WebSocket("wss://news.treeofalpha.com/ws");
      this.newsWebsocket.onopen = () => {
        console.log("TreeOfAlphaWS connected");
        this.newsWebsocket.send("login " + TREE_API_KEY);
        this.wsAlive = true;
        this.pingInterval = setInterval(this.pingWebsocket, this.pingIntervalTime);
      };
      this.newsWebsocket.onerror = (error) => {
        console.log("TreeOfAlphaWS error");
        console.log(error);
      };
      this.newsWebsocket.onclose = () => {
        console.log("TreeOfAlphaWS closed");
        clearTimeout(this.pingTimeout);
      };
      this.newsWebsocket.onmessage = (event) => {
        if (event.data == "pong") {
          clearTimeout(this.pingTimeout);
          return;
        }

        let data = JSON.parse(event.data);

        if (data.user) {
          console.log("TreeOfAlphaWS logged in as " + data.user.username);
          return;
        }

        console.log(data);

        let type = data.info && data.info.twitterId ? "twitter" : data.source;
        let link = data.link ? data.link : data.url ? data.url : undefined;

        let symbol;
        if (data.coin) {
          symbol = data.coin;
          if (!this.symbols[symbol]) {
            console.log("symbol not in symbols list. Skipping");
            return;
          }
        } else if (data.symbols && data.symbols.length > 0) {
          symbol = data.symbols[0].split("_")[0];
          if (!this.symbols[symbol]) {
            console.log("symbol not in symbols list. Skipping");
            return;
          }
        } else {
          symbol = this.findSymbolInHeadline(data.body ? data.body : data.title);
        }

        if (symbol == "") {
          console.log("no symbol found. Skipping");
          return;
        }

        let ticker = symbol + this.quoteAsset;
        this.headlines.unshift({
          title: data.title,
          body: data.body ? data.body : data.title,
          type: type,
          timestamp: new Date(data.time),
          symbol: symbol,
          ticker: ticker,
          link: link,
          price: this.livePriceFeed[ticker] ? this.livePriceFeed[ticker] : 0,
          btcPrice: this.livePriceFeed["BTC" + this.quoteAsset] ? this.livePriceFeed["BTC" + this.quoteAsset] : 0,
        });

        if (this.playNotificationSound) {
          this.notification_sound.play();
        }

        this.activeHeadline = 0;
        this.$emit("symbol-from-headline", symbol);
        this.$emit("update-headlines", this.headlines);
        this.$emit("active-headline-index-changed", 0);
      };
    },
    getPriceChange(index) {
      let priceAtNews = this.headlines[index].price;
      let priceNow = this.livePriceFeed[this.headlines[index].ticker];
      return ((priceNow - priceAtNews) / priceAtNews) * 100;
    },
    getBtcPriceChange(index) {
      let priceAtNews = this.headlines[index].btcPrice;
      let priceNow = this.livePriceFeed["BTC" + this.quoteAsset];
      return ((priceNow - priceAtNews) / priceAtNews) * 100;
    },
    pingWebsocket() {
      this.newsWebsocket.send("ping");
      this.pingTimeout = setTimeout(() => {
        console.log("ping timeout");
        this.wsAlive = false;

        this.newsWebsocket.close();
        clearInterval(this.pingInterval);

        this.connectNewsFeedWs();
      }, this.pingTimeoutTime);
    },
    findSymbolInHeadline(headline) {
      for (let symbol of Object.keys(this.symbols)) {
        if (symbol == "T") {
          //NOTE: we skip it for now, because it will always be true if theres a /t/ in a URL
          continue;
        }
        let regexName = new RegExp(`\\b${this.symbols[symbol]}\\b`, "i");
        let regexSymbol = new RegExp(`\\b${symbol}\\b`, "i");
        if (regexName.test(headline) || regexSymbol.test(headline)) {
          return symbol;
        }
      }
      return "";
    },
  },
  mounted() {
    this.connectNewsFeedWs();
  },
  beforeUnmount() {
    if (this.newsWebsocket) {
      this.newsWebsocket.close();
    }
    clearInterval(this.pingInterval);
    clearTimeout(this.pingTimeout);
  },
};
</script>

<template>
  <v-card>
    <v-badge :color="wsAlive ? 'green' : 'red'" dot inline>
      <v-card-title>News Feed</v-card-title>
    </v-badge>
    <v-list class="overflow-y-auto" style="height: 90%">
      <NewsItem
        v-for="(headline, index) in headlines"
        :symbol="headline.symbol"
        :type="headline.type"
        :title="headline.title"
        :body="headline.body"
        :link="headline.link"
        :timestamp="headline.timestamp"
        :selected="activeHeadline == index"
        :priceChange="getPriceChange(index)"
        :btcPriceChange="getBtcPriceChange(index)"
        :nbrOfTrades="index == 0 ? nbrOfTradesLatestHeadline : 0"
        @click="onSelectHeadline(index)"
      ></NewsItem>
    </v-list>
  </v-card>
</template>
