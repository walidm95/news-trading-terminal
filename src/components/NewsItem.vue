<script>
export default {
  props: {
    symbol: { type: String, required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    link: { type: String, required: true },
    timestamp: { type: String, required: true },
    selected: { type: Boolean, required: true },
    priceChange: { type: Number, required: true },
    btcPriceChange: { type: Number, required: true },
    nbrOfTrades: { type: Number, required: true },
  },
};
</script>

<template>
  <v-list-item :active="selected" :ripple="false">
    <h4 class="text-info" v-show="type == 'twitter'"><v-icon icon="mdi-twitter" size="small" />{{ title }}&nbsp;</h4>
    <h4 :class="!selected ? 'text-truncate' : ''"><span v-html="body"></span><a class="float-right pl-2" :href="link" target="_blank">Link</a></h4>
    <small class="float-left text-grey">
      <v-icon icon="mdi-clock-outline" size="x-small" /> {{ timestamp.toLocaleString("en-US", { timeZoneName: "short" }) }}
    </small>
    <small class="float-right pl-2 font-weight-bold"
      >BTC&nbsp; <span :class="btcPriceChange > 0 ? 'text-green' : 'text-red'">{{ btcPriceChange.toFixed(2) }}%</span>&nbsp;&nbsp;{{ symbol }}&nbsp;
      <span :class="priceChange > 0 ? 'text-green' : 'text-red'">{{ priceChange.toFixed(2) }}%</span>
    </small>
    <span v-if="nbrOfTrades > 0" class="float-right text-yellow text-caption align-center justify-center">
      <v-icon icon="mdi-account" size="small"></v-icon>{{ nbrOfTrades }}
    </span>
  </v-list-item>
</template>
