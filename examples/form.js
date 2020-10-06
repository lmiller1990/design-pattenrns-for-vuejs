/**
 * name
 * weight (imp|metric)
 */

export function required(value) {
  if (value) {
    return {
      valid: true
    }
  }

  return {
    valid: false,
    message: 'Required'
  }
}

export function isBetween(value, { min, max }) {
  if (value < min || value > max) {
    return {
      valid: false,
      message: `Must be between ${min} and ${max}`
    }
  }

  return { valid: true }
}

export function isBetweenAge(value, { min, max }) {
}

const limits = {
  kg: { min: 30, max: 200 },
  lb: { min: 66, max: 440 },
  cm: { min: 120, max: 200 },
  in: { min: 47, max: 78 },
}

export function validateMeasurement(value, { constraints, nullable }) {
  if (!nullable) {
    const result = required(value)
    if (!result.valid) {
      return result
    }
  }

  return isBetween(value, constraints)
}

export function formValidity(form) {
  return form.name.valid && form.weight.valid
}

export function patientForm(patient) {
  const name = required(patient.name)

  const weight = validateMeasurement(patient.weight.value, {
    nullable: false,
    constraints: limits[patient.weight.units]
  })

  return {
    name,
    weight,
    formValidity
  }
}

