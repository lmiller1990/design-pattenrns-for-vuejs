const startingPositions = {
  '1-1': 'white',
  '3-1': 'white',
  '5-1': 'white',
  '7-1': 'white',
  '2-2': 'white',
  '4-2': 'white',
  '6-2': 'white',
  '8-2': 'white',
  '1-3': 'white',
  '3-3': 'white',
  '5-3': 'white',
  '7-3': 'white',
}

export function newGame() {
  return [...Array(8)].reduce((xAcc, curr, x) => {
    return [...Array(8)].reduce((yAcc, curr, y) => {
      const index = `${x+1}-${y+1}`
      if (startingPositions[index]) {
        return { ...yAcc, [index]: startingPositions[index] }
      }
      return { ...yAcc, [index]: undefined }
    }, xAcc)
  }, {})
}
