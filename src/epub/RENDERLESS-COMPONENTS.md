# Renderless Components

You can find the completed source code in the [GitHub repository under examples/renderless-password](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code).

The primary way you reuse components in Vue is *slots*. This works great for a lot of cases, but sometimes you need *more* flexibility.

One example is you have some complex logic that needs to be reused in two different interfaces. One way to reuse complex logic with several different interfaces is the *renderless* component pattern.

In this section we will build the following component, a password strength form:

![Completed Password Complexity Component](./images/renderless-password/ss-done.png)

There are a few requirements. We'd like to publish this on npm; to make it as flexible as possible, we will use a technique known as a "renderless" component. This means we will not ship and specific markup. Instead, the developer will need to provide their own. 

This means we will work with a `render` function, the low-level JavaScript that `<template>` is compiled to. This will allow developers to fully customize the markup and style as they see fit.

We would like to support the following features:

- A `matching` variable that returns true if the password and confirmation match.
- Support a `minComplexity` prop; by default, the minimum complexity is 0 and the maximum complexity is 3. This is represented by the yellow bar above the submit button in the screenshot above.
- support a custom complexity algorithm (eg, require specific characters or numbers in the password).
- Expose a `valid` value which is true when the password and confirmation match and the password meets the minimum complexity.

Let's get started.

## Rendering without Markup

I will work out of a file called `renderless-password.js`. That's right - not a `vue` file. No need - we won't be shipping a `<template>`.

```js
export default {
  setup(props, { slots }) {
    return () => slots.default({
      complexity: 5
    })
  }
}
```
\begin{center}
Renderless functions return slots.default() in setup or render.
\end{center}

This is how renderless components work; calling `slots` with an object will expose whatever properties are passed to the object via the `v-slot` directive. 

Let's see this in action but using the component in a regular `vue` file. Mine is called `app.vue`; find the completed version in the source code.

```html
<template>
  <renderless-password 
    v-slot="{ 
      complexity
    }"
  >
    {{ complexity }}
  </renderless-password>
</template>

<script>
import RenderlessPassword from './renderless-password.js'

export default {
  components: { 
    RenderlessPassword
  }
}
</script>
```
\begin{center}
Trying out the renderless-password.
\end{center}

We can destructure the object passed to `slots.default()` in `v-slot`, and are free to use them however we like in the `<template>`. Great! This currently just renders a 5; not very interesting, but it illustrates the idea of exposing properties via `v-slot`.

![Rendering with slots.default() and v-slot](./images/renderless-password/ss1.png)

## Adding Password and Confirmation Inputs

The next feature we will add is the password and confirmation fields. We will also expose a `matching` property, to see if the password and confirmation are the same. 

First, update `renderless-password.js` to receive a `password` and `confirmation` prop. We also add the logic to see if the passwords match:

```js
import { computed } from 'vue'

export function isMatching(password, confirmation) {
  if (!password || !confirmation) {
    return false
  }
  return password === confirmation
}

export default {
  props: {
    password: {
      type: String
    },
    confirmation: {
      type: String
    }
  },

  setup(props, { slots }) {
    const matching = computed(() => isMatching(
      props.password, props.confirmation))

    return () => slots.default({
      matching: matching.value
    })
  }
}
```
\begin{center}
Checking if password and confirmation match.
\end{center}

You may notice I implemented `isMatching` as a separate function, which I've exported. I consider this part of the *business logic*, not the UI, so I like to keep it separate. This makes it super easy to test, and also keeps my `setup` function nice and simple. You could declare it inside of `setup` if you prefer that style.

I also removed `complexity: 5` from `slots.default()`; we will come back to this, but we aren't using it right now.

One thing that might be a little surprising if you need to pass `matching.value` to `slots.default()`. This is because I would like to let the developer destructure `matching` by doing `v-slot={ matching }"` as opposed to `v-slot="{ matching: matching.value }"`; the former feels cleaner to me.

Let's try it out:

