<script>
import { provide, ref } from 'vue'
export const mode = ref('light')

export default {
  setup(props, { slots }) {
    provide('mode', mode)
    return () => slots.default && slots.default()
  }
}
</script>
