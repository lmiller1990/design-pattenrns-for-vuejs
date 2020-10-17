## A Truly Reusable Date Component

In this section we will author a reusable date component. Usage will be like this:

```html
<date-time v-model="date" />
```

Where `date` can be... whatever you want. Some applications use the native JavaScript `Date` object (don't do this; it's not a fun experience). Older applications will often use `moment` and newer ones common opt for `luxon`. I'd like to support both - and any other library the user might choose to use. In other words, we want the component to be agnostic - it should not be coupled to a specific date time library.

One way to handle this would be to pick a simple format of our own, for example `YYYY-MM-DD`, and then have the user wrap the component and provide their own integration layer. For example a user wanting to use Luxon might wrap `<date-time>` in their own `<date-time-luxon>` component:

```html
<template>
  <date-time modelValue:
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

This might work ok - now you can put your `<luxon-date-time>` on npm to share. But other people may have different ways they'd like to validate the date from v-model, etc... maybe we can do better? What about moment? Also, testing this is pretty awkward. You will need to mount the component using something like Vue Test Utils just to test your parsing logic - again, not ideal. Of course we will need some integration tests to make sure it's working correctly, but I don't want to couple my business logic tests (eg, the parsing logic from `updateDate`) to the UI layer.

The core problem of the "wrapper" solution is you are just hiding an incorrect abstraction with another layer. Not ideal. The problem that needs solving is *serializing v-model*. 

Here is the API I am proposing to make `<date-time>` truly agnostic:

```html
<date-time 
  v-model="date" 
  :serialize="serialize"
  :deserialize="deserialize"
/>
```

`date` can be whatever you want - `serialize` and `deserialize` will be the functions that tell `<date-time>` how to handle the value.

## Foundations of v-model

Before starting the serialize functions, let's write the base for `<date-time>`. It will use `v-model`. This means we receive a `modelValue` prop and update the value by emitting a `update:modelValue` event. To keep things simple, I will just use 3 `<input>` elements for the year, month and day.

```html
<template>
  <input v-model="date.year" @input="handle" />
  <input v-model="date.month" @input="handle" />
  <input v-model="date.day" @input="handle" />
<pre>
Date is:
{{ date }} 
</pre>
</template>
```
