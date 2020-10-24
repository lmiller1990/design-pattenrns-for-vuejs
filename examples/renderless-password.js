import { h, computed, watch } from 'vue'

export function calcComplexity(val) {
  if (!val) {
    return 0
  }

  if (val.length > 10) {
    return 3
  }
  if (val.length > 7) {
    return 2
  }
  if (val.length > 5) {
    return 1
  }

  return 0
}

export function isMatching(password, confirmation) {
  if (!password || !confirmation) {
    return false
  }
  return password === confirmation
}

export default {
  props: {
    password: {
      type: String
    },

    confirmation: {
      type: String
    },

    minComplexity: {
      type: Number
    }
  },

  setup(props, { slots }) {
    const complexity = computed(() => calcComplexity(props.password))
    const matching = computed(() => isMatching(props.password, props.confirmation))
    const valid = computed(() => complexity.value >= props.minComplexity && matching.value)

    return () => slots.default({
      complexity: complexity.value,
      matching: matching.value,
      valid: valid.value
    })
  }
}
