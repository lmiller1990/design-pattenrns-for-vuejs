## Renderless Components

The primary way you reuse components in Vue is *slots*. This works great for a lot of cases, but sometimes you need *more* flexibility. One example is you have some complex logic that needs to be reused in two totally different interfaces. One way to reuse complex logic with several different interfaces is the *renderless* component pattern.

In this section we will build the following component, a password strength form:

There is a few requirements. We'd like to publish this on npm; to make it as flexible as possible, we will include no render function (or `<template>` tag, which compiles into a render function anyway), so developers can fully customize the style as they see fit.

We would like to support the following features:

- a `matching` varible that returns true if the password and confirmation match
- support a `minComplexity` prop; by default the minimum complexity is 0 and maximum complexity is 3
- support a custom complexity algorithm (eg, require specific characters or numbers in the password)
- expose a `valid` value which is true when the password and confirmation match, and the password meets the minimum complexity

Let's get started.

## Rendering without a render function

I will work out of a file called `renderless-password.js`. That's right - not a `vue` file. No need - we won't be shipping a `<template>`.
