<template>
  <emitter v-model:name="name" />
  {{ name }}
</template>

<script>
import { ref  } from 'vue'
import Emitter from './Emitter.vue'
export default {
  components: { Emitter },
  setup() {
    return {
      name: ref('lac')
    }
  }
}
</script>
