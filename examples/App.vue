<template>
  <h3>Luxon</h3>
  <date-time 
    v-model="dateLuxon" 
    :deserialize="deserialize"
    :serialize="serialize"
  />
  {{ dateLuxon }}

  <h3>Moment</h3>
  <date-time 
    v-model="dateMoment" 
    :deserialize="deserializeMoment"
    :serialize="serializeMoment"
  />
  {{ dateMoment }}
  <hr />
</template>

<script>
import { ref } from 'vue'
import { DateTime } from 'luxon'
import moment from 'moment'
import dateTime from './date-time.vue'

export function serializeMoment(value) {
  console.log(value)
  const toString = `${value.year}-${value.month.padStart(2, '0')}-${value.day.padStart(2, '0')}`
  const toObject = moment(toString, 'YYYY-MM-DD', true)
  if (toObject.isValid()) {
    return toObject
  }
  return value
}

export function deserializeMoment(value) {
  if (!moment.isMoment(value)) {
    return value
  }

  return {
    year: value.year().toString(),
    month: (value.month() + 1).toString(),
    day: value.date().toString()
  }
}


export function deserialize(value) {
  return {
    year: value.get('year'),
    month: value.get('month'),
    day: value.get('day')
  }
}

function serialize(value) {
  try {
    const obj = DateTime.fromObject(value)
    if (obj.invalid) {
      return 
    }
  } catch {
    return 
  }

  return DateTime.fromObject(value)
}

export default {
  components: { dateTime },

  setup() {
    const dateLuxon = ref(DateTime.fromObject({
      year: '2019',
      month: '01',
      day: '01',
    }))
    const dateMoment = ref(moment('2019-02-02', 'YYYY-MM-DD'))

    return {
      dateLuxon,
      serialize,
      deserialize,
      dateMoment,
      serializeMoment,
      deserializeMoment
    }
  }
}
</script>
