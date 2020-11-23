# Modular Components, v-model, and the Strategy Pattern

You can find the completed source code in the [GitHub repository under examples/reusable-date-time](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code).

In this section we will author a reusable date component. Usage will be like this:

```html
<date-time 
  v-model="date" 
  :serialize="..."
  :deserialize="..."
/>
```
\begin{center}
The goal - a <datetime> component that works with any DateTime library via the strategy pattern.
\end{center}

![Completed DateTime Component](./images/ss-dt-done.png)

The idea is that the `date` value passed to `v-model` can use whichever DateTime library the developer wants to use. We want to allow developers to choose their a DateTime library, instead of mandating a specific one.

Some applications use the native JavaScript `Date` object (don't do this; it's not a very good experience). Older applications will often use [Moment](https://momentjs.com/) and newer ones common opt for [Luxon](https://moment.github.io/luxon/). 

I'd like to support both - and any other library the user might choose to use! In other words, we want the component to be agnostic - it should not be coupled to a specific date time library.

One way to handle this would be to pick a simple format of our own, for example `YYYY-MM-DD`, and then have the user wrap the component and provide a custom integration layer. For example a user wanting to use Luxon might wrap `<date-time>` in their own `<date-time-luxon>` component:

```html
<template>
  <date-time
    :modelValue="date"
    @update:modelValue="updateDate"
  />
</template>

<script>
import { ref } from 'vue'
import { DateTime } from 'luxon'

export default {
  setup() {
    return {
      date: ref(DateTime.local()),
      updateDate: (value) => {
        // some logic to turn value which is
        // YYYY-MM-DD into Luxon DateTime
      }
    }        
  }
}
</script>
```
\begin{center}
Wrapping `<datetime>` to provide Luxon integration.
\end{center}

This might work okay - now you can put your `<luxon-date-time>` on npm to share, listing `luxon` as a `peerDependency` in `package.json`. But other people may have different ways they'd like to validate the date from v-model before calling `updateValue`, or have a different opinion on the API `<date-time-luxon>` should expose. Can we be more flexible? What about moment? Do we need to make a `<moment-date-time>` component too? 

The core problem of the "wrapper" solution is you are adding another abstraction - another layer. Not ideal. The problem that needs solving is *serializing* and *deserializing* `v-model` in a library agnostic way. The `<date-time>` component doesn't need to know the specifics of the DateTime object it is dealing with.

Here is the API I am proposing to make `<date-time>` truly agnostic, not needing to know the implementation details of the date library:

```html
<date-time 
  v-model="date" 
  :serialize="serialize"
  :deserialize="deserialize"
/>
```
\begin{center}
<datetime> with serialize and deserialize props.
\end{center}

`date` can be whatever you want - `serialize` and `deserialize` will be the functions that tell `<date-time>` how to handle the value, which will be some kind of DateTime object. This pattern is generalized as the "strategy" pattern. A textbook definition is as follows:

> In computer programming, the strategy pattern (also known as the policy pattern) is a behavioral software design pattern that enables selecting an algorithm at runtime. Instead of implementing a single algorithm directly, code receives run-time instructions as to which in a family of algorithms to use (https://en.wikipedia.org/wiki/Strategy_pattern). The strategy lets the algorithm vary independently from clients that use it.

The key part is the last sentence. We push the onus of selecting the algorithm onto the developer.

A diagram might make this more clear:

![DateTime data flow](./images/dt-ss-1.png)

In this diagram, the internal implementation of `<date-time>` is on the right. Regardless of what the developer passes to `v-model`, we will convert it to a framework agnostic representation. In this case, it's `{ year: '', month: '', day: '' }`. We then transform it *back* to the desired value when it is updated. 

If the developer was using Luxon, the workflow would be something like `luxon.DateTime()` -> `{ year: '', month: '', day: '' }` -> `luxon.Datetime()`. The input *and* output is a Luxon DateTime - the developer doesn't need to know or care about the internal representation.

## Foundations of v-model

Before implementing the strategy pattern (in this example, the `serialize` and `deserialize` functions), let's write the base for `<date-time>`. It will use `v-model`. This means we receive a `modelValue` prop and update the value by emitting a `update:modelValue` event. To keep things simple, I will just use 3 `<input>` elements for the year, month and day.

```html
<template>
  <input :value="modelValue.year" @input="update($event, 'year')" />
  <input :value="modelValue.month" @input="update($event, 'month')" />
  <input :value="modelValue.day" @input="update($event, 'day')" />
<pre>
Internal date is:
{{ modelValue }} 
</pre>
</template>

<script>
import { reactive, watch, computed } from 'vue'
import { DateTime } from 'luxon'

export default {
  props: {
    modelValue: {
      type: Object
    },
  },

  setup(props, { emit }) {
    const update = ($event, field) => {
      const { year, month, day } = props.modelValue
      let newValue
      if (field === 'year') {
        newValue = { year: $event.target.value, month, day }
      }
      if (field === 'month') {
        newValue = { year, month: $event.target.value, day }
      }
      if (field === 'day') {
        newValue = { year, month, day: $event.target.value }
      }
      emit('update:modelValue', newValue)
    }

    return {
      update
    }
  }
}
</script>
```
\begin{center}
Implementing v-model for the datetime.
\end{center}

Usage is like this:

```html
<template>
  <date-time v-model="dateLuxon" />
  {{ dateLuxon }}
</template>

<script>
import { ref } from 'vue'
import dateTime from './date-time.vue'

export default {
  components: { dateTime },
  setup() {
    const dateLuxon = ref({
      year: '2020',
      month: '01',
      day: '01',
    })

    return {
      dateLuxon
    }
  }
}
</script>
```

![Rendering the Date Inputs](./images/ss-dt-progress.png)

I called the variable `dateLuxon` since we will eventually change it to be a Luxon `DateTime`. For now it is just a plain JavaScript object, made reactive via `ref`. This is all standard - we made our custom component work with `v-model` by binding to `:value` with `modelValue`, and update the original value in the parent component with `emit('update:modelValue')`.

## Deserializing for modelValue

We have established the internal API. This is how the `<date-time>` component will manage the value. For notation purposes, if we were to write an interface in TypeScript, it would look like this:

```ts
interface InternalDateTime {
  year?: string
  month?: string
  day?: string
}
```

We will now work on the `deserialize` prop, which is a function that will convert any object (so a Luxon `DateTime` object, or Moment `Moment` object) into an `InternalDateTime`. This is the representation the `<date-time>` component uses internally.

## Deserializing modelValue

The next goal is to write a `deserialize` function. In pseudocode:

```js
export function deserialize(inputDateTime) {
  // do whatever needs to be done to convert
  // the inputDateTime to a JS object with
  // { year, month, day }
  return yearMonthDateObject
```

I will use Luxon's `DateTime` to demonstrate. You can create a new `DateTime` like this:

```js
import { DateTime } from 'luxon'

const date = DateTime.fromObject({
  year: '2020',
  month: '10',
  day: '02'
})
```

The goal is to get from our input from `v-model`, in this case a Luxon `DateTime`, to our internal representation, `InternalDateTime`. This conversion is trivial in the case of Luxon's DateTime. You can just do `date.get()` passing in `year`, `month` or `day`. So our `deserialize` function looks like this:

```js
// value is what is passed to `v-model`
// in this example a Luxon DateTime
// we need to return an InternalDateTime
export function deserialize(value) {
  return {
    year: value.get('year'),
    month: value.get('month'),
    day: value.get('day')
  }
}
```

Let's update the usage:

```html
<template>
  <date-time 
    v-model="dateLuxon" 
    :deserialize="deserialize"
  />
  {{ dateLuxon.toISODate() }}
</template>

<script>
import { ref } from 'vue'
import dateTime from './date-time.vue'
import { DateTime } from 'luxon'

export function deserialize(value) {
  return {
    year: value.get('year'),
    month: value.get('month'),
    day: value.get('day')
  }
}

export default {
  components: { dateTime },

  setup() {
    const dateLuxon = ref(DateTime.fromObject({
      year: '2019',
      month: '01',
      day: '01',
    }))

    return {
      dateLuxon,
      deserialize
    }
  }
}
</script>
```

Next, update `<date-time>` to use the new `deserialize` prop:

```html
<template>
  <input :value="date.year" @input="update($event, 'year')" />
  <input :value="date.month" @input="update($event, 'month')" />
  <input :value="date.day" @input="update($event, 'day')" />
<pre>
Internal date is:
{{ date }} 
</pre>
</template>

<script>
import { reactive, computed } from 'vue'

export default {
  props: {
    modelValue: {
      type: Object
    },
    deserialize: {
      type: Function
    }
  },

  setup(props, { emit }) {
    const date = computed(() => {
      return props.deserialize(props.modelValue)
    })

    const update = ($event, field) => {
      const { year, month, day } = props.modelValue
      let newValue
      if (field === 'year') {
        newValue = { year: $event.target.value, month, day }
      }
      if (field === 'month') {
        newValue = { year, month: $event.target.value, day }
      }
      if (field === 'day') {
        newValue = { year, month, day: $event.target.value }
      }
      emit('update:modelValue', newValue)
    }

    return {
      update,
      date
    }
  }
}
</script>
```

The main changes are:

1. We now need to use a `computed` property for `modelValue`, to ensure it is correctly transformed into our `InternalDateTime` representation. 
2. We use `deserialize` on the `modelValue` in the `update` function when preparing to update `modelValue`. 

![Using the serialize prop.](./images/ss-dt-progress-2.png)
  
Now would generally be a good time to write a test for the `deserialize` function. Notice I exported it independently of the Vue component, and it does not use the Vue reactivity system. This is intentional. It's a pure function, so it's very easy to test. For brevity, the tests are not shown, but you can find them in the GitHub repository. 

This implementation currently works - kind of - it displays the correct values in the `<input>` elements, but you cannot update the value. We need the opposite of `deserialize` - `serialize`.

## Serializing modelValue

We need to ensure are calling `emit('update:modelValue'`) with a Luxon `DateTime` now, not an `InternalDateTime` object, since that is what the developer expects. Remember, the input and output value needs to be of whichever DateTime library the developer has provided. 

Let's write a `serialize` function to transform the value. It's simple. Luxon's `DateTime.fromObject` happens to take an object with the same shape as our `InternalDateTime` - `{ year, month, day }`. We will see a more complex example with the Moment integration.

```js
export function serialize(value) {
  return DateTime.fromObject(value)
}
```

Again, update the usage.

```html
<template>
  <date-time 
    v-model="dateLuxon" 
    :deserialize="deserialize"
    :serialize="serialize"
  />
  {{ dateLuxon.toISODate() }}
</template>

<script>
import { ref } from 'vue'
import dateTime from './date-time.vue'
import { DateTime } from 'luxon'

// ...

export function serialize(value) {
  return DateTime.fromObject(value)
}

export default {

    // ...

    return {
      dateLuxon,
      deserialize,
      serialize
    }
  }
}
</script>
```

I added a `:serialize` prop and returned `serialize` from the `setup` function. 

Next, we need to call `serialize` every time we try to update `modelValue`. Update `<date-time>`:

```html
<template>
  <!-- 
    Omitted for brevity.
    Nothing to change here right now.
  -->
</template>

<script>
import { computed } from 'vue'
import { DateTime } from 'luxon'

export default {
  props: {
    modelValue: {
      type: Object
    },
    serialize: {
      type: Function
    },
    deserialize: {
      type: Function
    }
  },

  setup(props, { emit }) {

    // ...

    const update = ($event, field) => {
      const { year, month, day } = props.deserialize(props.modelValue)
      let newValue

      // ...

      emit('update:modelValue', props.serialize(newValue))
    }

    return {
      update,
      date
    }
  }
}
</script>
```

All that changed was declaring the `serialize` prop and calling `props.serialize` when emitting the new value.

It works! Kind of - as long as you only enter value numbers. If you enter a `0` for the day, all the inputs show `NaN`. We need some error handling.

![Serializing/Deserializing without error handling.](./images/ss-dt-error.png)

## Error Handling

In the case of an error - either we could not serialize or deserialize the value - we will just return the current input value, and give the user a chance to fix things.

Let's update `serialize` to be more defensive:

```js
export function serialize(value) {
  try {
    const obj = DateTime.fromObject(value)
    if (obj.invalid) {
      return 
    }
  } catch {
    return 
  }

  return DateTime.fromObject(value)
}
```

In the case that we failed to serialize the value, we just return `undefined`. Update the `emit` in `<date-time>` to use this new logic; if the value is invalid, we simply do not update modelValue:

```js
export default {
  props: {
    // ...
  },

  setup(props, { emit }) {
    // ...
    const update = ($event, field) => {
      const { year, month, day } = props.modelValue
      let newValue

      // ...

      const asObject = props.serialize(newValue)
      if (!asObject) {
        return
      }
      emit('update:modelValue', asObject)
    }

    return {
      update,
      date
    }
  }
}
```

I just added a check - `if (!asObject)` and return early if the `props.serialize` did not return a value.

Now everything works correctly, and `<date-time>` will only update `modelValue` if the date is valid. This behavior is a design decision I made; you could do something different depending on how you would like your `<date-time>` to work.

Adding support for Moment is not especially difficult or interesting - it is left as an exercise, and the solution included in the source code.

## Deploying

The goal here was to create a highly reusable `<date-time>` component. If I was going to release this on npm, there is a few things I'd do.

1. Remove `serialize` and `deserialize` from the `<date-time>` component and put them into another file. Perhaps one called `strategies.js`.
2. Write a number of strategies for popular DateTime libraries (Luxon, Moment etc).
3. Build and bundle the component and strategies separately. 

This will allow developers using tools like webpack or rollup to take advantage of "tree shaking". When they build their final bundle for production, it will only include the `<date-time>` component and the strategy they are using. It will also allow the developer to provide their own more opinionated strategy.

To make the component even more reusable, we could consider writing it as a renderless component, like the one described in chapter 5.
 
## Exercises

- We did not add any tests for `serialize` or `deserialize`; they are pure functions, so adding some is trivial. See the source code for some tests.
- Add support for another date library, like Moment. Support for Moment is implemented in the source code.
- Add hours, minutes, seconds, and AM/PM support.
- Write some tests with Testing Library; you can use `fireEvent.update` to update the value of the `<input>` elements.

You can find the completed source code in the [GitHub repository under examples/reusable-date-time](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

\pagebreak
