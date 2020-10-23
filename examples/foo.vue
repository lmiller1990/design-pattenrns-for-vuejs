<template>
  <renderless 
    :password="input.password"
    :confirmation="input.confirmation"
    :minComplexity="2"
    v-slot="{ 
      complexity,
      matching,
      valid
    }"
  >
    <div class="wrapper">
      <div class="field">
        <label for="password">Password</label>
        <input v-model="input.password" id="password" />
      </div>
      <div class="field">
        <label for="confirmation">Confirmation</label>
        <input v-model="input.confirmation" id="confirmation" />
      </div>
      <div 
        class="complexity" 
        :class="complexityStyle(complexity)"
      />
      <div class="field">
        <button :disabled="!valid">Submit</button>
      </div>
    </div>

  </renderless>
</template>

<script>
import { reactive } from 'vue'
import Renderless from './renderless.vue'

export default {
  components: { 
    Renderless 
  },

  setup(props) {
    const input = reactive({
      password: '',
      confirmation: ''
    })

    const complexityStyle = (complexity) => {
      if (complexity < 2) {
        return 'low'
      }
      if (complexity < 3) {
        return 'mid'
      }
      if (complexity >= 3) {
        return 'high'
      }
    }

    return {
      input,
      complexityStyle
    }
  }
}
</script>

<style>
.wrapper {
  width: 400px;
}

.field {
  display: flex;
  flex-direction: column;
  font-size: 1.1rem;
  margin: 5px 0;
}

input {
  height: 30px;
  font-size: 1.5rem;
}

.complexity {
  transition: 0.2s;
  height: 10px;
}

.high {
  width: 100%;
  background: lime;
}

.mid {
  width: 66%;
  background: yellow;
}

.low {
  width: 33%;
  background: red;
}

button {
  height: 30px;
  background: none;
  border: none;
  font-size: 1.5rem;
  background: steelblue;
  color: white;
  padding: 4px 0; 
  width: 100%;
  box-sizing: content-box;
}

button:disabled {
  opacity: 0.5;
}
</style>
