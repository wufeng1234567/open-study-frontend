<!-- front/knowledge/index.vue -->
<template>
  <div class="knowledge-container">
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>

<script setup name="FrontKnowledge">
import { useRoute, useRouter } from 'vue-router'
import { useFrontPageCacheStore } from '@/store/modules/frontPageCache'
import { onMounted, onActivated, watch } from 'vue'
import { useUpdateCachedPath } from '@/composables/useUpdateCachedPath'  // 如果使用 composable


const route = useRoute()
const router = useRouter()
const cacheStore = useFrontPageCacheStore()

// 替换原来的 onMounted 和 onActivated
onMounted(() => {
  // 只有处于根路径时才自动跳转，否则保持原路径
  if (route.path === '/front/knowledge') {
    const lastVisited = cacheStore.getLastVisited('knowledge', 'home')
    router.replace(`/front/knowledge/${lastVisited}`)
  } else {
    // 更新缓存
    updateCachedPath()
  }
})

onActivated(() => {
  if (route.path === '/front/knowledge') {
    const lastVisited = cacheStore.getLastVisited('knowledge', 'home')
    router.push(`/front/knowledge/${lastVisited}`)
  } else {
    updateCachedPath()
  }
})

// 添加 watch 监听变化
watch(() => route.path, () => {
  if (route.path !== '/front/knowledge') {
    updateCachedPath()
  }
})

function updateCachedPath() {
  const path = route.path
  if (path.startsWith('/front/knowledge/')) {
    const subPath = path.replace('/front/knowledge/', '')
    if (subPath) {
      cacheStore.setLastVisited('knowledge', subPath)
    }
  }
}
</script>