# Design Patterns for Vue.js - a Test Driven Approach to Maintainable Applications

## Introduction

Chances are, if you are interested in something as abstract as *design patterns*, you have been coding for a while now, likely with an interested in front-end development. You might have written a few interfaces using jQuery, that seemed pretty good. As time passed, requirements changed, and your once maintainable jQuery code-base has become a mess. 

At this point, you might have looked around for an alternative. Things like React and Vue are often the next step - Components! Encapsulation! Unit Tests! You `vue create app` and things are great!

Again, time passes - requirements change. Things get messy - again. It's a more organized, less crazy kind of messy, but it still doesn't feel *right*. You end up with giant components ("god components"), that are nearing a thousand lines, doing everything from fetching data, validation and everything else you can imagine. Passing tens of props down and emitting tens of events back up becomes normal. A "single source of truth" starts to be come "several sources of truth". The lines between your business logic, the problem you are solving and the presentation components starts to blur. Eventually velocity slows, and subtle bugs start to creep in.

A few years later, all the original developers are gone and no-one really knows how things work, or what exactly `// TODO: fix this` actually refers to. The business opts to do a major rewrite, and the cycle continues.

*This isn't unusual*. Maybe jQuery wasn't the problem after all? 

It doesn't have to be like this! Vue is a powerful and flexible UI layer, JavaScript (and TypeScript) get improvements every year and Jest is a first class test runner. All the tools needed to write reliable, maintainable and bug free applications are available. What's often missing is the design patterns, best practices, proper separation on concerns, and a reliable test suite. These are the fundamental ideas that underpin all software development, not just front-end applications.

## The Book

This is a book about design patterns and testing. But it's also more. Thinking in design patterns is not about memorizing a lot of fancy names and diagrams. Knowing how to test is not really about learning a test runner or reading documentation. 

Thinking in patterns, consider how data flows between different parts of a system and writing for testability starts *before* writing any code. 

Good software design is a philosophy. It's a way of life. Finally, as engineer, writing good software *is your job*. So is writing testable code - even if HR forgot to put it in your job description.

My goal is to get you in the habit of writing testable code, and how to choose the right abstraction for the problem at hand. The first things you think when you hear a new business requirement or request should be: 
\newline
\newline - What design pattern will give me the most flexibility moving forward? 
\newline - What new requirements could come up, and how will this decision deal with them?
\newline - How am I going to write my code in a testable, loosely coupled fashion? 

The lessons and patterns I'll be sharing are not Vue-specific at all; they are framework agnostic. I'd even say that they are language agnostic; they are fundamental concepts you can take with you and apply them to any software design problem. Good developers focus on tools and frameworks, great developers focus on data structures and how they interact with each other, testability and maintainability.

All of the content is, of course, based on my opinion. Like most best practices and design patterns, there is a time and place for everything, and not every recommendation will apply to every use case.  The best way to get value from this book is to read the examples, think about the concepts and compare it to what you are currently doing. 

If you think it solves a problem you have, try it out and see where it leads. There will always be exceptions, but the most important thing is you think about your concerns, testability and reliability. If you disagree with something you see, I'm always open to discussion and improvements; please reach out. I'm always interested in new perspectives and ideas.

## What To Expect

Most books that teach you frameworks, languages or testing will be an app or two, incrementally adding new features. This works great for learning a new language or framework, but isn't ideal for focusing on concepts or ideas. In this book, each section will be focused on a single idea, and we will build a small component or application to illustrate it. This approach has a few benefits; you can read the content is any order, and use it as a kind of reference.

We start with some patterns for `props`, as well as a discussion around one of the most fundamental ideas in this book, *separation of concerns*. We proceed to cover a wide variety of design patterns for events, forms, components, renderless components, feature separation with the Composition API, and everything else you'll need to know to create well engineered Vue.js applications.

Most sections end with some exercises to help you improve and practice what you learned. The source code, including all the solutions for the exercises are [included in the source code](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): (https://github.com/lmiller1990/design-patterns-for-vuejs-source-code), so you can check your solutions.

Each section is independent; you don't need to read it in order, so if there is a particular section you are interested in, feel free to skip to it. Try to think of this book as a reference tool; I hope it is something you can come back to for years to come and learn something useful each time.

I hope this has given you a good idea of what to expect. If you have any feedback, questions ors comments, or just want to chat about Vue and testing, feel free to reach out via email or Twitter (find my most up to date contact details on the website you got this book).

See you in the next section!

