## Grouping ...

Vue 3's flagship feature is The Composition API; it's main selling point is to easily group and reuse code by *feature*. In this section we will see some techniques to write testable composables by building a tic tac toe game. 

The API we will end with looks like this:

```js
export default {
  setup() {
    const { currentBoard, makeMove } = useTicTacToe()

    return {
      makeMove,
      currentBoard
    }
  }
}
```

`currentBoard` is a `computed` property that looks like this:

```js
[
  ['x', 'o', '-'],
  ['x', 'o', 'x'],
  ['-', 'o', '-']
]
```

`makeMove` is a function that takes two arguments: `col` and `row`. Given this board:

```
[
  ['-', '-', '-'],
  ['-', '-', '-'],
  ['-', '-', '-']
]
```

Calling `makeMove({ row: 0, col: 1 })` would yield the following board (where `o` goes first)

```
[
  ['-', 'o', '-'],
  ['-', '-', '-'],
  ['-', '-', '-']
]
```

While we won't do it here, I'd like to have a "history" feature, so we can replay the game and see how things progressed. We will keep this in mind as we develop. Implementing this will be an exercise, and the solution will be included in the final source code.

Finally, we want to consider two potential use cases for the composable. One is to allow many different components to update or access the same game of tic tac toe. Another is to support having many simultaneous games of tic tac toe running at once.

## Defining the Initial Board

Let's start with some way to maintain the game state. I will call this variable `initialBoard`:

```js
const initialBoard = [
  ['-', '-', '-'],
  ['-', '-', '-'],
  ['-', '-', '-']
]
```

Before diving too far into the game logic, let's get something rendering. Remember we want to keep a history of the game? This means instead of mutating the game state, we should just create a new game state for each and push it into an array. We also need the board to be reactive, so Vue will update the UI. We can use `ref` for this. Update the code:

```js
import { ref, readonly } from 'vue'

const initialBoard = [
  ['-', '-', '-'],
  ['-', '-', '-'],
  ['-', '-', '-']
]

const boards = ref([initialBoard])

export function useTicTacToe() {
  return {
    boards: readonly(boards)
  }
}
```

I made the board `readonly`; I don't want to update the game state direct in the component, but via a method we will write soon in the composable. This is not only better *separation of concerns* but also more testable.

Let's try it out! Create a new component and use the `useTicTacToe` function:

```html
<template>
  <div v-for="row, rowIdx in boards[0]" class="row">
    <div 
      v-for="col, colIdx in row" 
      class="col" 
    >
      {{ col }}
    </div>
  </div>
</template>

<script>
import { useTicTacToe } from './tic-tac-toe.js'

export default {
  setup() {
    const { boards } = useTicTacToe()

    return {
      boards
    }
  }
}
</script>

<style>
.row {
  display: flex;
}

.col {
  border: 1px solid black;
  height: 50px;
  width: 50px;
}
</style>
```

Great! It works:

ss1

## Computing the Current State

Currently the component is hard coded to use `boards[0]`. What we really want to do is use the last element, which is the latest game state. We can use a `computed` property for this. Update the composable:

```
import { ref, readonly, computed } from 'vue'

const initialBoard = [
  ['-', '-', '-'],
  ['-', '-', '-'],
  ['-', '-', '-']
]

const boards = ref([initialBoard])

export function useTicTacToe() {
  return {
    boards: readonly(boards),
    currentBoard: computed(() => boards.value[boards.value.length - 1])
  }
}
```

Update the component to use the new `currentBoard` computed property:

```html
<template>
  <div v-for="row, rowIdx in currentBoard" class="row">
    <div 
      v-for="col, colIdx in row" 
      class="col" 
    >
      {{ col }}
    </div>
  </div>
</template>

<script>
import { useTicTacToe } from './tic-tac-toe.js'

export default {
  setup() {
    const { boards, currentBoard } = useTicTacToe()

    return {
      boards,
      currentBoard
    }
  }
}
</script>
```

This works, but introduces a limitation. We cannot have multiple games of tic tac toe on the screen at the same time - `boards` is effectively a global variable, in a way. We will fix this limitation later on.

## Tests

We've written a little too much code without any tests for my liking. Now is a good time to write some, which will reveal some (potential) problems with our design.

```js
import { useTicTacToe } from './tic-tac-toe.js'

describe('useTicTacToe', () => {
  it('initializes state to an empty board', () => {
    const initialBoard = [
      ['-', '-', '-'],
      ['-', '-', '-'],
      ['-', '-', '-']
    ]
    const { currentBoard } = useTicTacToe()

    expect(currentBoard.value).toEqual(initialBoard)
  })
})
```

