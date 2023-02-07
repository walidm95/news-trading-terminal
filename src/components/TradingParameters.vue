<script>
export default {
    props: {
        maxTradingSize: {type: Number, required: true},
        stopLossPct: {type: Number, required: true},
        takeProfitPct: {type: Number, required: true},
        tradingSymbol: {type: String, required: true},
        quoteAsset: {type: String, required: true},
        lockSymbol: {type: Boolean, required: true}
    }
}
</script>

<template>
    <div class="container">
        <div class="row">
            <div class="col input-group mb-2">
                <div class="input-group-prepend">
                    <label class="input-group-text" for="maxTradingSizd">Max Size</label>
                </div>
                <input type="number" class="form-control" id="maxTradingSize" placeholder="Max Trading Size" 
                    :value="maxTradingSize"
                    @focusout="$emit('trading-size-changed', $event)"/>
                <div class="input-group-append">
                    <span class="input-group-text">$</span>
                </div>
            </div>
            <div class="col input-group mb-2">
                <div class="input-group-prepend">
                    <label class="input-group-text" for="executionMode">Mode</label>
                </div>
                <select class="custom-select" id="executionMode">
                    <option value="1" selected>Market In</option>
                    <option value="2">Market In + Scale TP</option>
                </select>
            </div>
        </div>
        <div class="row">
            <div class="col input-group mb-2">
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
            <div class="col input-group mb-2">
                <div class="input-group-prepend">
                    <label class="input-group-text" for="quoteAsset">Quote Asset</label>
                </div>
                <select class="custom-select" id="quoteAsset" :disabled="lockSymbol" :value="quoteAsset" @change="$emit('quote-asset-changed', $event)">
                    <option value="USDT">USDT</option>
                    <option value="BUSD">BUSD</option>
                </select>
            </div>
        </div>
        <div class="row">
            <div class="col input-group mb-2">
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
            <div class="col input-group mb-2">
                <div class="input-group-prepend">
                    <label class="input-group-text" for="tradingSymbol">Symbol</label>
                </div>
                <input type="text" class="form-control" id="tradingSymbol" placeholder="Trading Symbol" :disabled="lockSymbol"
                    :value="tradingSymbol"
                    @focusout="$emit('trading-symbol-changed', $event)" />
                <div class="input-group-append">
                    <button class="btn btn-outline-info" type="button" id="lockSymbolBtn" v-if="!lockSymbol" @click="$emit('lock-symbol-toggled')">Lock</button>
                    <button class="btn btn-outline-info" type="button" id="unlockSymbolBtn" v-if="lockSymbol" @click="$emit('lock-symbol-toggled')">Unlock</button>
                </div>
            </div>
            
        </div>
        
    </div>
</template>