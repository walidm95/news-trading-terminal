<script>
export default {
  data() {
    return {
      dialog: false,
      newKeyword: "",
      newAction: "",
      newColor: "",
      playHeadlineNotification: true,
      onlyColoredKeywords: false,
    };
  },
  props: {
    keywords: { type: Object, required: true },
  },
  methods: {
    close() {
      this.dialog = false;

      // Update general settings
      this.$emit("update-news-feed-settings", {
        playHeadlineNotification: this.playHeadlineNotification,
        onlyColoredKeywords: this.onlyColoredKeywords,
      });

      this.newKeyword = "";
    },
    onAddKeyword() {
      // Validate data
      if (this.newAction == "") {
        alert("Select an action");
        return;
      }
      if (this.newKeyword == "") {
        alert("Enter a keyword");
        return;
      }
      if (this.newAction == "Highlight" && this.newColor == "") {
        alert("Select a color");
        return;
      }
      if(this.newAction == "Highlight" && this.keywords.highlight.some(item => item.word == this.newKeyword)) {
        alert("This keyword is already in the list");
        return;
      }
      if(this.newAction == "Ignore" && this.keywords.ignore.some(word => word == this.newKeyword)) {
        alert("This keyword is already in the list");
        return;
      }

      this.$emit("add-keyword", {
        word: this.newKeyword,
        action: this.newAction,
        color: this.newColor,
      });
    },
  },
};
</script>

<template>
  <v-row justify="center">
    <v-dialog v-model="dialog" persistent width="1024">
      <template v-slot:activator="{ props }">
        <v-btn v-bind="props" color="grey" variant="text" icon="mdi-cog-outline" />
      </template>
      <v-card>
        <v-card-title>News Feed Settings</v-card-title>
        <v-card>
          <v-card-subtitle>Headline Notification Sound</v-card-subtitle>
          <v-card-text>
            <v-row>
              <v-col>
                <v-checkbox density="compact" hide-details="auto" label="New headline" v-model="playHeadlineNotification"></v-checkbox>
              </v-col>
              <v-col>
                <v-checkbox
                  density="compact"
                  hide-details="auto"
                  label="Only headline containing colored keywords"
                  v-model="onlyColoredKeywords"
                ></v-checkbox>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        <v-card>
          <v-row>
            <v-col>
              <v-card-subtitle>Keywords Coloring</v-card-subtitle>
              <v-row class="ma-2">
                <v-col v-for="(item, i) in keywords.highlight" :key="item.word" cols="auto" class="py-1 pe-0">
                  <v-chip :disabled="loading" closable :color="item.color" @click:close="$emit('delete-keyword', { action: 'Highlight', index: i })">
                    {{ item.word }}
                  </v-chip>
                </v-col>
              </v-row>
            </v-col>
            <v-col>
              <v-card-subtitle>Keywords to Ignore</v-card-subtitle>
              <v-row class="ma-2">
                <v-col v-for="(word, i) in keywords.ignore" :key="word" cols="auto" class="py-1 pe-0">
                  <v-chip :disabled="loading" closable @click:close="$emit('delete-keyword', { action: 'Ignore', index: i })">
                    {{ word }}
                  </v-chip>
                </v-col>
              </v-row>
            </v-col>
          </v-row>
          <v-card-actions>
            <v-text-field density="compact" hide-details="auto" class="pl-2 pr-2" label="Keyword" v-model="newKeyword"></v-text-field>
            <v-select
              class="pr-2"
              density="compact"
              hide-details="auto"
              label="Action"
              v-model="newAction"
              :items="['Highlight', 'Ignore']"
            ></v-select>
            <v-select
              v-show="newAction == 'Highlight'"
              class="pr-2"
              density="compact"
              hide-details="auto"
              label="Color"
              v-model="newColor"
              :items="['red', 'green', 'cyan', 'yellow']"
            ></v-select>
            <v-btn rounded="lg" variant="outlined" color="white" @click="onAddKeyword">Add</v-btn>
          </v-card-actions>
        </v-card>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn rounded="lg" variant="tonal" color="white" @click="close"> Close </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>
