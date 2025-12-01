// https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop
<script setup lang="ts">
import { useEventListener, useLocalStorage } from '@vueuse/core';
import { computed, ref, useTemplateRef } from 'vue';
import type { CursorSlot } from '../types';
import { defaultCursorFile, enabledSlots } from '../lib';
import CursorPreview from './CursorPreview.vue';

const { cursorSlotKey } = defineProps<{
  cursorSlotKey: CursorSlot,
  cursorSlotName: string,
}>();

const dropZone = useTemplateRef("dropZone");
const fileInput = useTemplateRef("fileInput");
const cursorFile = useLocalStorage(`cursor-file-${cursorSlotKey}`, { ...defaultCursorFile });
const dropZoneLabel = ref('not selected');
const enabled = computed(() => enabledSlots.value[cursorSlotKey]);

const handleCursorFile = (file: File) => {
  const reader = new FileReader();
  reader.onload = () => {
    const b64 = reader.result as string;
    cursorFile.value = {
      filename: file.name,
      type: file.name.endsWith('.cur') ? 'cur' : file.name.endsWith('.ani') ? 'ani' : 'unknown',
      slot: cursorSlotKey,
      base64Data: b64,
    };
  };
  reader.readAsDataURL(file);
};

const handlers = {
  window: {
    handleDrop: (e: DragEvent) => {
      if (!enabled) return;
      if (e.dataTransfer && [...e.dataTransfer.items].some(i => i.kind === "file")) {
        e.preventDefault();
      }
    },
    handleDragOver: (e: DragEvent) => {
      if (!e.dataTransfer || !enabled) return;
      const fileItems = [...e.dataTransfer.items].filter(i => i.kind === "file");
      if (fileItems.length > 0) e.preventDefault();
    }
  },
  dropZone: {
    handleDrop: (ev: DragEvent) => {
      ev.preventDefault();
      if (!ev.dataTransfer || !enabled) return;
      const files = [...ev.dataTransfer.items].map(i => i.getAsFile()).filter(file => file);
      if (files.length > 0 && files[0]) {
        handleCursorFile(files[0]);
      }
    },
    handleDragOver: (e: DragEvent) => {
      if (!e.dataTransfer || !enabled) {
        if (e.dataTransfer) e.dataTransfer.dropEffect = "none";
        return;
      }
      e.dataTransfer.dropEffect = "copy";
      dropZoneLabel.value = 'drop cursor file here';
      e.preventDefault();
    },
    handleDragLeave: (_e: DragEvent) => {
      if (!enabled) return;
      dropZoneLabel.value = 'not selected';
    },
  },
  fileInput: {
    handleChange: (ev: Event) => {
      if (!ev.target || !enabled) return;
      const elem = ev.target as HTMLInputElement;
      if (elem.files && elem.files.length > 0 && elem.files[0]) {
        handleCursorFile(elem.files[0]);
      }
    },
  },
};

const onToggle = () => {
  enabledSlots.value[cursorSlotKey] = !enabled.value;
};

const onDelete = () => {
  cursorFile.value = { filename: '', type: 'unknown', slot: cursorSlotKey, base64Data: '' };
  dropZoneLabel.value = 'not selected';
};

useEventListener(dropZone, "dragover", handlers.dropZone.handleDragOver);
useEventListener(dropZone, "dragleave", handlers.dropZone.handleDragLeave);
useEventListener(dropZone, "drop", handlers.dropZone.handleDrop);
useEventListener(window, "dragover", handlers.window.handleDragOver);
useEventListener(window, "drop", handlers.window.handleDrop);
useEventListener(fileInput, "change", handlers.fileInput.handleChange);
</script>

<template>
  <div class="cursor-drop-zone bordered">
    <div class="slot-label">
      <input class="btn" type="checkbox" :checked="enabled" @change="onToggle" :id="`${cursorSlotName}-enabled`" />

      <span v-if="!enabled">disabled</span>
      <span v-else>
        {{ `${cursorFile.filename ? cursorFile.filename : cursorSlotName}` }}
      </span>

      <button class="btn" type="reset" @click.prevent="onDelete" :disabled="!cursorFile.base64Data">
        &#x1F5D1;
      </button>
    </div>

    <label ref="dropZone" class="bordered drop-zone" :aria-disabled="!enabled" :title="cursorSlotName">
      <span v-if="!cursorFile.base64Data">{{ dropZoneLabel }}</span>
      <CursorPreview v-else :cursor-slot-key="cursorSlotKey" :cursorFile="cursorFile" />
      <input :disabled="!enabled" ref="fileInput" type="file" :id="`${cursorSlotName}-input`" accept=".cur, .ani" />
    </label>
  </div>
</template>

<style scoped>
.cursor-drop-zone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  text-align: center;
  width: 100%;
  height: min-content;
  padding: var(--border-radius);
}

.slot-label {
  display: flex;
  justify-content: space-between;

  .btn {
    border-radius: 0.1rem;
    height: calc(1.2rem + var(--border-radius));
    aspect-ratio: 1;
    padding: 0;
  }
}

.drop-zone {
  place-content: center;
  min-height: 100%;
  aspect-ratio: 1;
  padding: var(--border-radius);
  border-style: dashed;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  margin: 0;

  * {
    user-select: none;
  }

  span {
    pointer-events: none;
  }

  input {
    display: none;
  }
}
</style>