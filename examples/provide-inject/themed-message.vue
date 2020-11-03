<template>
  <div :class="className">
    <h3>{{ msg }}</h3>
    {{ mode }}
  </div>
</template>

<script>
import { inject, computed } from 'vue'

export default {
  props: {
    msg: {
      type: String
    }
  },

  setup() {
    const mode = computed(() => inject('mode').value)

    const className = computed(() => {
      return mode.value === 'dark' 
        ? 'day-mode'
        : 'night-mode'
    })

    return {
      className,
      mode
    }
  }
}
</script>

<style scoped>
.night-mode {
  background: black;
  color: white;
}

.day-mode {
  background: white;
  color: black;
}
</style>
