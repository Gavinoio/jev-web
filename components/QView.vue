<script setup lang="ts">
import { computed } from 'vue'
// 题目（questions）的 JSON 着色展示：青=固定字段名 紫=规定的类型值 橙=自己起名 绿=自己填写的内容
const props = defineProps<{ questions: Record<string, any>; compact?: boolean; hideLegend?: boolean }>()

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const sp = (n: number) => '  '.repeat(n)

const html = computed(() => {
  const out: string[] = []
  const qs = Object.entries(props.questions)
  out.push('<span class="p">{</span>')
  qs.forEach(([name, q], qi) => {
    out.push(`${sp(1)}<span class="nm">"${esc(name)}"</span>: <span class="p">{</span>`)
    const fields = Object.entries<any>(q)
    fields.forEach(([f, v], fi) => {
      const comma = fi < fields.length - 1 ? ',' : ''
      if (f === 'type') out.push(`${sp(2)}<span class="fx">"type"</span>: <span class="tv">"${esc(String(v))}"</span>${comma}`)
      else if (f === 'instructions') out.push(`${sp(2)}<span class="fx">"instructions"</span>: <span class="tx">"${esc(String(v))}"</span>${comma}`)
      else if (f === 'criteria' && Array.isArray(v)) {
        out.push(`${sp(2)}<span class="fx">"criteria"</span>: <span class="p">[</span>`)
        v.forEach((it: string, i: number) => out.push(`${sp(3)}<span class="tx">"${esc(it)}"</span>${i < v.length - 1 ? ',' : ''}`))
        out.push(`${sp(2)}<span class="p">]</span>${comma}`)
      } else if (f === 'criteria') {
        out.push(`${sp(2)}<span class="fx">"criteria"</span>: <span class="p">{</span>`)
        const opts = Object.entries<string>(v)
        opts.forEach(([k, d], i) => out.push(`${sp(3)}<span class="nm">"${esc(k)}"</span>: <span class="tx">"${esc(d)}"</span>${i < opts.length - 1 ? ',' : ''}`))
        out.push(`${sp(2)}<span class="p">}</span>${comma}`)
      } else out.push(`${sp(2)}<span class="fx">"${esc(f)}"</span>: ${esc(JSON.stringify(v))}${comma}`)
    })
    out.push(`${sp(1)}<span class="p">}</span>${qi < qs.length - 1 ? ',' : ''}`)
  })
  out.push('<span class="p">}</span>')
  return out.join('\n')
})
</script>
<template>
  <div>
    <pre class="jv qv" :class="{ cp: compact }" v-html="html" />
    <div v-if="!hideLegend" class="legend"><span class="fx">■ 固定字段名</span>　<span class="tv">■ 类型值</span>　<span class="nm">■ 自己起名</span>　<span class="tx">■ 自己填写</span></div>
  </div>
</template>
