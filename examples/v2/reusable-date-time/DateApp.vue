<template>
  <h3>Luxon</h3>
  <DateTimeC
    v-model="dateLuxon"
    :deserialize="deserialize"
    :serialize="serialize"
  />
  {{ dateLuxon }}

  <h3>Moment</h3>
  <DateTimeC
    v-model="dateMoment"
    :deserialize="deserializeMoment"
    :serialize="serializeMoment"
  />
  {{
    dateMoment.format ? dateMoment.format("YYYY-MM-DD") : dateMoment
  }}
  <hr />
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { DateTime } from "luxon";
import {
  serialize,
  deserialize,
  serializeMoment,
  deserializeMoment,
} from "./date-time-serializers.js";
import moment from "moment";
import DateTimeC from "./date-time.vue";

const dateLuxon = ref(
  DateTime.fromObject({
    year: 2019,
    month: 1,
    day: 1,
  })
);
const dateMoment = ref(moment("2019-02-02", "YYYY-MM-DD"));
</script>
