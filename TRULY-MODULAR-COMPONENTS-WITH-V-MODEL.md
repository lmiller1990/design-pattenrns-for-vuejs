## Truly Modular Components with v-model

In this section we will author a reusable date component. Usage will be like this:

```html
<date-time v-model="date" />
```

Where `date` can be... whatever you want. Some applications use the native JavaScript `Date` object (don't do this; it's not a fun experience). Older applications will often use [Moment](https://momentjs.com/) and newer ones common opt for [Luxon](https://moment.github.io/luxon/). I'd like to support both - and any other library the user might choose to use! In other words, we want the component to be agnostic - it should not be coupled to a specific date time library.

You can find the [completed source code, including exercise, here](https://gist.github.com/lmiller1990/bca97f1a32e5878ea1652a4b594d3ab1).

One way to handle this would be to pick a simple format of our own, for example `YYYY-MM-DD`, and then have the user wrap the component and provide their own integration layer. For example a user wanting to use Luxon might wrap `<date-time>` in their own `<date-time-luxon>` component:

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

This might work ok - now you can put your `<luxon-date-time>` on npm to share. But other people may have different ways they'd like to validate the date from v-model before calling `updateValue` or have a different opinion on the API `<date-time-luxon>` should support. Can we be more flexible ? What about moment? Do we need to make a `<moment-date-time>` component too? 

This is not that easy to test, either. You will need to mount the component using something like Vue Test Utils just to test your parsing logic - again, not ideal. Of course we will need some integration tests to make sure it's working correctly, but I don't want to couple my business logic tests (eg, the parsing logic from `updateDate` using pure functions and Jest) to the UI layer tests (using Vue Test Utils).

The core problem of the "wrapper" solution is you are adding another abstraction, another layer. Not ideal. The problem that needs solving is *serializing* and *deserializing* `v-model` in a library agnostic way. 

Here is the API I am proposing to make `<date-time>` truly agnostic, not needing to know the implementation details of the date library:

```html
<date-time 
  v-model="date" 
  :serialize="serialize"
  :deserialize="deserialize"
/>
```

`date` can be whatever you want - `serialize` and `deserialize` will be the functions that tell `<date-time>` how to handle the value.

A diagram might make this more clear:

## Foundations of v-model

Before starting the serialize functions, let's write the base for `<date-time>`. It will use `v-model`. This means we receive a `modelValue` prop and update the value by emitting a `update:modelValue` event. To keep things simple, I will just use 3 `<input>` elements for the year, month and day.

```html
<template>
  <input :value="modelValue.year" @input="update($event, 'year')" />
  <input :value="modelValue.month" @input="update($event, 'month')" />
  <input :value="modelValue.day" @input="update($event, 'day')" />
<pre>
date is:
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
  components: { DateTime },
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

I called the variable `dateLuxon` since we will eventually change it to be a Luxon `DateTime`. For now it is just a plain JavaScript object, make reactive via `ref`. This is all standard - we made our custom component work with `v-model` by binding to `:value` with `modelValue`, and update the original value in the parent component with `emit('update:modelValue')`.

## Deerializing for modelValue

We have established the internal API, or how the `<date-time>` component will manage the value. For notation purposes, if we were to write an interface in TypeScript, it would look like this:

```ts
interface InternalDateTime {
  year?: string
  month?: string
  day?: string
}
```

We will now work on the `deserialize` prop, which will convert any string object (so a Luxon `DateTime`, a Moment `moment`) into an `InternalDateTime`
.

## Deserializing modelValue

Let's take Luxon's `DateTime`. You can create a new one like this:

```js
import { DateTime } from 'luxon'

const date = DateTime.fromObject({
  year: '2020',
  month: '10',
  day: '02'
})
```

The goal is to get from our input to `v-model`, in this case a Luxon `DateTime`, to our internal representation, `InternalDateTime`. This conversion is trivial: from `DateTime`, you can just do `date.get()` passing in `year`, `month` or `day`. So our `deserialize` function looks like this:

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
  {{ dateLuxon }}
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
date is:
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
      const { year, month, day } = props.deserialize(props.modelValue)
      // ...
    }

    // ...

    return {
      update,
      date
    }
  }
}
</script>
```

The main changes are we now need to use a `computed` property for `modelValue`, to ensure it is correctly transformed into our `InternalDateTime` representation. We also need to `deserialize` the `modelValue` in the `update` function when preparing to update `modelValue`. 

This implementation currently works - kind of - it displays the correct values in the `<input>` elements, but you cannot update the value. We need the opposite of `deserialize` - `serialize`.

## Serializing modelValue

We need to ensure are calling `emit('update:modelValue'`) with a Luxon `DateTime` now, not an `InternalDateTime` object. Let's see how we can write a `serialize` function to transform the value. It's simple. Luxon's `DateTime.fromObject` happens to take an object with the same shape as our `InternalDateTime`. We will see a more complex example with the moment integration.

```js
function serialize(value) {
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
  {{ dateLuxon }}
</template>

<script>
import { ref } from 'vue'
import dateTime from './date-time.vue'
import { DateTime } from 'luxon'

// ...

function serialize(value) {
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

Next, we need to call `serialize` every time we try to update `modelValue`. Update `<date-time>`:

```html
<template>
  <!-- omitted for brevity -->
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

It works! Kind of - as long as you only enter value numbers. If you enter a `0` for the day, all the inputs show `NaN`. We need some error handling.

## Error Handling

In the case of an error - either we could not serialize or deserialize the value - we will just return the current input value, and give the user a chance to fix things.

Let's update `serialize` to be more defensive:

```js
function serialize(value) {
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

Great! Now everything works correctly, and `<date-time>` will only update `modelValue` if the date is valid. This behavior is a design decision I made; you could do something different depending on how you would like your `<date-time>` to work.

## Exercises

- We did not add any tests for `serialize` or `deserialize`; they are pure functions, so adding some is trivial. See the source code for some tests.
- Add support for another date library, like moment. Support for moment is implemented in the source code.
- Add hours, minutes, seconds, and AM/PM support.
- Write some tests with Vue Test Utils; you can use `setValue` to update the value of the `<input>` elements.
