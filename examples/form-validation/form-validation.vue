<template>
  <div class="form-wrapper">
    <h3>Patient Data</h3>
    <form @submit.prevent="submit">
      <div class="field">
        <div v-if="!validatedForm.name.valid" class="error">
          {{ validatedForm.name.message }}
        </div>
        <label for="name">Name</label>
        <input id="name" name="name" v-model="form.name" />
      </div>
      <div class="field">
        <div v-if="!validatedForm.weight.valid" class="error">
          {{ validatedForm.weight.message }}
        </div>
        <label for="weight">Weight</label>
        <input id="weight" name="weight" v-model.number="form.weight.value" />
        <select id="weight-units" v-model="form.weight.units">
          <option value="kg">kg</option>
          <option value="lb">lb</option>
        </select>
      </div>
      <div class="field">
        <button :disabled="!valid || submitted">Submit</button>
      </div>
    </form>
    <div>
<pre>
Patient Data
{{ form }}
</pre>

<pre>
Form State
{{ validatedForm }}
</pre>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { reactive, computed, ref, watch } from 'vue'
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

    const serverValidation = reactive({
      name: { valid: true },
      weight: { valid: true }
    })

    const submitted = ref(false)
    watch(form, () => {
      submitted.value = false
    })

    const validatedForm = computed(() => {
      if (submitted.value) {
        return serverValidation
      }
      return patientForm(form)
    })

    const submit = async () => {
      class ApiError extends Error {
        constructor(message) {
          super(message)
          this.response = {
            status: 400,
            data: [
              { field: 'name', error: 'Name already exists' }
            ]
          }
        }
      }

      try {
        submitted.value = true
        const delay = () => new Promise(res => setTimeout(res, 1000))
        await delay()
        throw new ApiError()
      } catch (e) {
        if (e.response.status === 400) {
          for (const { field, error } of e.response.data) {
            serverValidation[field] = {
              valid: false,
              message: error
            }
          }
        }
      } 
    }

    const valid = computed(() => isFormValid(validatedForm.value))

    return {
      form,
      validatedForm,
      submitted,
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
