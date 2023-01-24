<script setup>
defineProps({
    time: String,
    text: String
})
</script>

<template>
    <h6>&nbsp; {{ time }} &nbsp; {{ text }}</h6>
</template>