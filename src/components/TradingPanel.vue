<script setup>
import TradingParameters from './TradingParameters.vue';
import TradingButtons from './TradingButtons.vue';
</script>

<script>
export default {
    props: {
        maxTradingSize: {type: Number, required: true},
        stopLossPct: {type: Number, required: true},
        takeProfitPct: {type: Number, required: true},
        tradingSymbol: {type: String, required: true},
        quoteAsset: {type: String, required: true }
    }
}
</script>

<template>
    <div class="card mb-2">
        <div class="card-header h3">
            Trading Panel
        </div>
        <ul class="list-group list-group-flush">
            <li class="list-group-item">
                <TradingParameters 
                    :maxTradingSize="maxTradingSize" 
                    :stopLossPct="stopLossPct"
                    :takeProfitPct="takeProfitPct"
                    :tradingSymbol="tradingSymbol"
                    :quoteAsset="quoteAsset"
                    @trading-size-changed="$emit('trading-size-changed', $event)"
                    @stop-loss-changed="$emit('stop-loss-changed', $event)"
                    @take-profit-changed="$emit('take-profit-changed', $event)"
                    @trading-symbol-changed="$emit('trading-symbol-changed', $event)"
                    @quote-asset-changed="$emit('quote-asset-changed', $event.target.innerText)"/>
            </li>
            <li class="list-group-item text-center">
                <TradingButtons 
                    @buy-button-clicked="$emit('buy-button-clicked', $event.target.textContent)" 
                    @sell-button-clicked="$emit('sell-button-clicked', $event.target.textContent)"/>
            </li>
        </ul>
    </div>
</template>