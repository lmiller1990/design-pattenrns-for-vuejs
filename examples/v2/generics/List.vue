<script setup lang="ts" generic="T extends string | number, U extends ListItem">
import type { ListItem } from './types'

const props = defineProps<{
  list: U[]
  item: T
  foo: string
}>()
</script>

<template>
  {{ props.list }}
</template>