<script>
import NewsItem from './NewsItem.vue';

export default {
    data() {
        return {
            headlines: [],
            activeHeadline: 0,
            expand: false,
            showTwitter: true,
            showBlogs: true
        }
    },
    props : {
        symbols: {type: Object, required: true}
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
                } else if(data.symbols) {
                    symbol = data.symbols[0].split('_')[0]
                } else {
                    symbol = this.findSymbolInHeadline(data.body ? data.body : data.title);
                }
                 
                if (symbol == '')
                {
                    console.log('no symbol found. Skipping')
                    return
                }

                this.headlines.unshift({
                    title: data.title,
                    body: data.body ? data.body : data.title,
                    type: type,
                    time: new Date(data.time),
                    symbol: symbol
                })
                this.activeHeadline = 0;
                this.$emit('symbol-from-headline', symbol);
            }
        },
        onDoubleClick(index) {
            this.expand = !this.expand;
            this.activeHeadline = index;
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
                :datetime="headline.time.toLocaleString('en-US', {timeZoneName: 'short'})" 
                :type="headline.type" 
                :title="headline.title"
                :headline="headline.body"
                :selected="activeHeadline === index"
                :expand="expand"
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