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
      keywords: JSON.parse(localStorage.getItem("keywords")) || { highlight: [], ignore: [] },
    };
  },
  props: {
    quoteAsset: { type: String, required: true },
    symbols: { type: Object, required: true },
    livePriceFeed: { type: Object, required: true },
    playNotificationSound: { type: Boolean, required: true },
    onlyColoredKeywords: { type: Boolean, required: true },
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

        //this.$emit("add-debug-log", data.body ? data.body : data.title);
        //console.log(data);

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
          //this.$emit("add-debug-log", msg);
          console.log(msg);
          return;
        }

        const ticker = symbol + this.quoteAsset;
        const headline = {
          id: data._id,
          title: data.title,
          body: data.body ? data.body : data.title,
          type: type,
          timestamp: new Date(data.time),
          symbol: symbol,
          ticker: ticker,
          link: link,
          price: this.livePriceFeed[ticker] ? this.livePriceFeed[ticker] : 0,
          btcPrice: this.livePriceFeed["BTC" + this.quoteAsset] ? this.livePriceFeed["BTC" + this.quoteAsset] : 0,
          nbrOfTrades: 0,
        };

        // Ignore headline that contains a keyword to ignore
        if (this.keywords.ignore.length > 0) {
          const regex = new RegExp("\\b(" + this.keywords.ignore.join("|") + ")\\b", "i");
          if (regex.test(headline.body) || regex.test(headline.title)) {
            const msg = "Contains keyword from ignore list. Skipping";
            this.$emit("add-debug-log", msg);
            console.log(msg);
            return;
          }
        }

        this.headlines.unshift(headline);

        if (this.playNotificationSound && (!this.onlyColoredKeywords || this.hasHighlightedWord(headline.body))) {
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
        this.keywords.highlight.push(obj);
      } else if (obj.action == "Ignore") {
        this.keywords.ignore.push(obj.word);
      }
      localStorage.setItem("keywords", JSON.stringify(this.keywords));
    },
    onDeleteKeyword(obj) {
      if (obj.action == "Highlight") {
        this.keywords.highlight.splice(obj.index, 1);
      } else if (obj.action == "Ignore") {
        this.keywords.ignore.splice(obj.index, 1);
      }
      localStorage.setItem("keywords", JSON.stringify(this.keywords));
    },
    hasHighlightedWord(text) {
      const escapeRegExp = (string) => string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");

      const highlightPatterns = this.keywords.highlight.map((item) => `\\b${escapeRegExp(item.word)}\\b`).join("|");

      const regex = new RegExp(highlightPatterns, "gi");
      return regex.test(text);
    },
    applyHighlights(text) {
      const escapeRegExp = (string) => string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
      const highlightGroups = this.keywords.highlight
        .map((item) => ({
          pattern: `\\b${escapeRegExp(item.word)}\\b`,
          color: item.color,
        }))
        .reduce((acc, item) => {
          const colorGroup = acc[item.color] || { patterns: [], color: item.color };
          colorGroup.patterns.push(item.pattern);
          acc[item.color] = colorGroup;
          return acc;
        }, {});

      for (const colorGroup of Object.values(highlightGroups)) {
        const pattern = colorGroup.patterns.join("|");
        const regex = new RegExp(pattern, "gi");
        text = text.replace(regex, (match) => `<span style="color:${colorGroup.color}">${match}</span>`);
      }

      return text;
    },
    onUpdateNewsFeedSettings(settings) {
      // Only settings, does not handle the keywords system
      this.$emit("update-news-feed-settings", settings);
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
      :keywords="keywords"
      @add-keyword="onAddKeyword"
      @delete-keyword="onDeleteKeyword"
      @update-news-feed-settings="onUpdateNewsFeedSettings"
    ></NewsFeedSettingsDialog>

    <v-list class="overflow-y-auto" style="height: 90%">
      <NewsItem
        v-for="(headline, index) in headlines"
        :symbol="headline.symbol"
        :type="headline.type"
        :title="headline.title"
        :body="applyHighlights(headline.body)"
        :link="headline.link"
        :timestamp="headline.timestamp"
        :selected="activeHeadline == index"
        :priceChange="getPriceChange(index)"
        :btcPriceChange="getBtcPriceChange(index)"
        :nbrOfTrades="headline.nbrOfTrades || 0"
        @click="onSelectHeadline(index)"
      ></NewsItem>
    </v-list>
  </v-card>
</template>
