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
                    <label class="input-group-text" for="stopLossPct">Stop Loss</label>
                </div>
                <input type="number" class="form-control" id="stopLossPct" placeholder="Stop Loss %"
                    :value="stopLossPct"
                    @focusout="$emit('stop-loss-changed', $event)" />
                <div class="input-group-append">
                    <span class="input-group-text">%</span>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col input-group">
                <label class="btn btn-light" @click="$emit('lock-symbol-checked', $event)">
                    <input type="checkbox" id="lockSymbol" autocomplete="off" :checked="lockSymbol"> &nbsp; Lock Symbol
                </label>
            </div>
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
        </div>
        <div class="row">
            <div class="col input-group mb-2">
                <div class="input-group-prepend">
                    <label class="input-group-text" for="tradingSymbol">Symbol</label>
                </div>
                <input type="text" class="form-control" id="tradingSymbol" placeholder="Trading Symbol" :disabled="lockSymbol"
                    :value="tradingSymbol"
                    @focusout="$emit('trading-symbol-changed', $event)" />
            </div>
            <div class="col input-group mb-2">
                <div class="btn-group btn-group-toggle" data-toggle="buttons">
                    <label class="btn btn-info" :class="{active: this.quoteAsset === 'USDT'}" @click="$emit('quote-asset-changed', $event)">
                        <input type="radio" name="quotes" id="quoteUSDT" autocomplete="off"> USDT
                    </label>
                    <label class="btn btn-info" :class="{active: this.quoteAsset === 'BUSD'}" @click="$emit('quote-asset-changed', $event)">
                        <input type="radio" name="quotes" id="quoteBUSD" autocomplete="off"> BUSD
                    </label>
                </div>
            </div>
        </div>
        
    </div>
</template>