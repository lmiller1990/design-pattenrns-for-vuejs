<template>
  <h3>date-time component with luxon</h3>
  <date-time 
    v-model="dateLuxon" 
    :serialize="serialize"
    :deserialize="deserialize"
  />
  {{ dateLuxon.toFormat('yyyy-MM-dd') }}

  <hr />

  <h3>date-time component with moment</h3>
  <date-time 
    v-model="dateMoment" 
    :serialize="serializeMoment"
    :deserialize="deserializeMoment"
  />

    <div v-if="dateMoment.format">
      {{ dateMoment.format('YYYY-MM-DD') }}
    </div>

</template>

<script>
import { ref, watch  } from 'vue'
import dateTime from './date-time.vue'
import { DateTime } from 'luxon'
import moment from 'moment'

export function serializeMoment(value) {
  const toString = `${value.year}-${value.month.padStart(2, '0')}-${value.day.padStart(2, '0')}`
  const ser = moment(toString, 'YYYY-MM-DD', true)
  if (ser.isValid()) {
    return ser
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
  return DateTime.fromObject(value)
}

export default {
  components: { dateTime },

  setup() {
    const dateLuxon = ref(DateTime.local())
    const dateMoment = ref(moment())

    return {
      dateLuxon,
      serialize,
      deserialize,
      dateMoment,
      deserializeMoment,
      serializeMoment
    }
  }
}
</script>
