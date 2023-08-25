# Functional Core, Imperative Shell - Immutable Logic, Mutable Vue

You can find the completed source code in the [GitHub repository under examples/composition-functional](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

______

In the previous chapter, we build a Tic Tac Toe game, encapsulating the logic in a composable. We consciously decided to couple our implementation to Vue, when we used reactivity APIs like `computed` and `ref` in the business logic. 

In this chapter, we will explore an paradigm best characterized as "functional core, imperative shell". We will come back to this name and explain what it means soon.

The goal is to refactor the Tic Tic Toe logic to be more in line with the functional programming paradigm - this means pure functions and no mutation. Since we are avoiding mutation, this mean we will decoupled the logic from Vue's reactivity system, which relies on mutation and side effects.

Let's start with `makeMove`, which is full of mutation. In our previous implementation, `makeMove` looks like this:

```ts
function makeMove(move: { row: number, col: number }) {
  const newBoard = JSON.parse(JSON.stringify(boards.value))[currentMove.value] as Board
  newBoard[move.row][move.col] = currentPlayer.value
  currentPlayer.value  = currentPlayer.value === 'o' ? 'x' : 'o'
  boards.value.push(newBoard)
  currentMove.value += 1
}

```
\begin{center}
Original makeMove implemented using mutation.
\end{center}

We mutate the `newBoard` variable. We then mutate `boards`, by pushing a new value in. We are also using two global variables: `boards` and `currentPlayer`. They are global since they are not declared in the scope of the function, nor are they passed as arguments. I

f we want to approach this in a functional manner, the function needs include all the required data as arguments, and not rely on global variables. If we rely on global variables, the function will no longer be deterministic. We won't be able to know the return value without knowing the value of the global variables. This means `makeMove` needs to have the following signature:

```ts
type Marker = 'x' | 'o' | '-'
type Board = Array<Marker[]>

interface Options {
  col: number
  row: number
  counter: Marker
}

function makeMove(board: Board, { col, row, counter }: Options): Board
```
\begin{center}
The new makeMove will return an updated board based on it's arguments.
\end{center}

In other words, `makeMove` needs to receive all required arguments to create a new board, and should return a new board. This makes it pure; the return value is determined exclusively by the inputs.

You may be wondering: if we cannot mutate anything, how do we get anything done? How will we update the UI?

## Functional Core, Imperative Shell

The answer is that while we only avoid mutation in the business logic. This is the "functional core" part of the paradigm. All side effects, mutation and unpredictable actions, such as updating the DOM and listening for user input will be handled in a thin layer. This thin layer is the  *imperative shell* part of the paradigm. The imperative shell wraps the functional core (the business logic) with Vue's reactivity APIs. All mutation will occur in the imperative shell. 

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{functional-core-imperative-shell.jpg}
  \caption{Functional Core, Imperative Shell. Image Credit: mokagio (Twitter)}
  \label{fig}
\end{figure}

In this diagram the solid white circles represents the "functional core". These are a collection of pure functions that are written in plain JavaScript - no reactivity and no global variables. This includes methods like the new `makeMove` function we are about to write.

The thin layer surrounding the solid circles represents the "imperative shell". In this system, it is the `useTicTacToe` composable - a thin layer written using Vue's reactivity system, marrying the functional business logic and the UI layer.

The solid rectangles on the right represent interactions between the system and the outside world - things like user input, updating the DOM, the response to a HTTP request to a third party system or a push notification.

By making the business logic mutation free, it's very easy to test. We will then test the imperative shell, or the Vue integration, using Testing Library - a library designed for this very purpose - to test Vue components. We won't need too many tests, since all the complexity and edge cases will be covered in the functional core tests.

The final API is going to be the same:

```html
<script lang="ts" setup>
import { useTicTacToe } from "./tic-tac-toe.js";

const { currentBoard, makeMove } = useTicTacToe();
</script>
```
\begin{center}
Final API does not change - only the implementation details.
\end{center}

## Business Logic - The Functional Core

Let's start with the functional core, starting with a `createGame` function:

```ts
/**
 * Core Logic
 * Framework agnostic
 */
export const initialBoard: Board = [
  ["-", "-", "-"],
  ["-", "-", "-"],
  ["-", "-", "-"],
];

export function createGame(initialState: Board[]) {
  return [...initialState];
}
```
\begin{center}
So far, no mutation.
\end{center}

While we could have just done `createGame` without passing any arguments, this makes it easy to seed an initial state for testing. Also, we avoid relying on a global variable.

A test is so trivial it's almost pointless to write, but let's do it anyway:

```ts
describe('useTicTacToe', () => {
  it('initializes state to an empty board', () => {
    const expected: Board = [
      ['-', '-', '-'],
      ['-', '-', '-'],
      ['-', '-', '-']
    ]
    expect(createGame([initialBoard])).toEqual([expected])
  })
})
```
\begin{center}
A simple for the initial game state.
\end{center}

## Immutable `makeMove`

Then bulk of the logic is in the `makeMove` function. To update the board, we need the current game state, the column and row to update, and the counter (`x` or `o`). So those will be the arguments we pass to the function.

```ts
export function makeMove(
  board: Board,
  { col, row, counter }: { col: number; row: number; counter: Marker }
) {
  // copy current board
  // return copy with updated cell
}
```
\begin{center}
The new makeMove function (without implementation).
\end{center}

I decided to have two arguments: the first is the `board`, which I consider the "main" argument. I decided to implement `col`, `row` and `counter` as an object, since I consider those to be "options", which will change depending on the move the player makes.

Before going any further, a test will be useful. I'm going to write a verbose implementation of `makeMove` and then refactor it; the test will help ensure nothing breaks during the refactor.

```ts
describe('makeMove', () => {
  it('returns a new updated board and counter', () => {
    const board = createGame([initialBoard])
    const newBoard = makeMove(board[0], {
      row: 0, 
      col: 0, 
      counter: 'o'
    })

    expect(newBoard).to.eql([
      ['o', '-', '-'],
      ['-', '-', '-'],
      ['-', '-', '-']
    ])
  })
})
```
\begin{center}
A test to guide us.
\end{center}

Let's start with a verbose implementation. We will use `map` to iterate over each row. For each row, we will `map` each column. If we encounter the row and column the user has chosen, we will update the cell. Otherwise, we just return the current cell.

```ts
export function makeMove(
  board: Board,
  { col, row, counter }: { col: number; row: number; counter: Marker }
) {
  // loop each row with map. 
  const newBoard = board.map((theRow, rowIdx) => {
    
    // for each row, loop each column with map.
    return theRow.map((cell, colIdx) => {

      // if we are on the row and column the user
      // has chosen, return the counter (o or x).
      if (rowIdx === row && colIdx === col) {
        return counter
      }
      // otherwise just return the current cell.
      return cell
    })
  })

  return newBoard
}
```
\begin{center}
A verbose and heavily commented makeMove.
\end{center}

The test passes! I left some comments to make it clear what's going on. If you haven't seen this type of code before, it can be a little difficult to understand - it was for me. Once I got used to using tools like `map` and `reduce` instead of a for loop and mutation, I started to find this style of code more concise, and more importantly, less prone to bugs.

We can make this a lot more concise! This is optional; there is some merit to verbose, explicit code too. Let's see the concise version. You can make a decision which one you think is more readable.

```ts
export function makeMove(
  board: Board,
  { col, row, counter }: { col: number; row: number; counter: Marker }
) {
  return board.map((theRow, rowIdx) => {
    return theRow.map((cell, colIdx) =>
      rowIdx === row && colIdx === col ? counter : cell
    );
  });
}
```
\begin{center}
Functional code can be very concise. Careful - readability can suffer.
\end{center}

We avoided making a new variable by returning the result of `board.map`. We also removed the `if` statements by using a ternary operator, and the `return` keyword from the `map` functions. We also added `newCounter` - this will be useful when deciding which player's turn comes next.

The test still passes, so we can be confident the refactor was successfully. I think both implementations are fine; pick the one that you like best.

## Vue Integration - Imperative Shell

Most of the business logic is encapsulated in the `createGame()` and `makeMove()` functions. They are stateless. All the values required are received as arguments. We do need some persisted state somewhere, as well as some mutation to update the DOM; that comes in the form of Vue's reactivity - the *imperative shell*.

Let's start with the composable, `useTicTacToe()`, and get something rendering:

```ts
/**
 * Vue integration layer
 * State here is mutable
 */
export function useTicTacToe() {
  const boards = ref<Board[]>([initialBoard]);
  const counter = ref<Marker>("o");

  const move = ({ col, row }) => {}

  const currentBoard = computed(() => {
    return boards.value[boards.value.length - 1]
  })

  return {
    currentBoard,
    makeMove: move
  }
}
```
\begin{center}
The composable integrates the functional core with Vue's reactivity system - the "imperative shell" around the functional core.
\end{center}

I added an empty `move` function, assigning it to `makeMove` in the return value of `useTicTacToe`. We will be implementing that soon. 

Let's get something rendering. As per usual, you can find the CSS in the source code, or create your own.

```html
<template>
  <div
    v-for="(row, rowIdx) in currentBoard"
    :key="rowIdx"
    class="row"
  >
    <div
      v-for="(col, colIdx) in row"
      :key="colIdx"
      class="col"
      :data-testid="`row-${rowIdx}-col-${colIdx}`"
      :data-test="`row-${rowIdx}-col-${colIdx}`"
      @click="makeMove({ row: rowIdx, col: colIdx })"
    >
      {{ col }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useTicTacToe } from "./tic-tac-toe.js";

const { currentBoard, makeMove } = useTicTacToe();
</script>
```
\begin{center}
Testing out the implementation.
\end{center}

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{ttt-1.png}
  \caption{Rendered game board}
  \label{fig}
\end{figure}

## Integrating makeMove

The last thing we need to do is wrap the functional, stateless `makeMove` function from the functional core. This is easy:

```ts
const move = ({ col, row }: { col: number; row: number }) => {
  const newBoard = makeMove(
    currentBoard.value,
    {
      col,
      row,
      counter: counter.value
    }
  )
  boards.value.push(newBoard)
  counter.value = counter.value === 'o' ? 'x' : 'o'
}
```
\begin{center}
move is just a wrapper around the functional `makeMove`.
\end{center}

Everything now works in it's functional, loosely coupled, immutable glory.

\begin{figure}[H]
  \centering
  \includegraphics[width=\linewidth]{ttt-2.png}
  \caption{Rendered game board}
  \label{fig}
\end{figure}

From a user point of view, nothing has changed, and we can verify this by reusing the UI test (first exercise from the previous section):

```ts
import { describe, it, expect } from "vitest";
import { render, fireEvent, screen } from "@testing-library/vue";
import TicTacToeApp from "./tic-tac-toe-app.vue";

describe("TicTacToeApp", () => {
  it("plays a game", async () => {
    render(TicTacToeApp);

    await fireEvent.click(screen.getByTestId("row-0-col-0"));
    await fireEvent.click(screen.getByTestId("row-0-col-1"));
    await fireEvent.click(screen.getByTestId("row-0-col-2"));

    expect(screen.getByTestId("row-0-col-0").textContent).toContain(
      "o"
    );
    expect(screen.getByTestId("row-0-col-1").textContent).toContain(
      "x"
    );
    expect(screen.getByTestId("row-0-col-2").textContent).toContain(
      "o"
    );
  });
});
```
\begin{center}
The UI test from previous section, ensuring the behavior has not changed.
\end{center}

## Pushing Business Logic into the Functional Core

There is one last improvement we can make. We currently wrap the stateless `makeMove` function:

```ts
const move = ({ col, row }: { col: number; row: number }) => {
  const newBoard = makeMove(
    currentBoard.value,
    {
      col,
      row,
      counter: counter.value
    }
  )
  boards.value.push(newBoard)
  counter.value = counter.value === 'o' ? 'x' : 'o'
}
```

Ideally all the business logic should be in the functional core. This includes changing the counter after each move. I think this is part of the core gameplay - not the UI. For this reason I would like to move `counter.value === 'o' ? 'x' : 'o'` into the functional core.

Update `makeMove` to change the counter after updating the board, and return an object representing the new board as well as the updated counter:

```ts
export function makeMove(
  board: Board,
  { col, row, counter }: { col: number; row: number; counter: Marker }
) {
  const newBoard = board.map((theRow, rowIdx) => {
    return theRow.map((cell, colIdx) =>
      rowIdx === row && colIdx === col ? counter : cell
    );
  });

  const newCounter: Marker = counter === "o" ? "x" : "o";

  return {
    newBoard,
    newCounter,
  };
}
```

Now `makeMove` handles updating the counter, as well as the board. Update `move` to use the new return value:

```ts
const move = ({ col, row }: { col: number; row: number }) => {
  const { newBoard, newCounter } = makeMove(currentBoard.value, {
    col,
    row,
    counter: counter.value,
  });
  boards.value.push(newBoard);
  counter.value = newCounter;
};
``` 

Finally, since we changed the return value, the `makeMove` test needs to be updated (the UI test using Testing Library still passes, since the actual behavior from the user's point of view has not changed):

```ts
describe('makeMove', () => {
  it('returns a new updated board and counter', () => {
    const board = createGame(initialBoard)
    const { newBoard, newCounter } = makeMove(board, {
      row: 0, 
      col: 0, 
      counter: 'o'
    })

    expect(newCounter).toBe('x')
    expect(newBoard).toEqual([
      ['o', '-', '-'],
      ['-', '-', '-'],
      ['-', '-', '-']
    ])
  })
})
```

All the tests are now passing. I think this refactor is a good one; we pushed the business logic into the functional core, where it belongs.

## Reflections and Philosophy

This section explores the kind of concepts that I think separates junior and senior developers. It is one thing to just write some code that works. It's another entirely to really understand the different parts of your system and how the work together. Separation of concerns is really about understanding what a function should do, and where to draw the lines between the different parts of a system.

There are some easy ways to see if you are separating your Vue UI logic from your business logic, or in a more general sense, your imperative shell from your functional core: 

- are you accessing Vue reactivity APIs in your business logic? This usually comes in the form of `.value` for accessing the values of `computed` and `ref`.
- are you relying on global or pre-defined state?

This also prompts another question: what and how should we be testing in our functional core and imperative shell? In the previous section, we tested both in one go - they were so tightly coupled together, so this was the natural way to test them. This worked out fine for that very simple composable, but can quickly become complex. I like to have lots of tests around my business logic. If you write them like we did here - pure functions - they are very easy to test, and the tests run really quickly.

When testing the imperative shell (in this case the Vue UI layer using Testing Library) I like to focus on more high level tests from a user point of view - clicking on buttons and asserting the correct text and DOM elements are rendered. The imperative shell doesn't (and shouldn't) know about how the functional core works - these tests focus on asserting the behavior of the application from the user's perspective.

There is no one true way to write applications. It is also very hard to transition an application from a mutation heavy paradigm to the style discussed in this chapter.. I am more and more of the opinion that coupling Vue's reactivity to your composables and business logic is generally not a good idea - this simple separate makes things a whole lot more easy to reason about, test, and has very little downside (maybe a bit more code, but I don't see this is a big deal).

I think you should extract your logic into a functional core that is immutable and does not rely on shared state. Test this in isolation. Next, you write and test your imperative shell - in this case the `useTicTacToe` composable, in the context of this chapter - an test is using something like Testing Library (or a similar UI testing framework). These test are not testing business logic as such, but that your integration layer (the composable and Vue's reactivity) is correctly hooked up to your functional core. 

## Exercises

Repeat the exercises from the last chapter - undo/redo, defensive checks to prevent illegal moves, check if a player has won the game and display it on the UI.

You can find the completed source code in the [GitHub repository under examples/composition-functional](https://github.com/lmiller1990/design-patterns-for-vuejs-source-code): 
\newline
https://github.com/lmiller1990/design-patterns-for-vuejs-source-code.

\pagebreak
