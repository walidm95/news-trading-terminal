<template>
    <div>
        <div>
            <button type="button" class="btn btn-success btn-lg m-1 trading-buttons" @click="$emit('buy-button-clicked', $event)">25%</button>
            <button type="button" class="btn btn-success btn-lg m-1 trading-buttons" @click="$emit('buy-button-clicked', $event)">50%</button>
            <button type="button" class="btn btn-success btn-lg m-1 trading-buttons" @click="$emit('buy-button-clicked', $event)">100%</button>
        </div>
        <div>
            <button type="button" class="btn btn-danger btn-lg m-1 trading-buttons" @click="$emit('sell-button-clicked', $event)">25%</button>
            <button type="button" class="btn btn-danger btn-lg m-1 trading-buttons" @click="$emit('sell-button-clicked', $event)">50%</button>
            <button type="button" class="btn btn-danger btn-lg m-1 trading-buttons" @click="$emit('sell-button-clicked', $event)">100%</button>
        </div>
    </div>
</template>

<style scoped>
.trading-buttons {
    width: 30%;
    height: 70px;
}
</style>