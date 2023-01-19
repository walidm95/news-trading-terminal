<script setup>
defineProps({
    time: String,
    text: String
})
</script>

<template>
    <h6>[{{ time }}] {{ text }}</h6>
</template>