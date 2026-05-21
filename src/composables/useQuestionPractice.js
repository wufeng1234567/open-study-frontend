import { ref, computed, watch, nextTick } from 'vue'
import { listQuestionMainAll, getQuestionMain } from '@/api/questionMain/questionMain'
import { parseOptions } from '@/utils/questionUtils'
// 修改导入，添加新的API方法
import { recordOrUpdateError, checkUserErrorExists } from '@/api/questionError/questionError'
import { listQuestionErrorAll } from '@/api/questionError/questionError'
import useUserStore from '@/store/modules/user'
import usePracticeSettingsStore from '@/store/modules/practiceSettings'

// 调试日志工具
import {
  debugFetchStart,
  debugFetchComplete,
  debugProcessStart,
  debugCacheCheck,
  debugShuffle,
  debugCacheWrite,
  debugSetAllQuestionsData,
  debugSetQuestions,
  debugProcessComplete,
  debugResetAndFetch,
  debugFetchQuestions,
  debugStateSnapshot,
  debugCacheStatus
} from '@/utils/practiceDebug'

export function useQuestionPractice(props, { proxy }, options = {}) {
  const {
    isFavoriteMode = false,
    singleQuestionId = null
  } = options

  // 需要支持响应式更新
  const onlyWrong = ref(options.onlyWrong ?? false)
  const questionCount = ref(options.questionCount ?? null)
  const questionOffset = ref(0)
  function updateOnlyWrong(val) { onlyWrong.value = val }
  function updateQuestionCount(val) { questionCount.value = val }
  function updateQuestionOffset(val) { questionOffset.value = val }

  // 响应式数据
  const questions = ref([])
  const allQuestionsData = ref([])
  const currentQuestionIndex = ref(0)
  const selectedAnswer = ref(null)
  const answers = ref([])
  const loading = ref(true)
  const submissionLock = ref(false)

  // 乱序结果缓存：key 为 `${bankId}_${moduleType}`，value 为打乱后的数据
  const shuffledCache = new Map()
  // 答题状态缓存：key 为 `${bankId}_${moduleType}`，value 为答题状态
  const answerStateCache = new Map()
  // 标志位：是否正在重置中（防止二次触发）
  const isResetting = ref(false)

  // 获取用户store
  const userStore = useUserStore()
  // 获取刷题设置store
  const store = usePracticeSettingsStore()

  const subFillBlankAnswers = ref({})
  const subEssayAnswers = ref({})

  // ✅ 修复：recordErrorQuestion 函数 - 智能记录错题（先检查后记录）
  async function recordErrorQuestion(question, userAnswer, isCorrect) {
    if (isCorrect) return // 答对的不记录

    try {
      // 获取当前用户ID
      const currentUserId = userStore.id || userStore.userId

      if (!currentUserId) {
        return
      }

      // 1. 首先检查该题是否已记录为错题

      // 调用检查API
      const checkResponse = await checkUserErrorExists(question.id)

      if (checkResponse.code === 200) {
        const alreadyExists = checkResponse.data

        // 准备错题记录数据
        const errorRecord = {
          userId: currentUserId,
          questionId: question.id,
          bankId: question.bankId || props.bankId,
          errorTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
          lastErrorTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
          errorCount: 1,
          notes: generateErrorNote(question, userAnswer),
          tags: generateErrorTags(question.type, userAnswer),
          difficultyRating: question.difficulty || 3,
          reviewCount: 0,
          isMastered: 0,
          status: 1
        }

        // 2. 调用智能记录API（后端会根据是否存在自动处理）
        const recordResponse = await recordOrUpdateError(errorRecord)

        if (recordResponse.code === 200) {
          const success = recordResponse.data

          if (success) {
            if (alreadyExists) {
            } else {
            }
          } else {
          }
        } else {
        }
      } else {
      }

    } catch (error) {
    }
  }
  // ✅ 新增：生成错因备注
  function generateErrorNote(question, userAnswer) {
    const questionType = question.type
    const noteParts = []

    if (questionType === 'fillblank' || questionType === 'essay') {
      noteParts.push(`错误答案: "${userAnswer || '未填写'}"`)
      noteParts.push(`正确答案: "${question.correctAnswer}"`)
    } else if (questionType === 'single' || questionType === 'truefalse') {
      const userChoice = question.options && question.options[userAnswer] ? question.options[userAnswer] : '未选择'
      const correctChoice = question.options && question.options[question.correctAnswer] ? question.options[question.correctAnswer] : ''
      noteParts.push(`错误选项: ${userChoice}`)
      noteParts.push(`正确选项: ${correctChoice}`)
    } else if (questionType === 'multiple') {
      const userChoices = Array.isArray(userAnswer) && question.options
        ? userAnswer.map(idx => question.options[idx] || `选项${idx}`).join(', ')
        : '未选择'
      const correctChoices = Array.isArray(question.correctAnswer) && question.options
        ? question.correctAnswer.map(idx => question.options[idx] || `选项${idx}`).join(', ')
        : ''
      noteParts.push(`错误选项: ${userChoices}`)
      noteParts.push(`正确选项: ${correctChoices}`)
    }

    return noteParts.join(' | ')
  }

  // ✅ 新增：生成错题标签
  function generateErrorTags(questionType, userAnswer) {
    const tags = ['自动记录']

    if (!userAnswer || (Array.isArray(userAnswer) && userAnswer.length === 0)) {
      tags.push('未作答')
    } else if (questionType === 'fillblank' || questionType === 'essay') {
      tags.push('主观题错误')
    } else {
      tags.push('选择题错误')
    }

    // 根据题目类型添加标签
    switch (questionType) {
      case 'single':
        tags.push('单选题')
        break
      case 'multiple':
        tags.push('多选题')
        break
      case 'truefalse':
        tags.push('判断题')
        break
      case 'fillblank':
        tags.push('填空题')
        break
      case 'essay':
        tags.push('问答题')
        break
    }

    return tags.join(',')
  }


  // 新增：处理单个题目（收藏页面用）
  function fetchSingleQuestion(questionId) {
    loading.value = true

    getQuestionMain(questionId)
      .then((response) => {
        if (response.code === 200 && response.data) {
          // 处理单个题目
          const question = response.data
          processQuestions([question])
        } else {
          proxy.$modal.msgError('获取题目失败')
          loading.value = false
        }
      })
      .catch((err) => {
        proxy.$modal.msgError('加载题目失败')
        loading.value = false
      })
  }

  // 通用题目处理函数 - 现在可被外部调用
  async function processQuestions(data) {
    const count = questionCount.value
    // 判断是否需要打乱题目顺序：随机/模拟考试固定打乱，自定义练习根据 shuffleOptions 设置
    const moduleSettings = store.getModuleSettings(props.moduleType)
    const shouldShuffle = props.moduleType === 'random' || props.moduleType === 'mock' ||
                         (props.moduleType === 'custom' && moduleSettings.shuffleOptions)
    const offset = questionOffset.value

    // 调试日志：开始处理
    debugProcessStart(props.moduleType, data, { shouldShuffle, questionCount: count, offset })

    if (shouldShuffle) {
      // 检查缓存：如果已有乱序结果，直接使用
      const cacheKey = `${props.bankId}_${props.moduleType}`
      let shuffled

      const hasCache = shuffledCache.has(cacheKey)
      debugCacheCheck(props.moduleType, cacheKey, hasCache, hasCache ? shuffledCache.get(cacheKey) : null)

      if (hasCache) {
        // 使用缓存的乱序结果
        shuffled = shuffledCache.get(cacheKey)
      } else {
        // 首次进入，生成乱序并缓存
        shuffled = [...data]
        const beforeShuffle = [...shuffled]
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }

        // 调试日志：打乱前后对比
        debugShuffle(props.moduleType, beforeShuffle, shuffled)
        debugCacheWrite(props.moduleType, cacheKey, shuffled)
        shuffledCache.set(cacheKey, shuffled)
      }

      // 调试日志：设置 allQuestionsData
      debugSetAllQuestionsData(props.moduleType, shuffled, 'processQuestions(shuffle)')

      // 将打乱后的数组保存到 allQuestionsData，确保后续切片保持乱序
      allQuestionsData.value = shuffled

      const sliceEnd = count === 'all' ? shuffled.length : count
      const slicedData = shuffled.slice(0, sliceEnd)

      // 调试日志：设置 questions
      debugSetQuestions(props.moduleType, slicedData, 'processQuestions(shuffle)')

      questions.value = slicedData.map((q) => {
        const processed = transformQuestionForDisplay(q)
        return {
          ...processed,
          answered: false,
          correct: false,
          showAnalysis: false,
          userAnswer: null
        }
      })

      // 调试日志：处理完成
      debugProcessComplete(props.moduleType, questions.value, allQuestionsData.value)

      if (onlyWrong.value) {
        await filterOnlyWrongQuestions()
      } else {
        resetAnswers()
        loading.value = false
      }
    } else {
      if (offset >= data.length) {
        proxy.$modal.msgInfo('已刷完所有题目')
        questions.value = []
        resetAnswers()
        loading.value = false
        return
      }

      const sliceEnd = count === 'all' ? data.length : Math.min(offset + count, data.length)
      const slicedData = data.slice(offset, sliceEnd)

      // 调试日志：设置 allQuestionsData（顺序模式）
      debugSetAllQuestionsData(props.moduleType, data, 'processQuestions(sequential)')
      allQuestionsData.value = data

      // 调试日志：设置 questions（顺序模式）
      debugSetQuestions(props.moduleType, slicedData, 'processQuestions(sequential)')

      questions.value = slicedData.map((q) => {
        const processed = transformQuestionForDisplay(q)
        return {
          ...processed,
          answered: false,
          correct: false,
          showAnalysis: false,
          userAnswer: null
        }
      })

      if (onlyWrong.value) {
        await filterOnlyWrongQuestions()
      } else {
        resetAnswers()
        loading.value = false
      }
    }
  }

  async function filterOnlyWrongQuestions() {
    try {
      const userId = userStore.id || userStore.userId
      if (!userId) {
        proxy.$modal.msgWarning('请先登录')
        loading.value = false
        return
      }
      const res = await listQuestionErrorAll({ userId, bankId: props.bankId })
      if (res.code === 200) {
        const errorList = res.data || []
        if (errorList.length === 0) {
          proxy.$modal.msgInfo('当前暂无错题，请先练习积累错题。')
          questions.value = []
          allQuestionsData.value = []
          loading.value = false
          return
        }
        const errorQuestionIds = new Set(errorList.map(e => e.questionId))
        const filteredQuestions = allQuestionsData.value.filter(q => errorQuestionIds.has(q.id))
        allQuestionsData.value = filteredQuestions
        applyQuestionLimits()
      }
    } catch (e) {
      proxy.$modal.msgError('获取错题列表失败')
      loading.value = false
    }
  }

  function applyQuestionLimits() {
    if (allQuestionsData.value.length === 0) {
      resetAnswers()
      loading.value = false
      return
    }
    const count = questionCount.value
    const shouldShuffle = props.moduleType === 'random' || props.moduleType === 'mock'
    const offset = questionOffset.value

    if (shouldShuffle) {
      const shuffled = [...allQuestionsData.value]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      if (count === 'all') {
        questions.value = shuffled
      } else {
        questions.value = shuffled.slice(0, count)
      }
    } else if (offset >= allQuestionsData.value.length) {
      questions.value = []
      proxy.$modal.msgInfo('已刷完所有题目')
      resetAnswers()
      loading.value = false
      return
    } else if (count && count !== 'all' && typeof count === 'number' && count < allQuestionsData.value.length) {
      questions.value = allQuestionsData.value.slice(offset, offset + count)
    } else {
      questions.value = allQuestionsData.value
    }

    resetAnswers()
    loading.value = false
  }

  function loadBatchWithoutReset() {
    if (allQuestionsData.value.length === 0) {
      return
    }
    const count = questionCount.value
    const offset = questionOffset.value

    if (offset >= allQuestionsData.value.length) {
      questions.value = []
      answers.value = []
      return
    }

    let sliceEnd
    if (count === 'all') {
      sliceEnd = allQuestionsData.value.length
    } else if (typeof count === 'number') {
      sliceEnd = Math.min(offset + count, allQuestionsData.value.length)
    } else {
      sliceEnd = Math.min(offset + 10, allQuestionsData.value.length)
    }

    // 对切片后的数据调用 transformQuestionForDisplay 转换
    const slicedData = allQuestionsData.value.slice(offset, sliceEnd)
    questions.value = slicedData.map(q => {
      const processed = transformQuestionForDisplay(q)
      return {
        ...processed,
        answered: false,
        correct: false,
        showAnalysis: false,
        userAnswer: null
      }
    })

    answers.value = questions.value.map(q => {
      if (['readingComprehension', 'cloze'].includes(q.type)) {
        return {}
      }
      return null
    })

    currentQuestionIndex.value = 0
    selectedAnswer.value = null
    loading.value = false
  }

  // 新增：更新题目数量并重新切片，保留已答题目的状态
  function updateQuestionCountAndSlice(newCount) {
    questionCount.value = newCount

    // 如果 allQuestionsData 为空，不需要处理
    if (allQuestionsData.value.length === 0) {
      return
    }

    // 保存当前题目的答题状态（通过题目 ID 映射）
    const oldQuestionsMap = new Map()
    questions.value.forEach((q, index) => {
      if (q && q.id) {
        oldQuestionsMap.set(q.id, {
          question: q,
          answer: answers.value[index],
          index: index
        })
      }
    })

    // 计算新的偏移量，保持在当前批次的起始位置
    let newOffset = 0
    if (newCount !== 'all' && typeof newCount === 'number') {
      newOffset = Math.floor(questionOffset.value / newCount) * newCount
    }
    questionOffset.value = Math.max(0, newOffset)

    // 从 allQuestionsData 中重新切片
    let sliceEnd
    if (newCount === 'all') {
      sliceEnd = allQuestionsData.value.length
    } else if (typeof newCount === 'number') {
      sliceEnd = Math.min(newOffset + newCount, allQuestionsData.value.length)
    } else {
      sliceEnd = Math.min(newOffset + 10, allQuestionsData.value.length)
    }

    const newData = allQuestionsData.value.slice(newOffset, sliceEnd)

    // 处理新数据，保留已答题目的状态
    questions.value = newData.map(q => {
      const processed = transformQuestionForDisplay(q)
      const existing = oldQuestionsMap.get(q.id)

      if (existing) {
        // 保留已答题目的状态
        return {
          ...processed,
          answered: existing.question.answered,
          correct: existing.question.correct,
          showAnalysis: existing.question.showAnalysis,
          userAnswer: existing.question.userAnswer
        }
      }

      return {
        ...processed,
        answered: false,
        correct: false,
        showAnalysis: false,
        userAnswer: null
      }
    })

    // 重新构建 answers 数组，保留已答题目的答案
    const newAnswers = questions.value.map(q => {
      const existing = oldQuestionsMap.get(q.id)
      if (existing && existing.answer !== undefined) {
        return existing.answer
      }
      if (['readingComprehension', 'cloze'].includes(q.type)) {
        return {}
      }
      return null
    })

    answers.value = newAnswers

    // 确保 currentQuestionIndex 在有效范围内
    if (currentQuestionIndex.value >= questions.value.length) {
      currentQuestionIndex.value = Math.max(0, questions.value.length - 1)
    }

    // 使用 goToQuestion 同步所有状态（包括 selectedAnswer、子题答案等）
    const targetIndex = currentQuestionIndex.value
    if (questions.value[targetIndex]) {
      currentQuestionIndex.value = targetIndex
      const q = questions.value[targetIndex]
      const ans = answers.value[targetIndex]

      // 对于阅读理解或完形填空，同步子题答案
      if (['readingComprehension', 'cloze'].includes(q.type)) {
        selectedAnswer.value = null
        if (ans && ans.fillblank) {
          subFillBlankAnswers.value = { ...ans.fillblank }
        } else {
          subFillBlankAnswers.value = {}
        }
        if (ans && ans.essay) {
          subEssayAnswers.value = { ...ans.essay }
        } else {
          subEssayAnswers.value = {}
        }
      } else {
        selectedAnswer.value = ans ?? null
      }
    } else {
      selectedAnswer.value = null
      subFillBlankAnswers.value = {}
      subEssayAnswers.value = {}
    }

    loading.value = false
  }

  // ✅ 关键：导出的通用转换函数 - 完整版
  function transformQuestionForDisplay(q) {
    let type = 'unknown'
    switch (q.questionType || q.question_type) {
      case 1:
        type = 'single'
        break
      case 2:
        type = 'multiple'
        break
      case 3:
        type = 'truefalse'
        break
      case 4:
        type = 'fillblank'
        break
      case 5:
        type = 'essay'
        break
      case 6:
        type = 'readingComprehension'
        break
      case 7:
        type = 'cloze'
        break
      default:
        type = 'unknown'
    }

    // 解析选项
    let options = []
    if (q.options) {
      try {
        // 优先使用 parseOptions 函数
        if (typeof parseOptions === 'function') {
          options = parseOptions(q.options, type)
        } else {
          // 备用方案：手动解析
          if (typeof q.options === 'string') {
            const trimmed = q.options.trim()
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
              options = JSON.parse(trimmed)
            } else if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
              const parsed = JSON.parse(trimmed)
              options = Object.values(parsed).filter(val => val !== null && val !== undefined)
            } else {
              options = trimmed.split(',').map(opt => opt.trim())
            }
          } else if (Array.isArray(q.options)) {
            options = q.options
          } else if (typeof q.options === 'object') {
            options = Object.values(q.options).filter(val => val !== null && val !== undefined)
          }
        }
      } catch (e) {
        // 创建有意义的默认选项
        if (type === 'single' || type === 'multiple') {
          // 根据题目内容创建相关选项
          const baseOptions = ['has studied', 'studies', 'is studying', 'study']
          options = baseOptions
        } else if (type === 'truefalse') {
          options = ['正确', '错误']
        }
      }
    } else {
      // 创建有意义的默认选项
      if (type === 'single' || type === 'multiple') {
        // 根据题目内容创建相关选项
        if (q.questionText && q.questionText.includes('English')) {
          options = ['has studied', 'studies', 'is studying', 'study']
        } else if (q.questionText && q.questionText.includes('If I')) {
          options = ['am', 'was', 'were', 'be']
        } else {
          options = ['选项A', '选项B', '选项C', '选项D']
        }
      } else if (type === 'truefalse') {
        options = ['正确', '错误']
      }
    }

    // ✅ 改进：正确答案标准化
    let correctAnswer = q.answer

    if (type === 'truefalse') {
      const ans = String(q.answer).trim().toLowerCase()
      correctAnswer = ans === 't' || ans === 'true' || ans === '1' ? 0 : 1
    } else if (type === 'single') {
      if (typeof q.answer === 'string') {
        const ansStr = q.answer.trim()
        const letter = ansStr.toUpperCase()
        if (letter.length === 1 && letter >= 'A' && letter <= 'Z') {
          correctAnswer = letter.charCodeAt(0) - 65
        } else {
          const num = Number(ansStr)
          if (!isNaN(num)) {
            correctAnswer = num
          } else {
            correctAnswer = 0
          }
        }
      } else {
        correctAnswer = Number(q.answer) || 0
      }
    } else if (type === 'multiple') {
      if (typeof q.answer === 'string') {
        const ansStr = q.answer.trim()

        if (ansStr.startsWith('[') && ansStr.endsWith(']')) {
          try {
            const parsed = JSON.parse(ansStr)
            if (Array.isArray(parsed)) {
              if (parsed.every(item => typeof item === 'number')) {
                correctAnswer = parsed
              }
              else if (parsed.every(item => typeof item === 'string' && item.length === 1)) {
                correctAnswer = parsed
                  .map(s => s.trim().toUpperCase())
                  .filter(s => s >= 'A' && s <= 'Z')
                  .map(s => s.charCodeAt(0) - 65)
              } else {
                correctAnswer = []
              }
            } else {
              correctAnswer = []
            }
          } catch (e) {
            correctAnswer = ansStr
              .split(/[,，]/)
              .map(s => {
                s = s.trim().toUpperCase()
                if (s.length === 1 && s >= 'A' && s <= 'Z') {
                  return s.charCodeAt(0) - 65
                }
                const num = Number(s)
                return isNaN(num) ? null : num
              })
              .filter(n => n !== null)
          }
        } else {
          correctAnswer = ansStr
            .split(/[,，]/)
            .map(s => {
              s = s.trim().toUpperCase()
              if (s.length === 1 && s >= 'A' && s <= 'Z') {
                return s.charCodeAt(0) - 65
              }
              const num = Number(s)
              return isNaN(num) ? null : num
            })
            .filter(n => n !== null)
        }
      } else if (Array.isArray(q.answer)) {
        correctAnswer = q.answer
          .map(item => {
            if (typeof item === 'string') {
              const s = item.trim().toUpperCase()
              if (s.length === 1 && s >= 'A' && s <= 'Z') {
                return s.charCodeAt(0) - 65
              }
              const num = Number(s)
              return isNaN(num) ? null : num
            }
            return typeof item === 'number' ? item : null
          })
          .filter(n => n !== null)
      } else {
        correctAnswer = []
      }

      if (!Array.isArray(correctAnswer)) {
        correctAnswer = []
      }
    } else if (type === 'fillblank' || type === 'essay') {
      // 填空题和问答题保持原始答案
      correctAnswer = q.answer
    }

    // 处理阅读理解 & 完形填空
    let subQuestions = []
    let hasMainContent = false
    let mainContent = ''
    let mainTitle = ''

    if (type === 'cloze') {
      mainContent = q.content || ''
      mainTitle = q.questionText || '完形填空'
      hasMainContent = true

      if (mainContent) {
        mainContent = mainContent.replace(/\[\[(\d+)\]\]/g, '___$1___')
      }

      if (q.questionSubList && Array.isArray(q.questionSubList) && q.questionSubList.length > 0) {
        subQuestions = q.questionSubList.map((sq, index) => {
          let sqType = 'single'
          switch (sq.questionType || sq.question_type) {
            case 1:
              sqType = 'single'
              break
            case 2:
              sqType = 'multiple'
              break
            case 3:
              sqType = 'truefalse'
              break
            case 4:
              sqType = 'fillblank'
              break
            case 5:
              sqType = 'essay'
              break
            default:
              sqType = 'single'
          }

          // 解析子题选项
          let sqOptions = []
          if (sq.options) {
            try {
              if (typeof sq.options === 'string') {
                const trimmed = sq.options.trim()
                if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                  sqOptions = JSON.parse(trimmed)
                } else {
                  sqOptions = trimmed.split(',').map(opt => opt.trim())
                }
              } else if (Array.isArray(sq.options)) {
                sqOptions = sq.options
              }
            } catch (e) {
            }
          }

          // ✅ 改进：子题答案处理
          let sqCorrectAnswer = sq.answer
          if (sqType === 'truefalse') {
            const ans = String(sq.answer).trim().toLowerCase()
            sqCorrectAnswer = ans === 't' || ans === 'true' || ans === '1' ? 0 : 1
          } else if (sqType === 'single') {
            if (typeof sq.answer === 'string' && sq.answer.length === 1) {
              const letter = sq.answer.toUpperCase()
              if (letter >= 'A' && letter <= 'Z') {
                sqCorrectAnswer = letter.charCodeAt(0) - 65
              } else {
                sqCorrectAnswer = Number(sq.answer) || 0
              }
            } else {
              sqCorrectAnswer = Number(sq.answer) || 0
            }
          } else if (sqType === 'multiple') {
            // 使用相同的多选题答案处理逻辑
            if (typeof sq.answer === 'string') {
              sqCorrectAnswer = sq.answer
                .split(/[,，]/)
                .map((s) => {
                  s = s.trim().toUpperCase()
                  if (s.length === 1 && s >= 'A' && s <= 'Z') {
                    return s.charCodeAt(0) - 65
                  }
                  const num = Number(s)
                  return isNaN(num) ? null : num
                })
                .filter((n) => n !== null)
            } else if (Array.isArray(sq.answer)) {
              sqCorrectAnswer = sq.answer
            } else {
              sqCorrectAnswer = []
            }
          } else if (sqType === 'fillblank' || sqType === 'essay') {
            // ✅ 关键修复：填空题和问答题保持原始答案字符串
            sqCorrectAnswer = sq.answer
          }

          return {
            question: sq.questionText || sq.question_text || `第 ${index + 1} 空应填入：`,
            type: sqType,
            options: sqOptions,
            analysis: sq.analysis,
            correctAnswer: sqCorrectAnswer,
            answered: false,
            correct: false
          }
        })
      }
    }
    else if (type === 'readingComprehension') {
      mainContent = q.content || ''
      mainTitle = q.questionText || '阅读理解'
      hasMainContent = !!mainContent

      if (q.questionSubList && Array.isArray(q.questionSubList)) {
        subQuestions = q.questionSubList.map((sq, index) => {
          let sqType = 'single'
          switch (sq.questionType || sq.question_type) {
            case 1:
              sqType = 'single'
              break
            case 2:
              sqType = 'multiple'
              break
            case 3:
              sqType = 'truefalse'
              break
            case 4:
              sqType = 'fillblank'
              break
            case 5:
              sqType = 'essay'
              break
            default:
              sqType = 'single'
          }

          // 解析子题选项
          let sqOptions = []
          if (sq.options) {
            try {
              if (typeof sq.options === 'string') {
                const trimmed = sq.options.trim()
                if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                  sqOptions = JSON.parse(trimmed)
                } else {
                  sqOptions = trimmed.split(',').map(opt => opt.trim())
                }
              } else if (Array.isArray(sq.options)) {
                sqOptions = sq.options
              }
            } catch (e) {
            }
          }

          // ✅ 改进：子题答案处理
          let sqCorrectAnswer = sq.answer
          if (sqType === 'truefalse') {
            const ans = String(sq.answer).trim().toLowerCase()
            sqCorrectAnswer = ans === 't' || ans === 'true' || ans === '1' ? 0 : 1
          } else if (sqType === 'single') {
            if (typeof sq.answer === 'string' && sq.answer.length === 1) {
              const letter = sq.answer.toUpperCase()
              if (letter >= 'A' && letter <= 'Z') {
                sqCorrectAnswer = letter.charCodeAt(0) - 65
              } else {
                sqCorrectAnswer = Number(sq.answer) || 0
              }
            } else {
              sqCorrectAnswer = Number(sq.answer) || 0
            }
          } else if (sqType === 'multiple') {
            if (typeof sq.answer === 'string') {
              sqCorrectAnswer = sq.answer
                .split(/[,，]/)
                .map((s) => {
                  s = s.trim().toUpperCase()
                  if (s.length === 1 && s >= 'A' && s <= 'Z') {
                    return s.charCodeAt(0) - 65
                  }
                  const num = Number(s)
                  return isNaN(num) ? null : num
                })
                .filter((n) => n !== null)
            } else if (Array.isArray(sq.answer)) {
              sqCorrectAnswer = sq.answer
            } else {
              sqCorrectAnswer = []
            }
          } else if (sqType === 'fillblank' || sqType === 'essay') {
            // ✅ 关键修复：填空题和问答题保持原始答案字符串
            sqCorrectAnswer = sq.answer
          }

          return {
            question: sq.questionText || sq.question_text || `问题 ${index + 1}`,
            type: sqType,
            options: sqOptions,
            analysis: sq.analysis,
            correctAnswer: sqCorrectAnswer,
            answered: false,
            correct: false
          }
        })
      }
    }

    if (!hasMainContent) {
      mainContent = ''
      mainTitle = ''
    }

    const questionObj = {
      id: q.id,
      bankId: q.bankId, // ✅ 添加 bankId 字段，用于错题记录
      difficulty: q.difficulty, // ✅ 添加难度字段
      question: (type === 'readingComprehension' || type === 'cloze') ? '' : (q.questionText || q.question_text),
      type,
      options,
      correctAnswer,
      analysis: q.analysis || '',
      mainContent,
      mainTitle,
      hasMainContent,
      subQuestions,
      answered: false,
      correct: false,
      showAnalysis: false,
      userAnswer: null,
      // 添加额外的元数据，方便调试
      _rawAnswer: q.answer,
      _rawOptions: q.options
    }

    return questionObj
  }

  // 新增：重置所有数据并重新加载题目（用于模式切换）
  // 保存当前答题状态到缓存
  // moduleType 参数可选，用于在模式切换时指定旧的 moduleType
  function saveCurrentAnswerState(moduleType) {
    // 如果 moduleType 显式传入且为 undefined，说明是路由过渡，不保存
    if (moduleType === undefined) {
      console.log(`[CACHE] 跳过保存（路由过渡状态）`)
      return
    }
    const type = moduleType || props.moduleType
    if (!props.bankId || !type || questions.value.length === 0) return

    const cacheKey = `${props.bankId}_${type}`
    const state = {
      questions: [...questions.value],
      allQuestionsData: [...allQuestionsData.value],
      answers: [...answers.value],
      currentQuestionIndex: currentQuestionIndex.value,
      selectedAnswer: selectedAnswer.value,
      subFillBlankAnswers: { ...subFillBlankAnswers.value },
      subEssayAnswers: { ...subEssayAnswers.value },
      questionOffset: questionOffset.value,
      questionCount: questionCount.value
    }

    answerStateCache.set(cacheKey, state)
    console.log(`[CACHE] 保存答题状态: ${cacheKey}, 题目数: ${state.questions.length}, 当前题: ${state.currentQuestionIndex}`)
  }

  // 从缓存恢复答题状态
  function restoreAnswerState() {
    if (!props.bankId || !props.moduleType) return false

    const cacheKey = `${props.bankId}_${props.moduleType}`
    const state = answerStateCache.get(cacheKey)

    if (!state) {
      console.log(`[CACHE] 未找到缓存: ${cacheKey}`)
      return false
    }

    console.log(`[CACHE] 恢复答题状态: ${cacheKey}, 题目数: ${state.questions.length}, 当前题: ${state.currentQuestionIndex}`)

    questions.value = state.questions
    allQuestionsData.value = state.allQuestionsData
    answers.value = state.answers
    currentQuestionIndex.value = state.currentQuestionIndex
    selectedAnswer.value = state.selectedAnswer
    subFillBlankAnswers.value = state.subFillBlankAnswers
    subEssayAnswers.value = state.subEssayAnswers
    questionOffset.value = state.questionOffset
    questionCount.value = state.questionCount
    loading.value = false

    return true
  }

  // 清除指定模块的答题状态缓存
  function clearAnswerStateCache(moduleType) {
    if (!props.bankId || !moduleType) {
      console.log(`[CACHE] 清除缓存失败: bankId=${props.bankId}, moduleType=${moduleType}`)
      return
    }
    const cacheKey = `${props.bankId}_${moduleType}`
    const hadCache = answerStateCache.has(cacheKey)
    answerStateCache.delete(cacheKey)
    console.log(`[CACHE] 清除答题状态缓存: ${cacheKey}, 之前有缓存: ${hadCache}, 当前缓存数量: ${answerStateCache.size}`)
  }

  // oldModuleType 参数可选，用于在模式切换时指定旧的 moduleType
  function resetAndFetchQuestions(oldModuleType) {
    // 调试日志
    debugResetAndFetch(props.moduleType, props.bankId)

    // 先保存当前答题状态（使用旧的 moduleType 作为 key）
    saveCurrentAnswerState(oldModuleType)

    // 同步最新的设置（模式切换后 moduleSettings 会变化）
    const settings = store.getModuleSettings(props.moduleType)
    questionCount.value = settings.questionCount
    onlyWrong.value = settings.onlyWrong || false

    isResetting.value = true

    questions.value = []
    allQuestionsData.value = []
    answers.value = []
    currentQuestionIndex.value = 0
    selectedAnswer.value = null
    subFillBlankAnswers.value = {}
    subEssayAnswers.value = {}
    questionOffset.value = 0
    loading.value = true

    // 尝试从缓存恢复，如果没有缓存则重新加载
    if (restoreAnswerState()) {
      isResetting.value = false
      return
    }

    // 重新加载题目
    fetchQuestionsInternal().finally(() => {
      // 延迟清除标志位，确保所有 watch 都已处理完毕
      setTimeout(() => {
        isResetting.value = false
      }, 100)
    })
  }

  // 内部函数：实际加载题目（跳过早期返回检查）
  async function fetchQuestionsInternal() {
    // 调试日志
    debugFetchStart(props.moduleType, props.bankId)

    if (isFavoriteMode && singleQuestionId) {
      fetchSingleQuestion(singleQuestionId)
      return
    }

    if (!props.bankId || props.bankId <= 0) {
      loading.value = false
      return
    }

    loading.value = true

    try {
      const response = await listQuestionMainAll({
        bankId: props.bankId,
        status: "0"
      })
      let data = []
      if (Array.isArray(response.data)) {
        data = response.data
      } else if (Array.isArray(response.result)) {
        data = response.result
      }

      // 调试日志：API返回数据
      debugFetchComplete(props.moduleType, data)

      if (data.length === 0) {
        proxy.$modal.msgWarning('该题库暂无题目')
        questions.value = []
        resetAnswers()
        loading.value = false
        return
      }

      processQuestions(data)
      subFillBlankAnswers.value = {}
      subEssayAnswers.value = {}
      await nextTick()
    } catch (err) {
      proxy.$modal.msgError('加载题目失败')
      loading.value = false
    }
  }

  // ✅ 修复：fetchQuestions 函数 - 确保初始化时重置子题答案
  async function fetchQuestions() {
    // 调试日志
    debugFetchQuestions(props.moduleType, props.bankId, questions.value.length > 0)

    if (questions.value.length > 0) {
      loading.value = false
      return
    }

    if (isFavoriteMode && singleQuestionId) {
      fetchSingleQuestion(singleQuestionId)
      return
    }

    if (!props.bankId || props.bankId <= 0) {
      loading.value = false
      return
    }

    loading.value = true

    try {
      const response = await listQuestionMainAll({
        bankId: props.bankId,
        status: "0"
      })
      let data = []
      if (Array.isArray(response.data)) {
        data = response.data
      } else if (Array.isArray(response.result)) {
        data = response.result
      }

      if (data.length === 0) {
        proxy.$modal.msgWarning('该题库暂无题目')
        questions.value = []
        resetAnswers()
        loading.value = false
        return
      }

      processQuestions(data)
      subFillBlankAnswers.value = {}
      subEssayAnswers.value = {}
      await nextTick()

      // 调试日志：状态快照
      debugStateSnapshot(props.moduleType, {
        questions: questions.value,
        allQuestionsData: allQuestionsData.value,
        currentQuestionIndex: currentQuestionIndex.value,
        questionCount: questionCount.value,
        questionOffset: questionOffset.value,
        isResetting: isResetting.value
      })
    } catch (err) {
      proxy.$modal.msgError('加载题目失败')
      loading.value = false
    }
  }

  // ✅ 修复：resetAnswers 函数 - 重置子题答案
  function resetAnswers() {
    currentQuestionIndex.value = 0
    selectedAnswer.value = null

    // ✅ 新增：重置子题答案显示数据
    subFillBlankAnswers.value = {}
    subEssayAnswers.value = {}

    answers.value = questions.value.map(q => {
      if (['readingComprehension', 'cloze'].includes(q.type)) {
        return {}
      }
      return null
    })

    questions.value.forEach((q) => {
      q.answered = false
      q.correct = false
      q.showAnalysis = false
    })
  }

  // ✅ 修复：goToQuestion 函数 - 添加子题答案同步逻辑
  function goToQuestion(index) {
    const currentIndex = currentQuestionIndex.value
    const currentQ = questions.value[currentIndex]

    // 保存当前题目的答案
    if (currentIndex !== index && currentQ && !['readingComprehension', 'cloze'].includes(currentQ.type) && selectedAnswer.value !== null && answers.value[currentIndex] === null) {
      handleAnswerSubmission(currentIndex)
    }

    currentQuestionIndex.value = index
    const q = questions.value[index]
    const ans = answers.value[index]

    // 对于阅读理解或完形填空，重置 selectedAnswer 并同步子题答案
    if (['readingComprehension', 'cloze'].includes(q?.type)) {
      selectedAnswer.value = null

      // ✅ 新增：同步子题答案到显示数据
      if (ans && ans.fillblank) {
        subFillBlankAnswers.value = { ...ans.fillblank }
      } else {
        subFillBlankAnswers.value = {}
      }

      if (ans && ans.essay) {
        subEssayAnswers.value = { ...ans.essay }
      } else {
        subEssayAnswers.value = {}
      }

      return
    }

    selectedAnswer.value = ans ?? null

    // 设置解析显示状态
    if (ans !== null && q) {
      let isCorrect = false
      const ca = q.correctAnswer
      if (q.type === 'single' || q.type === 'truefalse') {
        isCorrect = ans === ca
      } else if (q.type === 'multiple') {
        isCorrect =
          Array.isArray(ans) &&
          Array.isArray(ca) &&
          ans.length === ca.length &&
          ans.every(v => ca.includes(v))
      } else if (['fillblank', 'essay'].includes(q.type)) {
        isCorrect = String(ans).trim().toLowerCase() === String(ca).trim().toLowerCase()
      }
      q.showAnalysis = true
    }
  }
  function nextQuestion() {
    handleAnswerSubmission(currentQuestionIndex.value)

    if (currentQuestionIndex.value < totalQuestions.value - 1) {
      currentQuestionIndex.value++
      goToQuestion(currentQuestionIndex.value)
    }
  }

  function prevQuestion() {
    if (currentQuestionIndex.value > 0) {
      handleAnswerSubmission(currentQuestionIndex.value)
      currentQuestionIndex.value--
      goToQuestion(currentQuestionIndex.value)
    }
  }

  function selectOption(index) {
    const type = currentQuestion.value?.type
    if (type === 'multiple') {
      const arr = Array.isArray(selectedAnswer.value) ? [...selectedAnswer.value] : []
      const i = arr.indexOf(index)
      if (i > -1) {
        arr.splice(i, 1)
      } else {
        arr.push(index)
      }
      selectedAnswer.value = arr
    } else if (['single', 'truefalse'].includes(type)) {
      selectedAnswer.value = index
    }
  }

  function selectSubOption(subIndex, optionIndex) {
    const currentQ = currentQuestion.value
    if (!currentQ || !['readingComprehension', 'cloze'].includes(currentQ.type)) return
    if (!currentQ.subQuestions[subIndex]) return

    if (!answers.value[currentQuestionIndex.value]) {
      answers.value[currentQuestionIndex.value] = {}
    }

    const subQ = currentQ.subQuestions[subIndex]
    if (subQ.type === 'multiple') {
      if (!answers.value[currentQuestionIndex.value][subIndex]) {
        answers.value[currentQuestionIndex.value][subIndex] = []
      }
      const arr = [...answers.value[currentQuestionIndex.value][subIndex]]
      const i = arr.indexOf(optionIndex)
      if (i > -1) {
        arr.splice(i, 1)
      } else {
        arr.push(optionIndex)
      }
      answers.value[currentQuestionIndex.value][subIndex] = arr
    } else {
      answers.value[currentQuestionIndex.value][subIndex] = optionIndex
    }

    updateReadingOrClozeStatus()
    handleAnswerSubmission(currentQuestionIndex.value)
  }

  // ✅ 修复：updateSubFillBlankAnswer 函数 - 完整版
  function updateSubFillBlankAnswer(subIndex, value) {
    const currentQ = currentQuestion.value
    if (!currentQ || !['readingComprehension', 'cloze'].includes(currentQ.type)) {
      return
    }

    // ✅ 关键修复：同时更新两个地方的答案数据
    // 1. 更新 answers 数组中的结构化答案（用于判题）
    if (!answers.value[currentQuestionIndex.value]) {
      answers.value[currentQuestionIndex.value] = {}
    }
    if (!answers.value[currentQuestionIndex.value].fillblank) {
      answers.value[currentQuestionIndex.value].fillblank = {}
    }
    answers.value[currentQuestionIndex.value].fillblank[subIndex] = value

    // 2. ✅ 新增：更新 subFillBlankAnswers（用于显示）
    // 确保是响应式更新
    subFillBlankAnswers.value = {
      ...subFillBlankAnswers.value,
      [subIndex]: value
    }

    updateReadingOrClozeStatus()
    handleAnswerSubmission(currentQuestionIndex.value)
  }

  // ✅ 修复：updateSubEssayAnswer 函数 - 完整版
  function updateSubEssayAnswer(subIndex, value) {
    const currentQ = currentQuestion.value
    if (!currentQ || !['readingComprehension', 'cloze'].includes(currentQ.type)) {
      return
    }

    // ✅ 关键修复：同时更新两个地方的答案数据
    // 1. 更新 answers 数组中的结构化答案
    if (!answers.value[currentQuestionIndex.value]) {
      answers.value[currentQuestionIndex.value] = {}
    }
    if (!answers.value[currentQuestionIndex.value].essay) {
      answers.value[currentQuestionIndex.value].essay = {}
    }
    answers.value[currentQuestionIndex.value].essay[subIndex] = value

    // 2. ✅ 新增：更新 subEssayAnswers（用于显示）
    // 确保是响应式更新
    subEssayAnswers.value = {
      ...subEssayAnswers.value,
      [subIndex]: value
    }

    updateReadingOrClozeStatus()
    handleAnswerSubmission(currentQuestionIndex.value)
  }

  function updateReadingOrClozeStatus() {
    const currentIndex = currentQuestionIndex.value
    const q = questions.value[currentIndex]
    const ans = answers.value[currentIndex]
    if (!q || !['readingComprehension', 'cloze'].includes(q.type)) return

    const allAnswered = q.subQuestions.every((subQ, idx) => {
      if (subQ.type === 'fillblank') {
        return ans && ans.fillblank && ans.fillblank[idx] !== undefined && ans.fillblank[idx] !== ''
      } else if (subQ.type === 'essay') {
        return ans && ans.essay && ans.essay[idx] !== undefined && ans.essay[idx] !== ''
      } else {
        return ans && ans[idx] !== undefined
      }
    })
    q.answered = allAnswered
  }

  // ✅ 修复：handleAnswerSubmission 函数 - 完整版
  function handleAnswerSubmission(qIndex) {
    if (submissionLock.value) return
    const q = questions.value[qIndex]
    if (!q) return

    submissionLock.value = true
    setTimeout(() => { submissionLock.value = false }, 100)

    let isCorrect = false
    let userAnswer = null

    if (['readingComprehension', 'cloze'].includes(q.type)) {
      // 阅读理解/完形填空处理逻辑
      const subAns = answers.value[qIndex] || {}

      // ✅ 修复：检查是否有填空题或问答题的答案
      const hasAnyAnswer = Object.keys(subAns).length > 0 &&
        (Object.keys(subAns).some(key => key !== 'fillblank' && key !== 'essay') ||
          (subAns.fillblank && Object.keys(subAns.fillblank).length > 0) ||
          (subAns.essay && Object.keys(subAns.essay).length > 0))

      if (hasAnyAnswer) {
        const allAnswered = q.subQuestions.every((subQ, i) => {
          if (subQ.type === 'fillblank') {
            const hasAnswer = subAns.fillblank && subAns.fillblank[i] !== undefined && subAns.fillblank[i] !== ''
            return hasAnswer
          } else if (subQ.type === 'essay') {
            const hasAnswer = subAns.essay && subAns.essay[i] !== undefined && subAns.essay[i] !== ''
            return hasAnswer
          } else {
            const hasAnswer = subAns[i] !== undefined
            return hasAnswer
          }
        })

        q.answered = allAnswered

        if (allAnswered) {
          let allCorrect = true
          for (let i = 0; i < q.subQuestions.length; i++) {
            const subQ = q.subQuestions[i]

            if (subQ.type === 'fillblank') {
              const userAns = subAns.fillblank && subAns.fillblank[i]

              if (!userAns || userAns.trim().toLowerCase() !== String(subQ.correctAnswer).trim().toLowerCase()) {
                allCorrect = false
                break
              }
            } else if (subQ.type === 'essay') {
              continue
            } else if (subQ.type === 'multiple') {
              const userAns = Array.isArray(subAns[i]) ? subAns[i].slice().sort() : []
              const correctAnswer = Array.isArray(subQ.correctAnswer) ? subQ.correctAnswer.slice().sort() : []
              if (JSON.stringify(userAns) !== JSON.stringify(correctAnswer)) {
                allCorrect = false
                break
              }
            } else {
              if (subAns[i] !== subQ.correctAnswer) {
                allCorrect = false
                break
              }
            }
          }

          q.correct = allAnswered && allCorrect
          q.showAnalysis = true

          if (!q.correct) {
            const currentUserId = userStore.id || userStore.userId
            if (currentUserId) {
              recordErrorQuestion(q, subAns, q.correct)
            }
          }
        }
      }
      return
    }

    // 普通题目处理
    const ans = selectedAnswer.value
    if (ans !== null) {
      userAnswer = ans
      answers.value[qIndex] = ans
      q.answered = true

      const ca = q.correctAnswer

      if (q.type === 'single' || q.type === 'truefalse') {
        isCorrect = ans === ca
      } else if (q.type === 'multiple') {
        isCorrect = Array.isArray(ans) && Array.isArray(ca) &&
          ans.length === ca.length && ans.every(v => ca.includes(v))
      } else if (['fillblank', 'essay'].includes(q.type)) {
        isCorrect = String(ans).trim().toLowerCase() === String(ca).trim().toLowerCase()
      }

      q.correct = isCorrect
      q.showAnalysis = true

      if (!isCorrect) {
        const currentUserId = userStore.id || userStore.userId
        if (currentUserId) {
          recordErrorQuestion(q, userAnswer, isCorrect)
        }
      }
    }
  }

  function resetPractice() {
    questionOffset.value = 0
    resetAnswers()
  }

  function showAllAnalysis() {
    questions.value.forEach(q => {
      q.showAnalysis = true
    })
  }

  function viewResult() {
    proxy.$modal.alert(
      `本次练习完成！\n答对 ${correctCount.value} 题，答错 ${wrongCount.value} 题，正确率 ${accuracy.value}%`
    )
  }

  function collectQuestion() {
    proxy.$modal.msgSuccess('已收藏该题')
  }

  function markQuestion() {
    proxy.$modal.msgSuccess('已标记为斩题')
  }

  function addNote() {
    proxy.$modal.msgInfo('请添加笔记')
  }

  function reportQuestion() {
    proxy.$modal.msgSuccess('已提交举报')
  }

  // 计算属性
  const currentQuestion = computed(() => questions.value[currentQuestionIndex.value])
  const totalQuestions = computed(() => questions.value.length)
  const correctCount = computed(() =>
    answers.value.filter((a, i) => {
      const q = questions.value[i]
      if (!q || a === null) return false
      if (['readingComprehension', 'cloze'].includes(q.type)) {
        const subAns = a
        if (!subAns || Object.keys(subAns).length === 0) return false
        return q.subQuestions.every((sq, idx) => {
          if (sq.type === 'fillblank') {
            const userAnswer = subAns.fillblank && subAns.fillblank[idx]
            return userAnswer !== undefined &&
              userAnswer.trim().toLowerCase() === String(sq.correctAnswer).trim().toLowerCase()
          } else if (sq.type === 'essay') {
            return true
          } else if (sq.type === 'multiple') {
            const userAnswer = Array.isArray(subAns[idx]) ? subAns[idx].slice().sort() : []
            const correctAnswer = Array.isArray(sq.correctAnswer) ? sq.correctAnswer.slice().sort() : []
            return JSON.stringify(userAnswer) === JSON.stringify(correctAnswer)
          } else {
            return subAns[idx] === sq.correctAnswer
          }
        })
      }
      if (q.type === 'multiple') {
        return Array.isArray(a) &&
          Array.isArray(q.correctAnswer) &&
          a.length === q.correctAnswer.length &&
          a.every(v => q.correctAnswer.includes(v))
      }
      if (['fillblank', 'essay'].includes(q.type)) {
        return String(a).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()
      }
      return a === q.correctAnswer
    }).length
  )
  const wrongCount = computed(() =>
    answers.value.filter((a, i) => {
      const q = questions.value[i]
      if (!q || a === null || !q.answered) return false

      if (['readingComprehension', 'cloze'].includes(q.type)) {
        const subAns = a
        if (!subAns || Object.keys(subAns).length === 0) return false
        return !q.subQuestions.every((sq, idx) => {
          if (sq.type === 'fillblank') {
            const userAnswer = subAns.fillblank && subAns.fillblank[idx]
            return userAnswer !== undefined &&
              userAnswer.trim().toLowerCase() === String(sq.correctAnswer).trim().toLowerCase()
          } else if (sq.type === 'essay') {
            return true
          } else if (sq.type === 'multiple') {
            const userAnswer = Array.isArray(subAns[idx]) ? subAns[idx].slice().sort() : []
            const correctAnswer = Array.isArray(sq.correctAnswer) ? sq.correctAnswer.slice().sort() : []
            return JSON.stringify(userAnswer) === JSON.stringify(correctAnswer)
          } else {
            return subAns[idx] === sq.correctAnswer
          }
        })
      }

      if (q.type === 'multiple') {
        return !(Array.isArray(a) &&
          Array.isArray(q.correctAnswer) &&
          a.length === q.correctAnswer.length &&
          a.every(v => q.correctAnswer.includes(v)))
      }

      if (['fillblank', 'essay'].includes(q.type)) {
        return String(a).trim().toLowerCase() !== String(q.correctAnswer).trim().toLowerCase()
      }

      return a !== q.correctAnswer
    }).length
  )
  const accuracy = computed(() =>
    totalQuestions.value > 0 ? Math.round((correctCount.value / totalQuestions.value) * 100) : 0
  )

  const displayOptions = computed(() => {
    const opts = currentQuestion.value?.options
    return Array.isArray(opts) ? opts : []
  })

  // 移除自动加载的 watch，改由外部控制首次加载
  // watch(
  //   () => [props.bankId, props.moduleType],
  //   (newVals, oldVals) => {
  //     console.log('[useQuestionPractice] watch 触发', {
  //       newBankId: newVals[0],
  //       oldBankId: oldVals?.[0],
  //       isInitialized: isInitialized.value,
  //       questionsLength: questions.value.length,
  //       propBankId: props.bankId,
  //       hasQuestions: questions.value.length > 0
  //     })
  //     if (isInitialized.value && questions.value.length > 0) {
  //       console.log('[useQuestionPractice] 跳过加载（已初始化且有题目数据）')
  //       return
  //     }
  //     isInitialized.value = true
  //     console.log('[useQuestionPractice] 执行 fetchQuestions()')
  //     fetchQuestions()
  //   },
  //   { immediate: true }
  // )

  return {
    // 响应式数据
    questions,
    currentQuestionIndex,
    selectedAnswer,
    answers,
    loading,
    subFillBlankAnswers,
    subEssayAnswers,
    questionOffset,
    allQuestionsData,
    isResetting,

    // 计算属性
    currentQuestion,
    totalQuestions,
    correctCount,
    wrongCount,
    accuracy,
    displayOptions,

    // 方法
    fetchQuestions,
    resetAndFetchQuestions,
    resetAnswers,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    selectOption,
    selectSubOption,
    updateSubFillBlankAnswer,
    updateSubEssayAnswer,
    handleAnswerSubmission,
    resetPractice,
    showAllAnalysis,
    viewResult,
    collectQuestion,
    markQuestion,
    addNote,
    reportQuestion,

    // ✅ 新增：导出的错题记录方法（可选）
    recordErrorQuestion,

    // 原有的导出函数
    transformQuestionForDisplay,
    processQuestions,
    applyQuestionLimits,
    loadBatchWithoutReset,
    fetchSingleQuestion,

    // 响应式更新方法
    updateOnlyWrong,
    updateQuestionCount,
    updateQuestionOffset,
    updateQuestionCountAndSlice,

    // 答题状态缓存方法
    saveCurrentAnswerState,
    restoreAnswerState,
    clearAnswerStateCache
  }
}