<script setup lang="ts">
import { computed, type CSSProperties, onBeforeUnmount, ref, watch } from 'vue';
import type { CursorFile } from '../types';
import { convertAniBinaryToCSS } from 'ani-cursor';
import { parseAni } from 'ani-cursor/dist/parser';

const { cursorSlotKey, cursorFile } = defineProps<{
  cursorSlotKey: string;
  cursorFile: CursorFile;
}>();

const canvas = ref<HTMLCanvasElement | null>(null);
const aniStyleElem = ref<HTMLStyleElement | null>(null);
const aniAnimRef = ref<number | null>(null);

watch([() => cursorSlotKey, () => cursorFile, canvas], async () => {
  if (aniStyleElem.value) {
    document.head.removeChild(aniStyleElem.value);
    aniStyleElem.value = null;
  }
  if (aniAnimRef.value !== null) {
    cancelAnimationFrame(aniAnimRef.value);
    aniAnimRef.value = null;
  }
  if (canvas.value) {
    const ctx = canvas.value.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
    }
  }

  if (cursorFile.type !== 'ani' || !canvas.value) return;

  try {
    const bytes = Uint8Array.fromBase64(cursorFile.base64Data.split(',')[1]!);
    aniStyleElem.value = document.createElement('style');
    aniStyleElem.value.innerText = convertAniBinaryToCSS(`#${cursorSlotKey}-preview`, bytes);
    document.head.appendChild(aniStyleElem.value);
    
    const ctx = canvas.value.getContext('2d');
    if (!ctx) {
      console.warn('Failed to get 2D context for ANI cursor preview');
      return;
    }

    const aniData = parseAni(bytes);
    if (!aniData.images || aniData.images.length === 0) {
      console.warn('ANI parsed but contains no images');
      return;
    }

    const frames = await Promise.all(
      aniData.images.map((imgBuffer) => {
        const blob = new Blob([imgBuffer as BlobPart], { type: 'image/x-icon' });
        return createImageBitmap(blob);
      })
    );

    canvas.value.width = Math.max(aniData.metadata.iWidth,
      frames.reduce((maxW, img) => Math.max(maxW, img.width), 0));
    canvas.value.height = Math.max(aniData.metadata.iHeight,
      frames.reduce((maxH, img) => Math.max(maxH, img.height), 0));

    let frameIdx = 0;
    let lastTime = 0;
    const JIFFY_MS = 1000 / 60;

    const animate = (time: number) => {
      if (!canvas.value) return;

      const totalSteps = aniData.seq ? aniData.seq.length : frames.length;
      const actualFrameIdx = aniData.seq ? aniData.seq[frameIdx]! : frameIdx;
      let durationJiffies = aniData.metadata.iDispRate;
      if (aniData.rate && aniData.rate[actualFrameIdx] !== undefined) {
        durationJiffies = aniData.rate[actualFrameIdx];
      }
      const durationMs = durationJiffies * JIFFY_MS;

      if (time - lastTime >= durationMs) {
        ctx.clearRect(0, 0, canvas.value.width, canvas.value.height);
        if (frames[actualFrameIdx]) {
          ctx.drawImage(frames[actualFrameIdx]!, 0, 0);
        }

        frameIdx = (frameIdx + 1) % totalSteps;
        lastTime = time;
      }

      aniAnimRef.value = requestAnimationFrame(animate);
    }
    aniAnimRef.value = requestAnimationFrame(animate);
  } catch (e) {
    console.error('Error rendering ANI preview:', e);
  }
});

onBeforeUnmount(() => {
  if (aniStyleElem.value) {
    document.head.removeChild(aniStyleElem.value);
    aniStyleElem.value = null;
  }
  if (aniAnimRef.value !== null) {
    cancelAnimationFrame(aniAnimRef.value);
    aniAnimRef.value = null;
  }
});

const curStyle = computed<CSSProperties>(() => {
  if (cursorFile.type === 'cur') {
    return { cursor: `url(${cursorFile.base64Data}), auto` };
  }
  return {};
});
</script>

<template>
  <div :id="`${cursorSlotKey}-preview`" :style="curStyle" class="cursor-preview">
    <img v-if="cursorFile.type === 'cur'" :src="cursorFile.base64Data" />
    <canvas v-if="cursorFile.type === 'ani'" ref="canvas" width="48" height="48" />
    <div v-if="cursorFile.type === 'unknown'" class="cursor-image unknown-cursor">
      invalid cursor format (only .cur and .ani supported)
    </div>
  </div>
</template>

<style scoped>
.cursor-preview {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  place-items: center;
}
</style>