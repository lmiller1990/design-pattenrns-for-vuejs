# Writing Testable Forms

You can find the completed source code (including exercises) in the [GitHub repository under examples/form-validation](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

______

Forms are the primary way a user enters information into any web based system, so getting them right is important. The focus on this section will be on forms, specifically *writing good forms*. 

What exactly is a *good* form? 

We want to ensure the form logic is decoupled from the Vue components - this will let us test in isolation. We also need to think about validation. 

In traditional server rendered apps, you would only get validation after submitting the form - not really a great user experience. Vue makes client side validation trivial. We will make use of this and implement two levels of validation:

1. Field validation - if a user enters incorrect in invalid data in a single field, we will show an error immediately.
2. Form validation - the submit button should only be enabled when the entire form is correctly filled out.

Finally, we need two levels of tests. The first is around the business logic; given some form, which fields are invalid, and when is the form considered complete? The second is around interactions - ensuring that the UI layer is working correctly, and that the user can enter data, see error messages, and correctly submit the form.

\pagebreak

## The Patient Form

For this example, we are building a form to enter patient data for a hospital application. The form will look like this when filled out without any errors:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./images/form-validation/ss-done-clean.png}
  \caption{Valid form with debug info}
  \label{fig}
\end{figure}
\pagebreak

There are two inputs. The first is the patient name, which is required and can be any text. The second is the patient weight, which can be in imperial or metric units. The constraints are as follows:

 .  | Imperial | Metric
--- | --- | ---
min | 66 | 30
max | 440 | 200

We will need to validate both the name and the weight. The form with errors looks like this:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./images/form-validation/ss-done-dirty.png}
  \caption{Invalid form with debug info}
  \label{fig}
\end{figure}
\pagebreak

We could define those using an object:

```js
const limits = {
  kg: { min: 30, max: 200 },
  lb: { min: 66, max: 440 }
}
```

The submit button should only be enabled if both inputs are valid. Finally, we should show validation for each field.

## A Mini Form Validation Framework

There are plenty of full-featured Vue (and non-Vue) form validation frameworks out there. For this simple example, we will write our own - this will let us discuss some ideas, as well as avoid learning a specific API or library. 

We need two types of validations: 

1. A required field. Both the patient name and weight are required fields.
2. Minimum and maximum constraints. This is for the weight field - it has to be within a specific range. 

As well as validating the fields, our framework should also return an error message if the input is not valid.

We will write two validation functions: `required` and `isBetween`. While TDD isn't always the right tool, for these two functions I believe it is. This is because we know the inputs and outputs, and all the possible states of the system, it's just a matter of writing the tests and then making them pass.

Let's do that - starting with the tests for the `required` validator. Each validator will return an object with the validation status, and a message if there is an error. Using a TypeScript `interface` for notation purposes:

```js
interface ValidationResult {
  valid: boolean
  messsage?: string
}
```

This will be the format our two validators (and any future ones) will need to conform to. Now we've settled on our validation API, we can write the tests for `required`.
\pagebreak

## The `required` validator

```js
import {
  required,
} from './form.js'

describe('required', () => {
  it('is invalid when undefined', () => {
    expect(required(undefined)).toEqual({ 
      valid: false, 
      message: 'Required' 
    })
  })

  it('is invalid when empty string', () => {
    expect(required('')).toEqual({ 
      valid: false, 
      message: 'Required' 
    })
  })

  it('returns true false value is present', () => {
    expect(required('some value')).toEqual({ valid: true })
  })
})
```

Basically, anything that is not truthy is invalid; anything else is considered valid. We can get all the tests passing with this implementation:

```js
export function required(value) {
  if (!value) {
    return {
      valid: false,
      message: 'Required'
    }
  }

  return { valid: true }
}
```

I like to put the invalid case first for my validators - that's just a personal preference.
\pagebreak

## The `isBetween` validator

`isBetween` is a bit more interesting. We need to support imperial and metric; we will build another function on top of `isBetween` that will pass in the correct constraints.

Let's start by identifying all the edge cases. If the minimum weight is 66 lb and the maximum weight is 440 lb, obviously 65 lb and 441 lb are invalid. 66 lb and 440 lb are valid, however, so we should make sure we add tests for those cases. 

This means we need 5 tests: 

