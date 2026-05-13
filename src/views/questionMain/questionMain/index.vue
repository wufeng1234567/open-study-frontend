<template>
  <div class="app-container">
    <!-- 查询条件 -->
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="88px">
      <el-form-item label="题目ID" prop="id">
        <el-input v-model="queryParams.id" placeholder="请输入题目ID" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="所属题库ID" prop="bankId">
        <el-input v-model="queryParams.bankId" placeholder="请输入所属题库ID" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="题型" prop="questionType">
        <el-select v-model="queryParams.questionType" placeholder="请选择题型：" clearable>
          <el-option v-for="dict in question_type" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="难度：" prop="difficulty">
        <el-select v-model="queryParams.difficulty" placeholder="请选择难度：" clearable>
          <el-option v-for="dict in difficulty_level" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="子题：" prop="hasSubQuestions">
        <el-select v-model="queryParams.hasSubQuestions" placeholder="请选择是否有子题" clearable>
          <el-option v-for="dict in is_sub_type" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="排序" prop="sortOrder">
        <el-input v-model="queryParams.sortOrder" placeholder="请输入排序" clearable @keyup.enter="handleQuery" />
      </el-form-item>
    <el-form-item label="状态" prop="status">
      <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
        <el-option v-for="dict in common_status" :key="dict.value" :label="dict.label" :value="dict.value" />
      </el-select>
    </el-form-item>

      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作按钮 -->
    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['questionMain:questionMain:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate" v-hasPermi="['questionMain:questionMain:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['questionMain:questionMain:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['questionMain:questionMain:export']">导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 主表格 -->
    <el-table v-loading="loading" :data="questionMainList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="题目ID" align="center" prop="id" />
      <el-table-column label="所属题库ID" align="center" prop="bankId" />
      <el-table-column label="题型：" align="center" prop="questionType">
        <template #default="scope">
          <dict-tag :options="question_type" :value="scope.row.questionType" />
        </template>
      </el-table-column>
      <el-table-column label="难度：1简单 2中等 3困难 4极难" align="center" prop="difficulty">
        <template #default="scope">
          <dict-tag :options="difficulty_level" :value="scope.row.difficulty" />
        </template>
      </el-table-column>
      <el-table-column label="题干" align="center" prop="questionText" />
      <!-- <el-table-column label="题目内容" align="center" prop="content" /> -->
      <!-- <el-table-column label="标准答案" align="center" prop="answer" />
      <el-table-column label="解析" align="center" prop="analysis" /> -->
      <el-table-column label="是否有子题" align="center" prop="hasSubQuestions">
        <template #default="scope">
          <dict-tag :options="is_sub_type" :value="scope.row.hasSubQuestions" />
        </template>
      </el-table-column>
      <el-table-column label="分数" align="center" prop="score" />
       <el-table-column label="状态：0正常 1停用" align="center" prop="status">
        <template #default="scope">
          <dict-tag :options="common_status" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <!-- <el-table-column label="排序" align="center" prop="sortOrder" /> -->
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['questionMain:questionMain:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['questionMain:questionMain:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 一级题目编辑弹窗 -->
    <el-dialog :title="title" v-model="open" width="600px" append-to-body>
      <el-form ref="questionMainRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="所属题库ID" prop="bankId">
          <el-input v-model="form.bankId" placeholder="请输入所属题库ID" />
        </el-form-item>
        <el-form-item label="题型" prop="questionType">
          <el-select v-model="form.questionType" placeholder="请选择题型：">
            <el-option v-for="dict in question_type" :key="dict.value" :label="dict.label" :value="parseInt(dict.value)" />
          </el-select>
        </el-form-item>
        <el-form-item label="难度：" prop="difficulty">
          <el-select v-model="form.difficulty" placeholder="请选择难度：">
            <el-option v-for="dict in difficulty_level" :key="dict.value" :label="dict.label" :value="parseInt(dict.value)" />
          </el-select>
        </el-form-item>
        <el-form-item label="题干" prop="questionText">
          <el-input v-model="form.questionText" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="题目内容">
          <editor v-model="form.content" :min-height="192" />
        </el-form-item>
        <el-form-item label="标准答案" prop="answer">
          <el-input v-model="form.answer" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="解析" prop="analysis">
          <el-input v-model="form.analysis" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="是否有子题：" prop="hasSubQuestions">
          <el-select v-model="form.hasSubQuestions" placeholder="请选择是否有子题">
            <el-option v-for="dict in is_sub_type" :key="dict.value" :label="dict.label" :value="parseInt(dict.value)" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input v-model="form.sortOrder" placeholder="请输入排序" />
        </el-form-item>
         <el-form-item label="状态：0正常 1停用" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态：0正常 1停用">
            <el-option
              v-for="dict in common_status"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>

        <!-- 子题操作区 -->
        <el-form-item v-if="form.hasSubQuestions === 1" label="子题管理">
          <el-button type="primary" size="small" @click="openSubQuestionDialog">查看/编辑子题</el-button>
        </el-form-item>
        <el-form-item v-else-if="form.hasSubQuestions === 0 && form.id" label="子题管理">
          <el-button type="primary" size="small" disabled>无子题</el-button>
        </el-form-item>
        <el-form-item v-else label="子题管理">
          <el-button type="primary" size="small" disabled>请先保存主题</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 子题管理弹窗（卡片式） -->
    <el-dialog
      v-model="subQuestionDialogVisible"
      title="二级题目（子题）管理"
      width="1200px"
      append-to-body
      @close="resetSubQuestionForm"
    >
      <el-card shadow="never" style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>共 {{ subQuestionList.length }} 条子题</span>
          <div>
            <el-button type="primary" size="small" icon="Plus" @click="addSubQuestion">添加</el-button>
            <el-button type="danger" size="small" icon="Delete" :disabled="selectedSubIds.length === 0" @click="deleteSelectedSubQuestions">删除</el-button>
          </div>
        </div>
      </el-card>
      <!-- 在 el-card 下方添加 -->
    <!-- 替换原有的 el-alert -->
<el-alert 
  title='题目为选择题时，选项格式说明：请输入有效的JSON格式，例如：["选项A", "选项B", "选项C", "选项D"] 或 [{"key":"A","value":"选项内容"}]。答案只能为单个大写字母（A-Z）'
  type="info" 
  show-icon 
  style="margin-bottom: 16px;"
/>
<el-alert 
  title='判断题答案只能为 true 或 false'
  type="info" 
  show-icon 
  style="margin-bottom: 16px;"
/>

      <el-table
        :data="subQuestionList"
        border
        @selection-change="handleSubSelectionChange"
        row-key="tempId"
        style="width: 100%"
        :cell-style="{ height: '55px', padding: '8px 0' }"
        
      >
        <el-table-column type="selection" width="50" />
        <el-table-column label="序号" type="index" width="60" />
        <el-table-column label="题型" prop="questionType" width="120">
          <template #default="scope">
            <el-select v-model="scope.row.questionType" placeholder="请选择" size="small" style="width: 100%">
              <el-option v-for="dict in question_type" :key="dict.value" :label="dict.label" :value="parseInt(dict.value)" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="题干" prop="questionText">
          <template #default="scope">
            <el-input v-model="scope.row.questionText" size="small" placeholder="请输入题干" />
          </template>
        </el-table-column>
        <el-table-column label="选项" prop="options" width="150">
          <template #default="scope">
            <el-input v-model="scope.row.options" size="small" placeholder="JSON格式" />
          </template>
        </el-table-column>
        <el-table-column label="答案" prop="answer" width="120">
          <template #default="scope">
            <el-input v-model="scope.row.answer" size="small" placeholder="答案" />
          </template>
        </el-table-column>
         
        <el-table-column label="分值" prop="score" width="100">
          <template #default="scope">
            <el-input-number v-model="scope.row.score" :min="0" :precision="2" size="small" style="width: 100%" />
          </template>
        </el-table-column>
        <el-table-column label="排序" prop="sortOrder" width="100">
          <template #default="scope">
            <el-input-number v-model="scope.row.sortOrder" :min="0" size="small" style="width: 100%" />
          </template>
        </el-table-column>
      </el-table>

     <!-- 替换原有的 footer 部分 -->
      <template #footer>
        <el-button type="primary" @click="confirmSubQuestions">确 认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="QuestionMain">
import { listQuestionMain, getQuestionMain, delQuestionMain, addQuestionMain, updateQuestionMain } from "@/api/questionMain/questionMain"

const { proxy } = getCurrentInstance()
const { question_type, difficulty_level, is_sub_type } = proxy.useDict('question_type', 'difficulty_level', 'is_sub_type')
const { common_status } = proxy.useDict('common_status')

const questionMainList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")

// 子题相关
const subQuestionDialogVisible = ref(false)
const subQuestionList = ref([])
const selectedSubIds = ref([])

let tempIdCounter = 0 // 用于临时唯一标识

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    id: null,
    bankId: null,
    questionType: null,
    difficulty: null,
    questionText: null,
    content: null,
    answer: null,
    analysis: null,
    hasSubQuestions: null,
    sortOrder: null,
    status: null,
    createTime: null,
    updateTime: null
  },
  rules: {
    bankId: [{ required: true, message: "所属题库ID不能为空", trigger: "blur" }],
    questionType: [{ required: true, message: "题型不能为空", trigger: "change" }],
  }
})

