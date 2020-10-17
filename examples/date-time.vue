<template>
  <input v-model="date.year" @input="handle" />
  <input v-model="date.month" @input="handle" />
  <input v-model="date.day" @input="handle" />
<pre>
Date is:
{{ date }} 
</pre>
</template>

<script>
import { reactive, watch, computed } from 'vue'
import { DateTime } from 'luxon'

export default {
  props: {
    modelValue: {
      type: Object
    },
    serialize: {
      type: Function
    },
    deserialize: {
      type: Function
    }
  },

  setup(props, { emit }) {
    const date = computed(() => {
      return props.deserialize(props.modelValue)
    })

    const handle = () => {
      const serial = props.serialize(date.value)
      if (!serial) {
        return
      }
      emit('update:modelValue', props.serialize(date.value))
    }

    return {
      date,
      handle
    }
  }
}
</script>
