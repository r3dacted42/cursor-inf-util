<script setup lang="ts">
import PWABadge from './components/PWABadge.vue';
import CursorDropZone from './components/CursorDropZone.vue';
import { useLocalStorage } from '@vueuse/core';
import cursorSlots from './assets/cursorSlots';
import { defaultCursorFile, getCursorPackZipUrl, getEnabledCursorFiles, getInstallInfString } from './lib';
import { computed, onBeforeUnmount, ref } from 'vue';

const packName = useLocalStorage('cursor-pack-name', 'my cool cursorpack');
const dirName = useLocalStorage('cursor-dir-name', '');
const infString = ref<string>();
const infDialog = ref<HTMLDialogElement | null>(null);
const infDownloadUrl = ref<string>();
const zipDownloadUrl = ref<string>();
const zipDialog = ref<HTMLDialogElement | null>(null);

const invalidCharRegex = /[\/\\:*?"<>|]/g;
const getInvalidChars = (s: string) => {
  const regexMatches = (s.match(invalidCharRegex) ?? []) as string[];
  const nonANSIChars = [...s].filter(c => c.charCodeAt(0) > 127);
  return regexMatches.concat(nonANSIChars).reduce((acc, c) => `${acc} ${c}`, '');
};
const packNameInvalidChars = computed(() => getInvalidChars(packName.value));
const dirNameInvalidChars = computed(() => getInvalidChars(dirName.value));

const onGenerateInf = () => {
  if (infDownloadUrl.value) URL.revokeObjectURL(infDownloadUrl.value);
  infString.value = getInstallInfString(packName.value, dirName.value);
  const infBlob = new Blob([infString.value], { type: "application/inf" });
  infDownloadUrl.value = URL.createObjectURL(infBlob);
  infDialog.value?.showModal();
};

const onGeneratePackZip = async () => {
  if (zipDownloadUrl.value) URL.revokeObjectURL(zipDownloadUrl.value);
  zipDownloadUrl.value = await getCursorPackZipUrl(packName.value, dirName.value);
  zipDialog.value?.showModal();
};

const fileList = computed(() => {
  let inclFilenames: Record<string, true> = {};
  return getEnabledCursorFiles().reduce((acc, cur) => {
    if (inclFilenames[cur.filename]) return acc;
    inclFilenames[cur.filename] = true;
    if (!acc) return cur.filename;
    return `${acc}\n${cur.filename}`;
  }, "");
});

function clearAll() {
  for (const slot of Object.keys(cursorSlots)) {
    const storageKey = `cursor-file-${slot}`;
    if (!localStorage.getItem(storageKey)) continue;
    const storageRef = useLocalStorage(`cursor-file-${slot}`, { ...defaultCursorFile });
    storageRef.value = { ...defaultCursorFile };
  }
}

onBeforeUnmount(() => {
  if (infDownloadUrl.value) URL.revokeObjectURL(infDownloadUrl.value);
  if (zipDownloadUrl.value) URL.revokeObjectURL(zipDownloadUrl.value);
});
</script>

<template>
  <main>
    <header>
      <h3>cursor install.inf utility</h3>
    </header>

    <section>
      <fieldset>
        <legend>cursor pack info</legend>
        <label title="name of cursor scheme that will appear in control panel">
          cursor pack name
          <input id="pack-name-input" v-model="packName" type="text" placeholder="cursor pack name"
            :aria-invalid="!!packNameInvalidChars" />
          <small v-if="!!packNameInvalidChars" title="due to limitations in the INF file format">
            pack name cannot contain: {{ packNameInvalidChars }}
          </small>
        </label>
        <label title="folder that will contain the cursors on installation">
          cursor directory name (leave blank to use pack name)
          <input id="pack-dir-input" v-model="dirName" type="text" placeholder="cursor directory name"
            :aria-invalid="!!dirNameInvalidChars" />
          <small v-if="!!dirNameInvalidChars" title="due to limitations in the INF file format">
            directory name cannot contain: {{ dirNameInvalidChars }}
          </small>
        </label>
      </fieldset>
    </section>

    <section>
      <fieldset>
        <legend>cursor files (drag & drop or click)</legend>
        <div class="slots">
          <CursorDropZone v-for="(slotName, slotKey) of cursorSlots" :key="slotKey" :cursorSlotKey="slotKey"
            :cursorSlotName="slotName" />
        </div>
        <div class="btns">
          <button type="reset" @click="clearAll">🧹 clear all</button>
        </div>
      </fieldset>
    </section>

    <section class="btns">
      <button @click="onGenerateInf" :disabled="!!packNameInvalidChars || !!dirNameInvalidChars"
        :title="!!packNameInvalidChars || !!dirNameInvalidChars ? 'please check cursor pack info' : ''">
        generate inf
      </button>
      <button @click="onGeneratePackZip" :disabled="!!packNameInvalidChars || !!dirNameInvalidChars"
        :title="!!packNameInvalidChars || !!dirNameInvalidChars ? 'please check cursor pack info' : ''">
        generate zip
      </button>
    </section>
  </main>

  <footer>
    <hr />
    <div class="creds">
      <span>made with ❤ by <a target="_blank" href="https://github.com/r3dacted42">r3dacted42</a></span>
      <a target="_blank" href="https://github.com/r3dacted42/cursor-inf-util">github repo</a>
    </div>
  </footer>

  <dialog ref="infDialog">
    <header>
      <h3>download <code>install.inf</code> file</h3>
    </header>
    <main>
      <p>save this file in the same directory/folder with all the cursor files. <br />
        it can be used to easily install the cursor pack by right clicking on the <code>install.inf</code> file and
        selecting "Install".</p>
      <textarea readonly>{{ infString }}</textarea>
    </main>
    <footer class="btns">
      <a :href="infDownloadUrl" download="install.inf">
        <button>💾 download <code>install.inf</code></button>
      </a>
      <button type="button" @click="infDialog?.close()">close</button>
    </footer>
  </dialog>

  <dialog ref="zipDialog">
    <header>
      <h3>download <code>{{ packName }}.zip</code> file</h3>
    </header>
    <main>
      <p>this zip file contains all the cursor files as well as the <code>install.inf</code> file.<br />
        it can be used to easily install the cursor pack by right clicking on the <code>install.inf</code> file and
        selecting "Install".</p>
      <label>
        it contains the following files:
        <textarea readonly>{{ fileList + "\n" }}install.inf</textarea>
      </label>
    </main>
    <footer class="btns">
      <a :href="zipDownloadUrl" :download="`${packName}.zip`">
        <button>💾 download <code>{{ packName }}.zip</code></button>
      </a>
      <button type="button" @click="zipDialog?.close()">close</button>
    </footer>
  </dialog>

  <PWABadge />
</template>

<style scoped>
input[aria-invalid="true"] {
  border-color: red;
}

.slots {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.5rem;

  @media (max-width: 800px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 550px) {
    grid-template-columns: 1fr;
  }
}

.creds {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  place-items: center;
}
</style>
