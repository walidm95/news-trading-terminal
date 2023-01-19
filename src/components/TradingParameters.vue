<script setup>

</script>

<template>
    <div class="container">
        <div class="row">
            <div class="col">
                <label for="trading-size">Trading Size</label>
                <div class="input-group mb-1">
                    <input type="number" class="form-control" id="trading-size">
                    <div class="input-group-append">
                        <span class="input-group-text">$</span>
                    </div>
                </div>
            </div>
            <div class="col">
                <label for="use-stop-loss">Stop Loss</label>
                <div class="input-group">
                    <input type="number" class="form-control" id="stop-loss-pct">
                    <div class="input-group-append">
                        <span class="input-group-text">%</span>
                    </div>
                </div>
            </div>
            <div class="col">
                <label for="use-take-profit">Take Profit</label>
                <div class="input-group">
                    <input type="number" class="form-control" id="take-profit-pct">
                    <div class="input-group-append">
                        <span class="input-group-text">%</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <label for="symbol">Symbol</label>
                <div class="input-group">
                    <input type="text" class="form-control" id="symbol" :disabled="symbolLocked">
                </div>
            </div>
            <div class="col d-flex align-items-center justify-content-center">
                <input type="checkbox" class="custom-control-input" id="lock-symbol" v-model="symbolLocked">
                <label class="custom-control-label" for="lock-symbol">&nbsp;&nbsp;Lock Symbol</label>                
            </div>
            <div class="col d-flex align-items-center justify-content-center">
                <input type="checkbox" class="custom-control-input" id="lock-trading">
                <label for="lock-trading">&nbsp;&nbsp;Lock Trading</label>
            </div>
        </div>
    </div>
</template>

<style scoped>
</style>