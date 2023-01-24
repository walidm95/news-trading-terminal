<script setup>
import Log from './Log.vue'
</script>

<script>
export default {
    props: {
        logs: {type: Array, required: true}
    },
    components: { Log }
}
</script>

<template>
    <div class="card">
        <div class="card-header h3">
              Event Logs
        </div>
        <ul class="list-group list-group-flush scrolled mt-1">
            <Log v-for="(log, index) in logs" :key="index" :time="log.time" :text="log.text" />
        </ul>
    </div>
</template>

<style scoped>
.scrolled {
    overflow-y: scroll;
    height: 160px;
}
</style>