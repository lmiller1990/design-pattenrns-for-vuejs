<template>
  <h3>Patient Data</h3>
  <form>
    <div class="field">
      <label for="name">Name</label>
      <input id="name" name="name" v-model="form.name" />
    </div>
    <div class="field">
      <label for="weight">Weight</label>
      <input id="weight" name="weight" v-model="form.weight" />
      <select name="weightUnits" v-model="weightUnits">
        <option value="kg">kg</option>
        <option value="lb">lb</option>
      </select>
    </div>
    <div class="field">
      <button :disabled="!valid">Submit</button>
    </div>
  </form>
<pre>
Patient Data
{{ form }}
</pre>
<br />

<pre>
Form State
{{ validatedForm }}
</pre>
</template>

<script>
import { reactive, computed, ref } from 'vue'
import { patientForm, formValidity } from './form.js'

export default {
  setup() {
    const form = reactive({
      name: '',
      weight: '',
    })

    const weightUnits = ref('kg')

    const validatedForm = computed(() => {
      return patientForm({
        name: form.name,
        weight: {
          value: form.weight,
          units: weightUnits.value
        }
      })
    })

    const valid = computed(() => formValidity(validatedForm.value))

    return {
      form,
      validatedForm,
      valid,
      weightUnits
    }
  }
}
</script>

<style>
.field > label {
  display: inline-block;
  width: 50px;
}

.field > input {
  display: inline-block;
  margin: 2px;
}
</style>
