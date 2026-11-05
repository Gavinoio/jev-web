<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { slides } from './slides'

// 两种模式，用同一份页面组件：
// - 演讲模式（宽屏 > 1024px）：1120×630 画布按窗口等比缩放，一屏一页，键盘翻页
// - 阅读模式（手机 / 平板竖屏 ≤ 1024px）：所有页面按屏幕宽度自然排版，竖向滚动
// 地址栏加 ?mode=present 或 ?mode=read 可强制指定模式。
const W = 1120
const H = 630
const forced = new URLSearchParams(location.search).get('mode')
const narrow = window.matchMedia('(max-width: 1024px)')
const isNarrow = ref(narrow.matches)
const reading = computed(() => (forced === 'read' ? true : forced === 'present' ? false : isNarrow.value))

const total = slides.length
const pageFromHash = () => Math.min(total, Math.max(1, Number(location.hash.replace(/^#\/?/, '')) || 1)) - 1
const cur = ref(pageFromHash())
const go = (i: number) => {
  cur.value = Math.min(total - 1, Math.max(0, i))
  history.replaceState(null, '', `#/${cur.value + 1}`)
}

const vw = ref(window.innerWidth)
const vh = ref(window.innerHeight)
// 内容按 1120×630 的设计尺寸等比缩放；窗口比 16:9 更宽或更高时，画布跟着延伸填满屏幕，
// 不留黑边。最多延伸到 1.3 倍，避免超宽屏上内容被拉得太散（剩余部分是同色背景）。
const MAX_STRETCH = 1.3
const scale = computed(() => Math.min(vw.value / W, vh.value / H))
const stageW = computed(() => Math.min(vw.value / scale.value, W * MAX_STRETCH))
const stageH = computed(() => Math.min(vh.value / scale.value, H * MAX_STRETCH))
const stageStyle = computed(() => ({
  width: `${stageW.value}px`,
  height: `${stageH.value}px`,
  transform: `scale(${scale.value})`,
  left: `${(vw.value - stageW.value * scale.value) / 2}px`,
  top: `${(vh.value - stageH.value * scale.value) / 2}px`,
}))

// 阅读模式顶部进度条
const progress = ref(0)
const onScroll = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight
  progress.value = max > 0 ? window.scrollY / max : 0
}

const isTyping = (el: EventTarget | null) => {
  const t = el as HTMLElement | null
  return !!t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)
}
const onKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape') { zoomSrc.value = ''; return }
  if (reading.value || isTyping(e.target) || e.ctrlKey || e.metaKey || e.altKey) return
  if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); go(cur.value + 1) }
  else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); go(cur.value - 1) }
  else if (e.key === 'Home') go(0)
  else if (e.key === 'End') go(total - 1)
  else if (e.key === 'f' || e.key === 'F') {
    if (document.fullscreenElement) document.exitFullscreen()
    else document.documentElement.requestFullscreen?.()
  }
}

// 点击任意图片放大，再点一下或按 Esc 关闭（价格页的小 logo 除外）
const zoomSrc = ref('')
const onClick = (e: MouseEvent) => {
  const t = e.target as HTMLElement
  if (t?.tagName !== 'IMG' || !t.closest('.slide') || t.classList.contains('pc-logo')) return
  const img = t as HTMLImageElement
  zoomSrc.value = img.currentSrc || img.src
}

// 窗口缩放、平板旋转时也重新判断模式（部分浏览器不会触发 matchMedia 的 change 事件）
const onResize = () => { vw.value = window.innerWidth; vh.value = window.innerHeight; isNarrow.value = narrow.matches; onScroll() }
const onNarrow = (e: MediaQueryListEvent) => { isNarrow.value = e.matches }
const onHash = () => { cur.value = pageFromHash() }
onMounted(() => {
  window.addEventListener('resize', onResize)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('keydown', onKey)
  window.addEventListener('hashchange', onHash)
  document.addEventListener('click', onClick)
  narrow.addEventListener('change', onNarrow)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('keydown', onKey)
  window.removeEventListener('hashchange', onHash)
  document.removeEventListener('click', onClick)
  narrow.removeEventListener('change', onNarrow)
})
</script>

<template>
  <div :class="reading ? 'reading' : 'presenting'">
    <div v-if="reading" class="read-progress" :style="{ transform: `scaleX(${progress})` }" />

    <!-- 两种模式都把所有页面挂载着，切页/切模式时 Demo 的状态不会丢 -->
    <div class="stage" :style="reading ? undefined : stageStyle">
      <component
        :is="s.component"
        v-for="(s, i) in slides"
        v-show="reading || i === cur"
        :key="i"
        :data-no="`${String(i + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`"
      />
    </div>

    <nav v-if="!reading" class="pnav">
      <button :disabled="cur === 0" aria-label="上一页" @click="go(cur - 1)">‹</button>
      <span>{{ cur + 1 }} / {{ total }}</span>
      <button :disabled="cur === total - 1" aria-label="下一页" @click="go(cur + 1)">›</button>
    </nav>

    <Teleport to="body">
      <div v-if="zoomSrc" class="zoom" @click="zoomSrc = ''">
        <img :src="zoomSrc" />
        <span class="zoom-hint">点击或按 Esc 关闭</span>
      </div>
    </Teleport>
  </div>
</template>
