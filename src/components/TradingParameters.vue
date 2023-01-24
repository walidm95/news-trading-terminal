<script>
export default {
    props: {
        maxTradingSize: {type: Number, required: true},
        stopLossPct: {type: Number, required: true},
        takeProfitPct: {type: Number, required: true},
        tradingSymbol: {type: String, required: true}
    }
}
</script>

<template>
    <div class="container">
        <div class="input-group mb-2">
            <div class="input-group-prepend">
                <label class="input-group-text" for="maxTradingSizd">Trading Size</label>
            </div>
            <input type="number" class="form-control" id="maxTradingSize" placeholder="Max Trading Size" 
                :value="maxTradingSize"
                @focusout="$emit('trading-size-changed', $event)"/>
            <div class="input-group-append">
                <span class="input-group-text">$</span>
            </div>
        </div>
        <div class="input-group mb-2">
            <div class="input-group-prepend">
                <label class="input-group-text" for="stopLossPct">Stop Loss</label>
            </div>
            <input type="number" class="form-control" id="stopLossPct" placeholder="Stop Loss %"
                :value="stopLossPct"
                @focusout="$emit('stop-loss-changed', $event)" />
            <div class="input-group-append">
                <span class="input-group-text">%</span>
            </div>
        </div>
        <div class="input-group mb-2">
            <div class="input-group-prepend">
                <label class="input-group-text" for="takeProfitPct">Take Profit</label>
            </div>
            <input type="number" class="form-control" id="takeProfitPct" placeholder="Take Profit %"
                :value="takeProfitPct"
                @focusout="$emit('take-profit-changed', $event)" />
            <div class="input-group-append">
                <span class="input-group-text">%</span>
            </div>
        </div>
        <div class="input-group mb-2">
            <div class="input-group-prepend">
                <label class="input-group-text" for="tradingSymbol">Trading Symbol</label>
            </div>
            <input type="text" class="form-control" id="tradingSymbol" placeholder="Trading Symbol"
                :value="tradingSymbol"
                @focusout="$emit('trading-symbol-changed', $event)" />
        </div>
    </div>
</template>

<style scoped>
</style>