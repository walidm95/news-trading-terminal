<script>
import misc from "../misc";

export default {
  props: {
    amount: { type: String, required: true },
    side: { type: String, required: true },
  },
  methods: {
    formatNumber(number) {
      return misc.formatNumberToCurrency(number);
    },
  },
};
</script>

<template>
  <v-btn
    class="trading-buttons"
    rounded="lg"
    size="x-large"
    :color="side == 'BUY' ? 'green' : 'red'"
    @click="$emit('execute-trade', [amount, side])"
    >{{ formatNumber(amount) }}</v-btn
  >
</template>

<style scoped>
.trading-buttons {
  margin-left: 3px;
  margin-right: 3px;
  margin-top: 3px;
  margin-bottom: 3px;
  width: 30%;
}
</style>
