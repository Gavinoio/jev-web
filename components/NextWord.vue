<script setup lang="ts">
import { ref } from 'vue'

const steps = [
  {
    prefix: '今天天气真',
    cands: [
      ['好', 0.62],
      ['不错', 0.21],
      ['热', 0.09],
      ['冷', 0.05],
      ['糟', 0.03],
    ],
  },
  {
    prefix: '今天天气真好',
    cands: [
      ['，', 0.48],
      ['！', 0.3],
      ['啊', 0.12],
      ['。', 0.08],
      ['呀', 0.02],
    ],
  },
  {
    prefix: '今天天气真好，',
    cands: [
      ['适合', 0.35],
      ['我', 0.25],
      ['出去', 0.2],
      ['心情', 0.12],
      ['我们', 0.08],
    ],
  },
]
const i = ref(0)
const picked = ref<string | null>(null)
function pick(w: string) {
  picked.value = w
  setTimeout(() => {
    i.value = (i.value + 1) % steps.length
    picked.value = null
  }, 600)
}
</script>
<template>
  <div class="card cy" style="min-width: 420px">
    <div class="tag">猜猜下一个词是什么？</div>
    <div class="mono" style="font-size: 24px; margin: 8px 0 10px; color: var(--tx)">
      {{ steps[i].prefix }}<span style="color: var(--cy)">{{ picked ?? '▍' }}</span>
    </div>
    <div
      v-for="[w, p] in steps[i].cands"
      :key="w as string"
      class="pbars"
      @click="pick(w as string)"
      style="cursor: pointer"
    >
      <div class="prow" :class="{ top: picked === w }">
        <span class="pl" style="font-size: 16px">{{ w }}</span>
        <span class="pt"><span class="pf" :style="{ width: (p as number) * 100 + '%' }" /></span>
        <span class="pv">{{ Math.round((p as number) * 100) }}%</span>
      </div>
    </div>
    <div class="note" style="margin-top: 6px">
      每写一个字，就把前面所有内容再算一遍 · 情景数据，示意
    </div>
  </div>
</template>
