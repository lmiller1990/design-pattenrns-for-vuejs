# Patterns for Testing Props

You can find the completed source code in the [GitHub repository under examples/props](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

______

In this section we explore `props`. What they are, how to think about them and the kind of patterns you might want to consider when creating components that use `props` (which as you probably know, is a fairly frequent occurrence when working with a component framework such as Vue). This leads into a much more fundamental and important topic; drawing a clear line between business logic and UI, also known as *separation of concerns*, and how you can help make this distinction clear.

Consider one of the big ideas (or even, the biggest idea) behind frameworks like Vue and React:

\begin{center}
Your user interface is a function of your data.
\end{center}

This idea comes in many forms; another is "data driven interfaces". Basically, your user interface (UI) should be determined by the data present. This idea has been around for a good while now. When paired with another big idea, *one way data flow*, complex component-based applications suddenly became a lot more understandable.

Given X data, your UI should be in Y state. In computer science, this idea is often referred to as *determinism*. The canonical example is this `sum` function for example:

```js
function sum(a, b) {
  return a + b
}
```
\begin{center}
A simple sum function. It's a pure function.
\end{center}

When called with the same value for `a` and `b`, you always get same result. The result is pre-determined. It's *deterministic*. An example of an impure function would be this:

```js
async function fetchUserData(userId) {
  return axios.get(`/api/users/${userId}`)
}
```
\begin{center}
A impure function - it has a side effect. Not ideal, but necessary for most systems to do anything useful.
\end{center}

This is *not* a pure function because it relies on an external resource - in this case an API and a database. Depending on what is in the database when it is called, we might get a different result. If the database is offline, we might get an error. Who knows? That's the whole point - you don't know. It's *unpredictable*. It's *non deterministic*. That's not good. We want our applications to be predicable and reliable. 

Unforunately, the type of software that people want to use tends to need things like databases, and APIs, and various other side effects. It's not a lost cause, though. We can design our applications in such a way all the side effects are in a single location, and have uniform ways to handle the inevitable unexpected cases.

So, how does this relate to components and `props`? Well, it turns out that most of the time, user interfaces generally *are* deterministic. Even in error states - given an error, they'll do the same thing each time, assuming you handle the error correctly. 

Enough talk - let's write some code. If you think of a component that does nothing but take some props and render some data, you'll see it's determinstic in the same way our `sum()` function is. That's because it's more or less the same thing, if you consider the component as a *function* and the `props` as the *arguments*. This is what components really are - and we will see this is more detail in the "Render Functions" chapter. 

Either way, given this parallel, it's clear that given the same `props`, the component will always render the same thing. Its output is deterministic. Since you decide what `props` are passed to the component, it's easy to test, since we know all the possible states the component can be in.

How about the `sum()` example, as a component? No props yet, but there will be.

```html
<script lang="ts" setup>
import { ref, computed } from 'vue'

const n1 = ref(0)
const n2 = ref(0)

function sum(a: number, b: number) {
  return a + b
}

const result = computed(() => sum(n1.value, n2.value))
</script>

<template>
  <input v-model.number="n1" />
  <input v-model.number="n2" />
  <div>{{ n1 }} + {{ n2 }} is {{ result }}.</div>
</template>
```

This component is deterministic. No side effects, no API calls, no randomness. Given the same value `a` and `b`, you always get the same result. But what if you don't handle the logic in the front end? What if it comes from an API (that might be offline, or down, or something else unexpected)? Read on...

## Side Effects Here, Pure Functions There

We will continue with the naive `<Sum>` example for a little longer. It will serve as a good example for how to make pure components using props. For whatever reason, we now want to move the logic to the  server, and again, for whatever reason, we need to ship it now. We make the minimal changes possible - noting that the `sum()` function is now gone - moved to the back end.

```html
<script lang="ts" setup>
import { ref, computed, watchEffect } from 'vue'

const n1 = ref(0)
const n2 = ref(0)
const result = ref(0)

watchEffect(async () => {
  const url = "/sum?" + new URLSearchParams({
    // These need to be strings, according to the type definitions.
    // In practice, it probably doesn't make a difference.
    n1: n1.value.toString(),
    n2: n2.value.toString(),
  })
  const data = await window.fetch(url)
  result.value = await data.json()
})
</script>

<template>
  <input v-model.number="n1" />
  <input v-model.number="n2" />
  <div>{{ n1 }} + {{ n2 }} is {{ result }}.</div>
</template>
```

We introduced a side effect: a network request. `<Sum>` is no longer deterministic. We also don't have any loading state, so our component doesn't provide a good user experience. No error state - if (when?) the API call fails, the user won't know, since we don't handle that, either.

There are a few things here *scream* "side effect":

- using `watch` or `watchEffect`. The whole point of these is to do something in reaction to a side effect. This is different to `computed`, which cannot be marked as `async` (well, you probably *can*, but you shouldn't. `computed` should always be synchronous and deterministic).
- `async` and `await`. It is very rare that pure functions (and pure components) use `async` - anything that can be deterministic can usually be determined immediately, no `await` required.

Of course, these are not only useful but necessary tools. Side effects can make writing tests a little more difficult, and also make it more difficult to use a tool like Storybook to iterate on your design and the various states of your component, since you'll need to mock our an API call. 

We can use our knowledge of props and pure components to avoid all these pitfalls, though, and make our components simple to develop and test.

## Refactoring: Props Only

Let's quickly refactor the `<Sum>` component - if we don't do it now, our manager will drop some new feature work on our desk, and we will never get a chance to. We want to identify all the side effects, and transform them to use props. The side effect here is the API request, which is inside of `watchEffect`. We still want `<Sum>` to contain the UI concerns - so, rendering the `<input>` and maintaining the state of the numbers. We just want it to be pure and deterministic. 

We can rewrite `<Sum>` to use `props`:

```html
<script lang="ts" setup>
import { ref, watchEffect } from 'vue';

defineProps<{
  result: number
}>()

const emits = defineEmits<{
  (e: 'calculate', payload: { n1: number; n2: number }): void
}>()

const n1 = ref(0)
const n2 = ref(0)

watchEffect(() => {
  emits('calculate', { n1: n1.value, n2: n2.value })
})
</script>

<template>
  <input v-model.number="n1" />
  <input v-model.number="n2" />
  <div>{{ n1 }} + {{ n2 }} is {{ result }}.</div>
</template>
```

There is quite a bit going on here. The `<Sum>` component still maintains the state of `n1` and `n2`. `watchEffect` also sticks around. The difference is `watchEffect` is now deterministic - no `async` and no API call. Given a state where `n1` and `n2` are known, `watchEffect` will always emit the same event, `calculate`, with the same payload.

`<Sum>` is now dead simple to reason about, to pull into your design tool (Storybook, etc) and test (Vue Test Utils, Cypress, Playwright).

We still need to make the API request. That would look something like this:

```html
<script lang="ts" setup>
import { ref } from 'vue'
import Sum from './Sum.vue'

const result = ref(0)

async function fetchSum({ n1, n2 }: { n1: number, n2: number }) {
  const url = "/sum?" + new URLSearchParams({
    n1: n1.toString(),
    n2: n2.toString()
  })
  const data = await window.fetch(url)
  result.value = await data.json()
}
</script>

<template>
  <Sum :result="result" @calculate="fetchSum" />
</template>
```

It is a bit more code to write. We now have two components - the simple `<Sum>` component, and this one with the side effects (call it `<SumContainer>` for now). That said, I think this trade off is worth it. Drawing the lines between concerns (UI and data fetching, in this case) can be tremendously valuable for the longevity of a code base. I like to keep my user interface components (eg, the components that render things, and that the user interacts with) simple, and if possible, as pure components (pure meaning no side effects). It makes them more reusable, easy to test, and works well with various developer tools, like test runners and design tools.

Vue makes maintaining this separation simple, but you still need to think carefully about what you are doing and how you might go about structuring your components.

## Separation of Concerns - Case Study

One example of poor separation of concerns costing an organization was an application I worked on for an electrical components supplier. They had an application customers would use to get an approximate quote for the price of components. The ordering process was quite complex - you would go through a form with several steps, and the values from the previous step would impact the fields on the next step.

The application was written using jQuery (which is not bad. No framework is bad - only if they are used incorrectly). All of the business logic was mixed in with the UI logic (this is the bad part). They had a quantity based discount model - "If purchasing more than 50 resistors, then apply X discount, otherwise Y" - this kind of thing. They decided to move to something a bit more modern - the UI was very dated, and wasn't mobile friendly at all. The complexity of the jQuery code was high and the code was a mess. 

Not only did I need to rewrite the entire UI layer (which was what I was paid to do), but I ended up having to either rewrite (well - identify and extract) the vast majority of the business logic from within the jQuery code, too. 

This search and extract mission made the task much more difficult and risky than it should have been - instead of just updating the UI layer, I had to dive in and learn their business and pricing model as well (which ended up taking a lot more time and costing a lot more than it probably should have). Of course there were no tests, either, which made this quite a task.

Here is a concrete example using the above real-world scenario. Let's say a resistor (a kind of electrical component) costs $0.60. If you buy over 50, you get a 20% discount. The jQuery code-base looked something like this (but vastly more convoluted):

```js
const $resistorCount = $('#resistors-count')

$resistorCount.change((event) => {
  const amount = parseInt(event.target.value)
  const totalCost = 0.6 * amount
  const $price = $("#price")
  if (amount > 50) {
    $price.value(totalCost * 0.8)
  } else {
    $price.value(totalCost)
  }
})
```

You need to look really carefully to figure out where the UI ends and the business starts. In this scenario, I wanted to move to Vue - the perfect tool for a highly dynamic, reactive form. I had to dig through the code base and figure out this core piece of business logic, extract it, and rewrite it with some tests (of course the previous code base had no tests, like many code bases from the early 2000s).

If we inspect the snippet above, we can see which lines are related to the user interface, and which are the core business:

```js
// user interface
const $resistorCount = $('#resistors-count')

// user interface
$resistorCount.change((event) => {
  // business logic - transition from a string to a real number
  const amount = parseInt(event.target.value)
  
  // business logic - yes, this really was done on the front-end
  const totalCost = 0.6 * amount
  
  // user interface
  const $price = $("#price")

  // business logic
  if (amount > 50) {
    // Both! Inline business logic, which is then 
    // written to the user interface
    $price.value(totalCost * 0.8)
  } else {
    $price.value(totalCost)
  }
})
```

 This search-extract-isolate-rewrite journey is full of risk and the chance of making a mistake or missing something is very high! What would have been much better is if the business logic and UI had be separated:

```js
// Business logic
const resistorPrice = 0.6
function resistorCost(price, amount) {
  if (amount > 50) {
    return price * amount * 0.8
  } else {
    return price * amount
  }
}

// User interface
$resistorCount.change((event) => {
  const amount = parseInt(event.target.value)
  $("#price").value = resistorCost(resistorPrice, amount)
})
```

The second is far superior. You can see where the business logic ends and the UI begins - they are literally separated in two different functions. The pricing strategy is clear - a discount for any amount greater than 50. It's also very easy to test the business logic in isolation. If the day comes you decide your framework of choice is no longer appropriate, it's trivial to move to another framework - your business logic unit tests can remain unchanged and untouched, and hopefully you have some end-to-end browser tests as well to keep you safe.

As expected, there is a lot more code and complexity for the business logic. This makes sense - your user interface really shouldn't be the most complicated part of your business!

With this new structure, moving to Vue (or React, or jQuery, or even a server rendered app) is trivial and mostly risk free. You can easily write some component tests, too, since your component is so damn simple:

```html
<template>
  <input v-model.number="amount" />
  <div>Price: {{ totalCost }}</div>
</template>

<script lang="ts" setup>
import { resistorCost, resistorPrice } from './logic.js'

const amount = ref(0)

const totalCost = computed(() => 
  resistorCost(resistorPrice, amount.value))
</script>
```

We can even change the business logic based on requirements (maybe we want to give a 30% discount, or change the price of a resistor) without touching our interface. Again, makes sense - should a developer really be involved in that sort of thing? Probably not!

Understanding and identifying the different concerns in a system and correctly structuring applications is the difference good engineers and great engineers, and a front end that will last the test of time, versus one that gets rewritten every few years.


## Conclusion

This chapter discussed props, along with some foundational concepts - separation of concerns, pure components, and user interfaces. We talked about how identifying and separating logic and side effects from pure components can make a code base easier to reason about and to test.

You can find the completed source code in the [GitHub repository under examples/props](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

\pagebreak
