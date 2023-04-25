<script setup>
import NewsItem from "./NewsItem.vue";
import NewsFeedSettingsDialog from "./NewsFeedSettingsDialog.vue";
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
      keywordsToHighlight: [],
      keywordsToIgnore: [],
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
        const msg = "TreeOfAlphaWS connected";
        this.$emit("add-debug-log", msg);
        console.log(msg);
        this.newsWebsocket.send("login " + TREE_API_KEY);
        this.wsAlive = true;
        this.pingInterval = setInterval(this.pingWebsocket, this.pingIntervalTime);
      };
      this.newsWebsocket.onerror = (error) => {
        const msg = "TreeOfAlphaWS error";
        this.$emit("add-debug-log", msg);
        console.log(msg);
      };
      this.newsWebsocket.onclose = () => {
        const msg = "TreeOfAlphaWS closed";
        this.$emit("add-debug-log", msg);
        console.log(msg);
        clearTimeout(this.pingTimeout);
      };
      this.newsWebsocket.onmessage = (event) => {
        if (event.data == "pong") {
          clearTimeout(this.pingTimeout);
          return;
        }

        let data = JSON.parse(event.data);

        if (data.user) {
          const msg = "TreeOfAlphaWS logged in"; //as " + data.user.username;
          this.$emit("add-debug-log", msg);
          console.log(msg);
          return;
        }

        this.$emit("add-debug-log", data.body ? data.body : data.title);
        console.log(data);

        let type = data.info && data.info.twitterId ? "twitter" : data.source;
        let link = data.link ? data.link : data.url ? data.url : undefined;

        let symbol;
        if (data.coin) {
          symbol = data.coin;
          if (!this.symbols[symbol]) {
            const msg = "symbol not in symbols list. Skipping";
            this.$emit("add-debug-log", msg);
            console.log(msg);
            return;
          }
        } else if (data.symbols && data.symbols.length > 0) {
          symbol = data.symbols[0].split("_")[0];
          if (!this.symbols[symbol]) {
            const msg = "symbol not in symbols list. Skipping";
            this.$emit("add-debug-log", msg);
            console.log(msg);
            return;
          }
        } else {
          symbol = this.findSymbolInHeadline(data.body ? data.body : data.title);
        }

        if (symbol == "") {
          const msg = "no symbol found. Skipping";
          this.$emit("add-debug-log", msg);
          console.log(msg);
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
        const msg = "ping timeout";
        this.$emit("add-debug-log", msg);
        console.log(msg);
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
    onAddKeyword(obj) {
      if (obj.action == "Highlight") {
        this.keywordsToHighlight.push(obj);
      } else if (obj.action == "Ignore") {
        this.keywordsToIgnore.push(obj.word);
      }
    },
    onDeleteKeyword(obj) {
      if (obj.action == "Highlight") {
        this.keywordsToHighlight.splice(obj.index, 1);
      } else if (obj.action == "Ignore") {
        this.keywordsToIgnore.splice(obj.index, 1);
      }
    },
    highlight(word, color) {
      let text = this.headlines[this.activeHeadline].body;
      if (text) {
        return text.replace(new RegExp(word, "gi"), (match) => {
          return `<span style="color:${color}">` + match + "</span>";
        });
      }
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
    <NewsFeedSettingsDialog
      class="float-right pt-3 pr-3"
      :keywordsToHighlight="keywordsToHighlight"
      :keywordsToIgnore="keywordsToIgnore"
      @add-keyword="onAddKeyword"
      @delete-keyword="onDeleteKeyword"
    ></NewsFeedSettingsDialog>

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
