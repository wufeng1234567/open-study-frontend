<template>
  <div class="create-studio">
    <!-- 返回按钮 -->
    <div class="back-bar">
      <el-button class="back-btn" size="small" @click="goBack">
        <el-icon>
          <ArrowLeft />
        </el-icon>
        返回
      </el-button>
    </div>
    <!-- 题库信息 -->
    <div class="section">
      <div class="section-header">
        <div class="section-title">📋 题库信息</div>
        <el-select v-model="selectedBankId" placeholder="选择已有题库" clearable filterable size="default"
          style="width: 200px" @change="onBankChange" class="bank-selector">
          <el-option v-for="bank in myBanks" :key="bank.id" :label="bank.bankName" :value="bank.id" />
        </el-select>
      </div>
      <el-form ref="basicFormRef" :model="basicForm" :rules="basicRules" label-position="top" class="basic-form">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="题库名称" prop="bankName">
              <el-input v-model="basicForm.bankName" placeholder="给你的题库起个名字" size="large" maxlength="50"
                show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="科目分类" prop="subject">
              <el-select v-model="basicForm.subject" placeholder="选择或输入科目" size="large" filterable allow-create
                style="width: 100%">
                <el-option label="Java" value="Java" />
                <el-option label="Python" value="Python" />
                <el-option label="前端开发" value="前端开发" />
                <el-option label="数据库" value="数据库" />
                <el-option label="算法" value="算法" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="题库封面">
              <ImageUpload v-model="basicForm.coverImage" :limit="1" :file-size="5" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="题库描述">
              <el-input v-model="basicForm.description" type="textarea" :rows="4" placeholder="简单介绍一下这个题库（选填）"
                maxlength="200" show-word-limit />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <!-- 题目搭建 -->
    <div class="section">
      <div class="section-title">📝 题目搭建</div>
      <QuestionBuilder ref="builderRef" :bank-id="selectedBankId || bankId" :knowledge-base-id="knowledgeBaseId"
        :loading="questionsLoading" />
    </div>

    <!-- 发布设置 -->
    <div class="section">
      <div class="section-title">⚙️ 发布设置</div>
      <el-form label-position="top" class="publish-form">
        <el-form-item label="题库可见性">
          <el-radio-group v-model="publishForm.visibility">
            <el-radio label="public">
              <div class="radio-label">
                <span class="label-title">公开</span>
                <span class="label-desc">所有用户可见，可收藏练习</span>
              </div>
            </el-radio>
            <el-radio label="private">
              <div class="radio-label">
                <span class="label-title">私有</span>
                <span class="label-desc">仅自己可见和管理</span>
              </div>
            </el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="其他设置">
          <el-checkbox v-model="publishForm.allowComment">允许评论</el-checkbox>
          <el-checkbox v-model="publishForm.allowFork">允许其他人复制（Fork）</el-checkbox>
        </el-form-item>
      </el-form>
    </div>

    <!-- 底部操作栏 -->
    <div class="step-footer">
      <el-button type="primary" size="large" :loading="saving" @click="handleSave">
        {{ isEditMode ? '保存修改' : '发布题库' }}
      </el-button>
    </div>
  </div>
</template>

