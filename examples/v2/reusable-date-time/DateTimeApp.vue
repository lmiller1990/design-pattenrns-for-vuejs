<template>
  <DateTimeBasic
    v-model="dateLuxon"
    :deserialize="deserialize"
    :serialize="serialize"
  />
  {{ dateLuxon }}
</template>

<script lang="ts" setup>
import { ref } from "vue";
import DateTimeBasic from "./DateTime.vue";
import Luxon from "luxon";
import { serialize, deserialize } from "./serializers.js";

const dateLuxon = ref(
  Luxon.DateTime.fromObject({
    year: 2019,
    month: 1,
    day: 1,
  })
);
</script>
