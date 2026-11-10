<script setup lang="ts">
import { ref } from 'vue'
// 切分结果用 GPT-5 系列的分词器 o200k_base（tiktoken）实测，与 platform.openai.com/tokenizer 一致；其他模型切法不同
const samples = {
  zh: { btn: '中文句', text: '我要退款', toks: ['我要', '退款'], unit: '4 个字' },
  en: { btn: '英文句', text: 'I want a refund', toks: ['I', ' want', ' a', ' refund'], unit: '4 个词' },
  long: { btn: '长单词', text: 'unbelievable', toks: ['un', 'bel', 'ievable'], unit: '1 个词' },
  word: { btn: '程序员', text: '程序员', toks: ['程序', '员'], unit: '3 个字' },
}
const k = ref<keyof typeof samples>('zh')
const cls = ['a', 'b', 'c']
</script>
<template>
  <div class="card cy">
    <div class="tag">TOKENIZER · GPT-5 实测</div>
    <div class="chips" style="margin:6px 0 10px">
      <button class="chip" v-for="(v, key) in samples" :key="key" @click="k = key"
        :style="k === key ? 'color:var(--tx);border-color:var(--cy)' : ''">{{ v.btn }}</button>
    </div>
    <div class="dim" style="font-size:13px">原文：{{ samples[k].text }}</div>
    <div style="margin:8px 0">
      <span v-for="(t, i) in samples[k].toks" :key="i" class="tok" :class="cls[i % 3]">{{ t }}</span>
    </div>
    <div class="kpi" style="font-size:34px"><small class="tv-unit">{{ samples[k].unit }} →</small> {{ samples[k].toks.length }}<small> 个 token</small></div>
    <div class="note">以上按 GPT-5 实测，换个模型切法会不同<br />自己试试：<a href="https://platform.openai.com/tokenizer" target="_blank">platform.openai.com/tokenizer</a></div>
  </div>
</template>
