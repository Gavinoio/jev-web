<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'

// 点击页面里的图片放大查看，再点一下或按 Esc 关闭（给看不清的信息图用）
const src = ref('')
const onClick = (e: MouseEvent) => {
  const t = e.target as HTMLElement
  if (t && t.tagName === 'IMG' && t.classList.contains('shot')) src.value = (t as HTMLImageElement).src
}
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') src.value = '' }
onMounted(() => { document.addEventListener('click', onClick); document.addEventListener('keydown', onKey) })
onBeforeUnmount(() => { document.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey) })
</script>
<template>
  <div v-if="src" class="zoom" @click.stop="src = ''">
    <img :src="src" />
    <span class="zoom-hint">点击或按 Esc 关闭</span>
  </div>
</template>
<style>
.zoom { position: fixed; inset: 0; z-index: 9999; background: rgba(2, 6, 14, 0.92); display: flex; align-items: center; justify-content: center; cursor: zoom-out; }
.zoom img { max-width: 94vw; max-height: 92vh; border-radius: 10px; box-shadow: 0 10px 60px rgba(0, 0, 0, 0.6); }
.zoom-hint { position: absolute; bottom: 14px; left: 50%; transform: translateX(-50%); color: #8da2c0; font-size: 13px; }
.shot { cursor: zoom-in; }
</style>
