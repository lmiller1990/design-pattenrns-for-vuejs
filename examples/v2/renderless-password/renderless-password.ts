export type Validator = (payload: {
  complexity: number;
  password: string;
  confirmation: string;
  matching: boolean;
}) => boolean;

export function isMatching(password: string, confirmation: string) {
  if (!password || !confirmation) {
    return false
  }
  return password === confirmation
}

export function calcComplexity(val: string) {
  if (!val) {
    return 0
  }

  if (val.length > 10) {
    return 3
  }
  if (val.length > 7) {
    return 2
  }
  if (val.length > 5) {
    return 1
  }

  return 0
}