This does pass, but also reveals some potential issues. Firstly, we are really wanting to test our business logic (the game logic, in this case). We had to use `.value` in the test, though - this is part of Vue's reactivity system. In other words, the UI layer - we have effectively coupled our implementation to Vue. You could not reuse this in another framework, like React, for example. This is a relatively simple composable and a coupling I am happy to live with for now, but it's still worth recognizing it and considering the implications this might have in the future, should we decide to move away from Vue.

This might seem unlikely, but we thought the same thing about jQuery, Backbone and Angular.js. For this simple example I think it's fine, but if we start to write signficantly complex business logic, we may want to consider removing the coupling between the composable and the business logic.

Another problem is there is no easy way to pre-set the game state - we currently cannot test a scenario where many moves have been played. We could work around this by passing in an intiial state to `useTicTacToe`, for example `useTicTacToe(initialState)`.

The third problem was highlighted earlier - `boards` is effectively a global variable. Any updates to the game state in a test will be reflected in all other tests. This is not ideal - each test should be isolated and side effect free. We will fix this soon.

Let's start by fixing the first issue, and allow setting an initial state.

## Setting an Initial State

To do this, we first need to make a small refactor: move all the logic and variables *inside* the `useTicTacToe` function. 

```js
import { ref, readonly, computed } from 'vue'

export function useTicTacToe() {
  const initialBoard = [
    ['-', '-', '-'],
    ['-', '-', '-'],
    ['-', '-', '-']
  ]

  const boards = ref([initialBoard])

  return {
    boards: readonly(boards),
    currentBoard: computed(() => boards.value[boards.value.length - 1])
  }
}
```

Tests are still passing, definitely a good sign. Now add an `initialState` argument:

```js
```js
import { ref, readonly, computed } from 'vue'

export function useTicTacToe(initialState) {
  const initialBoard = [
    ['-', '-', '-'],
    ['-', '-', '-'],
    ['-', '-', '-']
  ]

  const boards = ref(initialState || [initialBoard])

  return {
    boards: readonly(boards),
    currentBoard: computed(() => boards.value[boards.value.length - 1])
  }
}
```

And finally, add a test:

```js
describe('useTicTacToe', () => {

  it('initializes state to an empty board', () => {
    // ...
  })

  it('supports seding an initial state', () => {
    const initialState = [
      ['o', 'o', 'o'],
      ['-', '-', '-'],
      ['-', '-', '-']
    ]
    const { currentBoard } = useTicTacToe([initialState])

    expect(currentBoard.value).toEqual(initialState)
  })
})
```

Notice we pass in `[initialState]` as an array - we are representing the state as an array to preserve the history. This allows us to seed a fully completed game, which will be useful when writing the logic to see if a player has won.

With this refactor, we can seed the state - but now calling `useTicTacToe` will return a *new* game of tic tac toe every time. There is no way for multiple components to update the same game by simply calling `useTicTacToe()` - this is a limitation we will address soon, too. 

## Making a Move

The final feature we will add is making a move. We need to keep track of the current player, and then update the board by pushing the next game state into `boards`. Let's start with a test:

```js
describe('makeMove', () => {
  it('updates the board and adds the new state', () => {
    const game = useTicTacToe() 
    game.makeMove({ row: 0, col: 0 })

    expect(game.boards.value).toHaveLength(2)
    expect(game.currentPlayer.value).toBe('x')
    expect(game.currentBoard.value).toEqual([
      ['o', '-', '-'],
      ['-', '-', '-'],
      ['-', '-', '-']
    ])
  })
})
```

There isn't anything too surprising here. After making a move, we have two game states (initial and the current one). The current player is now `x` (since `o` goes first). Finally, the `currentBoard` should be updated.

The implementation is quite simple, too:

```js
export function useTicTacToe(initialState) {
  const initialBoard = [
    ['-', '-', '-'],
    ['-', '-', '-'],
    ['-', '-', '-']
  ]

  const boards = ref(initialState || [initialBoard])
  const currentPlayer = ref('o')

  function makeMove({ row, col }) {
    const newBoard = [...boards.value[boards.value.length - 1]]
    newBoard[row][col] = currentPlayer.value
    currentPlayer.value  = currentPlayer.value === 'o' ? 'x' : 'o'
    boards.value.push(newBoard)
  }


  return {
    makeMove,
    boards: readonly(boards),
    currentPlayer: readonly(currentPlayer),
    currentBoard: computed(() => boards.value[boards.value.length - 1])
  }
}
```

This gets the test to pass. Let's update the usage:

```html
<template>
  <div v-for="row, rowIdx in currentBoard" class="row">
    <div 
      v-for="col, colIdx in row" 
      class="col" 
      @click="makeMove({ row: rowIdx, col: colIdx })"
    >
      {{ col }}
    </div>
  </div>
