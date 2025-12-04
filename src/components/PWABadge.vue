<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { useEventListener } from '@vueuse/core'

// periodic sync is disabled, change the value to enable it, the period is in milliseconds
// You can remove onRegisteredSW callback and registerPeriodicSync function
const period = 0

const swActivated = ref(false)

/**
 * This function will register a periodic sync check every hour, you can modify the interval as needed.
 */
function registerPeriodicSync(swUrl: string, r: ServiceWorkerRegistration) {
  if (period <= 0) return

  setInterval(async () => {
    if ('onLine' in navigator && !navigator.onLine)
      return

    const resp = await fetch(swUrl, {
      cache: 'no-store',
      headers: {
        'cache': 'no-store',
        'cache-control': 'no-cache',
      },
    })

    if (resp?.status === 200)
      await r.update()
  }, period)
}

const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW({
  immediate: true,
  onRegisteredSW(swUrl, r) {
    if (period <= 0) return
    if (r?.active?.state === 'activated') {
      swActivated.value = true
      registerPeriodicSync(swUrl, r)
    }
    else if (r?.installing) {
      r.installing.addEventListener('statechange', (e) => {
        const sw = e.target as ServiceWorker
        swActivated.value = sw.state === 'activated'
        if (swActivated.value)
          registerPeriodicSync(swUrl, r)
      })
    }
  },
})

const installPrompt = ref<any>(null);

useEventListener('beforeinstallprompt' as keyof WindowEventMap, (e) => {
  e.preventDefault();
  installPrompt.value = e;
});

function showInstallPrompt() {
  if (!installPrompt.value) return;
  installPrompt.value.prompt();
  installPrompt.value = null;
}

const title = computed(() => {
  if (offlineReady.value || !!installPrompt.value)
    return 'app ready to work offline'
  if (needRefresh.value)
    return 'new content available, click on reload button to update.'
  return ''
})

function close() {
  offlineReady.value = false
  needRefresh.value = false
  installPrompt.value = null;
}
</script>

<template>
  <div v-if="offlineReady || needRefresh || !!installPrompt" class="pwa-toast bordered" aria-labelledby="toast-message" role="alert">
    <div class="message">
      <span id="toast-message">
        {{ title }}
      </span>
    </div>
    <div class="btns">
      <button v-if="needRefresh" type="button" @click="updateServiceWorker()">
        reload
      </button>
      <button v-if="!!installPrompt" type="button" @click="showInstallPrompt">
        install
      </button>
      <button type="button" @click="close">
        close
      </button>
    </div>
  </div>
</template>

<style scoped>
.pwa-toast {
  position: fixed;
  right: 0;
  bottom: 0;
  margin: 16px;
  padding: 12px;
  z-index: 1;
  text-align: left;
  display: grid;
  background-color: var(--background-color);
}

.pwa-toast .message {
  margin-bottom: 8px;
}
</style>
