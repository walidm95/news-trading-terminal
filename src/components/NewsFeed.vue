<script>
import NewsItem from './NewsItem.vue';

export default {
    data() {
        return {
            headlines: [],
            activeHeadline: 0
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
            let symbol = this.findSymbolInHeadline(this.headlines[index].body);
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
                    time: new Date(data.time)
                })
            }
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
        </div>
        <ul class="list-group list-group-flush scrolled">
            <NewsItem v-for="(headline, index) in headlines" 
                :key="index" :datetime="headline.time.toLocaleString('en-US', {timeZoneName: 'short'})" 
                :headline="headline.body" 
                :selected="activeHeadline === index" 
                @click="onSelectHeadline(index)"/>
        </ul>
    </div>
</template>

<style scoped>
.scrolled {
    overflow-y: auto;
    height: 350px;
}
</style>