<script setup lang="ts">
import { ref } from 'vue'
// 手工切分的示意，真实切法取决于具体模型的切词器
const samples = {
  zh: { text: '我的月订阅被扣了两次款', toks: ['我的', '月', '订阅', '被', '扣', '了', '两次', '款'] },
  en: { text: 'My monthly plan was charged twice', toks: ['My', ' monthly', ' plan', ' was', ' charged', ' twice'] },
  rare: { text: '程序员', toks: ['程序', '员'] },
}
const k = ref<'zh' | 'en' | 'rare'>('zh')
const cls = ['a', 'b', 'c']
</script>
<template>
  <div class="card cy">
    <div class="tag">TOKENIZER · 示意</div>
    <div class="chips" style="margin:6px 0 10px">
      <button class="chip" v-for="(v, key) in samples" :key="key" @click="k = key as any"
        :style="k === key ? 'color:var(--tx);border-color:var(--cy)' : ''">{{ key === 'zh' ? '中文句' : key === 'en' ? '英文句' : '程序员' }}</button>
    </div>
    <div class="dim" style="font-size:13px">原文：{{ samples[k].text }}</div>
    <div style="margin:8px 0">
      <span v-for="(t, i) in samples[k].toks" :key="i" class="tok" :class="cls[i % 3]">{{ t }}</span>
    </div>
    <div class="kpi" style="font-size:34px">{{ samples[k].toks.length }}<small>个 token</small></div>
    <div class="note">真实切分因模型而异；可在 platform.openai.com/tokenizer 现场试</div>
  </div>
</template>
