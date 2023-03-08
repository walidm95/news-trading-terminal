<template>
    <div>
        <h6 v-if="maxLevAndNotional">Max position if max leverage ({{ maxLevAndNotional[0] }}x) = {{formatNumber(maxLevAndNotional[1])}}</h6>
        <div>
            <button type="button" class="btn btn-success btn-lg m-1 trading-buttons" @click="$emit('buy-button-clicked', $event)">{{ formatNumber(0.25 * maxTradingSize) }}</button>
            <button type="button" class="btn btn-success btn-lg m-1 trading-buttons" @click="$emit('buy-button-clicked', $event)">{{ formatNumber(0.5 * maxTradingSize) }}</button>
            <button type="button" class="btn btn-success btn-lg m-1 trading-buttons" @click="$emit('buy-button-clicked', $event)">{{ formatNumber(maxTradingSize) }}</button>
        </div>
        <div>
            <button type="button" class="btn btn-danger btn-lg m-1 trading-buttons" @click="$emit('sell-button-clicked', $event)">{{ formatNumber(0.25 * maxTradingSize) }}</button>
            <button type="button" class="btn btn-danger btn-lg m-1 trading-buttons" @click="$emit('sell-button-clicked', $event)">{{ formatNumber(0.5 * maxTradingSize) }}</button>
            <button type="button" class="btn btn-danger btn-lg m-1 trading-buttons" @click="$emit('sell-button-clicked', $event)">{{ formatNumber(maxTradingSize) }}</button>
        </div>
        <h6 v-if="clickedByTradersNbr > 0">News traded by {{ clickedByTradersNbr }} traders</h6>
    </div>
</template>

<script>
var formatter = new Intl.NumberFormat("en-US", {
    style:"currency",
    currency: "USD",
    notation: "compact"
});

export default {
    props: {
        maxTradingSize: {type: Number, required: true},
        maxLevAndNotional: {type: Object, required: true},
        clickedByTradersNbr: {type: Number, required: true}
    },
    methods: {
        formatNumber(number) {
            return formatter.format(number);
        }
    }
}

</script>

<style scoped>
.trading-buttons {
    width: 30%;
}
</style>