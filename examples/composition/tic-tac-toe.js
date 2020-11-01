import { ref, readonly, computed } from 'vue'

export function useTicTacToe(initialState) {
  const initialBoard = [
    ['-', '-', '-'],
    ['-', '-', '-'],
    ['-', '-', '-']
  ]

  const boards = ref(initialState || [initialBoard])
  const currentPlayer = ref('o')

  function makeMove({ row, col }) {
    const newBoard = JSON.parse(JSON.stringify(boards.value))[boards.value.length - 1]
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

