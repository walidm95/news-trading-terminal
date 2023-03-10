<script>
export default {
  props: {
    headline: {type: Object, required: true},
    selected: {type: Boolean, required: true},
    expand: {type: Boolean, required: true},
    priceChange: {type: Number, required: true},
    btcPriceChange: {type: Number, required: true}
  }
}
</script>

<template>
    <li class="list-group-item" :class="{'bg-dark': !selected, 'bg-white': selected, 'text-white': !selected, 'text-dark': selected}">
        <div>
          <h6 class="card-text" :class="{'truncate': !expand && headline.body && headline.body.length > 500}"><span :class="{'text-info': !selected, 'text-primary': selected}" v-show="headline.type == 'twitter'"><i class="bi bi-twitter"></i> {{ headline.title }}: </span>{{ headline.body }}&nbsp;<a class="float-right" v-show="headline.link" :href="headline.link" target="_blank">Link</a></h6>
          <small class="d-inline" :class="{'text-muted': !selected, 'text-dark': selected}"><i class="bi bi-clock"></i> {{ headline.time.toLocaleString('en-US', {timeZoneName: 'short'}) }}</small>
          <small class="float-right font-weight-bold d-inline">{{ headline.symbol }} <span :class="priceChange> 0 ? 'text-success' : 'text-danger'">{{ priceChange.toFixed(2) }}%</span></small>
          <small class="float-right font-weight-bold d-inline">BTC <span :class="btcPriceChange> 0 ? 'text-success' : 'text-danger'">{{ btcPriceChange.toFixed(2) }}% &nbsp;</span></small>
        </div>
      </li>
</template>

<style scoped>
.truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
</style>
