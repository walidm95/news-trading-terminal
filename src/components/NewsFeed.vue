<script>
import NewsItem from './NewsItem.vue';

export default {
    data() {
        return {
            notification_sound: new Audio('/new_headline.mp3'),
            headlines: [],
            activeHeadline: 0,
            expand: false,
            showTwitter: true,
            showBlogs: true,
            websocketUsername: '',
            websocketApiKey: '',
            websocketInstance: null,
            websocketTimeout: null,
            websocketAlive: false,
            websocketPingTimeout: 60000,
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
        onWebsocketConnected(username) {
            this.websocketUsername = username;
            console.log('Websocket connected as ' + username)
        },
        connectTreeOfAlphaWS(api) {
            this.websocketInstance = new WebSocket('wss://news.treeofalpha.com/ws')
            this.websocketInstance.onopen = () => {
                console.log('TreeOfAlphaWS connected')
                this.websocketAlive = true
                this.websocketTimeout = setTimeout(this.pingWebsocket, this.websocketPingTimeout)
                if(api) {
                    this.websocketInstance.send(`login ${api}`)
                }
            }
            this.websocketInstance.onmessage = (event) => {
                if (event.data == 'pong') {
                    this.websocketAlive = true
                    clearTimeout(this.websocketTimeout)
                    this.websocketTimeout = setTimeout(this.pingWebsocket, this.websocketPingTimeout)
                    return
                }

                let data = JSON.parse(event.data)
                console.log(data)
                /*if (data.user) {
                    this.onWebsocketConnected(data.user.username)
                    return
                }*/

                let type
                let link
                if (data.info && data.info.twitterId) {
                    type = 'twitter'
                    if (data.info.isQuote || data.info.isReply /*|| data.info.isRetweet*/) {
                        // skip
                        return
                    }
                } else if (data.source) {
                    type = data.source
                } else  {
                    type = 'check console log'
                }
                
                link = data.link ? data.link : data.url ? data.url : undefined

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
                    link: link,
                    price: this.livePriceFeed[ticker] ? this.livePriceFeed[ticker] : 0,
                    btcPrice: this.livePriceFeed['BTC' + this.quoteAsset] ? this.livePriceFeed['BTC' + this.quoteAsset] : 0
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
        },
        getBtcPriceChange(index) {
            let priceAtNews = this.headlines[index].btcPrice
            let priceNow = this.livePriceFeed['BTC' + this.quoteAsset]
            return (priceNow - priceAtNews) / priceAtNews * 100
        },
        onConnectWebsocket(event) {
            let input = event.target.parentElement.parentElement.getElementsByTagName('input')
            let api = input[0].value
            if (api == '') {
                return
            }
            localStorage.setItem('treeOfAlphaApi', api)
            this.connectTreeOfAlphaWS(api);
        },
        pingWebsocket() {
            if (this.websocketInstance && this.websocketAlive) {
                this.websocketAlive = false
                this.websocketInstance.send('ping')
            } else if(this.websockInstance && !this.websocketAlive) {
                this.websocketInstance.close()
                clearTimeout(this.websocketTimeout)
                this.connectTreeOfAlphaWS('') //TODO: use api if we need to
            }
        }
    },
    mounted() {
        console.log("NewsFeed mounted")
        //this.websocketApiKey = localStorage.getItem('treeOfAlphaApi') ? localStorage.getItem('treeOfAlphaApi') : ''

        // Note: when tree of alpha becomes a paid subscripion, use api method, else connect without api
        this.connectTreeOfAlphaWS('');
    },
    beforeUnmount() {
        console.log("NewsFeed beforeUnmount")
        if(this.websocketTimeout) {
            this.websocketInstance.close()
            clearTimeout(this.websocketTimeout)
        }
    }
}
</script>

<template>
    <div class="card bg-dark text-white border-secondary">
        <div class="card-header h4 border-secondary">
            <div class="row">
                <div class="col">
                    News Feed
                </div>
                <div class="col">
                    <span v-if="websocketAlive" class="badge bg-success float-right">Connected</span>
                    <span v-else class="badge bg-danger float-right">Disconnected</span>
                    <!--span v-if="websocketConnected" class="badge bg-success float-right">{{ websocketUsername }}</span>
                    <div v-else class="input-group input-group-sm">
                        <div class="input-group-prepend">
                            <span class="input-group-text" id="inputGroup-sizing-sm">Websocket API Key</span>
                        </div>
                        <input type="text" class="form-control" aria-label="Small" aria-describedby="inputGroup-sizing-sm" :value="websocketApiKey">
                        <div class="input-group-append">
                            <button class="btn btn-outline-light" type="button" @click="onConnectWebsocket($event)">Connect</button>
                        </div>
                    </div-->
                </div>
            </div>            
        </div>
        <ul class="list-group list-group-flush scrolled">
            <NewsItem v-for="(headline, index) in headlines"
                :key="index" 
                :headline="headline"
                :selected="activeHeadline === index"
                :expand="expand"
                :priceChange="getPriceChange(index)"
                :btcPriceChange="getBtcPriceChange(index)"
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