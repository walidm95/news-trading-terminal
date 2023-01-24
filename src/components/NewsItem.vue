<script>
export default {
  props: {
    headline: {type: String, required: true},
    time: {type: String, required: true},
    selected: {type: Boolean, required: true}
  }
}
</script>

<template>
    <li class="list-group-item" :class="{active: selected}">
        <div>
          <h6 class="card-subtitle mb-1">{{ time }}</h6>
          <h5 class="card-title">{{ headline }}</h5>
        </div>
      </li>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
