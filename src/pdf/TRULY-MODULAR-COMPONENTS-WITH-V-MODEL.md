# Modular Components, the Strategy Pattern

You can find the completed source code in the [GitHub repository under examples/reusable-DateTime](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

______

In this section we will author a reusable date component. Usage will be like this:

```html
<DateTime 
  v-model="date" 
  :serialize="..."
  :deserialize="..."
/>
```
\begin{center}
The goal - a <DateTime> component that works with any DateTime library via the strategy pattern.
\end{center}

The finished component will look like this:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{ss-dt-done.png}
  \caption{Completed DateTime Component}
  \label{fig}
\end{figure}

There are three props: `v-model`, `serialize` and `deserialize`. More on what `serialize` and `deserialize` are soon.

The idea is that the `date` value passed to `v-model` can use whichever DateTime library the developer wants to use. We want to allow developers to choose their a DateTime library, instead of mandating a specific one.

Some applications use the native JavaScript `Date` object (don't do this; it's not a very good experience). Older applications will often use [Moment](https://momentjs.com/) and newer ones common opt for [Luxon](https://moment.github.io/luxon/), or one of the many others.

I'd like to support both - and any other library the user might choose to use! In other words, we want the component to be agnostic - it should not be coupled to a specific date time library.

One way to handle this would be to pick a simple format of our own, for example `YYYY-MM-DD`, and then have the user wrap the component and provide a custom integration layer. For example a user wanting to use Luxon might wrap `<DateTime>` in their own `<DateTimeLuxon>` component:

```html
<!-- DateTimeLuxon.vue -->
<template>
  <DateTime
    :modelValue="date"
    @update:modelValue="updateDate"
  />
</template>

<script setup>
import { ref } from 'vue'
import Luxon from 'luxon'

const date = ref(Luxon.DateTime.local())
const updateDate: (value: string) => {
  // some logic to turn value which is
  // YYYY-MM-DD into Luxon DateTime
}
</script>
```
\begin{center}
Wrapping `<DateTime>` to provide Luxon integration.
\end{center}

This might work okay - now you can put your `<DateTimeLuxon>` on npm to share, listing `luxon` as a `peerDependency` in `package.json`. But other people may have different ways they'd like to validate the date from v-model before calling `updateValue`, or have a different opinion on the API `<DateTimeLuxon>` should expose. Can we be more flexible? What about moment? Do we need to make a `<DateTimeMoment>` component too? 

The core problem of the "wrapper" solution is you are adding another abstraction - another layer. Not ideal. The problem that needs solving is *serializing* and *deserializing* `v-model` in a library agnostic way. The `<DateTime>` component doesn't need to know the specifics of the Date library that it is working with.

Here is the API I am proposing to make `<DateTime>` truly agnostic, not needing to know the implementation details of the date library:

```html
<DateTime 
  v-model="date" 
  :serialize="serialize"
  :deserialize="deserialize"
/>
```
\begin{center}
<DateTime> with serialize and deserialize props.
\end{center}

`date` can be whatever you want - `serialize` and `deserialize` will be the functions that tell `<DateTime>` how to handle the value, which will be some kind of DateTime object. This pattern is generalized as the "strategy" pattern. A textbook definition is as follows:

> In computer programming, the strategy pattern (also known as the policy pattern) is a behavioral software design pattern that enables selecting an algorithm at runtime. Instead of implementing a single algorithm directly, code receives run-time instructions as to which in a family of design patterns to use (https://en.wikipedia.org/wiki/Strategy_pattern). The strategy lets the algorithm vary independently from clients that use it.

The key part is the last sentence. We push the onus of selecting the algorithm onto the developer.

A diagram might make this more clear:

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{dt-ss-1.png}
  \caption{DateTime data flow}
  \label{fig}
\end{figure}

In this diagram, the internal implementation of `<DateTime>` is on the right. Regardless of what the developer passes to `v-model`, we will convert it to a framework agnostic representation. In this case, it's `{ year: '', month: '', day: '' }`. We then transform it *back* to the desired value when it is updated. 

If the developer was using Luxon, the workflow would be something like `luxon.DateTime()` -> `{ year: '', month: '', day: '' }` -> `luxon.Datetime()`. The input *and* output is a Luxon DateTime - the developer doesn't need to know or care about the internal representation.

## Foundations of v-model

Before implementing the strategy pattern (in this example, the `serialize` and `deserialize` functions), let's write the base for `<DateTime>`. It will use `v-model`. This means we receive a `modelValue` prop and update the value by emitting a `update:modelValue` event. To keep things simple, I will just use 3 `<input>` elements for the year, month and day.

I'm going to have a file named `serializers.ts` where I define my types, and a few other things:

```ts
export interface InternalDateTime {
  year: string;
  month: string;
  day: string;
}
```

Let's get started with our `<DateTime>` component.

```html
<template>
  <input
    :value="modelValue.year"
    @input="($event) => update($event, 'year')"
  />
  <input
    :value="modelValue.month"
    @input="($event) => update($event, 'month')"
  />
  <input
    :value="modelValue.day"
    @input="($event) => update($event, 'day')"
  />
  <pre>
Internal date is:
{{ modelValue }} 
</pre
  >
</template>

<script lang="ts" setup>
const props = defineProps<{
  // use `any` - this will be explained soon.
  modelValue: any;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", dt: InternalDateTime): void;
}>();

function update($event: Event, field: "year" | "month" | "day") {
  const target = $event.target as HTMLInputElement;
  const { year, month, day } = props.modelValue;
  let newValue: InternalDateTime = {
    year,
    month,
    day
  };

  if (field === "year") {
    newValue.year = parseInt(target.value);
  }
  if (field === "month") {
    newValue.month = parseInt(target.value);
  }
  if (field === "day") {
    newValue.day = parseInt(target.value);
  }

  emit("update:modelValue", newValue);
}
</script>
```
\begin{center}
Implementing v-model for the DateTime.
\end{center}

Usage is like this:

```html
<template>
  <DateTimeBasic v-model="dateLuxon" />
  {{ dateLuxon }}
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import DateTimeBasic from './DateTimeBasic.vue'

const dateLuxon = ref({
  year: 2020,
  month: 1,
  day: 1,
})
</script>
```
\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{ss-dt-progress.png}
  \caption{Rendering the Date Inputs}
  \label{fig}
\end{figure}

I called the variable `dateLuxon` since we will eventually change it to be a Luxon `DateTime`. For now it is just a plain JavaScript object, made reactive via `ref`. This is all standard - we made our custom component work with `v-model` by binding to `:value` with `modelValue`, and update the original value in the parent component with `emit('update:modelValue')`.

## Deserializing for modelValue

We have established the internal API. This is how the `<DateTime>` component will manage the value. The TypeScript interface, as a reminder, is:

```ts
interface InternalDateTime {
  year: string
  month: string
  day: string
}
```

We will now work on the `deserialize` prop, which is a function that will convert any object (so a Luxon `DateTime` object, or Moment `Moment` object) into an `InternalDateTime`. This is the representation the `<DateTime>` component uses internally.

## Deserializing modelValue

The next goal is to write a `deserialize` function. In pseudocode:

```ts
export function deserialize(inputDateTime) {
  // do whatever needs to be done to convert
  // the inputDateTime to a JS object with
  // { year, month, day }
  return yearMonthDateObject
```

I will use Luxon's `DateTime` to demonstrate. You can create a new `DateTime` like this:

```ts
import Luxon from 'luxon'

const date = Luxon.DateTime.fromObject({
  year: 2020,
  month: 10,
  day: 2
})
```

The goal is to get from our input from `v-model`, in this case a Luxon `DateTime`, to our internal representation, `InternalDateTime`. This conversion is trivial in the case of Luxon's DateTime. You can just do `date.get()` passing in `year`, `month` or `day`. So our `deserialize` function looks like this:

```ts
// serializers.ts
//
// value is what is passed to `v-model`
// in this example a Luxon DateTime
// we need to return an InternalDateTime
export function deserialize(value: DateTime): InternalDateTime {
  return {
    year: value.get("year"),
    month: value.get("month"),
    day: value.get("day"),
  };
}
```

Let's update the usage:

```html
<template>
  <DateTime 
    v-model="dateLuxon" 
    :deserialize="deserialize"
  />
  {{ dateLuxon.toISODate() }}
</template>

<script>
import { ref } from 'vue'
import dateTime from './DateTime.vue'
import Luxon from 'luxon'
import { deserialize } from "./serializers.js";

const dateLuxon = ref(Luxon.DateTime.fromObject({
  year: 2019,
  month: 1,
  day: 1,
}))
</script>
```

Next, update `<DateTime>` to use the new `deserialize` prop:

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
import { computed } from 'vue'
import { InternalDateTime } from "./serializers.js";

const props = defineProps<{
  modelValue: any;
  deserialize: (val: any) => InternalDateTime;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", dt: InternalDateTime): void;
}>();

const date = computed(() => {
  return props.deserialize(props.modelValue)
})

function update($event: Event, field: "year" | "month" | "day") {
  const target = $event.target as HTMLInputElement;
  const { year, month, day } = props.modelValue;
  let newValue: InternalDateTime = {
    year,
    month,
    day
  };

  if (field === "year") {
    newValue.year = parseInt(target.value);
  }
  if (field === "month") {
    newValue.month = parseInt(target.value);
  }
  if (field === "day") {
    newValue.day = parseInt(target.value);
  }

  emit("update:modelValue", newValue);
}
</script>
```

The main changes are:

1. We now need to use a `computed` property for `modelValue`, to ensure it is correctly transformed into our `InternalDateTime` representation. 
2. We use `deserialize` on the `modelValue` in the `update` function when preparing to update `modelValue`. 

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{ss-dt-progress-2.png}
  \caption{Using the serialize prop.}
  \label{fig}
\end{figure}
\pagebreak

Now would generally be a good time to write a test for the `deserialize` function. Notice I exported it independently of the Vue component, and it does not use the Vue reactivity system. This is intentional. It's a pure function, so it's very easy to test. For brevity, the tests are not shown, but you can find them in the GitHub repository. 

This implementation currently works - kind of - it displays the correct values in the `<input>` elements, but you cannot update the value. We need the opposite of `deserialize` - `serialize`.

## Serializing modelValue

We need to ensure are calling `emit('update:modelValue')` with a Luxon `DateTime` now, not an `InternalDateTime` object, since that is what the developer expects. Remember, the input and output value needs to be of whichever DateTime library the developer has provided. 

Let's write a `serialize` function to transform the value. It's simple. Note the type signature - it should be the exact opposite of `deserialize`, taking an `InternalDateTime` and converting it to a `DateTme`. 

Luxon's `DateTime.fromObject` happens to take an object with the same shape as our `InternalDateTime` - `{ year, month, day }`. We will see a more complex example with the Moment integration.

Note - this is not complete! We will add error handling soon.

```ts
// serializers.ts
export function serialize(value: InternalDateTime) {
  return DateTime.fromObject(value);
}
```

Again, update the usage.

```html
<template>
  <DateTime
    v-model="dateLuxon" 
    :deserialize="deserialize"
    :serialize="serialize"
  />
  {{ dateLuxon.toISODate() }}
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import DateTime from './DateTime.vue'
import { serialize, deserialize } from "./serializers.js";

// ...

</script>
```

I added a `:serialize` prop and passed the `serialize` function to `<DateTime>`.

Next, we need to call `serialize` every time we try to update `modelValue`. Update `<DateTime>`:

```html
<template>
  <!-- 
    Omitted for brevity.
    Nothing to change here right now.
  -->
</template>

<script lang="ts" setup>
import { computed } from "vue";

// ...

const props = defineProps<{
  modelValue: any;
  serialize: (val: InternalDateTime) => any;
  deserialize: (val: any) => InternalDateTime;
}>();

// ...

function update($event: Event, field: "year" | "month" | "day") {
  const eventTarget = $event.target as HTMLInputElement;

  // ... 

  // Call `props.serialize` when emitting the new value
  emit("update:modelValue", props.serialize(newValue!));
}
</script>
```

All that changed was declaring the `serialize` prop and calling `props.serialize` when emitting the new value.

It works! Kind of - as long as you only enter value numbers. If you enter a `0` for the day, all the inputs show `NaN`. We need some error handling.

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{ss-dt-error.png}
  \caption{Serializing/Deserializing without error handling.}
  \label{fig}
\end{figure}
\pagebreak

## Error Handling

In the case of an error - either we could not serialize or deserialize the value - we will just return the current input value, and give the user a chance to fix things.

Let's update `serialize` to be more defensive:

```ts
export function serialize(value: InternalDateTime): DateTime | undefined {
  try {
    const obj = DateTime.fromObject(value);
    // Luxon error
    if (!obj.isValid) {
      return;
    }
  } catch {
    // Unexpected error - just return undefined
    return;
  }

  // valid DateTime
  return DateTime.fromObject(value);
}
```

In the case that we failed to serialize the value, we just return `undefined`. Update the `emit` in `<DateTime>` to use this new logic; if the value is invalid, we simply do not update modelValue:

```ts
function update($event: Event, field: "year" | "month" | "day") {
  // ... 

  const obj = props.serialize(newValue!);
  if (!obj) {
    return;
  }
  emit("update:modelValue", obj);
}
```

I just added a check - `if (!isObj)` and return early if the `props.serialize` did not return a value.

Now everything works correctly, and `<DateTime>` will only update `modelValue` if the date is valid. This behavior is a design decision I made; you could do something different depending on how you would like your `<DateTime>` to work.

Adding support for Moment is not especially difficult or interesting - it is left as an exercise, and the solution included in the source code.

## Deploying

The goal here was to create a highly reusable `<DateTime>` component. If I was going to release this on npm, there is a few things I'd do.

1. Write a number of strategies (serialize/deserialize pairs) for popular DateTime libraries (Luxon, Moment etc).
2. Build and bundle the component and strategies separately. 

This will allow developers using tools like webpack or Rollup to take advantage of "tree shaking". When they build their final bundle for production, it will only include the `<DateTime>` component and the strategy they are using. It will also allow the developer to provide their own more opinionated strategy.

To make the component even more reusable, we could consider writing it as a renderless component, like the one described in the Renderless Components chapter.
 
## Exercises

- We did not add any tests for `serialize` or `deserialize`; they are pure functions, so adding some is trivial. See the source code for some tests.
- Add support for another date library, like Moment. Support for Moment is implemented in the source code.
- Add hours, minutes, seconds, and AM/PM support.
- Write some tests with Testing Library; you can use `fireEvent.update` to update the value of the `<input>` elements.

You can find the completed source code in the [GitHub repository under examples/reusable-DateTime](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

\pagebreak
