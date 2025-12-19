import request from '@/utils/request'

// 查询一级题目列表
export function listQuestionMain(query) {
  return request({
    url: '/questionMain/questionMain/list',
    method: 'get',
    params: query
  })
}

// 查询一级题目列表 不分页
export function listQuestionMainAll(query) {
  return request({
    url: '/questionMain/questionMain/all',
    method: 'get',
    params: query
  })
}

// 查询一级题目详细
export function getQuestionMain(id) {
  return request({
    url: '/questionMain/questionMain/' + id,
    method: 'get'
  })
}

// 新增一级题目
export function addQuestionMain(data) {
  return request({
    url: '/questionMain/questionMain',
    method: 'post',
    data: data
  })
}

// 修改一级题目
export function updateQuestionMain(data) {
  return request({
    url: '/questionMain/questionMain',
    method: 'put',
    data: data
  })
}

// 删除一级题目
export function delQuestionMain(id) {
  return request({
    url: '/questionMain/questionMain/' + id,
    method: 'delete'
  })
}

// ✅ 新增：验证题目是否存在
export function checkQuestionExists(questionId) {
  return request({
    url: '/questionMain/questionMain/checkExists/' + questionId,
    method: 'get'
  })
}

// ✅ 新增：获取题目简单信息
export function getQuestionSimpleInfo(questionId) {
  return request({
    url: '/questionMain/questionMain/simpleInfo/' + questionId,
    method: 'get'
  })
}

// ✅ 新增：搜索题目（用于选择器）
export function searchQuestions(params) {
  return request({
    url: '/questionMain/questionMain/search',
    method: 'get',
    params: params
  })
}

// 在 questionMain.js 中添加以下方法：

// 验证用户是否存在
export function checkUserExists(userId) {
  return request({
    url: '/questionMain/questionMain/checkUserExists/' + userId,
    method: 'get'
  })
}

// 验证题目和用户是否存在
export function checkQuestionAndUser(questionId, userId) {
  return request({
    url: `/questionMain/questionMain/checkQuestionAndUser/${questionId}/${userId}`,
    method: 'get'
  })
}