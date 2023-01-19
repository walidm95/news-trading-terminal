<script setup>
import NewsFeed from './components/NewsFeed.vue'
import TradingPanel from './components/TradingPanel.vue';
</script>

<template>
  <div class="page-title">
    <h1>News Trading Terminal</h1>
  </div>
  <div class="container">
    <div class="row">
      <div class="col">
        <NewsFeed />
      </div>
      <div class="col">
        <TradingPanel />
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-title {
  margin-top: 20px;
  margin-bottom: 20px;
  text-align: center;
}
</style>