```html
<template>
  <renderless-password 
    :password="input.password"
    :confirmation="input.confirmation"
    v-slot="{ 
      matching
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
    </div>

    <p>Matches: {{ matching }}</p>

  </renderless-password>
</template>

<script>
import { reactive } from 'vue'
import RenderlessPassword from './renderless-password.js'

export default {
  components: { 
    RenderlessPassword
  },

  setup(props) {
    const input = reactive({
      password: '',
      confirmation: ''
    })

    return {
      input
    }
  }
}
</script>
```
\begin{center}
password and confirmation are saved in a reactive object.
\end{center}

The main change is we now have a `reactive` input that has `password` and `confirmation` properties. You could have used two `ref`s; one for `password` and one for `confirmation`. I like to group related properties using `reactive`, so that's why I am using `reactive` here.

I also added some extra `<div>` elements and classes - those are mainly for styling. You can grab the final styles from the source code. It looks like this:

![Rendering Inputs and Debug Info](./images/renderless-password/ss2.png)

This works great! The complexity and business logic is nicely abstracted away in `renderless-password`. The developer can use the logic to style the component to suit their application and use case.

Let's keep going and add a customizable `complexity` feature, to rate whether a password is sufficiently complex.

## Adding Password Complexity

For now, we will implement a very naive complexity check. Most developers will want to customize this. For this example, we will keep it simple and choose an algorithm that will rate complexity based on the length of the password:

- high: length >= 10
- mid: length >= 7
- low: length >= 5

As with `isMatching`, we will make a `calcComplexity` a pure function. Decoupled, deterministic, and easily testable.

```js
import { computed } from 'vue'

export function isMatching() {
  // ...
}

export function calcComplexity(val) {
  if (!val) {
    return 0
  }

  if (val.length >= 10) {
    return 3
  }
  if (val.length >= 7) {
    return 2
  }
  if (val.length >= 5) {
    return 1
  }

  return 0
}

export default {
  props: {
    // ...
  },

  setup(props, { slots }) {
    const matching = computed(() => isMatching(
      props.password, props.confirmation))
    const complexity = computed(() => calcComplexity(
      props.password))

    return () => slots.default({
      matching: matching.value,
      complexity: complexity.value
    })
  }
}
```
\begin{center}
Adding a simple calcComplexity function.
\end{center}

Everything is very similar to what we did with the `isMatching` function and `matching` computed property. We will add support for a custom complexity function in the future passed via a prop. 

Let's try it out:

```html
<template>
  <renderless-password 
    :password="input.password"
    :confirmation="input.confirmation"
    v-slot="{ 
      matching,
      complexity
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
      <div class="complexity-field">
        <div
          class="complexity"
          :class="complexityStyle(complexity)"
        />
      </div>
    </div>

    <p>Matches: {{ matching }}</p>
    <p>Complexity: {{ complexity }}</p>

  </renderless-password>
</template>

<script>
import { reactive } from 'vue'
import RenderlessPassword from './renderless-password.js'

export default {
  components: { 
    RenderlessPassword
  },

  setup(props) {
    const input = reactive({
      password: '',
      confirmation: ''
    })

    const complexityStyle = (complexity) => {
      if (complexity >= 3) {
        return 'high'
      }
      if (complexity >= 2) {
        return 'mid'
      }
      if (complexity >= 1) {
        return 'low'
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
/**
  some styles excluded for brevity
  see source code for full styling
*/
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
</style>
```
\begin{center}
Styling the form based using a computed style.
\end{center}

I also added a `complexityStyle` function to apply a different CSS class depending on the complexity. I have consciously chosen *not* to define and export this function outside of `setup` - instead, I defined it *inside* of `setup`. 

The reason for this is I see no value in testing `complexityStyle` separately to the component - knowing that the correct class (`high`, `mid`, or `low`) is returned is not enough. To fully test this component, I'll need to assert against the DOM. 

