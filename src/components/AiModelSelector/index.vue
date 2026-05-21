<template>
  <el-select :model-value="modelValue" @update:model-value="handleChange" placeholder="系统默认" size="small"
    class="ai-model-selector" :style="{ width: width }">
    <el-option label="系统默认" value="" />
    <el-option v-for="config in configList" :key="config.configId"
      :label="(config.providerName || config.provider) + ' - ' + config.model" :value="config.provider" />
  </el-select>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { listAiConfig } from '@/api/system/aiConfig'

const STORAGE_KEY = 'openstudy_ai_provider'

const props = defineProps({
  modelValue: { type: String, default: '' },
  width: { type: String, default: '200px' }
})

const emit = defineEmits(['update:modelValue', 'change'])

const configList = ref([])

const handleChange = (val) => {
  localStorage.setItem(STORAGE_KEY, val)
  emit('update:modelValue', val)
  emit('change', val)
}

const fetchConfigs = async () => {
  try {
    const res = await listAiConfig()
    if (res.code === 200 && res.rows) {
      configList.value = res.rows.filter(c => c.isEnabled === 1)
    }
  } catch (e) {
    console.error('获取模型配置失败:', e)
  }
}

// 初始化时从 localStorage 恢复选择
const initFromStorage = () => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved !== null && saved !== props.modelValue) {
    emit('update:modelValue', saved)
    emit('change', saved)
  }
}

onMounted(() => {
  fetchConfigs()
  initFromStorage()
})

defineExpose({ refresh: fetchConfigs })
</script>

<style scoped>
.ai-model-selector :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #e5e7eb;
  background: #fff;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.ai-model-selector :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #d1d5db;
}

.ai-model-selector :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #b3b3b3;
}
</style>