1. The "happy" path, where the input is valid. 
2. Value is above the maximum value.
3. Value is below the minimum value.
4. Value is equal to the maximum value.
5. Value is equal to the minimum value.

For this function, it is safe to assume that only numbers can be passed as the input value; this validation is something we will handle at a higher level.

```js
import {
  required,
  isBetween
} from './form.js'

describe('required' () => {
  // ...
})

describe('isBetween', () => {
  it('returns true when value is equal to min', () => {
    expect(isBetween(5, { min: 5, max: 10 }))
    .toEqual({ valid: true })
  })

  it('returns true when value is between min/max', () => {
    expect(isBetween(7, { min: 5, max: 10 }))
    .toEqual({ valid: true })
  })

  it('returns true when value is equal to max', () => {
    expect(isBetween(10, { min: 5, max: 10 }))
    .toEqual({ valid: true })
  })

  it('returns false when value is less than min', () => {
    expect(isBetween(4, { min: 5, max: 10 }))
      .toEqual({ 
        valid: false, 
        message: 'Must be between 5 and 10' 
      })
  })

  it('returns false when value is greater than max', () => {
    expect(isBetween(11, { min: 5, max: 10 }))
      .toEqual({ 
        valid: false, 
        message: 'Must be between 5 and 10' 
      })
    })
})
```

I think the tests are simple enough to have everything in a single `expect` statement. If the tests were more complex, I'd probably assign the result of `isBetween()` to a variable (I like to call it `actual`) and pass that to the `expect` assertion. More on structuring larger, more complex tests later.

The implementation is much less code than the tests; this is not unusual.

```js
export function isBetween(value, { min, max }) {
  if (value < min || value > max) {
    return {
      valid: false,
      message: `Must be between ${min} and ${max}`
    }
  }

  return { valid: true }
}
```

Again, I like to have the validation at the start of the function.

## Building `validateMeasurement` with `isBetween`

Now we have written our little validation framework (well, two functions), it's time to validate the patient weight. We will build a `validateMeasurement` function using `isBetween` and `required`. 

Since we are supporting imperial and metric, we will be passing the constraints as an argument. Dealing with which one is selected will be done later on, in the UI layer. 

There are three scenarios to consider:

1. The happy path when the value is valid. 
2. The value is null/undefined. 
3. The value is outside the constraints. 

I don't feel the need to add tests for all the cases like we did with `isBetween`, since we already tested that thoroughly.

```js
import {
  required,
  isBetween,
  validateMeasurement
} from './form.js'

describe('required' () => {
  // ...
})

describe('isBetween', () => {
  // ...
})

describe('validateMeasurement', () => {
  it('returns invalid for input', () => {
    const constraints = { min: 10, max: 30 }
    const actual = validateMeasurement(undefined, { constraints })

    expect(actual).toEqual({ valid: false, message: 'Required' })
  })

  it('returns invalid when outside range', () => {
    const constraints = { min: 10, max: 30 }
    const actual = validateMeasurement(40, { constraints })

    expect(actual).toEqual({ 
      valid: false, 
      message: 'Must be between 10 and 30' 
    })
  })
})
```

Since the test is a bit more complex, I decided to assign the result to `actual`, and assert against that. I think this makes it more clear. 

We don't need to use the specific constraints for pounds and kilograms outlined in the table earlier. As long as the tests pass with the constraints we pass in here, we can be confident `validateMeasurement` will work correctly for any given set of `min/max` constraints.

I also left a blank line between the body of the test and the assertion. This is a personal preference, loosely inspired by the three phases of a test: *arrange*, *act* and *assert*. We will talk about those later. 

You don't have to write your tests like this. Personally, I find it useful to think in terms of "doing things" (eg, creating some variables, calling some functions) and asserting (where we say "given this scenario, this should happen").

Personal philosophy aside - the implementation, again, is much shorter than the test code. Notice a pattern?

```js
export function validateMeasurement(value, { constraints }) {
  const result = required(value)
  if (!result.valid) {
    return result
  }

  return isBetween(value, constraints)
}
```

Nice! We were able to reuse `required` and `isBetween`. We "composed" a validator using two small ones. Re-usability is good. Composability is good.

## The Form Object and Full Form Validation

We have completed all the validations for each field. Let's think about the structure of the form now. 

We have two fields: `name` and `weight`. 

