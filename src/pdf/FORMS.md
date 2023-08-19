# Writing Testable Forms

You can find the completed source code (including exercises) in the [GitHub repository under examples/form-validation](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

______

Forms are the primary way a user enters information into any web-based system, so getting them right is important. The focus of this section will be on forms, specifically *writing good forms*. 

What exactly is a *good* form? 

We want to ensure the form logic is decoupled from the Vue components - this will let us test in isolation. We don't want to couple our logic to our UI layer. In my experience, user interfaces change a lot (for some reason) and seem to get thrown out every 5 years or so. Businesses, and their logic, tends to stay the same, and also tends to be more important, so we want to make sure the core logic and underyling value is resilient and reliable. Good forms have good errors and good validation. 

In traditional server-rendered apps, you would only get validation after submitting the form - not a great user experience. Vue allows us to deliver a great user experience by implementing highly dynamic, client-side validation. We will make use of this and implement two levels of validation:

1. Field validation - if a user enters incorrect in invalid data in a single field, we will show an error immediately.
2. Form validation - the submit button should only be enabled when the entire form is correctly filled out.

Finally, we need two types of tests. The first is around the business logic; given some form, which fields are invalid, and when is the form considered complete? The second is around interactions - ensuring that the UI layer is working correctly and that the user can enter data, see error messages, and submit the form if all the fields are valid. We also want our form to be extensible - we will need to update it at some point, as new edge cases are discovered, and the business and application evolves.

\pagebreak

## The Patient Form

For this example, we are building a form to enter patient data for a hospital application. The form will look like this when filled out without any errors:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{ss-done-clean.png}
  \caption{Valid form with debug info}
  \label{fig}
\end{figure}

There are two inputs. The first is the patient name, which is required and can be any text. The second is the patient weight, which can be in imperial or metric units. The constraints are as follows:

 Constraint | Imperial | Metric
--- | --- | ---
min | 66 | 30
max | 440 | 200

We will need to validate both the name and the weight. The form with errors looks like this:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{ss-done-dirty.png}
  \caption{Invalid form with debug info}
  \label{fig}
\end{figure}

We will define the constraints using an object:

```ts
const limits = {
  kg: { min: 30, max: 200 },
  lb: { min: 66, max: 440 }
}
```

The submit button should only be enabled if both inputs are valid. Finally, we should show validation for each field.

## A Mini Form Validation Framework

There are plenty of full-featured Vue (and non-Vue) form validation frameworks out there. For this simple example, we will write our own - this will let us discuss some ideas, as well as avoid learning a specific API or library. 

We need two types of validations: 

1. A required field. Both the patient's name and weight are required fields.
2. Minimum and maximum constraints. This is for the weight field - it has to be within a specific range. It also needs to support metric and imperial units.

As well as validating the fields, our form validation framework should also return an error messages for each invalid input. Finally, it should be *composable* - I expect to write many more forms, and most of the valdiation requirements are some combination of existing rules - required, minimum/maximum length, etc.

We will write two validation functions: `required` and `validateRange`. While test driven development (abbreviated to TDD - where you write the tests first, and let the failing tests guide the implementation) isn't always the right tool, for writing these two functions I believe it is. This is because we know the inputs and outputs, and all the possible states of the system, it's just a matter of writing the tests and then making them pass.

Let's do that - starting with the tests for the `required` validator. Each validator will return an object with the validation status, and a message if there is an error. A validated input should have this shape:

```ts
interface ValidationResult {
  valid: boolean
  message?: string
}
```

In addition, a validator is a function that returns a `ValidationResult`. We can write a type for that, too:

```ts
export type Validator = (...args: any[]) => ValidationResult;
```

This will be the format our two validators (and any future ones) will need to conform to. Now we've settled on our validation API, we can write the tests for `required`.
\pagebreak

## The `required` validator

Let's see the tests first, to better understand the requirements for the `required` validator.

```ts
import { describe, it, expect } from "vitest";
import { required } from "./form.js";

describe("required", () => {
  it("is invalid when undefined", () => {
    expect(required(undefined)).toEqual({
      valid: false,
      message: "Required",
    });
  });

  it("is invalid when empty string", () => {
    expect(required("")).toEqual({
      valid: false,
      message: "Required",
    });
  });

  it("returns true false value is present", () => {
    expect(required("some value")).toEqual({ valid: true });
  });
});
```
\begin{center}
Tests for the required validator.
\end{center}

Basically, anything that does not evaluated to `true` is invalid; anything else is considered valid. We can get all the tests passing with this implementation:

```ts
export const required: Validator = (value: any): ValidationResult => {
  if (!value) {
    return {
      valid: false,
      message: `Required`,
    };
  }

  return { valid: true };
};
```
\begin{center}
required validator implementation.
\end{center}

I like to check for the null case first, when `value` is not defined. That's just a personal preference. When I see an `if` statement, boardly speaking, it means one of two things:

1. A `return` statement is coming.
2. Mutation - if you don't return something, and you don't have some sort of side effect (usually mutating or assigning something) the `if` statement can't possibly be doing anything.
\pagebreak

## The `validateRange` validator

`validateRange` is a bit more interesting. We need to support imperial and metric; we will build another function on top of `validateRange` that will pass in the correct constraints.

Let's start by identifying all the edge cases. If the minimum weight is 66 lb and the maximum weight is 440 lb, obviously 65 lb and 441 lb are invalid. 66 lb and 440 lb are valid, however, so we should make sure we add tests for those cases. 

This means we need 5 tests: 

1. The "happy" path, where the input is valid. 
2. Value is above the maximum value.
3. Value is below the minimum value.
4. Value is equal to the maximum value.
5. Value is equal to the minimum value.

For this function, it is safe to assume that only numbers can be passed as the input value; this validation is something we will handle at a higher level.

```ts
import { describe, it, expect } from "vitest";
import {
  required,
  validateRange
} from './form.js'

describe('required' () => {
  // ...
})

describe("validateRange", () => {
  it("returns true when value is equal to min", () => {
    expect(validateRange(5, { min: 5, max: 10 })).toEqual({
      valid: true,
    });
  });

  it("returns true when value is between min/max", () => {
    expect(validateRange(7, { min: 5, max: 10 })).toEqual({
      valid: true,
    });
  });

  it("returns true when value is equal to max", () => {
    expect(validateRange(10, { min: 5, max: 10 })).toEqual({
      valid: true,
    });
  });

  it("returns false when value is less than min", () => {
    expect(validateRange(4, { min: 5, max: 10 })).toEqual({
      valid: false,
      message: "Must be between 5 and 10",
    });
  });

  it("returns false when value is greater than max", () => {
    expect(validateRange(11, { min: 5, max: 10 })).toEqual({
      valid: false,
      message: "Must be between 5 and 10",
    });
  });
});
```
\begin{center}
Tests for the validateRange validator.
\end{center}

I think the tests are simple enough to have everything in a single `expect` statement. If the tests were more complex, I'd probably assign the result of `validateRange()` to a variable (I like to call it `actual`) and pass that to the `expect` assertion. More on structuring larger, more complex tests later.

The implementation is much less code than the tests; this is not unusual.

```ts
interface RangeRule {
  min: number;
  max: number;
}

export const validateRange: Validator = (
  value: number,
  { min, max }: RangeRule
): ValidationResult => {
  if (value < min || value > max) {
    return {
      valid: false,
      message: `Must be between ${min} and ${max}`,
    };
  }

  return { valid: true };
};
```
\begin{center}
validateRange validator implementation.
\end{center}

Again, I like to have the validation at the start of the function.
\pagebreak

## Building `applyRules`

Now we have written our little validation framework (well, two functions), it's time to see if we can combine them together. One of the requirements is to validate a patient's weight. It:

- cannot be null
- if metric, between 30 and 200
- if imperial, between 66 and 440

I don't want to define `interface Patient` yet, though. We will first add a `applyRules` function, which will let us combine multiple validators (in this case, two, but probably more in the future) to a single field.

Since we are supporting imperial and metric, we will be passing one set of constraints as a parameter to `validateRange`. Dealing with which one is selected will be done later on, in the UI layer. 

There are several scenarios `applyRules` must consider:

1. The happy path when all validator(s) return true.
2. When one or more validators returns false.

I don't feel the need to add tests for all the cases as we did with `validateRange`, since we already tested that thoroughly.

```ts
import { describe, it, expect } from "vitest";
import {
  required,
  validateRange,
  isFormValid,
  applyRules,
  Validator,
} from "./form.js";

describe("required", () => {
  // ...
});

describe("validateRange", () => {
  // ...
});

describe("applyRules", () => {
  it("returns invalid for missing required input", () => {
    const actual = applyRules(required(""));

    expect(actual).toEqual({ valid: false, message: "Required" });
  });

  it("returns invalid when outside range", () => {
    const constraints = { min: 10, max: 30 };
    const actual = applyRules(validateRange(9, constraints));

    expect(actual).toEqual({
      valid: false,
      message: "Must be between 10 and 30",
    });
  });

  it("returns invalid when at least one validator is invalid", () => {
    const alwaysValid: Validator = () => ({ valid: true });
    const neverValid: Validator = () => ({
      valid: false,
      message: "Invalid!",
    });

    const actual = applyRules(alwaysValid(), neverValid());

    expect(actual).toEqual({ valid: false, message: "Invalid!" });
  });

  it("returns true when all validators return true", () => {
    const alwaysValid: Validator = () => ({ valid: true });

    const actual = applyRules(alwaysValid());

    expect(actual).toEqual({ valid: true });
  });
});

```
\begin{center}
Tests for the applyRules function.
\end{center}

Since some of the tests are a bit more complex, I decided to assign the result to `actual`, and assert against that. I think this makes it more clear. 

We don't need to use the specific constraints for pounds and kilograms outlined in the table earlier. As long as the tests pass with the constraints we pass in here, we can be confident `applyRules` and `validateRange` will work correctly for any given set of `min/max` constraints.

I also left a blank line between the body of the test and the assertion. This is a personal preference, loosely inspired by the three phases of a test: *arrange*, *act* and *assert*. We will talk about those later. 

You don't have to write your tests like this. I find it useful to think in terms of "doing things" (eg, creating some variables, calling some functions) and asserting (where we say "given this scenario, this should happen").

Personal philosophy aside - the implementation, again, is much shorter than the test code. Notice a pattern? It's common for the test code to be longer than the implementation. It might feel a little strange at first, but it's not a problem and expected for complex logic.

```ts
export function applyRules(
  ...results: ValidationResult[]
): ValidationResult {
  return results.find((result) => !result.valid) ?? { valid: true };
}
```
\begin{center}
Composing multiple validators with `applyRules`.
\end{center}

If `results` contains at least one entry where `!valid`, the form is in an error state. Otherwise, we assume everything is correct and return `{ valid: true }`.




## The Form Object and Full Form Validation

We have completed all the validations for each field. Let's think about the structure of the form now. 

We have two fields: `name` and `weight`. 

1. `name` is a string. 
2. `weight` is a number with associated units. 

These are the *inputs*. It should have this shape:

```ts
// definition
export interface Patient {
  name: string;
  weight: {
    value: number;
    units: "kg" | "lb";
  };
}

// usage
const patientForm: Patient = {
  name: 'John',
  weight: {
    value: 445,
    units: 'lb'
  }
}
```
\begin{center}
Object describing the patient.
\end{center}

Given an input (a `patientForm`), we can valid each field. Fields when validated are either `{ valid: true }` or `{ valid: false, message: '...' }`. So the form and validity interfaces could look like this:


```ts
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
\begin{center}
Example usage of the validateForm function we will be writing.
\end{center}

We will need two functions: 

1. `isFormValid`, to tell us if the form is valid or not. 
2. `patientForm`, which handles figuring out the correct weight units, and calling all the validators. It will use `applyRules`.

Let's start with the tests for `isFormValid`. The form is considered valid when all fields are `valid`, so we only need two tests: the case where all fields are valid, and the case where at least one field is not: 

```ts
import { describe, it, expect } from "vitest";
import {
  required,
  validateRange,
  validateMeasurement,
  isFormValid
} from './form.js'

describe('required' () => {
  // ...
})

describe('validateRange', () => {
  // ...
})

describe('applyRules', () => {
  // ...
})

describe("isFormValid", () => {
  it("returns true when all fields are valid", () => {
    const form = {
      name: { valid: true },
      weight: { valid: true },
    };

    expect(isFormValid(form)).toBe(true);
  });

  it("returns false when any field is invalid", () => {
    const form = {
      name: { valid: false },
      weight: { valid: true },
    };

    expect(isFormValid(form)).toBe(false);
  });
});
```
\begin{center}
Testing isFormValid.
\end{center}

The implementation is simple:

```ts
export function isFormValid<
  T extends Record<string, ValidationResult>
>(form: T): boolean {
  const invalidField = Object.values(form).find((res) => !res.valid);
  return invalidField ? false : true;
}
```
\begin{center}
isFormValid implementation.
\end{center}

This solution is a bit tricky - it uses `T extends Record<...>`. We are saying this function can work with *any* form, as long as all the properties use the `ValidationResult` interface we defined earlier.

We've written a good amount of code by this piont - but we are still yet to write any application specific logic! We are still working on our form validation logic. It's generic and reusable, which is great!

The last piece of code we need to (finally) complete the actual business requirement is going to be named `patientForm`. It's a function takes an object the shape of the `Patient` interface we defined earlier. It returns the validation result for each field. 

We will want to have quite a few tests here, to make sure we don't miss anything. The cases I can think of are:

1. Happy path: all inputs are valid
2. Patient name is null
3. Patient weight is outside constraints (imperial)
4. Patient weight is outside constraints (metric)
\pagebreak

```ts
import {
  required,
  validateRange,
  validateMeasurement,
  isFormValid,
  patientForm
} from './form.js'

// ... other tests ...

describe("patientForm", () => {
  const validPatient: Patient = {
    name: "test patient",
    weight: { value: 100, units: "kg" },
  };

  it("is valid when form is filled out correctly", () => {
    const form = patientForm(validPatient);

    expect(form.name).toEqual({ valid: true });
    expect(form.weight).toEqual({ valid: true });
  });

  it("is invalid when name is null", () => {
    const form = patientForm({ ...validPatient, name: "" });

    expect(form.name).toEqual({ valid: false, message: "Required" });
  });

  it("validates weight in imperial", () => {
    const form = patientForm({
      ...validPatient,
      weight: {
        value: 65,
        units: "lb",
      },
    });

    expect(form.weight).toEqual({
      valid: false,
      message: "Must be between 66 and 440",
    });
  });

  it("validates weight in metric", () => {
    const form = patientForm({
      ...validPatient,
      weight: {
        value: 29,
        units: "kg",
      },
    });

    expect(form.weight).toEqual({
      valid: false,
      message: "Must be between 30 and 200",
    });
  });
});
```
\begin{center}
Testing patientForm.
\end{center}

The test code is quite long! The implementation is trivial, however. In this example, I am just hard-coding the weight constraints in an object called `limits`. In a real-world system, you would likely get these from an API and pass them down to the `patientForm` function. I would definitely keep this in a separate place to the component that renders the actual form, for the reasons the previous chapter abot props discussed.

```ts
const limits = {
  kg: { min: 30, max: 200 },
  lb: { min: 66, max: 440 },
};

type PatientForm = {
  [k in keyof Patient]: ValidationResult;
};

export function patientForm(patient: Patient): PatientForm {
  return {
    name: required(patient.name),
    weight: applyRules(
      required(patient.weight.value),
      validateRange(
        patient.weight.value,
        limits[patient.weight.units]
      )
    ),
  };
}
```
\begin{center}
Implementing patientForm.
\end{center}

This completes the business logic for the patient form - noticed we haven't written and Vue components yet? That's because we are adhering to one of our goals; *separation of concerns*, and isolating the business logic entirely. 

`patientForm` is the "glue" code - the line between our application logic (something to do with patients) and our generic form logic (which knows nothing about the outside word, just about forms and validation).

In general, if there is any kind of generic complexity (such a form validation), I will write this separately and be careful to keep in generic. Or - more realstically - use a prebuild solution from npm - those are always generic by nature. 

Either way, npm module or otherwise, I like to keep the business logic as a simple and thin layer on top of any generic complexity. You do need to exercise some caution, though; making your logic *too* generic and reusable can be problematic in terms of TypeScript usage (you end up writing incredibly complex and difficult to understand type definitions, with heavy use of generics) and difficult to maintain or patch if a bug occurs.

## Writing the UI Layer

Now the fun part - writing the UI layer with Vue. Although I think TDD is a great fit for business logic, I generally do not use TDD for my component tests.

I like to start by thinking about how I will manage the state of my component. Let's use the Composition API and `<script setup>`. This is how all the examples in this book will be presented, and how I write all my Vue code in the real world.

```html
<script lang="ts" setup>
import { reactive, computed } from "vue";
import { isFormValid, patientForm, Patient } from "./form.js";

const emit = defineEmits<{
  (e: 'submit', patient: Patient): void
}>()

const form = reactive<Patient>({
  name: '',
  weight: {
    value: 0,
    units: 'kg'
  }
})

const validatedForm = computed(() => {
  return patientForm(form)
})

const submit = () => {
  emit('submit', form)
}

const valid = computed(() => isFormValid(validatedForm.value))
</script>
```
\begin{center}
Integrating the form business logic and the Vue UI layer.
\end{center}

I decided to keep the state in a `reactive` object. Both the `valid` state and `validateForm` are `computed` values - we want the validation and form state to update reactively when any value in the form changes.

Let's add the `<template>` part now - it's very simple, just good old HTML.
\pagebreak

```html
<template>
  <div class="form-wrapper">
    <h3>Patient Data</h3>
    <form @submit.prevent="submit">
      <div class="field">
        <div v-if="!validatedForm.name.valid" class="error" role="error">
          {{ validatedForm.name.message }}
        </div>
        <label for="name">Name</label>
        <input id="name" name="name" v-model="form.name" />
      </div>
      <div class="field">
        <div v-if="!validatedForm.weight.valid" class="error" role="error">
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
        <button type="submit" :disabled="!valid">Submit</button>
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
```
\begin{center}
A simple template with form v-model bindings.
\end{center}

I added the `<pre>` block for some debugging. You can grab the CSS from the source code (or write your own - mine leaves much to be desired). Everything works!

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{ss-done-clean.png}
  \caption{Validation debug info}
  \label{fig}
\end{figure}
\pagebreak

## Some Basic UI Tests

We can add some basic component tests using either a browser based runner like Cypress or Playwright, or in the terminal using Jest / Vitest and Vue Test Utils / Testing Library. I tend to use Cypress, since I can exercise as much of the component as possible with as little code as possible. It's very expressive.

```ts
import Form from "./Form.vue"

describe("Form", () => {
  it("fills out form", () => {
    cy.mount(Form)

    // disabled due to errors
    cy.get('[role="error"]').should('have.length', 2)
    cy.get("button[type='submit']").should('be.disabled')

    cy.get("input[name='name']").type("lachlan")
    cy.get('[role="error"]').should('have.length', 1)
    cy.get("input[name='weight']").type("30")
    cy.get('[role="error"]').should('have.length', 0)

    cy.get('#weight-units').select("lb")
    // 30 lb is not valid! Error shown
    cy.get('[role="error"]').should('have.length', 1)
      .should('have.text', 'Must be between 66 and 440')

    cy.get("input[name='weight']").clear().type("100")
    cy.get("button[type='submit']").should('be.enabled')
  })
})
```
\begin{center}
Testing the component layer with Cypress Component Testing.
\end{center}

If you prefer a terminal based runner, you could use Jest or Vitest (both are very similar) along with Vue Testing Library, which uses Vue Test Utils under the hood.

```ts
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from '@testing-library/vue'
import Form from "./Form.vue"

describe("Form.vue", () => {
  it('fills out form correctly', async () => {
    render(Form)

    await fireEvent.update(screen.getByLabelText('Name'), 'lachlan') 
    await fireEvent.update(screen.getByDisplayValue('kg'), 'lb')
    await fireEvent.update(screen.getByLabelText('Weight'), '150')

    expect(screen.queryByRole('error')).toBe(null)
  })

  it('shows errors for invalid inputs', async () => {
    render(Form)

    await fireEvent.update(screen.getByLabelText('Name'), '')
    await fireEvent.update(screen.getByLabelText('Weight'), '5')
    await fireEvent.update(screen.getByDisplayValue('kg'), 'lb')

    expect(screen.getAllByRole('error')).toHaveLength(2)
  })
})
```
\begin{center}
Testing the component layer with Testing Library.
\end{center}

Since these tests are a little larger, I am making the separation between each part clear. I like to write my tests in this structure (I don't actually include "Arrange" and "Act" and "Assert" in my tet code - those comments are just to make this example clear):

```ts
it('...', async () => {
  // Arrange - this is where we set everything up
  render(Form)

  // Act - do things! 
  // Call functions
  // Assign values
  // Simulate interactions
  await fireEvent.update(screen.getByLabelText('Name'), 'lachlan') 

  // Assert
  expect(...).toEqual(...)
})
```
\begin{center}
Anatomy of a test - arrange, act, assert.
\end{center}

We don't have any tests to ensure the `<button>` is correctly disabled - see below for more.

## Improvements and Conclusion

The goal here wasn't to build the *perfect* form but illustrate how to separate your form validation and business logic from the component and UI layer. 

As it stands, you can enter any string into the weight field and it will be considered valid - not ideal, but also trivial to fix. A good exercise would be to write some tests to ensure the input is a number, and if not, return a useful error message. We also haven't got any tests to ensure the `<button>` is correctly disabled.

## Exercises

- Add a test to ensure that any non-numeric values entered into the `weight` field cause the field to become invalid and show a "Weight must be a number" error.
- Add a `@submit.prevent` listener to `<form>`. When the form is submitted, emit an event with the `patientForm`.
 - Submit the form using Testing Library and assert the correct event and payload are emitted.

You can find the completed source code (including exercises) in the [GitHub repository under examples/form-validation](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

\pagebreak