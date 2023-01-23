<script>
import NewsItem from './NewsItem.vue';

function getHeadlines() {
    return [
        {
        'time': '15:02:43',
        'title': 'This is a headline1'
        },
        {
        'time': '15:02:42',
        'title': 'This is a headline2'
        },
        {
        'time': '15:02:41',
        'title': 'This is a headline3'
        },
        {
        'time': '15:02:40',
        'title': 'This is a headline4'
        }
    ]
}

export default {
    data() {
        return {
            activeHeadline: 0,
            headlines: getHeadlines()
        };
    },
    components: { NewsItem },
    methods: {
        selectHeadline(index) {
            this.activeHeadline = index;
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
            <NewsItem v-for="(headline, index) in headlines" :key="index" :time="headline.time" :headline="headline.title" :selected="activeHeadline === index" @click="selectHeadline(index)"/>
        </ul>
    </div>
</template>