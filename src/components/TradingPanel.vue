<script setup>
import TradingParameters from './TradingParameters.vue';
import TradingButtons from './TradingButtons.vue';
import EventLogs from './EventLogs.vue';
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
            <li class="list-group-item">
                <TradingButtons />
            </li>
            <li class="list-group-item">
                <EventLogs />
            </li>
        </ul>
    </div>
</template>