<script setup name="FrontStudioCreate">
import ImageUpload from '@/components/ImageUpload/index.vue'
import { ref, reactive, computed, onMounted, watch, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import QuestionBuilder from '../components/QuestionBuilder.vue'
import {
  getQuestionBank,
  listMyQuestionBank,
  updateQuestionBank,
  createQuestionBankWithReturn
} from '@/api/questionBank/questionBank'
import { listQuestionMain, getQuestionMain, addQuestionMain, updateQuestionMain, delQuestionMain } from '@/api/questionMain/questionMain'
import { useFrontPageCacheStore } from '@/store/modules/frontPageCache'

const route = useRoute()
const router = useRouter()
const cacheStore = useFrontPageCacheStore()

const isEditMode = computed(() => !!route.query.bankId)
const bankId = computed(() => route.query.bankId ? parseInt(route.query.bankId) : null)
const knowledgeBaseId = computed(() => {
  const id = route.query.knowledgeBaseId
  return id ? parseInt(id) : null
})
const autoOpenAi = computed(() => route.query.autoOpenAi === 'true')
const newBank = computed(() => route.query.newBank === 'true')

const saving = ref(false)
const basicFormRef = ref(null)
const builderRef = ref(null)
const questionsLoading = ref(false)
const myBanks = ref([])
const selectedBankId = ref(null)

const basicForm = reactive({
  bankName: '',
  subject: '',
  coverImage: '',
  description: ''
})

const basicRules = {
  bankName: [
    { required: true, message: '请输入题库名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  subject: [{ required: true, message: '请选择或输入科目', trigger: 'change' }]
}

const publishForm = reactive({
  visibility: 'public',
  allowComment: true,
  allowFork: true
})

// 返回上一页
const goBack = () => {
  if (route.query.from === 'knowledge') {
    cacheStore.setLastVisited('knowledge', 'list')
    router.push('/front/knowledge/list')
  } else {
    cacheStore.setLastVisited('myQuestion', 'myBank')
    router.push('/front/myQuestion/myBank')
  }
}

// ========== 加载用户题库列表 ==========
const loadMyBanks = async () => {
  try {
    const res = await listMyQuestionBank()
    if (res.code === 200 && res.data) {
      myBanks.value = res.data || []
    }
  } catch (error) {
    console.error('加载我的题库失败:', error)
  }
}

// 选中题库变化处理
const onBankChange = async (bankId) => {
  if (!bankId) return
  selectedBankId.value = bankId
  cacheStore.clearCachedForm('studioCreateForm')
  Object.assign(basicForm, {
    bankName: '',
    subject: '',
    coverImage: '',
    description: ''
  })
  await loadEditData()
}

// ========== Pinia 缓存：恢复表单数据 ==========
onMounted(async () => {
  await loadMyBanks()

  const cachedForm = cacheStore.getCachedForm('studioCreateForm')
  if (cachedForm) {
    Object.assign(basicForm, cachedForm.basicForm || {})
    Object.assign(publishForm, cachedForm.publishForm || {})
  }

  if (isEditMode.value) {
    selectedBankId.value = bankId.value
    await loadEditData()
  } else {
    publishForm.visibility = 'public'
  }

  // 自动打开 AI 出题弹窗
  if (autoOpenAi.value) {
    nextTick(() => {
      setTimeout(() => {
        builderRef.value?.openAiDialog?.()
      }, 500)
    })
  }
})

// 监听路由变化
watch(() => route.query.bankId, async (newBankId) => {
  if (newBankId) {
    await loadEditData()
  } else {
    basicForm.bankName = ''
    basicForm.subject = ''
    basicForm.coverImage = ''
    basicForm.description = ''
    publishForm.visibility = 'public'
    if (builderRef.value) {
      builderRef.value.questions = []
    }
  }
})

// ✅ 修改 saveFormCache，确保只保存纯数据
const saveFormCache = () => {
  cacheStore.setCachedForm('studioCreateForm', {
    basicForm: {
      bankName: basicForm.bankName || '',
      subject: basicForm.subject || '',
      coverImage: basicForm.coverImage || '',
      description: basicForm.description || ''
    },
    publishForm: {
      visibility: publishForm.visibility || 'public',
      allowComment: publishForm.allowComment ?? true,
      allowFork: publishForm.allowFork ?? true
    }
  })
}

// ✅ 页面离开前保存缓存
onBeforeUnmount(() => {
  saveFormCache()
})




// ========== 题型转换（保持原有逻辑） ==========
const mapTypeToNumber = (type) => {
  const map = { single: 1, multiple: 2, judge: 3, fill: 4, essay: 5, composite: 6, readingComprehension: 6, cloze: 6 }
  return map[type] || 1
}

const mapBackendType = (typeNum) => {
  const map = { 1: 'single', 2: 'multiple', 3: 'judge', 4: 'fill', 5: 'essay', 6: 'composite' }
  return map[typeNum] || 'single'
}

const formatOptions = (options) => {
  if (!options || !Array.isArray(options) || options.length === 0) return null
  return JSON.stringify(options.map(opt => typeof opt === 'string' ? opt : opt.text))
}

const parseOptions = (optionsStr) => {
  if (!optionsStr) return []
  try {
    const parsed = JSON.parse(optionsStr)
    if (Array.isArray(parsed)) return parsed.map(item => typeof item === 'string' ? item : item.text || item.value)
  } catch (e) { }
  return []
}

const formatAnswer = (answer, type) => {
  if (answer === undefined || answer === null || answer === '') {
    if (type === 'composite') return ''
    if (type === 'fill' || type === 'essay') return ''
    return ''
  }
  switch (type) {
    case 'judge': return answer === true ? 'true' : 'false'
    case 'single': return (typeof answer === 'number' && answer >= 0) ? String.fromCharCode(65 + answer) : ''
    case 'multiple':
      if (Array.isArray(answer)) {
        const valid = answer.filter(idx => typeof idx === 'number' && idx >= 0)
        return valid.map(idx => String.fromCharCode(65 + idx)).join(',')
      }
      return ''
    default: return String(answer)
  }
}

const parseAnswer = (answerStr, typeNum) => {
  if (!answerStr || answerStr === 'null' || answerStr === '') {
    if (typeNum === 3) return false
    if (typeNum === 2) return []
    if (typeNum === 1) return 0
    return ''
  }
  switch (typeNum) {
    case 3: return answerStr === 'true'
    case 2: return answerStr.split(',').map(s => s.trim()).map(letter => letter.charCodeAt(0) - 65)
    case 1: return answerStr.charCodeAt(0) - 65
    default: return answerStr
  }
}

// ========== 加载编辑数据 ==========
const loadEditData = async () => {
  const currentBankId = selectedBankId.value || bankId.value
  if (!currentBankId) return
  questionsLoading.value = true
  try {
    const bankRes = await getQuestionBank(currentBankId)
    if (bankRes.code === 200 && bankRes.data) {
      const bank = bankRes.data
      basicForm.bankName = bank.bankName
      basicForm.subject = bank.subject
      basicForm.coverImage = bank.coverImage || bank.cover_image || ''
      basicForm.description = bank.description || ''
      publishForm.visibility = bank.isPublic === 0 ? 'public' : 'private'
    } else {
      ElMessage.error('加载题库信息失败')
    }

    const questionRes = await listQuestionMain({ bankId: currentBankId, pageNum: 1, pageSize: 1000 })
    if (questionRes.code === 200 && questionRes.rows) {
      const questions = []
      for (const q of questionRes.rows) {
        try {
          const fullRes = await getQuestionMain(q.id)
          if (fullRes.code === 200 && fullRes.data) {
            const fullQ = fullRes.data
            const base = {
              id: fullQ.id,
              backendId: fullQ.id,
              type: mapBackendType(fullQ.questionType),
              title: fullQ.questionText || '',
              content: fullQ.content || '',
              analysis: fullQ.analysis || '',
              score: fullQ.score || 5
            }
            const isComposite = fullQ.questionType === 6 || fullQ.hasSubQuestions === 1
            if (isComposite) {
              base.type = 'composite'
              base.content = fullQ.content || ''
              const subList = fullQ.questionSubList || []
              base.subQuestions = subList.map(sub => ({
                id: sub.id,
                type: mapBackendType(sub.questionType),
                question: sub.questionText || '',
                optionsJson: sub.options,
                options: parseOptions(sub.options),
                answer: parseAnswer(sub.answer, sub.questionType),
                score: sub.score || 2,
                sortOrder: sub.sortOrder !== undefined ? sub.sortOrder : 0,
                analysis: sub.analysis || ''
              }))
            } else if (['single', 'multiple', 'judge'].includes(base.type)) {
              base.options = parseOptions(fullQ.options)
              base.optionsJson = JSON.stringify(base.options)
              base.answer = parseAnswer(fullQ.answer, fullQ.questionType)
            } else if (base.type === 'fill' || base.type === 'essay') {
              base.answer = fullQ.answer || ''
            }
            questions.push(base)
          }
        } catch (err) {
          console.error(`加载题目 ${q.id} 失败:`, err)
        }
      }
      if (builderRef.value) builderRef.value.questions = questions
    }
  } catch (error) {
    console.error('加载编辑数据失败:', error)
    ElMessage.error('加载数据失败，请刷新重试')
  } finally {
    questionsLoading.value = false
  }
}

const resetQuestions = async () => {
  if (!builderRef.value) return
  if (isEditMode.value) {
    await ElMessageBox.confirm('重置将丢失当前未保存的题目修改，确定要重置吗？', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    await loadEditData()
    ElMessage.success('已重置为上次保存的状态')
  } else {
    await ElMessageBox.confirm('重置将清空所有已添加的题目，确定吗？', '提示', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    builderRef.value.questions = []
    ElMessage.success('已清空所有题目')
  }
}

const validateAnswers = (questions) => {
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    if (q.type === 'composite' && q.subQuestions) {
      for (let j = 0; j < q.subQuestions.length; j++) {
        const sub = q.subQuestions[j]
        const answer = sub.answer
        if (sub.type === 'judge' && typeof answer !== 'boolean') {
          ElMessage.error(`第${i + 1}题的第${j + 1}子题（判断）答案无效`)
          return false
        }
        if (sub.type === 'single' && (typeof answer !== 'number' || answer < 0)) {
          ElMessage.error(`第${i + 1}题的第${j + 1}子题（单选）答案无效`)
          return false
        }
        if (sub.type === 'multiple' && (!Array.isArray(answer) || answer.length === 0)) {
          ElMessage.error(`第${i + 1}题的第${j + 1}子题（多选）答案不能为空`)
          return false
        }
        if ((sub.type === 'fill' || sub.type === 'essay') && (!answer || answer.toString().trim() === '')) {
          ElMessage.error(`第${i + 1}题的第${j + 1}子题答案不能为空`)
          return false
        }
      }
      continue
    }
    if (q.type === 'single' && (typeof q.answer !== 'number' || q.answer < 0)) {
      ElMessage.error(`第${i + 1}题（单选）答案无效`)
      return false
    }
    if (q.type === 'multiple' && (!Array.isArray(q.answer) || q.answer.length === 0)) {
      ElMessage.error(`第${i + 1}题（多选）答案不能为空`)
      return false
    }
    if (q.type === 'judge' && typeof q.answer !== 'boolean') {
      ElMessage.error(`第${i + 1}题（判断）答案无效`)
      return false
    }
    if ((q.type === 'fill' || q.type === 'essay') && (!q.answer || q.answer.toString().trim() === '')) {
      ElMessage.error(`第${i + 1}题答案不能为空`)
      return false
    }
  }
  return true
}

// ========== 保存 ==========
const handleSave = async () => {
  saveFormCache()

  if (!basicForm.bankName || basicForm.bankName.trim().length < 2) {
    ElMessage.warning('请填写题库名称（至少2个字符）')
    return
  }
  if (!basicForm.subject) {
    ElMessage.warning('请选择或输入科目')
    return
  }

  await basicFormRef.value?.validate().catch(() => {
    ElMessage.warning('请填写完整的题库基本信息')
    return
  })

  const rawQuestions = builderRef.value?.questions || []
  const currentQuestions = JSON.parse(JSON.stringify(rawQuestions.map((q, index) => {
    const base = {
      ...q,
      sortOrder: index,
      title: q.title || '',
      content: q.content || '',
      analysis: q.analysis || '',
      score: Number(q.score) || 5,
      type: q.type || 'single',
      options: q.options ? [...q.options] : [],
      answer: q.answer
    }
    if (q.type === 'composite' && q.subQuestions) {
      base.subQuestions = q.subQuestions.map((sub, subIdx) => ({
        ...sub,
        sortOrder: subIdx,
        score: Number(sub.score) || 2,
        options: sub.options ? [...sub.options] : []
      }))
    }
    return base
  }))

  )

  if (currentQuestions.length === 0) {
    ElMessage.warning('请至少添加一道题目')
    return
  }
  if (!validateAnswers(currentQuestions)) return

  saving.value = true
  const bankData = {
    bankName: basicForm.bankName,
    subject: basicForm.subject,
    description: basicForm.description,
    coverImage: basicForm.coverImage,
    totalQuestions: currentQuestions.length,
    status: 0,
    isPublic: publishForm.visibility === 'public' ? 0 : 1
  }

  try {
    let targetBankId = selectedBankId.value || bankId.value
    const effectiveBankId = targetBankId

    if (effectiveBankId) {
      bankData.id = effectiveBankId
      const updateRes = await updateQuestionBank(bankData)
      if (updateRes.code !== 200) throw new Error(updateRes.msg || '更新题库失败')
      targetBankId = effectiveBankId

      const existingRes = await listQuestionMain({ bankId: effectiveBankId, pageNum: 1, pageSize: 1000 })
      const existingQuestions = existingRes.code === 200 ? existingRes.rows : []
      const existingMap = new Map(existingQuestions.map(q => [q.id, q]))

      const toAdd = [], toUpdate = [], frontendIds = new Set()
      for (const q of currentQuestions) {
        if (q.backendId && existingMap.has(q.backendId)) {
          toUpdate.push(q)
          frontendIds.add(q.backendId)
        } else {
          toAdd.push(q)
        }
      }
      const toDelete = existingQuestions.filter(q => !frontendIds.has(q.id)).map(q => q.id)
      if (toDelete.length) await delQuestionMain(toDelete.join(','))

      for (const q of toUpdate) {
        await updateQuestionMain(JSON.parse(JSON.stringify({
          id: q.backendId, bankId: targetBankId, questionType: mapTypeToNumber(q.type), difficulty: 2,
          questionText: q.title || '', content: q.content || '',
          options: formatOptions(q.options),
          answer: q.type === 'composite' ? '' : formatAnswer(q.answer, q.type),
          analysis: q.analysis || '',
          hasSubQuestions: (q.type === 'composite' && q.subQuestions?.length) ? 1 : 0,
          sortOrder: currentQuestions.indexOf(q), score: q.score || 5, status: 0,
          questionSubList: (q.type === 'composite' && q.subQuestions) ? q.subQuestions.map((sub, idx) => ({
            id: sub.id, questionText: sub.question, questionType: mapTypeToNumber(sub.type),
            options: sub.optionsJson || null, answer: formatAnswer(sub.answer, sub.type),
            analysis: sub.analysis || '', sortOrder: sub.sortOrder !== undefined ? sub.sortOrder : idx, score: sub.score || 2
          })) : []
        })))
      }
      for (const q of toAdd) {
        await addQuestionMain(JSON.parse(JSON.stringify({
          bankId: targetBankId, questionType: mapTypeToNumber(q.type), difficulty: 2,
          questionText: q.title || '', content: q.content || '',
          options: formatOptions(q.options),
          answer: q.type === 'composite' ? '' : formatAnswer(q.answer, q.type),
          analysis: q.analysis || '',
          hasSubQuestions: (q.type === 'composite' && q.subQuestions?.length) ? 1 : 0,
          sortOrder: currentQuestions.indexOf(q), score: q.score || 5, status: 0,
          questionSubList: (q.type === 'composite' && q.subQuestions) ? q.subQuestions.map((sub, idx) => ({
            questionText: sub.question, questionType: mapTypeToNumber(sub.type),
            options: sub.optionsJson || null, answer: formatAnswer(sub.answer, sub.type),
            analysis: sub.analysis || '', sortOrder: sub.sortOrder !== undefined ? sub.sortOrder : idx, score: sub.score || 2
          })) : []
        })))
      }
      ElMessage.success('保存成功')
    } else {
      const createRes = await createQuestionBankWithReturn(bankData)
      if (createRes.code !== 200) throw new Error(createRes.msg || '创建题库失败')
      targetBankId = createRes.data?.id
      if (!targetBankId) throw new Error('创建题库成功但未返回ID')
      for (let i = 0; i < currentQuestions.length; i++) {
        const q = currentQuestions[i]
        await addQuestionMain(JSON.parse(JSON.stringify({
          bankId: targetBankId, questionType: mapTypeToNumber(q.type), difficulty: 2,
          questionText: q.title || '', content: q.content || '',
          options: formatOptions(q.options),
          answer: q.type === 'composite' ? '' : formatAnswer(q.answer, q.type),
          analysis: q.analysis || '',
          hasSubQuestions: (q.type === 'composite' && q.subQuestions?.length) ? 1 : 0,
          sortOrder: i, score: q.score || 5, status: 0,
          questionSubList: (q.type === 'composite' && q.subQuestions) ? q.subQuestions.map((sub, idx) => ({
            questionText: sub.question, questionType: mapTypeToNumber(sub.type),
            options: sub.optionsJson || null, answer: formatAnswer(sub.answer, sub.type),
            analysis: sub.analysis || '', sortOrder: sub.sortOrder !== undefined ? sub.sortOrder : idx, score: sub.score || 2
          })) : []
        })))
      }
      ElMessage.success('发布成功')
    }

    cacheStore.clearCachedForm('studioCreateForm')
    router.push('/front/myQuestion/myBank')
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error(error.message || '保存失败，请重试')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped lang="scss">
.create-studio {
  max-width: 100%;
  margin: 0 auto;
  padding: 12px 16px;

  :deep(.el-button) {
    border-radius: 8px;
  }

  :deep(.el-tag) {
    border-radius: 4px;
  }

  :deep(.el-radio__input.is-checked .el-radio__inner) {
    border-radius: 50%;
  }

  :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
    border-radius: 4px;
  }

  .back-bar {
    margin-bottom: 10px;

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #fff;
      border: 1px solid #e5e7eb;
      color: #6b7280;
      border-radius: 8px;
      font-weight: 500;
      padding: 6px 14px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        transform: translateY(-2px);
        border-color: #409eff;
        color: #409eff;
      }

      &:active {
        transform: translateY(0);
      }
    }
  }

  .section {
    background: #fff;
    border-radius: 16px;
    padding: 16px 20px;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    border: 1px solid #e5e7eb;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e5e7eb;

      .section-title {
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: none;
      }

      .bank-selector {
        :deep(.el-select__wrapper) {
          border-radius: 8px;
        }
      }
    }

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 16px;
      padding-bottom: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
  }

  .basic-form,
  .publish-form {
    :deep(.el-form-item__label) {
      font-weight: 500;
      color: #374151;
    }

    :deep(.el-input__wrapper) {
      border-radius: 8px;
      box-shadow: 0 0 0 1px #e5e7eb;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        box-shadow: 0 0 0 1px #d1d5db;
      }

      &.is-focus {
        box-shadow: 0 0 0 1px #409eff;
      }
    }

    :deep(.el-textarea__inner) {
      border-radius: 8px;
      border-color: #e5e7eb;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        border-color: #d1d5db;
      }

      &:focus {
        border-color: #409eff;
      }
    }

    :deep(.el-select .el-input__wrapper) {
      border-radius: 8px;
    }

    .radio-label {
      display: flex;
      flex-direction: column;

      .label-title {
        font-weight: 500;
        color: #1f2937;
      }

      .label-desc {
        font-size: 13px;
        color: #6b7280;
      }
    }
  }

  .step-footer {
    display: flex;
    justify-content: center;
    padding-top: 12px;

    :deep(.el-button) {
      border-radius: 8px;
      padding: 12px 48px;
      font-weight: 500;
    }
  }
}
</style>