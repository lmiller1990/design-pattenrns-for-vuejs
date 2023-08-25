# Renderless Components

You can find the completed source code in the [GitHub repository under examples/renderless-password](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

______


The primary way you reuse components in Vue is *slots*. This works great for a lot of cases, but sometimes you need *more* flexibility.

One example is you have some complex logic that needs to be reused in two different interfaces. One way to reuse complex logic with several different interfaces is the *renderless* component pattern.

In this section we will build the following component, a password strength form:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./ss-done.png}
  \caption{Completed Password Complexity Component}
  \label{fig}
\end{figure}

There are a few requirements. We'd like to publish this on npm; to make it as flexible as possible, we will use a technique known as a "renderless" component. This means we will not ship and specific markup. Instead, the developer will need to provide their own. 

This means we will work with a `<slot>`, but provide no other markup (such as `<div>` etc). The `<slot>` will be replaced by whatever the user wants. This will allow developers to fully customize the markup and style as they see fit. We are only providing the logic. We definitely won't be including any styling. 

This is a useful technique, especially when building a component library. It allows greatly customization without the need for consumers to awkwardly override CSS classes.

We would like to support the following features:

- A `matching` variable that returns true if the password and confirmation match.
- Support a `minComplexity` prop; by default, the minimum complexity is 0 and the maximum complexity is 3. This is represented by the yellow bar above the submit button in the screenshot above.
- support a custom complexity algorithm (eg, require specific characters or numbers in the password).
- Expose a `valid` value which is true when the password and confirmation match and the password meets the minimum complexity.

Let's get started.

## Rendering without Markup

All the code will be in one file - an SFC named `<RenderlessPassword>`, that integrates the logic with some reactivity APIs and the the consumer markup. We could separate out logic into another module, but I don't think it makes sense here - the entire point of this exercise is to build a renderless *Vue* component. There are libraries that separate the logic, such as the Headless UI project. They re-use the same logic for their renderless Vue and React components!

*Note*: A previous edition of this book didn't use an SFC at all. Instead, we returned a render function from `setup` like this:

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

The standard was to author components is now `<script setup>`, which does not support using a render function returned from `setup`, so I've chosen to go with that approach instead. We do discuss render functions in detail in the "Render Functions" chapter, if you prefer not to use `<template>` and `<script setup>`.

Using `<script setup>` looks like this:

```html
<template>
  <slot
    :complexity="complexity"
  />
</template>

<script lang="ts" setup>
const complexity = 5
</script>
```
\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./ss1.png}
  \caption{Using `<slot>` to let user inject markup}
  \label{fig}
\end{figure}
_____

Let's see this in action but using the component in a regular SFC. The final usage will look like below. I'm creating a test component to use to try things out - mine is called `<RenderlessPasswordApp>`; find the completed version in the source code.

```html
<template>
  <RenderlessPassword
    v-slot="{ 
      complexity
    }"
  >
    {{ complexity }}
  </RenderlessPassword>
</template>

<script lang="ts" setup>
import RenderlessPassword from "./RenderlessPassword.vue";
</script>
```
\begin{center}
Trying out the renderless password.
\end{center}

We can destructure the object passed received from `v-slot`, and are free to use them however we like in the `<template>`. Great! This currently just renders a 5; not very interesting, but it illustrates the idea of exposing properties via `v-slot`.

## Adding Password and Confirmation Inputs

The next feature we will add is the password and confirmation fields. We will also expose a `matching` property, to see if the password and confirmation are the same. 

First, update `isMatching` to receive a `password` and `confirmation` prop. We also add the logic to see if the passwords match:

```ts
function isMatching(password: string, confirmation: string) {
  if (!password || !confirmation) {
    return false
  }
  return password === confirmation
}
```
\begin{center}
Checking if password and confirmation match.
\end{center}

I implemented `isMatching` as a separate function, which I will wrap in `computed` soon. You could inline the entire logic in the computed property, too. 

