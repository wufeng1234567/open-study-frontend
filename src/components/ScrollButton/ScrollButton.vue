<template>
  <transition name="fade">
    <div v-if="visible" class="scroll-button-container" :style="{ bottom: bottom + 'px', right: right + 'px' }">
      <button class="scroll-btn-inner" @click="handleClick">
        <el-icon size="18">
          <ArrowDown v-if="scrollDirection === 'down'" />
          <ArrowUp v-else />
        </el-icon>
      </button>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue'

const props = defineProps({
  bottom: {
    type: Number,
    default: 80
  },
  right: {
    type: Number,
    default: 20
  }
})

const visible = ref(false)
const scrollDirection = ref('down')
let lastScrollTop = 0
let hideTimer = null
let directionTimer = null

const handleScroll = () => {
  const scrollTop = document.documentElement.scrollTop

  visible.value = scrollTop > 100

  if (directionTimer) clearTimeout(directionTimer)
  directionTimer = setTimeout(() => {
    if (scrollTop > lastScrollTop) {
      scrollDirection.value = 'down'
    } else {
      scrollDirection.value = 'up'
    }
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop
  }, 80)

  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    visible.value = false
  }, 1000)
}

const handleClick = () => {
  if (scrollDirection.value === 'down') {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' })
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  if (hideTimer) clearTimeout(hideTimer)
  if (directionTimer) clearTimeout(directionTimer)
})
</script>

<style scoped>
.scroll-button-container {
  position: fixed;
  z-index: 1000;
}

.scroll-btn-inner {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #fff;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  color: #000;
}

.scroll-btn-inner:hover {
  background: #f3f4f6;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
