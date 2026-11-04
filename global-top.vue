<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'

// 点击幻灯片里的任意图片放大查看，再点一下或按 Esc 关闭。
// 价格页的厂商 logo（.pc-logo）不放大。
const src = ref('')
const onClick = (e: MouseEvent) => {
  const t = e.target as HTMLElement
  if (!t || t.tagName !== 'IMG' || !t.closest('.slidev-layout')) return
  const img = t as HTMLImageElement
  if (img.classList.contains('pc-logo')) return
  src.value = img.currentSrc || img.src
}
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') src.value = '' }
onMounted(() => { document.addEventListener('click', onClick); document.addEventListener('keydown', onKey) })
onBeforeUnmount(() => { document.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey) })
</script>
<template>
  <!-- 挂到 body 上：幻灯片画布有缩放 transform，留在里面会让 fixed 定位和 vw/vh 跟着放大，导致图片超出屏幕 -->
  <Teleport to="body">
    <div v-if="src" class="zoom" @click.stop="src = ''">
      <img :src="src" />
      <span class="zoom-hint">点击或按 Esc 关闭</span>
    </div>
  </Teleport>
</template>
<style>
.zoom { position: fixed; inset: 0; z-index: 9999; background: rgba(2, 6, 14, 0.92); display: flex; align-items: center; justify-content: center; cursor: zoom-out; }
.zoom > img { max-width: 94vw; max-height: 92vh; border-radius: 10px; box-shadow: 0 10px 60px rgba(0, 0, 0, 0.6); background: #fff; }
.zoom-hint { position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%); color: #8da2c0; font-size: 13px; }
.slidev-layout img:not(.pc-logo) { cursor: zoom-in; }
</style>
