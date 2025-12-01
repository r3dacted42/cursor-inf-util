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

const fileList = computed(() =>
  getEnabledCursorFiles().reduce((acc, cur) => {
    if (!acc) return cur.filename;
    return `${acc}\n${cur.filename}`;
  }, ""));

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
    <section>
      <fieldset>
        <legend>cursor pack info</legend>
        <label title="name of cursor scheme that will appear in control panel">
          cursor pack name
          <input id="pack-name-input" v-model="packName" type="text" placeholder="cursor pack name" />
        </label>
        <label title="folder that will contain the cursors on installation">
          cursor directory name (leave blank to use pack name)
          <input id="pack-dir-input" v-model="dirName" type="text" placeholder="cursor directory name" />
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
      <button @click="onGenerateInf">generate install.inf</button>
      <button @click="onGeneratePackZip">generate {{ packName }}.zip</button>
    </section>
  </main>

  <footer>
    <hr />
    <p>oyasumi</p>
  </footer>

  <dialog ref="infDialog">
    <header>
      <h3>download <code>install.inf</code> file</h3>
    </header>
    <main>
      <p>save this file in the same directory/folder with all the cursor files. <br />
        it can be used to easily install the cursor pack by right clicking on the <code>install.inf</code> file and
        selecting "Install".</p>
      <textarea disabled>{{ infString }}</textarea>
    </main>
    <footer class="btns">
      <a :href="infDownloadUrl" download="install.inf">
        <button>💾 download install.inf</button>
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
        <textarea disabled>{{ fileList + "\n" }}install.inf</textarea>
      </label>
    </main>
    <footer class="btns">
      <a :href="zipDownloadUrl" :download="`${packName}.zip`">
        <button>💾 download {{ packName }}.zip</button>
      </a>
      <button type="button" @click="zipDialog?.close()">close</button>
    </footer>
  </dialog>

  <PWABadge />
</template>

<style scoped>
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

.btns {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
}
</style>
