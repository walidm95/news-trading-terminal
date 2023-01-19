<script setup>
import Log from './Log.vue'
</script>

<template>
    <div style="text-align:left">
        <div class="h4">
            Event Logs
        </div>
        <div class="" >
            <Log 
                time="15:02:43"
                text="This is a text"
            />
            <Log 
                time="15:02:42"
                text="This is a text"
            />
            <Log 
                time="15:02:41"
                text="This is a text"
            />
        </div>
    </div>
</template>