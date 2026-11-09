<!-- 官方 Playground 真实调用截图：按题型 / 工单切换，部分截图可切换“结果视图 / JSON” -->
<script setup lang="ts">
import { computed, ref, watch } from 'vue'

type View = { label: string; src: string }
type Tab = { label: string; tag?: string; views: View[]; note: string }

const props = defineProps<{ tabs: Tab[] }>()
const tab = ref(0)
const view = ref(0)
watch(tab, () => { view.value = 0 })
const cur = computed(() => props.tabs[tab.value])
</script>

<template>
  <div class="shots">
    <div class="shots-bar">
      <div class="shots-tabs" role="tablist">
        <button v-for="(t, i) in tabs" :key="t.label" role="tab" :aria-selected="i === tab" :class="{ on: i === tab }" @click="tab = i">
          {{ t.label }}<small v-if="t.tag">{{ t.tag }}</small>
        </button>
      </div>
      <div v-if="cur.views.length > 1" class="shots-views">
        <button v-for="(v, i) in cur.views" :key="v.label" :class="{ on: i === view }" @click="view = i">{{ v.label }}</button>
      </div>
    </div>
    <div class="shots-frame">
      <img :src="cur.views[view].src" :alt="cur.label + ' · ' + cur.views[view].label + '（官方 Playground 截图，点击放大）'" />
    </div>
    <div class="shots-note"><b>读结果</b><span v-html="cur.note" /></div>
  </div>
</template>

<style scoped>
.shots { flex: 1 1 0; min-height: 0; display: flex; flex-direction: column; gap: 8px; }
.shots-bar { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.shots-tabs, .shots-views { display: flex; gap: 6px; flex-wrap: wrap; }
.shots button {
  padding: 5px 12px; border: 1px solid var(--line); border-radius: 999px;
  background: rgba(15, 28, 51, .6); color: var(--tx2); font-size: 13px; line-height: 1.3; cursor: pointer;
}
.shots button small { margin-left: 5px; color: var(--tx3); font-size: 11px; }
.shots button:hover { color: var(--tx); }
.shots button.on { border-color: var(--cy); background: rgba(56, 189, 248, .14); color: var(--cy); }
.shots-views button { padding: 4px 10px; font-size: 12px; }
.shots-views button.on { border-color: var(--pu); background: rgba(167, 139, 250, .14); color: var(--pu); }
.shots-frame {
  flex: 1 1 0; min-height: 0; overflow: hidden;
  display: flex; align-items: flex-start; justify-content: center;
}
.shots-frame img { display: block; max-width: 100%; max-height: 100%; object-fit: contain; border: 1px solid var(--line); border-radius: 10px; background: #fff; }
.shots-note { display: flex; gap: 10px; align-items: baseline; font-size: 14px; line-height: 1.5; color: var(--tx); }
.shots-note b { flex: none; color: var(--gn); font-size: 12px; font-weight: 600; letter-spacing: 1px; }
</style>
