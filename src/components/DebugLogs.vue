<template>
  <v-card class="overflow-y-auto">
    <v-card-title>Debug</v-card-title>
    <p class="pl-2" v-for="log in logs">{{ log }}</p>
  </v-card>
</template>

<script>
export default {
  props: {
    logs: { type: Array, required: true },
  },
};
</script>
