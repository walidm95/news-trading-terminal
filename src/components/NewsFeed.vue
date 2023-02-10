<script>
import NewsItem from './NewsItem.vue';

export default {
    data() {
        return {
            notification_sound: new Audio('/public/new_headline.mp3'),
            headlines: [],
            activeHeadline: 0,
            expand: false,
            showTwitter: true,
            showBlogs: true
        }
    },
    props : {
        quoteAsset: {type: String, required: true},
        symbols: {type: Object, required: true},
        livePriceFeed: {type: Object, required: true}
    },
    components: { NewsItem },
    methods: {
        findSymbolInHeadline(headline) {
            for(let symbol of Object.keys(this.symbols))
            {
                if (symbol == 'T') {
                    //NOTE: we skip it for now, because it will always be true if theres a /t/ in a URL
                    continue
                }
                let regexName = new RegExp(`\\b${this.symbols[symbol]}\\b`, 'i');
                let regexSymbol = new RegExp(`\\b${symbol}\\b`, 'i');
                if(regexName.test(headline) || regexSymbol.test(headline)){
                    return symbol;
                }
            }
            return '';
        },
        onSelectHeadline(index) {
            this.activeHeadline = index;
            let symbol = this.headlines[index].symbol;
            this.$emit('symbol-from-headline', symbol);
        },
        connectTreeOfAlphaWS() {
            const TreeOfAlphaWS = new WebSocket('wss://news.treeofalpha.com/ws')   
            TreeOfAlphaWS.onmessage = (event) => {
                let data = JSON.parse(event.data)
                console.log(data)

                let type
                if (data.info && data.info.twitterId) {
                    type = 'twitter'
                    if (data.info.isQuote || data.info.isReply || data.info.isRetweet) {
                        // skip
                        return
                    }
                } else if (data.source) {
                    type = data.source
                } else  {
                    type = 'check console log'
                }

                let symbol
                if (data.coin) {
                    symbol = data.coin
                    if (!this.symbols[symbol]) {
                        console.log('symbol not in symbols list. Skipping')
                        return
                    }

                } else if(data.symbols && data.symbols.length > 0) {
                    symbol = data.symbols[0].split('_')[0]
                    if (!this.symbols[symbol]) {
                        console.log('symbol not in symbols list. Skipping')
                        return
                    }
                } else {
                    symbol = this.findSymbolInHeadline(data.body ? data.body : data.title);
                }
                 
                if (symbol == '')
                {
                    console.log('no symbol found. Skipping')
                    return
                }

                let ticker = symbol + this.quoteAsset
                this.headlines.unshift({
                    title: data.title,
                    body: data.body ? data.body : data.title,
                    type: type,
                    time: new Date(data.time),
                    symbol: symbol,
                    ticker: ticker,
                    price: this.livePriceFeed[ticker] ? this.livePriceFeed[ticker] : 0
                })

                this.activeHeadline = 0;
                this.notification_sound.play()
                this.$emit('symbol-from-headline', symbol);
            }
        },
        onDoubleClick(index) {
            this.expand = !this.expand;
            this.activeHeadline = index;
        },
        getPriceChange(index) {
            let priceAtNews = this.headlines[index].price
            let priceNow = this.livePriceFeed[this.headlines[index].ticker]
            return (priceNow - priceAtNews) / priceAtNews * 100
        }
    },
    mounted() {
        console.log("NewsFeed mounted")
        this.connectTreeOfAlphaWS();
    } 
}
</script>

<template>
    <div class="card bg-dark text-white border-secondary">
        <div class="card-header h4 border-secondary">
            News Feed
            <button type="button" class="btn btn-outline-secondary btn-sm float-right"><i class="bi bi-gear"></i></button>
        </div>
        <ul class="list-group list-group-flush scrolled">
            <NewsItem v-for="(headline, index) in headlines" 
                :key="index" 
                :headline="headline"
                :selected="activeHeadline === index"
                :expand="expand"
                :priceChange="getPriceChange(index)"
                @click="onSelectHeadline(index)"
                @dblclick="onDoubleClick(index)" />
        </ul>
    </div>
</template>

<style scoped>
.scrolled {
    overflow-y: auto;
    height: 350px;
}
</style>