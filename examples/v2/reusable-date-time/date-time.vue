<template>
  <input
    role="year"
    :value="date.year"
    @input="update($event, 'year')"
  />
  <input
    role="month"
    :value="date.month"
    @input="update($event, 'month')"
  />
  <input
    role="day"
    :value="date.day"
    @input="update($event, 'day')"
  />
  <pre>
    date is:
    {{ date }} 
    </pre
  >
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { InternalDateTime } from "./date-time-serializers.js";

const props = defineProps<{
  modelValue: any;
  serialize: (val: any) => any;
  deserialize: (val: any) => InternalDateTime;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", dt: InternalDateTime): void;
}>();

const date = computed(() => {
  return props.deserialize(props.modelValue);
});

const update = (event: Event, field: "year" | "month" | "day") => {
  const target = event.target as HTMLInputElement;

  let newValue: InternalDateTime = props.deserialize(
    props.modelValue
  );

  if (field === "year") {
    newValue.year = parseInt(target.value);
  }
  if (field === "month") {
    newValue.month = parseInt(target.value);
  }
  if (field === "day") {
    newValue.day = parseInt(target.value);
  }

  const asObject = props.serialize(newValue);

  if (!asObject) {
    return;
  }

  emit("update:modelValue", asObject);
};
</script>
