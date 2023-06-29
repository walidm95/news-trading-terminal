<script setup>
import NewsItem from "./NewsItem.vue";
import NewsFeedSettingsDialog from "./NewsFeedSettingsDialog.vue";
</script>

<script>
import CREDENTIALS from "../credentials.js";

export default {
  data() {
    return {
      notification_sound: new Audio("/new_headline.mp3"),
      headlines: [],
      activeHeadline: 0,
      toaNewsWebsocket: null,
      dbNewsWebsocket: null,
      toaWsAlive: false,
      dbWsAlive: false,
      toaPingInterval: null,
      toaPingTimeout: null,
      dbPingInterval: null,
      toaPingInterval: null,
      pingIntervalTime: 5000,
      pingTimeoutTime: 2000,
    };
  },
  props: {
    quoteAsset: { type: String, required: true },
    symbols: { type: Object, required: true },
    livePriceFeed: { type: Object, required: true },
    newsFeedSettings: { type: Object, required: true },
  },
  methods: {
    onSelectHeadline(index) {
      this.$emit("active-headline-index-changed", index);

      this.activeHeadline = index;
      this.$emit("symbol-from-headline", this.headlines[index].symbol);
    },
    connectDbNewsFedWs() {
      this.dbNewsWebsocket = new WebSocket(`wss://${CREDENTIALS.DB_USERNAME}:${CREDENTIALS.DB_PASSWORD}@904c7008.nip.io/credo`);
      this.dbNewsWebsocket.onopen = () => {
        const msg = "DB ws connected";
        this.$emit("add-debug-log", msg);
        console.log(msg);
        this.dbWsAlive = true;
      };
      this.dbNewsWebsocket.onerror = (error) => {
        const msg = "DB ws error";
        this.$emit("add-debug-log", msg);
        console.error(msg, error);
        this.dbWsAlive = false;

        // try to reconnect
        this.connectDbNewsFedWs();
      };
      this.dbNewsWebsocket.onclose = () => {
        const msg = "DB ws closed";
        this.$emit("add-debug-log", msg);
        console.log(msg);
        this.dbWsAlive = false;
      };
      this.dbNewsWebsocket.onmessage = (event) => {
        let data = JSON.parse(event.data);

        let symbol;
        if (data.coins.length > 0) {
          // NOTE: for now we only take the first coin
          symbol = data.coins[0];
          if (!this.symbols[symbol]) {
            const msg = `${symbol} not in symbols list. Skipping`;
            this.$emit("add-debug-log", msg);
            console.log(msg);
            return;
          }
        } else {
          const msg = "no symbol found. Skipping";
          console.log(msg);
          return;
        }

        const ticker = symbol + this.quoteAsset;

        let title;

        // get twitter username
        const match = data.link.match(/https?:\/\/twitter\.com\/(\w+)\/status\/\d+/);
        if (match && match[1]) {
          title = "@" + match[1];
        } else {
          title = data.source;
        }

        const headline = {
          feedSource: "DB",
          id: data._id,
          title: title,
          body: data.text,
          type: data.source,
          timestamp: new Date(data.ts),
          symbol: symbol,
          ticker: ticker,
          link: data.link,
          price: this.livePriceFeed[ticker] ? this.livePriceFeed[ticker] : 0,
          btcPrice: this.livePriceFeed["BTC" + this.quoteAsset] ? this.livePriceFeed["BTC" + this.quoteAsset] : 0,
          nbrOfTrades: 0,
        };

        // Ignore headline that contains a keyword to ignore
        if (this.newsFeedSettings.keywords.ignore.length > 0) {
          const regex = new RegExp("\\b(" + this.newsFeedSettings.keywords.ignore.join("|") + ")\\b", "i");
          if (regex.test(headline.body) || regex.test(headline.title)) {
            const msg = "Contains keyword from ignore list. Skipping";
            this.$emit("add-debug-log", msg);
            console.log(msg);
            return;
          }
        }

        this.headlines.unshift(headline);

        if (this.newsFeedSettings.playHeadlineNotification && (!this.newsFeedSettings.onlyColoredKeywords || this.hasHighlightedWord(headline.body))) {
          this.notification_sound.play();
        }

        this.activeHeadline = 0;
        this.$emit("symbol-from-headline", symbol);
        this.$emit("update-headlines", this.headlines);
        this.$emit("active-headline-index-changed", 0);
      };
    },
    connectToaNewsFeedWs() {
      if (this.toaPingTimeout) {
        clearTimeout(this.toaPingTimeout);
      }

      this.toaNewsWebsocket = new WebSocket("wss://news.treeofalpha.com/ws");
      this.toaNewsWebsocket.onopen = () => {
        const msg = "TreeOfAlphaWS connected";
        this.$emit("add-debug-log", msg);
        console.log(msg);
        this.toaNewsWebsocket.send("login " + CREDENTIALS.TREE_OF_ALPHA_API_KEY);
        this.toaWsAlive = true;
        this.toaPingInterval = setInterval(this.pingWebsocket, this.pingIntervalTime);
      };
      this.toaNewsWebsocket.onerror = (error) => {
        const msg = "TreeOfAlphaWS error";
        this.$emit("add-debug-log", msg);
        console.error(msg, error);
      };
      this.toaNewsWebsocket.onclose = () => {
        const msg = "TreeOfAlphaWS closed";
        this.$emit("add-debug-log", msg);
        console.log(msg);
        clearTimeout(this.toaPingTimeout);
        clearInterval(this.toaPingInterval);
        this.toaWsAlive = false;
      };
      this.toaNewsWebsocket.onmessage = (event) => {
        if (event.data == "pong") {
          clearTimeout(this.toaPingTimeout);
          return;
        }

        let data = JSON.parse(event.data);

        if (data.user) {
          const msg = "TreeOfAlphaWS logged in"; //as " + data.user.username;
          this.$emit("add-debug-log", msg);
          console.log(msg);
          return;
        }

        let type = data.info && data.info.twitterId ? "twitter" : data.source;
        let link = data.link ? data.link : data.url ? data.url : undefined;

        let symbol;
        if (data.coin) {
          symbol = data.coin;
          if (!this.symbols[symbol]) {
            const msg = `${symbol} not in symbols list. Skipping`;
            this.$emit("add-debug-log", msg);
            console.log(msg);
            return;
          }
        } else if (data.symbols && data.symbols.length > 0) {
          symbol = data.symbols[0].split("_")[0];
          if (!this.symbols[symbol]) {
            const msg = `${symbol} not in symbols list. Skipping`;
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
          feedSource: "Tree Of Alpha",
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
        if (this.newsFeedSettings.keywords.ignore.length > 0) {
          const regex = new RegExp("\\b(" + this.newsFeedSettings.keywords.ignore.join("|") + ")\\b", "i");
          if (regex.test(headline.body) || regex.test(headline.title)) {
            const msg = "Contains keyword from ignore list. Skipping";
            this.$emit("add-debug-log", msg);
            console.log(msg);
            return;
          }
        }

        this.headlines.unshift(headline);

        if (this.newsFeedSettings.playHeadlineNotification && (!this.newsFeedSettings.onlyColoredKeywords || this.hasHighlightedWord(headline.body))) {
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
      this.toaNewsWebsocket.send("ping");
      this.toaPingTimeout = setTimeout(() => {
        const msg = "ping timeout";
        this.$emit("add-debug-log", msg);
        console.log(msg);
        this.toaWsAlive = false;

        this.toaNewsWebsocket.close();
        clearInterval(this.toaPingInterval);

        this.connectToaNewsFeedWs();
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
    hasHighlightedWord(text) {
      const escapeRegExp = (string) => string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");

      const highlightPatterns = this.newsFeedSettings.keywords.highlight.map((item) => `\\b${escapeRegExp(item.word)}\\b`).join("|");

      const regex = new RegExp(highlightPatterns, "gi");
      return regex.test(text);
    },
    applyHighlights(text) {
      const escapeRegExp = (string) => string.replace(/[.*+\-?^${}()|[\]\\]/g, "\\$&");
      const highlightGroups = this.newsFeedSettings.keywords.highlight
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
      this.$emit("update-news-feed-settings", settings);
    },
    onResetNewsFeedSettings() {
      this.$emit("reset-news-feed-settings");
    },
  },
  watch: {
    newsFeedSettings: {
      handler: function () {
        if (this.newsFeedSettings.useTreeOfAlpha && !this.toaWsAlive) {
          this.connectToaNewsFeedWs();
        } else if (!this.newsFeedSettings.useTreeOfAlpha && this.toaNewsWebsocket) {
          this.toaNewsWebsocket.close();
          this.toaNewsWebsocket = null;
        }
        if (this.newsFeedSettings.useDB && !this.dbWsAlive) {
          this.connectDbNewsFedWs();
        } else if (!this.newsFeedSettings.useDB && this.dbNewsWebsocket) {
          this.dbNewsWebsocket.close();
          this.dbNewsWebsocket = null;
        }
      },
      deep: true,
    },
  },
  mounted() {},
  beforeUnmount() {
    if (this.toaNewsWebsocket) {
      this.toaNewsWebsocket.close();
    }
    clearInterval(this.toaPingInterval);
    clearTimeout(this.toaPingTimeout);
  },
};
</script>

<template>
  <v-card>
    <v-badge :color="toaWsAlive || dbWsAlive ? 'green' : 'red'" dot inline>
      <v-card-title>News Feed</v-card-title>
    </v-badge>
    <NewsFeedSettingsDialog
      class="float-right pt-3 pr-3"
      :news-feed-settings="newsFeedSettings"
      @add-keyword="onAddKeyword"
      @delete-keyword="onDeleteKeyword"
      @reset-news-feed-settings="onResetNewsFeedSettings"
      @update-news-feed-settings="onUpdateNewsFeedSettings"
    ></NewsFeedSettingsDialog>

    <v-list class="overflow-y-auto" style="height: 90%">
      <NewsItem
        v-for="(headline, index) in headlines"
        :feedSource="headline.feedSource"
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