1. `name` is a string. 
2. `weight` is a number with associated units. 

These are the *inputs*. I will use a TypeScript interface for notation purposes:

```js
// definition
interface PatientFormState {
  name: string
  weight: {
    value: number
    units: 'kg' | 'lb'
  }
}

// usage
const patientForm: PatientFormState = {
  name: 'John',
  weight: {
    value: 445,
    units: 'lb'
  }
}
```

Given an input (a `patientForm`), we can valid each field. Fields when validated are either `{ valid: true }` or `{ valid: false, message: '...' }`. So the form and validity interfaces could look like this (again, using TypeScript for notation):


```js
interface ValidationResult {
  valid: boolean
  messsage?: string
}

interface PatientFormValidity {
  name: ValidationResult
  weight: ValidationResult
}

const patientForm: PatientFormState = {
  name: 'John',
  weight: {
    value: 445,
    units: 'lb'
  }
}

const validState = validateForm(patientForm)
// Return value should be:
// {
//   name: { valid: true }
//   weight: { 
//     valid: false, 
//     message: 'Must be between 66 and 440' 
//   }
// }

```

We will need two functions: 

1. `isFormValid()`, to tell us if the form is valid or not. 
2. `patientForm()`, which handles figuring out the correct weight units, and calling all the validators.

Let's start with the tests for `isFormValid`. The form is considered valid when all fields are `valid`, so we only need two tests: the case where all fields are valid, and the case where at least one field is not: 

```js
import {
  required,
  isBetween,
  validateMeasurement,
  isFormValid
} from './form.js'

describe('required' () => {
  // ...
})

describe('isBetween', () => {
  // ...
})

describe('validateMeasurement', () => {
  // ...
})

describe('isFormValid', () => {
  it('returns true when name and weight field are valid', () => {
    const form = {
      name: { valid: true },
      weight: { valid: true }
    }

    expect(isFormValid(form)).toBe(true)
  })

  it('returns false when any field is invalid', () => {
    const form = {
      name: { valid: false },
      weight: { valid: true }
    }

    expect(isFormValid(form)).toBe(false)
  })
})
```

The implementation is as simple as you might expect:

```js
export function isFormValid(form) {
  return form.name.valid && form.weight.valid
}
```

You could get fancy and iterate over the `form` using `Object.keys` or `Object.entries` if you were building a more generic form validation library. This would be a more general solution. In this case I am keeping it as simple as possible.

The last test we need to complete the business logic is `patientForm`. This function takes an object with the `PatientFormState` interface we defined earlier. It returns the validation result of each field. 

We will want to have a quite a few tests here, to make sure we don't miss anything. The cases I can think of are:

1. Happy path: all inputs are valid
2. Patient name is null
3. Patient weight is outside constraints (imperial)
4. Patient weight is outside constraints (metric)

```js
import {
  required,
  isBetween,
  validateMeasurement,
  isFormValid,
  patientForm
} from './form.js'

describe('required' () => {
  // ...
})

describe('isBetween', () => {
  // ...
})

describe('validateMeasurement', () => {
  // ...
})

describe('isFormValid', () => {
  // ...
})

describe('patientForm', () => {
  const validPatient = {
    name: 'test patient',
    weight: { value: 100, units: 'kg' }
  }

  it('is valid when form is filled out correctly', () => {
    const form = patientForm(validPatient)
    expect(form.name).toEqual({ valid: true })
    expect(form.weight).toEqual({ valid: true })
  })

  it('is invalid when name is null', () => {
    const form = patientForm({ ...validPatient, name: '' })
    expect(form.name).toEqual({ valid: false, message: 'Required' })
  })

  it('validates weight in imperial', () => {
    const form = patientForm({ 
      ...validPatient, 
      weight: { 
        value: 65, 
        units: 'lb' 
      }
    })

    expect(form.weight).toEqual({ 
      valid: false, 
      message: 'Must be between 66 and 440' 
    })
  })

  it('validates weight in metric', () => {
    const form = patientForm({ 
      ...validPatient, 
      weight: { 
        value: 29, 
        units: 'kg' 
      }
    })

    expect(form.weight).toEqual({ 
      valid: false, 
      message: 'Must be between 30 and 200' 
    })
  })
})
```

