<script setup>
import TradingParameters from './TradingParameters.vue';
import TradingButtons from './TradingButtons.vue';
</script>

<script>
export default {
    data() {
        return {
            maxTradingSize: 1000,
            stopLossPct: 2,
            takeProfitPct: 2,
            lockSymbol: false,
        }
    },
    props: {
        tradingSymbol: {type: String, required: true},
        quoteAsset: {type: String, required: true },
        apiKeys: {type: Array, required: true},
        livePriceFeed: {type: Object, required: true}
    },
    methods: {
        onTradingSizeChanged(event) {
            this.maxTradingSize = Number(event.target.value);
        },
        onStopLossChanged(event) {
            this.stopLossPct = Number(event.target.value);
        },
        onTakeProfitChanged(event) {
            this.takeProfitPct = Number(event.target.value);
        },
        onSymbolChanged(symbol) {
            this.$emit('trading-symbol-changed', symbol);
        },
        onQuoteAssetChanged(event) {
            this.$emit('quote-asset-changed', event.target.value);
        },
        onBuyButtonClicked(event) {
            this.executeOrder('BUY', event.target.innerText);
        },
        onSellButtonClicked(event) {
            this.executeOrder('SELL', event.target.innerText);
        },
        executeOrder(side, sizeText) {
            if(this.apiKeys.length == 0) {
                alert('API Keys are required to trade');
                return;
            }

            let positions = []
            for(let apiKey of this.apiKeys)
            {
                // Execute order
                sizeText = sizeText.replace('$','');
                let multiplier = sizeText.endsWith('K') ? 1000 : sizeText.endsWith('M') ? 1000000 : 1;
                let dollarSize = Number(sizeText.replace('K','').replace('M','')) * multiplier;
                let latestPrice = this.livePriceFeed[this.tradingSymbol + this.quoteAsset]
                

                //TODO: Execute on Binance


                // Store postion if order was successful
                positions.unshift({
                    account: apiKey.name,
                    symbol: this.tradingSymbol,
                    size: dollarSize,
                    side: side,
                    entry: latestPrice,
                    upnl: 0
                })
            }

            if (positions.length > 0) {
                this.$emit('positions-opened', positions)
            }
        },
        onLockSymbolToggled() {
            this.lockSymbol = !this.lockSymbol;
        }
    },
    mounted() {
        console.log('TradingPanel mounted');
    }
}
</script>

<template>
    <div class="card bg-dark text-white border-secondary" style="height: 400px">
        <div class="card-header h4 border-secondary">
            Trading Panel
        </div>
        <ul class="list-group list-group-flush">
            <li class="list-group-item bg-dark text-white border-secondary">
                <TradingParameters 
                    :maxTradingSize="maxTradingSize" 
                    :stopLossPct="stopLossPct"
                    :takeProfitPct="takeProfitPct"
                    :tradingSymbol="tradingSymbol"
                    :quoteAsset="quoteAsset"
                    :lockSymbol="lockSymbol"
                    @trading-size-changed="onTradingSizeChanged"
                    @stop-loss-changed="onStopLossChanged"
                    @take-profit-changed="onTakeProfitChanged"
                    @trading-symbol-changed="onSymbolChanged"
                    @quote-asset-changed="onQuoteAssetChanged"
                    @lock-symbol-toggled="onLockSymbolToggled"/>
            </li>
            <li class="list-group-item text-center bg-dark text-white border-secondary">
                <TradingButtons 
                    :maxTradingSize="maxTradingSize"
                    @buy-button-clicked="onBuyButtonClicked" 
                    @sell-button-clicked="onSellButtonClicked"/>
            </li>
        </ul>
    </div>
</template>