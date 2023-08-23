<template>
  <slot
    :matching="matching"
    :complexity="complexity"
    :valid="valid"
  />
</template>

<script lang="ts" setup>
import { computed } from "vue";

export type Validator = (payload: {
  complexity: number;
  password: string;
  confirmation: string;
  matching: boolean;
}) => boolean;

const props = withDefaults(
  defineProps<{
    password: string;
    confirmation: string;
    validator?: Validator;
    minComplexity?: number;
  }>(),
  {
    minComplexity: 3,
  }
);

function calcComplexity(val: string) {
  if (!val) {
    return 0;
  }

  if (val.length > 10) {
    return 3;
  }
  if (val.length > 7) {
    return 2;
  }
  if (val.length > 5) {
    return 1;
  }

  return 0;
}

const complexity = computed(() => calcComplexity(props.password));

function isMatching(password: string, confirmation: string) {
  if (!password || !confirmation) {
    return false;
  }
  return password === confirmation;
}

const matching = computed(() =>
  isMatching(props.password, props.confirmation)
);

const valid = computed(() => {
  if (props.validator) {
    return props.validator({
      complexity: complexity.value,
      password: props.password,
      confirmation: props.confirmation,
      matching: matching.value,
    });
  }
  return matching.value && complexity.value >= props.minComplexity;
});
</script>
