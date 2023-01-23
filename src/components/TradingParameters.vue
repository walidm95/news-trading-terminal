<script setup>

</script>

<template>
    <div class="container">
        <div class="row">
            <div class="col-6">
                <div class="input-group mb-3">
                    <div class="input-group-prepend">
                        <span class="input-group-text">Trading Size</span>
                        <span class="input-group-text">$</span>
                    </div>  
                    <input type="number" class="form-control" id="max-trading-size">
                </div>
            </div>
            <div class="col-4">
                <div class="input-group mb-3">
                    <div class="input-group-prepend">
                        <div class="input-group-text">
                        <input type="checkbox" aria-label="lock-trading">
                        </div>
                    </div>
                    <span class="input-group-text">Lock Trading</span>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <div class="input-group mb-3">
                    <div class="input-group-prepend">
                        <span class="input-group-text">Stop Loss</span>
                    </div>  
                    <input type="number" class="form-control" aria-label="stop-loss-pct">
                    <div class="input-group-append">
                        <span class="input-group-text">%</span>
                    </div>
                </div>
            </div>
            <div class="col">
                <div class="input-group mb-3">
                    <div class="input-group-prepend">
                        <span class="input-group-text">Take Profit</span>
                    </div>  
                    <input type="number" class="form-control" aria-label="take-profit-pct">
                    <div class="input-group-append">
                        <span class="input-group-text">%</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <div class="input-group mb-3">
                    <div class="input-group-prepend">
                        <span class="input-group-text">Trading Symbol</span>
                    </div>  
                    <input type="text" class="form-control" aria-label="trading-symbol">
                </div>
            </div>
            <div class="col">
                <div class="input-group mb-3">
                    <div class="input-group-prepend">
                        <div class="input-group-text">
                        <input type="checkbox" aria-label="Checkbox for following text input">
                        </div>
                    </div>
                    <span class="input-group-text">Lock Symbol</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
</style>