You could still export `complexityStyle` and test it individually, but you still need to test that the correct class is applied (eg, you could forget to code `:class="complexityStyle(complexity)"`, for example, and the `complexityStyle` test would still pass).

By writing a test and asserting against the DOM, you test `complexityStyle` implicitly. The test would look something like this (see the source code for the full working example):

```js
it('meets default requirements', async () => {
  render(TestComponent)

  await fireEvent.update(
    screen.getByLabelText('Password'), 'this is a long password')
  await fireEvent.update(
    screen.getByLabelText('Confirmation'), 'this is a long password')

  expect(screen.getByRole('password-complexity').classList)
    .toContain('high')
  expect(screen.getByText('Submit').disabled).toBeFalsy()
})
```
\begin{center}
Testing the correct complexity class is included.
\end{center}

The application now looks like this:

![Complexity Indicator](./images/renderless-password/ss3.png)

## Computing Form Validity 

Let's add the final feature: a button that is only enabled when a `valid` property is `true`. The `valid` property is exposed by the `<renderless-password>` and accessed via `v-slot`.

```js
import { computed } from 'vue'

export isMatching() {
  // ...
}

export calcComplexity() {
  // ...
}

export default {
  props: {
    minComplexity: {
      type: Number,
      default: 3
    },
    // ... other props ...
  },

  setup(props, { slots }) {
    const matching = computed(() => isMatching(
          props.password, props.confirmation))
    const complexity = computed(() => calcComplexity(
          props.password))
    const valid = computed(() => 
        complexity.value >= props.minComplexity && 
        matching.value)

    return () => slots.default({
      matching: matching.value,
      complexity: complexity.value,
      valid: valid.value
    })
  }
}
```
\begin{center}
Validating the form with a valid computed property, derived from matching and complexity.
\end{center}

I added a `valid` computed property, based on the result of `complexity` and `matching`. You could make a separate function for this if you wanted to test it in isolation. If I was going to distribute this npm, I probably would; alternatively, we can test this implicitly by binding `valid` to a button's `disabled` attribute, like we are about to do, and then assert against the DOM that the attribute is set correctly.

Update the usage to include a `<button>` that binds to `valid`:

```html
<template>
  <renderless-password 
    :password="input.password"
    :confirmation="input.confirmation"
    v-slot="{ 
      matching,
      complexity,
      valid
    }"
  >
    <div class="wrapper">
      <! -- ... omitted for brevity ... --> 
      <div class="field">
        <button :disabled="!valid">Submit</button>
      </div>
    </div>

    <p>Matches: {{ matching }}</p>
    <p>Complexity: {{ complexity }}</p>

  </renderless-password>
</template>
```
\begin{center}
Destructuring valid and binding to it.
\end{center}

Everything works! And we can easily move elements around to change the look and feel of `<renderless-password>`.

![Completed Password Complexity Component](./images/renderless-password/ss-done.png)

Just for fun, I tried making an alternative UI. All I had to do was move around some markup:

![Alternative Password Complexity Component](./images/renderless-password/ss-alt.png)

See what else you can come up with. I think there is a lot of room for innovation with the renderless component pattern. There is at least one project using this pattern, Headless UI - check it out for more inspiration: https://headlessui.dev/.

## Exercises

This section intentionally omitted writing tests to focus on the concepts. Several techniques regarding tests were mentioned. For practice, try to write the following tests (find the solutions in the source code):

- Some tests using Testing Library to assert the correct complexity class is assigned.
- Test that the button is appropriately disabled.

You could also write some tests for the business logic, to make sure we didn't miss any edge cases:

- Test the `calcComplexity` and `isMatching` functions in isolation.

There are also some improvements you could try making:

- Allow the developer to pass their own `calcComplexity` function as a prop. Use this if it's provided.
- Support passing a custom `isValid` function, that receives `password`, `confirmation`, `isMatching` and `complexity` as arguments.

You can find the completed source code in the [GitHub repository under examples/renderless-password](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

\pagebreak
