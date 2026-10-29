<script setup lang="ts">
withDefaults(defineProps<{ mode?: string; ms?: number; title: string; timeLabel?: string }>(), { timeLabel: '响应时长' })
</script>
<template>
  <div class="dbar demo-timing">
    <span class="dspacer" />
    <span v-if="ms != null" class="dchip">{{ timeLabel }} {{ ms }} ms</span>
  </div>
</template>
