<script>
export default {
  props: {
    title: {type: String, required: true},
    type: {type: String, required: true},
    headline: {type: String, required: true},
    datetime: {type: String, required: true},
    selected: {type: Boolean, required: true},
    expand: {type: Boolean, required: true},
    priceChange: {type: Number, required: true}
  }
}
</script>

<template>
    <li class="list-group-item" :class="{'bg-dark': !selected, 'bg-white': selected, 'text-white': !selected, 'text-dark': selected}">
        <div>
          <h6 class="card-text" :class="{'truncate': !expand && headline.length > 200}"><span :class="{'text-info': !selected, 'text-primary': selected}" v-if="headline.type == 'twitter'"><i class="bi bi-twitter"></i> {{ headline.title }}: </span>{{ headline.body }}</h6>
          <h7 :class="{'text-muted': !selected, 'text-dark': selected}"><i class="bi bi-clock"></i> {{ headline.time.toLocaleString('en-US', {timeZoneName: 'short'}) }}</h7>
          <h7 class="float-right font-weight-bold">{{ headline.symbol }} <span :class="priceChange> 0 ? 'text-success' : 'text-danger'">{{ priceChange.toFixed(2) }}%</span></h7>
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