The test code is quite long. The implementation is trivial, however. In this example, I am just hard-coding the weight constraints in an object called `limits`. In a real world system, you would likely get these from an API and pass them down to the `patientForm` function.

```js
const limits = {
  kg: { min: 30, max: 200 },
  lb: { min: 66, max: 440 },
}

export function patientForm(patient) {
  const name = required(patient.name)

  const weight = validateMeasurement(patient.weight.value, {
    nullable: false,
    constraints: limits[patient.weight.units]
  })

  return {
    name,
    weight
  }
}
```

This completes the business logic for the patient form - noticed we haven't written and Vue components yet? That's because we are sticking to one of our goals; *separation of concerns*, and isolating the business logic entirely. 

## Writing the UI Layer

Now the fun part - writing the UI layer with Vue. Although I think TDD is a great fit for business logic, I prefer to write the tests for my components after the fact generally, although this doesn't follow the hardcore TDD mantra.

I like to start by thinking about how I will manage the state of my component. Let's use the Composition API; I think works great for forms.

```html
<script>
import { reactive, computed, ref } from 'vue'
import { patientForm, isFormValid } from './form.js'

export default {
  setup() {
    const form = reactive({
      name: '',
      weight: {
        value: '',
        units: 'kg'
      }
    })

    const validatedForm = computed(() => patientForm(form))
    const valid = computed(() => isFormValid(validatedForm.value))

    return {
      form,
      validatedForm,
      valid
    }
  }
}
</script>
```

I decided to keep the state in a `reactive` object. Both the `valid` state and `validateForm` are `computed` values - we want the validation and form state to update reactively when any value in the form changes.

Let's add the `<template>` part now - it's very simple, just good old HTML.

```html
<template>
  <h3>Patient Data</h3>
  <form>
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
      <input 
        id="weight" 
        name="weight" 
        v-model.number="form.weight.value" 
      />
      <select name="weightUnits" v-model="form.weight.units">
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
```

I added the `<pre>` block for some debugging. Everything works!

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./images/form-validation/ss-done-clean.png}
  \caption{Validation debug info}
  \label{fig}
\end{figure}
\pagebreak

## Some Basic UI Tests

We can add some basic UI tests using Vue Test Utils, too. Here are two fairly simple ones that cover most of the functionality:

```js
import { mount } from '@vue/test-utils'
import FormValidation from './form-validation.vue'

describe('FormValidation', () => {
  it('fills out form correctly', async () => {
    const wrapper = mount(FormValidation)

    await wrapper.find('#name').setValue('lachlan')
    await wrapper.find('#weight-units').setValue('lb')
    await wrapper.find('#weight').setValue('150')

    expect(wrapper.findAll('.error')).toHaveLength(0)
  })

  it('shows errors for invalid inputs', async () => {
    const wrapper = mount(FormValidation)

    await wrapper.find('#name').setValue('')
    await wrapper.find('#weight-units').setValue('lb')
    await wrapper.find('#weight').setValue('50')

    expect(wrapper.findAll('.error')).toHaveLength(2)
  })
})
```

Since these tests are a little larger, I am making the separation between each step clear. I like to write my tests like this:

```js
it('...', () => {
  // Arrange - this is where we set everything up
  const wrapper = mount(...)

  // Act - do things! 
  // Call functions
  // Assign values
  // Simulate interactions
  wrapper.find(...).trigger(...)

  // Assert
  expect(...).toEqual(...)
})
```

We don't have any tests to ensure the `<button>` is correctly disabled - see below for more.

## Improvements and Conclusion

The goal here wasn't to build the *perfect* form, but illustrate how to separate your form validation and business logic from the UI layer. 

As it stands, you can enter any string into the weight field and it will be considered valid - not ideal, but also trivial to fix. A good exercise would be to write some tests to ensure the input is a number, and if not, return a useful error message. We also haven't got any tests to ensure the `<button>` is correctly disabled.

## Exercises

- Add a test to ensure that any non numbers entered into the `weight` field cause the field to become invalid and show a "Weight must be a number" error.
- Add a `@submit.prevent` listener to the `<form>`. When the form is submitted, emit an event with the `patientForm`.
 - Submit the form using Vue Test Utils and assert the correct event and payload is emitted.

You can find the completed source code (including exercises) in the [GitHub repository under examples/form-validation](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

\pagebreak
