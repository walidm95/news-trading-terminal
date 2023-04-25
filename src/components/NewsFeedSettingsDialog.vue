<script>
export default {
  data() {
    return {
      dialog: false,
      newKeyword: "",
      newAction: "",
      newColor: "",
    };
  },
  props: {
    keywordsToHighlight: { type: Array, required: true },
    keywordsToIgnore: { type: Array, required: true },
  },
  methods: {
    close() {
      this.dialog = false;
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
        <v-card>
          <v-card-title>News Feed Settings</v-card-title>
          <v-row>
            <v-col>
              <v-card>
                <v-card-subtitle>Keywords Coloring</v-card-subtitle>
                <div class="text-center">
                  <v-chip
                    closable
                    v-for="(obj, index) in keywordsToHighlight"
                    :color="obj.color"
                    @click:close="$emit('delete-keyword', { action: 'Highlight', index: index })"
                  >
                    {{ obj.word }}
                  </v-chip>
                </div>
              </v-card>
            </v-col>
            <v-col>
              <v-card>
                <v-card-subtitle>Keywords to Ignore</v-card-subtitle>
                <div class="text-center">
                  <v-chip
                    closable
                    v-for="(word, index) in keywordsToIgnore"
                    @click:close="$emit('delete-keyword', { action: 'Ignore', index: index })"
                  >
                    {{ word }}
                  </v-chip>
                </div>
              </v-card>
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
              :items="['red', 'green', 'blue', 'yellow']"
            ></v-select>
            <v-btn rounded="lg" variant="outlined" color="white" @click="onAddKeyword">Add</v-btn>
          </v-card-actions>
        </v-card>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn rounded="lg" variant="tonal" color="white" @click="close()"> Close </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>
