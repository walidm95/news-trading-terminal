<script setup>

defineProps({
  headline: String,
  time: String,
  symbol: String,
})
</script>

<template>
    <div style="text-align: left;">
        <div>
          <h6 class="card-subtitle mb-2 text-muted" style="text-align;: left">{{ time }}</h6>
          <h5 class="card-title">{{ headline }}</h5>
        </div>
    </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
