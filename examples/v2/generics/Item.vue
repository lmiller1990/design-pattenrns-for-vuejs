<script lang="ts" setup generic="T extends ListItem">

import type { ListItem } from "./types";

const props = defineProps<{
  klass: string
  item: T
}>();

const items: ListItem[] = []
</script>

<template>
  <ul>
    {{  props.klass }}
  </ul>
</template>