</template>

<script>
import { useTicTacToe } from './tic-tac-toe.js'

export default {
  setup() {
    const { boards, currentBoard, makeMove } = useTicTacToe()

    return {
      boards,
      currentBoard,
      makeMove
    }
  }
}
</script>
```

ss2

The game is now playable - well, you can make moves. There are a number of problems - no way to know if a player has won, and you can make an invalid move (for example, going on a square that is already taken). Fixing these is not very difficult and will be left as an exercise. You can find the solutions in the source code.

What we will do, now, is support updating the same tic tac toc game from different components. 

## Tracking Games by ID

If another component calls the `useTicTacToe` function, it will get a new instance of a game - this might not be what the user expects, Most of the time, composables will return the *same* instance - examples are `useStore` and `useRouter` from Vuex and Vue Router respectively. If we decided that there is no use case for multiple games, we could simply update the composable as follows:

```js
import { ref, readonly, computed } from 'vue'

let initialBoard = [
  ['-', '-', '-'],
  ['-', '-', '-'],
  ['-', '-', '-']
]

let boards
const currentPlayer = ref('o')

function makeMove({ row, col }) {
  const newBoard = [...boards.value[boards.value.length - 1]]
  newBoard[row][col] = currentPlayer.value
  currentPlayer.value  = currentPlayer.value === 'o' ? 'x' : 'o'
  boards.value.push(newBoard)
}


export function useTicTacToe(initialState) {
  // first usage
  if (!boards) {
    boards = ref(initialState || [initialBoard])
  }

  return {
    makeMove,
    boards: readonly(boards),
    currentPlayer: readonly(currentPlayer),
    currentBoard: computed(() => boards.value[boards.value.length - 1])
  }
}
```

What if we want *both*? The ability to have multiple games, *and* access them all from any component? One way we can handle this is by using an `id` to identify each game, and storing them in a key value map. This implementation is simplified - I removed the `initialState` feature. It's just for demonstration purposes:

```js
import { ref, readonly, computed } from 'vue'

function createNewGame() {
  const initialBoard = [
    ['-', '-', '-'],
    ['-', '-', '-'],
    ['-', '-', '-']
  ]

  const boards = ref([initialBoard])
  const currentPlayer = ref('o')

  function makeMove({ row, col }) {
    const newBoard = [...boards.value[boards.value.length - 1]]
    newBoard[row][col] = currentPlayer.value
    currentPlayer.value  = currentPlayer.value === 'o' ? 'x' : 'o'
    boards.value.push(newBoard)
  }

  return {
    makeMove,
    boards: readonly(boards),
    currentPlayer: readonly(currentPlayer),
    currentBoard: computed(() => boards.value[boards.value.length - 1])
  }
}

const games = {}

export function useGame(id) {
  return games[id]
}

export function createGame(id) {
  if (!id) {
    throw Error('Please provide an id for the game')
  }

  games[id] = createNewGame()
  return games[id]
}

export function useTicTacToe() {
  return {
    useGame,
    createGame
  }
}
```

Usage is very similar:

```html
<script>
import { useTicTacToe } from './tic-tac-toe.js'

export default {
  setup() {
    const { createGame, useGame } = useTicTacToe()
    const { boards, currentBoard, makeMove } = createGame('1')

    return {
      boards,
      currentBoard,
      makeMove
    }
  }
}
</script>
```

It works. Most of the test are not broken, because we changed the public interface, but fixing them is not difficult. Updating it to work with `initialState` and writing a test will be left as an exercise. The solution can be found in the final source code.

## Conclusion

We saw how you can isolate business logic in a composable, making it testable and reusable. We also discussed some trade-offs of our approach - namely, coupling the business logic to Vue's reactivity system. We also discuss how to design a composables designed to only maintain one instance throughout a system, like `useStore` and `useRouter` in Vuex and Vue Router, as well as a technique to support creating and tracking multiple instances of a composable.

## Exercises

Some exercises to improve:

1. Write some tests with Vue Test Utils to ensure the UI is working correctly.
2. Update the new `createGame` function to take an `initialState`
3. Fix the tests to support the new multi-game interface

The solutions can be found in the source code.

