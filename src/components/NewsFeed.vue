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
    <div class="card">
        <div class="card-header h2">
            News Feed
        </div>
        <ul class="list-group list-group-flush">
            <NewsItem v-for="(headline, index) in headlines" 
                :key="index" :time="headline.time" 
                :headline="headline.title" 
                :selected="activeHeadline === index" 
                @click="selectHeadline(index)"/>
        </ul>
    </div>
</template>