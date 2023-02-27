<script>
import { ExecutionMode } from '../constants'

export default {
    data() {
        return {
            ExecutionMode: ExecutionMode
        }
    },
    props: {
        maxTradingSize: {type: Number, required: true},
        stopLossPct: {type: Number, required: true},
        takeProfitPct: {type: Number, required: true},
        tradingSymbol: {type: String, required: true},
        quoteAsset: {type: String, required: true},
        lockSymbol: {type: Boolean, required: true},
        executionMode: {type: String, required: true},
        orderSplit: {type: Number, required: true},
        startScalePct: {type: Number, required: true}
    }
}
</script>

<template>
    <div class="container">
        <div class="row">
            <div class="col input-group input-group-sm mb-2">
                <div class="input-group-prepend">
                    <label class="input-group-text" for="maxTradingSizd">Size</label>
                </div>
                <input type="number" class="form-control" id="maxTradingSize" placeholder="Max Trading Size" 
                    :value="maxTradingSize"
                    @focusout="$emit('trading-size-changed', $event)"/>
                <div class="input-group-append">
                    <span class="input-group-text">$</span>
                </div>
            </div>
            <div class="col input-group input-group-sm mb-2">
                <div class="input-group-prepend">
                    <label class="input-group-text" for="executionMode">Exit Mode</label>
                </div>
                <select class="custom-select custom-select-sm" id="executionMode" @change="$emit('exit-mode-changed', $event)">
                    <option value="None" :selected="executionMode == 'None'">None</option>
                    <option v-for="(mode, key) in ExecutionMode" :key="key" :value="mode" :selected="executionMode == mode">
                        {{ mode }}
                    </option>
                </select>
            </div>
        </div>
        <div class="row">
            <div class="col input-group input-group-sm mb-2">
                <div class="input-group-prepend">
                    <label class="input-group-text" for="stopLossPct">Stop Loss</label>
                </div>
                <input type="number" class="form-control" id="stopLossPct" placeholder="Stop Loss"
                    :value="stopLossPct"
                    @focusout="$emit('stop-loss-changed', $event)" />
                <div class="input-group-append">
                    <span class="input-group-text">%</span>
                </div>
            </div>
            <div class="col input-group input-group-sm mb-2">
                <div class="input-group-prepend">
                    <label class="input-group-text" for="takeProfitPct">Take Profit</label>
                </div>
                <input type="number" class="form-control" id="takeProfitPct" placeholder="Take Profit"
                    :value="takeProfitPct"
                    :disabled="executionMode == 'None'"
                    @focusout="$emit('take-profit-changed', $event)" />
                <div class="input-group-append">
                    <span class="input-group-text">%</span>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col input-group input-group-sm mb-2">
                <div class="input-group-prepend">
                    <label class="input-group-text" for="quoteAsset">Base</label>
                </div>
                <select class="custom-select custom-select-sm" id="quoteAsset" :disabled="lockSymbol" :value="quoteAsset" @change="$emit('quote-asset-changed', $event)">
                    <option value="USDT">USDT</option>
                    <option value="BUSD">BUSD</option>
                </select>
            </div>
            <div class="col input-group input-group-sm mb-2">
                <div class="input-group-prepend">
                    <label class="input-group-text" for="orderSplit">Split</label>
                </div>
                <input type="number" class="form-control" id="orderSplit" placeholder="Order Split"
                    :value="orderSplit" :disabled="executionMode != ExecutionMode.SCALE"
                    @focusout="$emit('order-split-changed', $event)" />
                <div class="input-group-append">
                    <span class="input-group-text">orders</span>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col input-group input-group-sm mb-2">
                <div class="input-group-prepend">
                    <label class="input-group-text" for="tradingSymbol">Coin</label>
                </div>
                <input type="text" class="form-control" id="tradingSymbol" placeholder="Trading Symbol" :disabled="lockSymbol"
                    :value="tradingSymbol"
                    @focusout="$emit('trading-symbol-changed', $event)" />
                <div class="input-group-append">
                    <button class="btn btn-outline-info" type="button" id="lockSymbolBtn" v-if="!lockSymbol" @click="$emit('lock-symbol-toggled')"><i class="bi bi-unlock"></i></button>
                    <button class="btn btn-outline-info" type="button" id="unlockSymbolBtn" v-if="lockSymbol" @click="$emit('lock-symbol-toggled')"><i class="bi bi-lock"></i></button>
                </div>
            </div>
            <div class="col input-group input-group-sm mb-2">
                <div class="input-group-prepend">
                    <label class="input-group-text" for="startScale">Scale From</label>
                </div>
                <input type="input" class="form-control" id="startScale" placeholder="Scaling from"
                    :value="startScalePct" :disabled="executionMode != ExecutionMode.SCALE"
                    @focusout="$emit('start-scale-changed', $event)" />
                <div class="input-group-append">
                    <span class="input-group-text">%</span>
                </div>
            </div>
        </div>
    </div>
</template>