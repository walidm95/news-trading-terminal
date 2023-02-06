<script>
import NewsItem from './NewsItem.vue';

export default {
    props : {
        symbols: {type: Object, required: true},
        headlines: {type: Array, required: true},
        activeHeadline: {type: Number, required: true}
    },
    components: { NewsItem },
    methods: {
        selectHeadline(index) {
            this.$emit('select-headline', index);
        }
    }
}
</script>

<template>
    <div class="card bg-dark text-white border-secondary">
        <div class="card-header h3 border-secondary">
            News Feed
        </div>
        <ul class="list-group list-group-flush scrolled">
            <NewsItem v-for="(headline, index) in headlines" 
                :key="index" :datetime="headline.datetime.toLocaleString('en-US', {timeZoneName: 'short'})" 
                :headline="headline.title" 
                :selected="activeHeadline === index" 
                @click="selectHeadline(index)"/>
        </ul>
    </div>
</template>

<style scoped>
.scrolled {
    overflow-y: scroll;
    height: 75vh;
}
</style>