I like to keep the logic separate. This makes it super easy to test in isolation. This could also be considered an over optimization. One downside is we do incur an additional function declaration. You could inline all the code inside of `<RenderlessPassword>`, if you prefer that style. For the purpose of this chapter, though, I'm going to keep the logic separate, and wrap the logic using reactivity APIs, if for nothing but to promote a mindset.

Updating `<RenderlessPassword>` to use `isMatching` gives us:

```html
<template>
  <slot :matching="matching" />
</template>

<script lang="ts" setup>
import { computed } from "vue";

const props = defineProps<{
  password: string;
  confirmation: string;
}>();

function isMatching(password: string, confirmation: string) {
  if (!password || !confirmation) {
    return false
  }
  return password === confirmation
}

const matching = computed(() =>
  isMatching(props.password, props.confirmation)
);
</script>
```

I removed `complexity` for now; we will come back to this. We aren't using it right now to check the passwords.

Let's update the test component that uses `<RenderlessPassword>`:

```html
<template>
  <RenderlessPassword
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
  </RenderlessPassword>
</template>

<script lang="ts" setup>
import { reactive } from "vue";
import RenderlessPassword from "./RenderlessPassword.vue";

const input = reactive({
  password: "",
  confirmation: "",
});
</script>
```
\begin{center}
password and confirmation are saved in a reactive object.
\end{center}

The main change is we now have a `reactive` input that has `password` and `confirmation` properties. You could have used two `ref`s; one for `password` and one for `confirmation`. I like to group related properties using `reactive`, so that's why I am using `reactive` here.

I also added some extra `<div>` elements and classes - those are mainly for styling. You can grab the final styles from the source code. It looks like this:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./ss2.png}
  \caption{Rendering Inputs and Debug Info}
  \label{fig}
\end{figure}

This works great! The complexity and business logic is nicely abstracted away in `RenderlessPassword`. The developer can use the logic to style the component to suit their application and use case.

Let's keep going and add a customizable `complexity` feature, to rate whether a password is sufficiently complex.

## Adding Password Complexity

For now, we will implement a very naive complexity check. Most developers will want to customize this. For this example, we will keep it simple and choose an algorithm that will rate complexity based on the length of the password:

- high: length >= 10
- mid: length >= 7
- low: length >= 5

As with `isMatching`, we will make a `calcComplexity` a pure function. Decoupled, deterministic, and easily testable, if need be.

```ts
import { computed } from 'vue'

function isMatching() {
  // ...
}

function calcComplexity(val: string) {
  if (!val) {
    return 0
  }

  if (val.length > 10) {
    return 3
  }
  if (val.length > 7) {
    return 2
  }
  if (val.length > 5) {
    return 1
  }

  return 0
}
```
\begin{center}
Adding a simple calcComplexity function.
\end{center}

And the associated component:

```html
```

And usage:

```html
<template>
  <template>
    <slot :matching="matching" :complexity="complexity" />
  </template>
</template>

<script lang="ts" setup>
import { computed } from "vue";

const props = defineProps<{
  password: string;
  confirmation: string;
}>();

function calcComplexity(val: string) {
  // shown above
}

const complexity = computed(() => calcComplexity(props.password));

function isMatching(password: string, confirmation: string) {
  // ...
}

const matching = computed(() =>
  // ...
);
</script>
```

Everything is very similar to what we did with the `isMatching` function and `matching` computed property. We will add support for a custom complexity function in the future passed via a prop. 

Let's try it out:

```html
<template>
  <RenderlessPassword
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
    </div>

    <div class="complexity-field">
      <div
        class="complexity"
        :class="complexityStyle(complexity)"
      />
    </div>

    <p>Matches: {{ matching }}</p>
    <p>Complexity: {{ complexity }}</p>

    <p>Matches: {{ matching }}</p>

  </RenderlessPassword>
</template>

<script lang="ts" setup>
import { reactive } from "vue";
import RenderlessPassword from "./RenderlessPassword.vue";

const input = reactive({
  password: "",
  confirmation: "",
});

const complexityStyle = (complexity: number) => {
  if (complexity >= 3) {
    return 'high'
  }
  if (complexity >= 2) {
    return 'mid'
  }
  if (complexity >= 1) {
    return 'low'
  }

  return 'low'
}
</script>

<style>
  /* omitted for brevity. See source code */
</style>
```
\begin{center}
Showing the complexity of the password.
\end{center}

