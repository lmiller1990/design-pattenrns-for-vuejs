<template>
  <div class="form-wrapper">
    <h3>patient data</h3>
    <form @submit.prevent="submit">
      <div class="field">
        <div v-if="!validatedform.name.valid" class="error" role="error">
          {{ validatedform.name.message }}
        </div>
        <label for="name">name</label>
        <input id="name" name="name" role="name" v-model="form.name" />
      </div>
      <div class="field">
        <div v-if="!validatedform.weight.valid" class="error" role="error">
          {{ validatedform.weight.message }}
        </div>
        <label for="weight">weight</label>
        <input id="weight" role="weight" name="weight" v-model.number="form.weight.value" />
        <select id="weight-units" role="weight-units" v-model="form.weight.units">
          <option value="kg">kg</option>
          <option value="lb">lb</option>
        </select>
      </div>
      <div class="field">
        <button role="submit" :disabled="!valid">submit</button>
      </div>
    </form>
    <div>
<pre>
patient data
{{ form }}
</pre>

<pre>
form state
{{ validatedform }}
</pre>
    </div>
  </div>
</template>

<script>
import { reactive, computed, ref } from 'vue'
import { patientForm, isFormValid } from './form.js'

export default {
  setup(props, { emit }) {
    const form = reactive({
      name: '',
      weight: {
        value: '',
        units: 'kg'
      }
    })

    const validatedForm = computed(() => {
      return patientForm(form)
    })

    const submit = () => {
      emit('submit', { patient: form })
    }

    const valid = computed(() => isFormValid(validatedForm.value))

    return {
      form,
      validatedForm,
      submit,
      valid,
    }
  }
}
</script>

<style>
.field > label {
  display: inline-block;
  width: 50px;
  margin: 0 0 20px 0;
}

.field > input {
  display: inline-block;
  margin: 2px;
}

.error {
  color: red;
}

pre {
  display: flex;
  justify-content: flex-start;
}

.form-wrapper {
}
</style>
