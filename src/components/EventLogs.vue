<script setup>
import Log from './Log.vue'
import api from '../api'
</script>

<template>
    <div style="text-align:left">
        <div class="h4">
            Event Logs
        </div>
        <ul class="list-group list-group-flush">
            <Log v-for="(log, index) in logs" :key="index" :time="log.time" :text="log.text" />
        </ul>
    </div>
</template>

<script>
export default {
    data() {
        return {
            logs: api.getEventLogs()
        };
    },
    components: { Log }
}
</script>