<script setup>
import TradingParameters from './TradingParameters.vue';
import TradingButtons from './TradingButtons.vue';
</script>

<script>
import binance from '../binance'

let tradingParams = JSON.parse(localStorage.getItem('tradingParams')) || {};

export default {
    data() {
        return {
            maxTradingSize: tradingParams.maxTradingSize ? tradingParams.maxTradingSize : null,
            stopLossPct: tradingParams.stopLossPct ? tradingParams.stopLossPct : null,
            takeProfitPct: tradingParams.takeProfitPct ? tradingParams.takeProfitPct : null,
            lockSymbol: false,
        }
    },
    props: {
        tradingSymbol: {type: String, required: true},
        quoteAsset: {type: String, required: true },
        apiKeys: {type: Array, required: true},
        livePriceFeed: {type: Object, required: true},
        precisionFormat: {type: Object, required: true}
    },
    methods: {
        onTradingSizeChanged(event) {
            this.maxTradingSize = Number(event.target.value);
            let tradingParams = JSON.parse(localStorage.getItem('tradingParams')) || {};
            tradingParams.maxTradingSize = this.maxTradingSize;
            localStorage.setItem('tradingParams', JSON.stringify(tradingParams));
        },
        onStopLossChanged(event) {
            this.stopLossPct = Number(event.target.value);
            let tradingParams = JSON.parse(localStorage.getItem('tradingParams')) || {};
            tradingParams.stopLossPct = this.stopLossPct;
            localStorage.setItem('tradingParams', JSON.stringify(tradingParams));
        },
        onTakeProfitChanged(event) {
            this.takeProfitPct = Number(event.target.value);
            let tradingParams = JSON.parse(localStorage.getItem('tradingParams')) || {};
            tradingParams.takeProfitPct = this.takeProfitPct;
            localStorage.setItem('tradingParams', JSON.stringify(tradingParams));
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
        formatQuantityPrecision(quantity) {
            let precision = this.precisionFormat.quantity[this.tradingSymbol + this.quoteAsset];
            return quantity.toFixed(precision);
        },
        executeOrder(side, sizeText) {
            if(this.apiKeys.length == 0) {
                alert('API Keys are required to trade');
                return;
            }

            for(let apiKey of this.apiKeys)
            {
                // Execute order
                sizeText = sizeText.replace('$','');
                let multiplier = sizeText.endsWith('K') ? 1000 : sizeText.endsWith('M') ? 1000000 : 1;
                let dollarSize = Number(sizeText.replace('K','').replace('M','')) * multiplier;
                let latestPrice = this.livePriceFeed[this.tradingSymbol + this.quoteAsset]

                // Execute Binance order
                let formattedQuantity = this.formatQuantityPrecision(dollarSize / latestPrice);
                let ticker = this.tradingSymbol + this.quoteAsset;
                let formattedPrice = latestPrice.toFixed(this.precisionFormat.price[ticker]);
                let orderPromise = binance.executeMarketOrder(apiKey.key, apiKey.secret, ticker, side, formattedQuantity);

                // Stop loss and take profit
                let stopLossPrice = side == 'BUY' ? latestPrice * (1 - this.stopLossPct / 100) : latestPrice * (1 + this.stopLossPct / 100);
                let takeProfitPrice = side == 'BUY' ? latestPrice * (1 + this.takeProfitPct / 100) : latestPrice * (1 - this.takeProfitPct / 100);
                let stopLossPromise = binance.executeStopLossOrder(apiKey.key, apiKey.secret, ticker, side == 'BUY' ? 'SELL' : 'BUY', formattedQuantity, stopLossPrice.toFixed(this.precisionFormat.price[ticker]));
                let takeProfitPromise = binance.executeTakeProfitOrder(apiKey.key, apiKey.secret, ticker, side == 'BUY' ? 'SELL' : 'BUY', formattedQuantity, takeProfitPrice.toFixed(this.precisionFormat.price[ticker]));
                
                orderPromise.then(response => response.json())
                .then(data => {
                    if (data.code) {
                        alert(data.msg);
                    } else {
                        this.$emit('position-opened', {
                            account: apiKey.name,
                            ticker: this.tradingSymbol + this.quoteAsset,
                            size: dollarSize,
                            side: side,
                            entryPrice: latestPrice,
                            markPrice: latestPrice,
                            upnl: 0,
                            units: Number(data.origQty),
                        })
                    }
                });

                stopLossPromise.then(response => response.json())
                .then(data => {
                    if (data.code) {
                        alert(data.msg);
                    } else {
                        console.log('Stop loss order placed')
                        let orderIds = JSON.parse(localStorage.getItem('openOrders')) || [];
                        orderIds.push({accountName: apiKey.name, ticker: this.tradingSymbol + this.quoteAsset, orderId: data.orderId});
                        localStorage.setItem('openOrders', JSON.stringify(orderIds));
                    }
                });

                takeProfitPromise.then(response => response.json())
                .then(data => {
                    if (data.code) {
                        alert(data.msg);
                    } else {
                        console.log('Take profit order placed')
                        let orderIds = JSON.parse(localStorage.getItem('openOrders')) || [];
                        orderIds.push({accountName: apiKey.name, ticker: this.tradingSymbol + this.quoteAsset, orderId: data.orderId});
                        localStorage.setItem('openOrders', JSON.stringify(orderIds));
                    }
                });
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