const { queryParams, form, rules } = toRefs(data)
// 在 script setup 中添加正确的字典映射
const questionTypeMap = {
  1: '单选',
  2: '多选',
  3: '判断',
  4: '填空',
  5: '简答',
  6: '组合题',
  7: '组合题'
}
/** 查询列表 */
function getList() {
  loading.value = true
  listQuestionMain(queryParams.value).then(response => {
    questionMainList.value = response.rows
    
    total.value = response.total
    loading.value = false
  })
}

/** 重置表单 */
function reset() {
  form.value = {
    id: null,
    bankId: null,
    questionType: null,
    difficulty: null,
    questionText: null,
    content: null,
    answer: null,
    analysis: null,
    hasSubQuestions: null,
    sortOrder: null,
    createTime: null
  }
  proxy.resetForm("questionMainRef")
}

/** 取消 */
function cancel() {
  open.value = false
  reset()
}

/** 搜索 & 重置 */
function handleQuery() {
  queryParams.value.pageNum = 
    console.log('查询参数:', queryParams.value) // 添加这行查看参数
  getList()
}
function resetQuery() {
  proxy.resetForm("queryRef")
  handleQuery()
}

/** 表格选择 */
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id)
  single.value = selection.length !== 1
  multiple.value = selection.length === 0
}

