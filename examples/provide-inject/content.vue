<template>
  <button @click="mode = 'dark'">Dark</button>
  <button @click="mode = 'light'">Light</button>
  <theme-provider>
    <themed-message 
      msg="Hello world" 
    />
  </theme-provider>
</template>

<script>
import ThemeProvider, { mode } from './themed-provider.vue'
import ThemedMessage from './themed-message.vue'

export default {
  components: {
    ThemeProvider,
    ThemedMessage
  },

  setup() {
    return {
      mode
    }
  }
}
</script>
