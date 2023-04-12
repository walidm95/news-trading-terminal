<template>
  <v-card>
    <Chart
      class="pb-1 pt-1 pl-1 pr-1"
      :options="{
        autosize: true,
        interval: '1',
        symbol: `BINANCE:${ticker}`,
        timezone: getLocaleTimezone(),
        theme: 'dark',
        hide_top_toolbar: true,
        hide_legend: false,
      }"
      style="height: 100%"
    />
  </v-card>
</template>

<script>
import { Chart } from "vue-tradingview-widgets";

export default {
  props: {
    ticker: { type: String, required: true },
  },
  components: { Chart },
  methods: {
    getLocaleTimezone() {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    },
  },
};
</script>