I also added a `complexityStyle` function to apply a different CSS class depending on the complexity. `high`, `mid` and `low` are CSS classes - you can style it how you like, or see the source code for how I've styled it. 

The application now looks like this:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./ss3.png}
  \caption{Complexity Indicator}
  \label{fig}
\end{figure}

## Computing Form Validity 

Let's add the final feature: a button that is only enabled when a `valid` property is `true`. The `valid` property is exposed by the `<RenderlessPassword>` and accessed via `v-slot`. For a password to be valid, the password and confirmation must match, and the complexity must exceed the minimum complexity. We will also have a default minimum complexity.

```html
<template>
  <slot
    :matching="matching"
    :complexity="complexity"
    :valid="valid"
  />
</template>

<script lang="ts" setup>
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    password: string;
    confirmation: string;
    minComplexity?: number;
  }>(),
  {
    minComplexity: 2,
  }
);

function calcComplexity(val: string) {
  // ...
}

const complexity = computed(() => calcComplexity(props.password));

function isMatching(password: string, confirmation: string) {
  if (!password || !confirmation) {
    return false;
  }
  return password === confirmation;
}

const matching = computed(() =>
  isMatching(props.password, props.confirmation)
);

const valid = computed(() => {
  return matching.value && complexity.value >= props.minComplexity;
});
</script>
```
\begin{center}
Validating the form with a valid computed property, derived from matching and complexity.
\end{center}

I added a `valid` computed property, based on the result of `complexity` and `matching`. You could make a separate function for this if you wanted to test it in isolation. If the component became more complex, I probably would; alternatively, because this one is simple, we can test this implicitly by binding `valid` to a button's `disabled` attribute, like we are about to do, and then assert against the DOM that the attribute is set correctly.

Update the usage to include a `<button>` that binds to `valid`:

```html
<template>
  <RenderlessPassword
    :password="input.password"
    :confirmation="input.confirmation"
    v-slot="{ 
      matching,
      complexity,
      valid
    }"
  >
    <div class="wrapper">
      <!-- ... -->
      <div class="field">
        <button :disabled="!valid">Submit</button>
      </div>
    </div>

    <!-- ... -->
  </RenderlessPassword>
</template>
```
\begin{center}
Destructuring valid and binding to it.
\end{center}

Everything works! And we can easily move elements around to change the look and feel of `<RenderlessPassword>`.

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./ss-done.png}
  \caption{Completed Password Complexity Component}
  \label{fig}
\end{figure}

Just for fun, I tried making an alternative UI. All I had to do was move around some markup:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{./ss-alt.png}
  \caption{Alternative Password Complexity Component}
  \label{fig}
\end{figure}

See what else you can come up with. I think there is a lot of room for innovation with the renderless component pattern. There is at least one project using this pattern, Headless UI - check it out for more inspiration: https://headlessui.dev/.

## Exercises

This section intentionally omitted writing tests to focus on the concepts. Several techniques regarding tests were mentioned. For practice, try to write the following tests (find the solutions in the source code):

- Some tests using your favorite runner to assert the correct complexity class is assigned.
- Test that the button is disabled when appropriate.

You could also write some tests for the business logic, to make sure we didn't miss any edge cases:

- Test the `calcComplexity` and `isMatching` functions in isolation.

There are also some improvements you could try making:

- Allow the developer to pass their own `calcComplexity` function as a prop. Use this if it's provided.
- Support passing a custom `isValid` function, that receives `password`, `confirmation`, `isMatching` and `complexity` as arguments.

You can find the completed source code in the [GitHub repository under examples/renderless-password](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

\pagebreak
