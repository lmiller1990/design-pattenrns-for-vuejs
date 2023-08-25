# Emitting Events

You can find the completed source code in the [GitHub repository under examples/events](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

______

Vue's primary mechanic for passing data *down* to components is `props`. In contrast, when components needs to communicate with another component higher in the hierarchy, you do so by *emitting events*. 

## Defining Events

When using Script Setup, events are defined with the `defineEmits` compiler macro:

```ts
const emits = defineEmits<{
  (event: 'greet', message: string): void
}>()
```

Traditionally this is assigned to a variable name `emit` or `emits`.

You can then emit an event:

```ts
emits('greet', 'hello!')
```

The nice thing about `defineEmits` is type safety; as long as you are using TypeScript (which you should be!) you will get a compiler error if you emit a event that isn't defined, or emit an event with an incorrect payload.

You can provide any number of positional arguments:

```ts
const emits = defineEmits<{
  (event: "signup", username: string, password: string): void
}>();
```

Although if there is a large number of values in the payload (say, 3 or more) or some logical grouping (in this case, a user) I much prefer to group them using an object:

```ts
const emits = defineEmits<{
  (event: "signup", user: { username: string, password: string }): void
}>();
```

I find this both less error prone and easier to understand. More often than not, I end up extracting an `interface` or `type` based on these arguments, as you will soon see.

## Responding to Events

Defining and emitting events is all good and well, but in general you won't just do this arbitrarily, but in response to a user doing something, like clicking, typing, or something else. 

You can listen for an event using `v-on:event`, or better yet, the shorthand - `@event`. Most people reading this book will know this - but there's some more intricacies that are worth understanding. There are *hundreds* of events defined by the Web API. You've probably encountered some of the more common events, like `click`:

```html
<button @click="foo()">Button</button>
```

But how about `canplaythrough`?

```html
<video @canplaythrough="autoplay()"></video>
```

Once the `<video>` is ready, as indicated by the `canplaythrough` event, you can respond appropriately. There are lots of events available for `HTMLVideoElement`. Making a really clean video player that uses the native events would be a good learning project. You can find a full list of native events [here](https://developer.mozilla.org/en-US/docs/Web/Events#event_listing): https://developer.mozilla.org/en-US/docs/Web/Events#event_listing.

You can respond to custom events in the same way as standard HTML events. Before we get into custom events, let's talk about native events a little more.

## The Secret Life of `@event` 

There's a neat little tool called the [Vue SFC Playground](https://play.vuejs.org/): https://play.vuejs.org/. It will let you prototype, and more importantly, see what your SFCs are compiled to.

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{events/sfc-playground.png}
  \caption{SFC Playground}
  \label{fig}
\end{figure}
\pagebreak

Let's take a look at `<Counter>`, which calls `foo` in three different ways:

```html
<script lang="ts" setup>
const emits = defineEmits<{
  (event: "greet", message: string): void
  (event: "signup", username: string, password: string): void
  (event: "signup", user: { username: string, password: string }): void
}>();

function count(...args: unknown[]) {
  console.log(args);
}
</script>

<template>
  <button @click="count">Count</button>
  <button @click="count()">Count</button>
  <button @click="$event => count($event)">Count</button>
</template>
```

The first `<button>` calls `count` without parenthesis - as a callback. If you've done React, it's similar to what you often see there:

```tsx
function Counter () {
  function count (...args) {
    console.log(args)
  }
  return <button onClick={count}>Count</button>
}
```

Both frameworks do the same thing, at least conceptually. If you pass a callback function to a native event, you get the native event as the first argument (unless you pass something else).

Vue will pass a native event. A `PointerEvent`, in fact, with `type: "click"`, `x` and `y` values, and various other interesting things. There isn't anything Vue specific about it. It's the raw HTML event from the underlying `<input>`. 

React is a little different. React will pass something they calla a `SyntheticBaseEvent`. React has it's own event system that wraps the native events. It does give you native event under the `nativeEvent` property, so it's there if you want it.

If you are familiar with standard JavaScript, Vue and React might actually surprise you. That's because Vue and React don't necessarily do what you'd expect, based on your knowledge of plain old HTML and JavaScript. 

Given this snippet of plain old HTML:

```html
<!-- Not a template. This is just HTML-->
<script>
  function count() {
    console.log(arguments)
  }
</script>
<button onclick="count">Counter</button>
```

Clicking this logs ... nothing. Changing it to `onclick="count()"` will call `count()`, but you won't get the native event. If you want that, you need to write some JavaScript:

```ts
document.querySelector('button').addEventListener('click', event => {
  // event is PointerEvent
})
```

This is what Vue and React are doing under the hood, eventually, if you go deep enough in the source code. You can see the [`addEventListener` function in the Vue source code here: https://github.com/vuejs/core/blob/3be4e3cbe34b394096210897c1be8deeb6d748d8/packages/runtime-dom/src/modules/events.ts#L15-L21](https://github.com/vuejs/core/blob/3be4e3cbe34b394096210897c1be8deeb6d748d8/packages/runtime-dom/src/modules/events.ts#L15-L21). If you wnat to learn more, you can take a look at the code base, and see where it's used, or take a look at the tests.

Let's see how a component with events compiles. We can take a look at Vue with the SFC Playground. To clarify, given:

```html
<script setup>
function count () {}
</script>

<template>
  <button @click="count">Count</button>
</template>
```

We get:

```ts
import { 
  openBlock as _openBlock, 
  createElementBlock as _createElementBlock 
} from "vue"

const __sfc__ = {
  __name: 'App',
  setup(__props) {
    function count () {}

    return (_ctx, _cache) => {
      return (
        _openBlock(), 
        _createElementBlock("button", { 
          onClick: count 
        }, 
        "Count")
      )
    }
  }
}
__sfc__.__file = "src/App.vue"
export default __sfc__
```

If you have written Vue without Script Setup, you'll see this is a regular component definition using `setup`. It returns a (somewhat verbose) render function. The thing to notic is `{ onClick: count }`, which is the second argument to `_createElementBlock`. A more human readable version is:

```ts
export default {
  setup () {
    return () => h('button', { onClick: count }, "Count")
  }
}
```

See the Render Functions chapter for more insight on exactly what `h` is and how this works. Ultimately, you can think of `@click="count"` as simply passing an `onClick` prop with `count` as the value. In fact, these two are identical:

```html
<button @click="count">Count</button>
<button :onclick="count">Count</button>
```

You can verify this is using the SFC Playground.

How about the other two?

```html
<template>
  <button @click="count()">Count</button>
  <button @click="$event => count($event)">Count</button>
</template>
```

The Vue SFC Playground shows they compile to something slightly different:

```ts
_createElementVNode("button", {
  onClick: _cache[0] || (_cache[0] = $event => (count()))
}, "Count"),

// ... 

_createElementVNode("button", {
  onClick: _cache[1] || (_cache[1] = $event => count($event))
}, "Count")
```

They are very similar. The only difference is the first one is called with no arguments (not even the event), but the second one is basically the same as what we've written in the template.

This is mostly academic, but it's good to know how things work under the hood. I like the second option better, since it's more explicit, and closer to standard JavaScript. I like this parallel:

```ts
document.querySelector('button')
  .addEventListener('click', $event => { ... })

<button @click="$event => count($event)">Count</button>
```

People say "React is just JavaScript", but so is Vue, once you look a little closer.

So, three ways to handle events:

```html
<template>
  <button @click="count">Count</button>
  <button @click="count()">Count</button>
  <button @click="$event => count($event)">Count</button>
</template>
```

There isn't a "best" way. I've come up with some guidelines I like to use, though, based on my experience. 

If I am not passing any arguments, I use the first style - `@event="handler"`. For example:

```html
<template>
  <button @click="count">Count</button>
</template>

<script lang="ts" setup>
  function count () {
    // something
  }
</script>
```

If I am passing any arguments, I use the third style - `@event="$event => handler(...)"`. If I want the native `$event`, I write it. If not, I'll omit it. For example:

```html
<template>
  <ul>
    <li v-for="todo of todos">
      <span>{{ todo.name }}</span>
      <button @click="() => handleComplete(todo)">Complete</button>
    </li>
</template>

<script lang="ts" setup>
  import type { Todo } from "..."
  const todos: Todo[] = [ 
    // ...
  ]

  function handleComplete(todo: Todo) {
    // ...
  }
</script>
```

The only reason for this preference is that I like to think of `@click` as taking a *callback*. If you do pass a function invocation, eg `@click="handleComplete(todo)"`, Vue converts it to the `$event => handleComplete(todo)` syntax under the hood anyway. I just like to be consistent. 

I've also found that using this consistent style helps greatly when on boarding developers from other frameworks, such as React, to be helpful. Even though *you* know how Vue the invocation style will be transformed by Vue under the hood, not everyone else will, nor should they need to.

## Some Simple Guidelines for Events

Now we have a fairly deep understanding of events, how to define them, and how they work under the hood. Let's see some examples of how we can use them, and some guidelines we can set to keep things clean and understandable.

## Write a Function!

We will start with the below `<PatientForm>` and improve it. If you see some issues, don't worry - we will be fixing everything - please bare with me!

```html
<template>
  <h1>Create Patient</h1>
  <form>
    <input v-model="patient.firstName" />
    <input v-model="patient.familyName" />
    <button @click="emits('createPatient', patient.firstName, patient.familyName)">
      Submit
    </button>
  </form>

</template>

<script lang="ts" setup>
import { reactive } from 'vue';

const emits = defineEmits<{
  (event: 'createPatient', firstName: string, familyName: string): void
}>()

const patient = reactive({
  firstName: '',
  familyName: ''
})
</script>
```

This works - but the template is going to become difficult to work with as we add more fields. In general, I recommend keeping templates clean and simple, and opt to move as much as possible into the `<script>` tag. For this reason, unless it's a very simple event, I prefer to avoid using `emits` in `<template>`. It's a personal preference, but once I've found to help keep my code bases in good shape. 

In addition, I like to have a convention for naming event handlers. The name isn't really important; having a good convention is, though. I like to use `handle` or `on`. So, in this case, I'm going to add a `handleCreatePatient` or `onCreatePatient` function. Alternatively, if you like to be concise, and since the component is focused on one thing - creating patients - `handleCreate` works well, too.

I'm not interested in passing any arguments, so I'm going to go use the `@click="handleCreate"` syntax.

```html
<template>
  <h1>Create Patient</h1>
  <form>
    <input v-model="patient.firstName" />
    <input v-model="patient.familyName" />
    <button @click="handleCreate">
      Submit
    </button>
  </form>

</template>

<script lang="ts" setup>
import { reactive } from 'vue';

const emits = defineEmits<{
  (event: 'createPatient', firstName: string, familyName: string): void
}>()

const patient = reactive({
  firstName: '',
  familyName: ''
})

function handleCreate () {
  emits('createPatient', patient.firstName, patient.familyName)
}
</script>
```

A bit more code - but I think the component is more clear now.

## Be Cautious with Positional Arguments

Our `createPatient` event uses positional parameters now. We could switch the order of `firstName` and `familyName`:

```ts
function handleCreate () {
  emits('createPatient', patient.familyName, patient.firstName)
}
```

Now we've got a pretty significant bug - but no compilation error, since they are both `string` types.

In general, unless I only have a small number of parameters, I like to use objects for my event payloads. Now is a great time to extract an `interface`:

```html
<template>
  <h1>Create Patient</h1>
  <form>
    <input v-model="patient.firstName" />
    <input v-model="patient.familyName" />
    <button @click="handleCreate">
      Submit
    </button>
  </form>
</template>

<script lang="ts" setup>
import { reactive } from 'vue';

interface Patient {
  firstName: string;
  familyName: string;
}

const emits = defineEmits<{
  (event: 'createPatient', patient: Patient): void
}>()

const patient = reactive<Patient>({
  firstName: '',
  familyName: ''
})

function handleCreate () {
  emits('createPatient', patient)
}
</script>
```

We also pass `Patient` to `reactive` as a generic: `reactive<Patient>`. Type safety! It's a big improvement.

## Reusing Object Types

This isn't a one size fits all rule, but a pattern I've often found myself using is to put the type definition for the object payload in a separate file, so I can reuse it when I respond to the event. One of the downsides of `<script setup>` is you cannot arbitrarily export values or types - so you need a separate module:

```ts
// patient.ts
export interface Patient {
  firstName: string;
  familyName: string;
}
```

Now `<PatientForm>` looks like this:


```html
<script lang="ts" setup>
import { reactive } from 'vue';
import type { Patient } from './patient.js';

const emits = defineEmits<{
  (event: 'createPatient', patient: Patient): void
}>()

// ...
</script>
```

More importantly, I can do the same pattern where I use `<PatientForm>`:

```html
<template>
  <PatientForm @createPatient="handleCreate" />
</template>

<script lang="ts" setup>
import type { Patient } from './patient.js';

function handleCreate (patient: Patient) {
  // fully type safe!
}
</script>
```

Or, like many large projects, if you extract your HTTP calls to some kind of module:

```ts
// api.ts
import type { Patient } from './patient.js';

export const API = {
  createPatient: (patient: Patient) => {
    // ...
  }
}
```

Your component might simply be:

```html
<template>
  <PatientForm @createPatient="API.createPatient" />
</template>

<script lang="ts" setup>
import { API } from './api'
</script>
```

We get type safety all the way from the event getting emitted to the API call that performs the POST request. Plus, our component is very concise - because all the business logic is abstracted away into separate modules that are not coupled to our framework, as they should be.

## Use the `submit` Event Correctly

There's one more improvement we can make. If you are writing a form, specifically, you always should use the `submit` event. The `click` event on the `<button>` is not only not necessary, but not correct. Forms should be accessible, and part of that is allowing them to be submitted without a mouse, for example by pressing enter. `@submit` handles this, but `@click` won't.

Here's how `<template>` should look:

```html
<template>
  <h1>Create Patient</h1>
  <form @submit.prevent="handleCreate">
    <input v-model="patient.firstName" />
    <input v-model="patient.familyName" />
    <button>
      Submit
    </button>
  </form>
</template>
```

Now our form, and our component is complete.

## Conclusion

We discussed emitting events in great detail, including how to declare component events in a type safe fashion, and some techniques to achieve type safety, all while keeping our `<template>` concise and our `<script>` consistent. 

We also did a deep dive into how Vue's `@event` syntax actually compiles, and saw it's just JavaScript under the hood - although Vue is a powerful framework, and understand how it works is not at all necessary, it sure is useful to have insight into what's happening under the hood - you never know when it might come in handy.

You can find the completed source code in the [GitHub repository under examples/events](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

\pagebreak
