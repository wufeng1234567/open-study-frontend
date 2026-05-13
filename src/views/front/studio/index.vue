<!-- front/studio/index.vue -->
<template>
  <div class="studio-container">
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>
<script setup name="FrontStudio">
import { useRoute, useRouter } from 'vue-router'
import { useFrontPageCacheStore } from '@/store/modules/frontPageCache'
import { onMounted, onActivated } from 'vue'

const route = useRoute()
const router = useRouter()
const cacheStore = useFrontPageCacheStore()

onMounted(() => {
  if (route.path === '/front/studio') {
    const lastVisited = cacheStore.getLastVisited('studio', '')  // ← 改这里
    router.replace(`/front/studio/${lastVisited}`)
  }
})

onActivated(() => {
  if (route.path === '/front/studio') {
    const lastVisited = cacheStore.getLastVisited('studio', '')  // ← 改这里
    router.push(`/front/studio/${lastVisited}`)
  }
})
</script>
<style scoped>
.studio-container {
  min-height: 100%;
}
</style>