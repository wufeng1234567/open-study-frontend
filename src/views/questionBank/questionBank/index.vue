<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="88px">
      <el-form-item label="题库ID" prop="id">
        <el-input v-model="queryParams.id" placeholder="请输入题库ID" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="题库名称" prop="bankName">
        <el-input v-model="queryParams.bankName" placeholder="请输入题库名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="科目" prop="subject">
        <el-input v-model="queryParams.subject" placeholder="请输入科目" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择状态：0正常 1停用" clearable>
          <el-option v-for="dict in common_status" :key="dict.value" :label="dict.label" :value="dict.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="创建者" prop="createBy">
        <el-input v-model="queryParams.createBy" placeholder="请输入创建者" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item label="是否公开" prop="isPublic">
        <el-select v-model="queryParams.isPublic" placeholder="请选择" clearable>
          <el-option label="公开" :value="0" />
          <el-option label="私有" :value="1" />
        </el-select>
      </el-form-item>


      <el-form-item label="创建时间" prop="createTime">
        <el-date-picker clearable v-model="queryParams.createTime" type="date" value-format="YYYY-MM-DD"
          placeholder="请选择创建时间">
        </el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>


    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd"
          v-hasPermi="['questionBank:questionBank:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate"
          v-hasPermi="['questionBank:questionBank:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['questionBank:questionBank:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport"
          v-hasPermi="['questionBank:questionBank:export']">导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="questionBankList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="题库ID" align="center" prop="id" />
      <el-table-column label="题库名称" align="center" prop="bankName" />
      <el-table-column label="科目" align="center" prop="subject" />
      <el-table-column label="题库描述" align="center" prop="description" />
      <el-table-column label="封面图" align="center" prop="coverImage" width="100">
        <template #default="scope">
          <image-preview :src="scope.row.coverImage" :width="50" :height="50" />
        </template>
      </el-table-column>
      <el-table-column label="题目总数" align="center" prop="totalQuestions" />
      <el-table-column label="状态：0正常 1停用" align="center" prop="status">
        <template #default="scope">
          <dict-tag :options="common_status" :value="scope.row.status" />
        </template>
      </el-table-column>
      <el-table-column label="是否公开" align="center" prop="isPublic">
        <template #default="scope">
          <el-tag :type="scope.row.isPublic === 0 ? 'success' : 'info'">
            {{ scope.row.isPublic === 0 ? '公开' : '私有' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建者" align="center" prop="createBy" />
      <el-table-column label="创建时间" align="center" prop="createTime" width="180">
        <template #default="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
            v-hasPermi="['questionBank:questionBank:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
            v-hasPermi="['questionBank:questionBank:remove']">删除</el-button>
        </template>
      </el-table-column>

    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum"
      v-model:limit="queryParams.pageSize" @pagination="getList" />

    <!-- 添加或修改题库主对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="questionBankRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="题库名称" prop="bankName">
          <el-input v-model="form.bankName" placeholder="请输入题库名称" />
        </el-form-item>
        <el-form-item label="科目" prop="subject">
          <el-input v-model="form.subject" placeholder="请输入科目" />
        </el-form-item>
        <el-form-item label="题库描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="封面图" prop="coverImage">
          <image-upload v-model="form.coverImage" />
        </el-form-item>
        <el-form-item label="题目总数" prop="totalQuestions">
          <el-input v-model="form.totalQuestions" placeholder="请输入题目总数" />
        </el-form-item>
        <el-form-item label="是否公开" prop="isPublic">
          <el-radio-group v-model="form.isPublic">
            <el-radio :value="0">公开</el-radio>
            <el-radio :value="1">私有</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态：0正常 1停用" prop="status">
          <el-select v-model="form.status" placeholder="请选择状态：0正常 1停用">
            <el-option v-for="dict in common_status" :key="dict.value" :label="dict.label"
              :value="dict.value"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="QuestionBank">
import { listQuestionBank, getQuestionBank, delQuestionBank, addQuestionBank, updateQuestionBank } from "@/api/questionBank/questionBank"

const { proxy } = getCurrentInstance()
const { common_status } = proxy.useDict('common_status')

const questionBankList = ref([])
const open = ref(false)
const loading = ref(true)
const showSearch = ref(true)
const ids = ref([])
const single = ref(true)
const multiple = ref(true)
const total = ref(0)
const title = ref("")

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    id: null,
    bankName: null,
    subject: null,
    description: null,
    status: null,
    createBy: null,
    createTime: null
  },
  rules: {
    bankName: [
      { required: true, message: "题库名称不能为空", trigger: "blur" }
    ],
  }
})

const { queryParams, form, rules } = toRefs(data)

/** 查询题库主列表 */
function getList() {
  loading.value = true
  listQuestionBank(queryParams.value).then(response => {
    questionBankList.value = response.rows
    total.value = response.total
    loading.value = false
  })
}

// 取消按钮
function cancel() {
  open.value = false
  reset()
}

// 表单重置
function reset() {
  form.value = {
    id: null,
    bankName: null,
    subject: null,
    description: null,
    coverImage: null,
    totalQuestions: null,
    status: null,
    createBy: null,
    createTime: null
  }
  proxy.resetForm("questionBankRef")
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1
  getList()
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef")
  handleQuery()
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id)
  single.value = selection.length != 1
  multiple.value = !selection.length
}

/** 新增按钮操作 */
function handleAdd() {
  reset()
  open.value = true
  title.value = "添加题库主"
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset()
  const _id = row.id || ids.value
  getQuestionBank(_id).then(response => {
    form.value = response.data
    open.value = true
    title.value = "修改题库主"
  })
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["questionBankRef"].validate(valid => {
    if (valid) {
      if (form.value.id != null) {
        updateQuestionBank(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功")
          open.value = false
          getList()
        })
      } else {
        addQuestionBank(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功")
          open.value = false
          getList()
        })
      }
    }
  })
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _ids = row.id || ids.value
  proxy.$modal.confirm('是否确认删除题库主编号为"' + _ids + '"的数据项？').then(function () {
    return delQuestionBank(_ids)
  }).then(() => {
    getList()
    proxy.$modal.msgSuccess("删除成功")
  }).catch(() => { })
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('questionBank/questionBank/export', {
    ...queryParams.value
  }, `questionBank_${new Date().getTime()}.xlsx`)
}

getList()
</script>
