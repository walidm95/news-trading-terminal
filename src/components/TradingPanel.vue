<script setup>
import TradingParameters from './TradingParameters.vue';
import TradingButtons from './TradingButtons.vue';
</script>

<script>
import binance from '../binance'
import { ExecutionMode, ApiRoutes } from '../constants'

let tradingParams = JSON.parse(localStorage.getItem('tradingParams')) || {};

export default {
    data() {
        return {
            maxTradingSize: tradingParams.maxTradingSize ? tradingParams.maxTradingSize : null,
            stopLossPct: tradingParams.stopLossPct ? tradingParams.stopLossPct : null,
            takeProfitPct: tradingParams.takeProfitPct ? tradingParams.takeProfitPct : null,
            executionMode: tradingParams.executionMode ? tradingParams.executionMode : '',
            orderSplit: tradingParams.orderSplit ? tradingParams.orderSplit : null,
            startScalePct: tradingParams.startScalePct ? tradingParams.startScalePct : null,
            nttWs: null,
        }
    },
    props: {
        tradingSymbol: {type: String, required: true},
        quoteAsset: {type: String, required: true },
        apiKeys: {type: Array, required: true},
        livePriceFeed: {type: Object, required: true},
        pricePrecision: {type: Number, required: true},
        tickSize: {type: Number, required: true},
        quantityPrecision: {type: Number, required: true},
        lockSymbol: {type: Boolean, required: true},
        maxLevAndMaxNotional: {type: Object, required: true},
        cognitoIdToken: {type: Object, required: true}
    },
    methods: {
        onTradingSizeChanged(event) {
            //TODO: simplify these methods
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
        onExitModeChanged(event) {
            this.executionMode = event.target.value;
            let tradingParams = JSON.parse(localStorage.getItem('tradingParams')) || {};
            tradingParams.executionMode = this.executionMode;
            localStorage.setItem('tradingParams', JSON.stringify(tradingParams));
        },
        onOrderSplitChanged(event) {
            this.orderSplit = Number(event.target.value);
            let tradingParams = JSON.parse(localStorage.getItem('tradingParams')) || {};
            tradingParams.orderSplit = this.orderSplit;
            localStorage.setItem('tradingParams', JSON.stringify(tradingParams));
        },
        onStartScalePctChange(event) {
            this.startScalePct = Number(event.target.value);
            let tradingParams = JSON.parse(localStorage.getItem('tradingParams')) || {};
            tradingParams.startScalePct = this.startScalePct;
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
            return quantity.toFixed(this.quantityPrecision);
        },
        formatPricePrecision(price) {
            // Round based on tick size
            price -= price % this.tickSize;
            return price.toFixed(this.pricePrecision);
        },
        executeOrder(side, sizeText) {
            if(this.apiKeys.length == 0) {
                alert('API Keys are required to trade');
                return;
            }

            if(this.apiKeys.length > 1) {
                alert('Multiple API Keys are not supported yet');
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
                let orderPromise = binance.executeMarketOrder(apiKey.key, apiKey.secret, ticker, side, formattedQuantity);

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

                        // Take profit
                        let takeProfitPromise
                        let takeProfitPrice = side == 'BUY' ? latestPrice * (1 + this.takeProfitPct / 100) : latestPrice * (1 - this.takeProfitPct / 100)
                        takeProfitPrice = this.formatPricePrecision(takeProfitPrice)
                        if(this.executionMode == ExecutionMode.LIMIT) {
                            takeProfitPromise = binance.executeLimitOrder(apiKey.key, apiKey.secret, ticker, side == 'BUY' ? 'SELL' : 'BUY', formattedQuantity, takeProfitPrice, "true");
                        } else if (this.executionMode == ExecutionMode.SCALE) {
                            takeProfitPromise = this.executeScaleOutOrders(side == 'BUY' ? 'SELL' : 'BUY', dollarSize / latestPrice, this.orderSplit, takeProfitPrice, this.startScalePct);
                        }                

                        if(takeProfitPromise) {
                            takeProfitPromise.then(response => {
                                if(response.ok == undefined) {
                                    return response
                                } else if (response.ok) {
                                    return response.json()
                                } else {
                                    return response.text().then(text => Promise.reject(text))
                                }
                            })
                            .then(data => {
                                console.log('Take profit(s) orders placed')
                                
                                if (this.executionMode == ExecutionMode.LIMIT) {
                                    data = [data]
                                }

                                for(let order of data)
                                {
                                    if (data.code) {
                                        alert(data.msg);
                                        return
                                    }

                                    let orderIds = JSON.parse(localStorage.getItem('openOrders')) || [];
                                    orderIds.push({accountName: apiKey.name, ticker: order.symbol, orderId: order.orderId});
                                    localStorage.setItem('openOrders', JSON.stringify(orderIds));
                                }
                                
                            });
                        }
                    }
                });

                // Stop loss
                let stopLossPrice = side == 'BUY' ? latestPrice * (1 - this.stopLossPct / 100) : latestPrice * (1 + this.stopLossPct / 100)
                let stopLossPromise = binance.executeStopLossOrder(apiKey.key, apiKey.secret, ticker, side == 'BUY' ? 'SELL' : 'BUY', formattedQuantity, this.formatPricePrecision(stopLossPrice));

                stopLossPromise.then(response => response.json())
                .then(data => {
                    if (data.code) {
                        alert(data.msg);
                    } else {
                        console.log('Stop loss order placed')
                        let orderIds = JSON.parse(localStorage.getItem('openOrders')) || [];
                        orderIds.push({accountName: apiKey.name, ticker: data.symbol, orderId: data.orderId});
                        localStorage.setItem('openOrders', JSON.stringify(orderIds));
                    }
                });
            }
        },
        executeScaleOutOrders(side, quantity, nbrOfOrders, takeProfitPrice, startScalePct) {
            // Only linear scaling for now

            // Build list of orders
            let orders = []
            let latestPrice = this.livePriceFeed[this.tradingSymbol + this.quoteAsset];
            let startScalePrice = latestPrice * (1 + (side == 'SELL' ? 1 : -1) * startScalePct / 100);
            let priceIncrement = side == 'SELL' ? (takeProfitPrice - startScalePrice) / nbrOfOrders : (startScalePrice - takeProfitPrice) / nbrOfOrders;
            
            // Must respect the expected format of the Binance API
            for(let i = 1; i <= nbrOfOrders; i++) {
                let order = {
                    type: 'LIMIT',
                    timeInForce: 'GTC',
                    symbol: this.tradingSymbol + this.quoteAsset,
                    side: side,
                    quantity: this.formatQuantityPrecision(quantity / nbrOfOrders),
                    price: this.formatPricePrecision(startScalePrice + (side == 'SELL' ? 1 : -1) * priceIncrement * i),
                    reduceOnly: 'true'
                }
                orders.push(order);
            }

            // Execute orders
            if(orders.length > 5) {
                console.log('Executing ' + orders.length + ' orders in batches of 5')
                let promises = []
                for(let i = 0; i < orders.length; i+=5) {
                    if(i+5 > orders.length)
                        promises.push(binance.executeMultipleOrders(this.apiKeys[0].key, this.apiKeys[0].secret, orders.slice(i)));
                    else
                        promises.push(binance.executeMultipleOrders(this.apiKeys[0].key, this.apiKeys[0].secret, orders.slice(i, i+5)));
                }

                return Promise.allSettled(promises);
            } else {
                return binance.executeMultipleOrders(this.apiKeys[0].key, this.apiKeys[0].secret, orders);
            }
        },
        connectNttWs() {
            //Get websocket api key
            let headers = new Headers()
            headers.append('Authorization', this.cognitoIdToken.jwtToken)

            let url = ApiRoutes.GET_WS_API_KEY + `?user_id=${this.cognitoIdToken.payload['cognito:username']}`
            let requestOptions = new Request(url, {
                method: 'GET',
                headers: headers,
                redirect: 'follow'
            })

            fetch(requestOptions)
            .then(response => response.text())
            .then(result => {
                console.log(result)
                let wsUrl = ApiRoutes.CONNECT_WS + `?user_id=${this.cognitoIdToken.payload['cognito:username']}&api_key=${result}`
                this.nttWs = new WebSocket(wsUrl);
                this.nttWs.onopen = () => {
                    console.log('nttWs opened')
                }
                this.nttWs.onmessage = (event) => {
                    let data = JSON.parse(event.data);
                }
            })
            .catch(error => console.log('error', error))
        },
    },
    mounted() {
        console.log('TradingPanel mounted');
        this.connectNttWs()
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
                    :executionMode="executionMode"
                    :startScalePct="startScalePct"
                    :orderSplit="orderSplit"
                    @trading-size-changed="onTradingSizeChanged"
                    @stop-loss-changed="onStopLossChanged"
                    @take-profit-changed="onTakeProfitChanged"
                    @trading-symbol-changed="onSymbolChanged"
                    @quote-asset-changed="onQuoteAssetChanged"
                    @lock-symbol-toggled="$emit('lock-symbol-toggled')"
                    @start-scale-changed="onStartScalePctChange"
                    @order-split-changed="onOrderSplitChanged"
                    @exit-mode-changed="onExitModeChanged"/>
            </li>
            <li class="list-group-item text-center bg-dark text-white border-secondary">
                <TradingButtons 
                    :maxTradingSize="maxTradingSize"
                    :maxLevAndNotional="maxLevAndMaxNotional"
                    @buy-button-clicked="onBuyButtonClicked" 
                    @sell-button-clicked="onSellButtonClicked"/>
            </li>
        </ul>
    </div>
</template>