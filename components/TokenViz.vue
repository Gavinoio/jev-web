<script setup lang="ts">
import { ref } from 'vue'
// 手工切分的示意，真实切法取决于具体模型的切词器
const samples = {
  zh: { btn: '中文句', text: '道具没到账', toks: ['道具', '没', '到账'], unit: '5 个字' },
  en: { btn: '英文句', text: "My items haven't arrived", toks: ['My', ' items', ' haven', "'t", ' arrived'], unit: '4 个词' },
  long: { btn: '长单词', text: 'unbelievable', toks: ['un', 'believ', 'able'], unit: '1 个词' },
  rare: { btn: '程序员', text: '程序员', toks: ['程序', '员'], unit: '3 个字' },
}
const k = ref<keyof typeof samples>('zh')
const cls = ['a', 'b', 'c']
</script>
<template>
  <div class="card cy">
    <div class="tag">TOKENIZER · 示意</div>
    <div class="chips" style="margin:6px 0 10px">
      <button class="chip" v-for="(v, key) in samples" :key="key" @click="k = key"
        :style="k === key ? 'color:var(--tx);border-color:var(--cy)' : ''">{{ v.btn }}</button>
    </div>
    <div class="dim" style="font-size:13px">原文：{{ samples[k].text }}</div>
    <div style="margin:8px 0">
      <span v-for="(t, i) in samples[k].toks" :key="i" class="tok" :class="cls[i % 3]">{{ t }}</span>
    </div>
    <div class="kpi" style="font-size:34px"><small class="tv-unit">{{ samples[k].unit }} →</small> {{ samples[k].toks.length }}<small> 个 token</small></div>
    <div class="note">真实切分因模型而异；可在 platform.openai.com/tokenizer 现场试</div>
  </div>
</template>
