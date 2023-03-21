<template>
  <slot
    :matching="matching"
    :complexity="complexity"
    :valid="valid"
  />
</template>

<script lang="ts" setup>
import { useSlots, computed } from "vue";
import {
  isMatching,
  calcComplexity,
  Validator,
} from "./renderless-password.js";

const props = withDefaults(
  defineProps<{
    minComplexity?: number;
    validator?: Validator;
    password: string;
    confirmation: string;
  }>(),
  {
    minComplexity: 3,
  }
);

const matching = computed(() =>
  isMatching(props.password, props.confirmation)
);

const complexity = computed(() => calcComplexity(props.password));

const valid = computed(() =>
  props.validator
    ? props.validator({
        complexity: complexity.value,
        password: props.password,
        confirmation: props.confirmation,
        matching: matching.value,
      })
    : complexity.value >= props.minComplexity && matching.value
);

const slots = useSlots();
</script>
