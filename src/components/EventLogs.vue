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
    <div class="card bg-dark text-white border-secondary">
        <div class="card-header h3 border-secondary">
              Event Logs
        </div>
        <ul class="list-group list-group-flush scrolled p-1 bg-dark text-white border-secondary">
            <Log v-for="(log, index) in logs" :key="index" :time="log.time" :text="log.text"/>
        </ul>
    </div>
</template>

<style scoped>
.scrolled {
    overflow-y: scroll;
    height: 20vh;
}
</style>