/** 新增 */
function handleAdd() {
  reset()
  open.value = true
  title.value = "添加一级题目"
}

/** 修改 */
function handleUpdate(row) {
  reset()
  const _id = row.id || ids.value[0]
  getQuestionMain(_id).then(response => {
    form.value = response.data
    console.log(form.value);
    
    // 初始化子题（添加临时ID）
    subQuestionList.value = (response.data.questionSubList || []).map(item => ({
      ...item,
      tempId: ++tempIdCounter,
      options: item.options === "" ? null : item.options
    }))
    open.value = true
    title.value = "修改一级题目"
  })
}


/** 提交 */
function submitForm() {
  proxy.$refs["questionMainRef"].validate(valid => {
    if (valid) {
      // 如果有子题，先校验子题的options字段和答案
      if (form.value.hasSubQuestions === 1 && subQuestionList.value.length > 0) {
        for (let i = 0; i < subQuestionList.value.length; i++) {
          const subQuestion = subQuestionList.value[i];
          
          // 校验选择题的options字段
          if (subQuestion.questionType === 1 && subQuestion.options) {
            if (!validateOptions(subQuestion.options)) {
              proxy.$modal.msgError(`子题中第${i + 1}题的选项格式不正确。请输入有效的JSON格式，例如：["选项A", "选项B", "选项C"]`);
              return;
            }
          }
          
          // 校验判断题答案
          if (subQuestion.questionType === 3 && subQuestion.answer) {
            if (!validateTrueFalseAnswer(subQuestion.answer)) {
              proxy.$modal.msgError(`子题中第${i + 1}题为判断题，答案只能为 true 或 false`);
              return;
            }
          }
          
          // 校验单选题答案
          if (subQuestion.questionType === 1 && subQuestion.answer) {
            if (!validateChoiceAnswer(subQuestion.answer)) {
              proxy.$modal.msgError(`子题中第${i + 1}题为单选题，答案只能为单个大写字母，例如：A、B、C等`);
              return;
            }
          }
          
          // 校验多选题答案
          if (subQuestion.questionType === 2 && subQuestion.answer) {
            if (!validateMultipleChoiceAnswer(subQuestion.answer)) {
              proxy.$modal.msgError(`子题中第${i + 1}题为多选题，答案只能为大写字母组合，例如：A,B,C`);
              return;
            }
          }
        }
      }

      // 合并子题（去掉 tempId）
      const payload = { ...form.value }
      if (form.value.hasSubQuestions === 1) {
        payload.questionSubList = subQuestionList.value.map(({ tempId, ...rest }) => rest)
      } else {
        payload.questionSubList = []
      }

      const api = payload.id ? updateQuestionMain : addQuestionMain
      api(payload).then(() => {
        proxy.$modal.msgSuccess(payload.id ? "修改成功" : "新增成功")
        open.value = false
        getList()
      })
    }
  })
}
/** 确认子题修改并进行校验 */
function confirmSubQuestions() {
  // 校验所有子题的options字段和答案
  for (let i = 0; i < subQuestionList.value.length; i++) {
    const subQuestion = subQuestionList.value[i];
    
    // 校验选择题的options字段
    if (subQuestion.questionType === 1 && subQuestion.options) {
      if (!validateOptions(subQuestion.options)) {
        proxy.$modal.msgError(`第${i + 1}题的选项格式不正确。请输入有效的JSON格式，例如：["选项A", "选项B", "选项C"]`);
        return;
      }
    }
    
    // 校验判断题答案 - 只有当题型为判断题时才校验
    if (subQuestion.questionType === 3 && subQuestion.answer) {
      if (!validateTrueFalseAnswer(subQuestion.answer)) {
        proxy.$modal.msgError(`第${i + 1}题为判断题，答案只能为 true 或 false`);
        return;
      }
    }
    
    // 校验单选题答案
    if (subQuestion.questionType === 1 && subQuestion.answer) {
      if (!validateChoiceAnswer(subQuestion.answer)) {
        proxy.$modal.msgError(`第${i + 1}题为单选题，答案只能为单个大写字母，例如：A、B、C等`);
        return;
      }
    }
    
    // 校验多选题答案
    if (subQuestion.questionType === 2 && subQuestion.answer) {
      if (!validateMultipleChoiceAnswer(subQuestion.answer)) {
        proxy.$modal.msgError(`第${i + 1}题为多选题，答案只能为大写字母组合，例如：A,B,C`);
        return;
      }
    }
  }
  
  // 校验通过，关闭弹窗
  subQuestionDialogVisible.value = false;
}

