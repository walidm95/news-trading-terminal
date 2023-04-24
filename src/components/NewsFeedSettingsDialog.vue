<script>
export default {
  data() {
    return {
      dialog: false,
      newKeyword: "",
      newColor: "",
    };
  },
  props: {
    keywords: { type: Array, required: true },
  },
  methods: {
    close() {
      this.dialog = false;
    },

    onAddKeyword() {
      // Validate data
      if (this.newColor == "") {
        alert("Select a color");
        return;
      }
      if (this.newKeyword == "") {
        alert("Enter a keyword");
        return;
      }

      this.dialog = false;

      this.$emit("add-keyword", {
        newKeyword: this.newKeyword,
        newColor: this.newColor,
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
          <v-card-subtitle>Keyword Coloring</v-card-subtitle>
          <v-table density="compact">
            <thead>
              <tr>
                <th class="text-center text-subtitle-2 pr-0">Keyword</th>
                <th class="text-center text-subtitle-2 pr-0">Color</th>
                <th class="text-center text-subtitle-2 pr-0">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(obj, index) in keywords" class="text-center">
                <td>{{ obj.word }}</td>
                <td>{{ obj.color }}</td>
                <td class="pt-1 pb-1">
                  <v-btn rounded="lg" variant="tonal" color="red" @click="$emit('delete-keyword', index)"> Delete </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
          <v-card-actions v-if="apiKeys.length < 6">
            <v-text-field density="compact" hide-details="auto" class="pl-2 pr-2" label="Keyword" v-model="newKetword"></v-text-field>
            <v-text-field density="compact" hide-details="auto" class="pl-2 pr-2" label="Color" v-model="newColor"></v-text-field>
            <v-select label="Color" :items="['Red', 'Green', 'Blue', 'Yellow']"></v-select>
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
