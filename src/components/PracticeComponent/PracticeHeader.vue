<template>
  <div class="practice-header">
    <el-button size="small" @click="$emit('close')">
      <el-icon><ArrowLeft /></el-icon> 返回题库
    </el-button>
    <span class="mode-title">{{ getModeText(mode) }} · {{ bankName }}</span>
  </div>
</template>

<script setup>
import { ArrowLeft } from '@element-plus/icons-vue'

defineProps({
  mode: {
    type: String,
    required: true,
    validator: (val) => ['sequential', 'random', 'byType', 'mock'].includes(val)
  },
  bankName: {
    type: String,
    default: '题库'
  }
})

defineEmits(['close'])

function getModeText(mode) {
  const modeMap = {
    sequential: '顺序练习',
    random: '随机练习',
    byType: '题型练习',
    mock: '模拟考试'
  }
  return modeMap[mode] || '练习模式'
}
</script>