/** 校验选项是否为有效JSON */
function validateOptions(options) {
  if (!options) return true; // 允许为空
  try {
    const parsed = JSON.parse(options);
    // 检查是否为数组或对象
    return Array.isArray(parsed) || (typeof parsed === 'object' && parsed !== null);
  } catch (e) {
    return false;
  }
}
/** 删除 */
function handleDelete(row) {
  const _ids = row.id || ids.value
  proxy.$modal.confirm(`是否确认删除一级题目编号为"${_ids}"的数据项？`).then(() => {
    return delQuestionMain(_ids)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => {})
}

/** 打开子题管理弹窗 */
function openSubQuestionDialog() {
  subQuestionDialogVisible.value = true
}

/** 添加子题 */
function addSubQuestion() {
  subQuestionList.value.push({
    tempId: ++tempIdCounter,
    questionType: null,
    questionText: "",
    options: null,
    answer: "",
    analysis: "",
    score: 0,
    sortOrder: 0
  })
}

/** 删除选中子题 */
function deleteSelectedSubQuestions() {
  if (selectedSubIds.value.length === 0) {
    proxy.$modal.msgWarning("请先选择要删除的子题")
    return
  }
  proxy.$modal.confirm("是否确认删除选中的子题？").then(() => {
    subQuestionList.value = subQuestionList.value.filter(item => !selectedSubIds.value.includes(item.tempId))
    selectedSubIds.value = []
  })
}
/** 校验判断题答案 */
function validateTrueFalseAnswer(answer) {
  return answer === 'true' || answer === 'false';
}

/** 校验选择题答案 */
function validateChoiceAnswer(answer) {
  // 答案应该是单个大写字母 A-Z
  return /^[A-Z]$/.test(answer);
}

/** 校验多选题答案 */
function validateMultipleChoiceAnswer(answer) {
  // 多选题答案必须包含至少两个大写字母，用英文逗号分隔
  if (!answer) return false;
  
  const regex = /^[A-Z]+(,[A-Z]+)+$/;
  const parts = answer.split(',');
  
  // 确保至少有两个选项
  if (parts.length < 2) {
    return false;
  }
  
  // 验证每个部分都是单个大写字母
  for (let part of parts) {
    if (!/^[A-Z]$/.test(part.trim())) {
      return false;
    }
  }
  
  return regex.test(answer);
}

/** 重置子题表单（关闭弹窗时） */
function resetSubQuestionForm() {
  selectedSubIds.value = []
}

/** 导出 */
function handleExport() {
  proxy.download('questionMain/questionMain/export', { ...queryParams.value }, `questionMain_${new Date().getTime()}.xlsx`)
}

getList()
</script>

<style scoped>
.el-card {
  border-radius: 8px;
}
</style>