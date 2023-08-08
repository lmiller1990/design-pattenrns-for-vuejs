<script lang="ts" setup>
import { ref } from 'vue'
import SumWithProps from './SumWithProps.vue';

const result = ref(0)

async function fetchSum({ n1, n2 }: { n1: number, n2: number }) {
  const url = "/sum?" + new URLSearchParams({
    n1: n1.toString(),
    n2: n2.toString()
  })
  const data = await window.fetch(url)
  result.value = await data.json()
}
</script>

<template>
  <SumWithProps :result="result" @calculate="fetchSum" />
</template>