<template>
  <div v-for="i in 8">
    {{ i }}
  </div>  
</template>

<script>
import { newGame } from './checkers.js'

export default {
  setup() {
    return {
      game: newGame()
    }
  }
}
</script>
