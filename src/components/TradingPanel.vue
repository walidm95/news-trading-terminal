<script setup>
import TradingParameters from './TradingParameters.vue';
import TradingButtons from './TradingButtons.vue';
import EventLogs from './EventLogs.vue';
</script>

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
    <div class="card">
        <div class="card-header h2">
            Trading Panel
        </div>
        <ul class="list-group list-group-flush">
            <li class="list-group-item">
                <TradingParameters />
            </li>
            <li class="list-group-item text-center">
                <TradingButtons />
            </li>
            <li class="list-group-item">
                <EventLogs />
            </li>
        </ul>
    </div>
</template>