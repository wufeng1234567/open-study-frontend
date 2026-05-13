import request from '@/utils/request'

// 查询题库主列表
export function listQuestionBank(query) {
  return request({
    url: '/questionBank/questionBank/list',
    method: 'get',
    params: query
  })
}

// 查询题库主列表不分页
export function listQuestionBankAll(query) {
  return request({
    url: '/questionBank/questionBank/all',
    method: 'get',
    params: query
  })
}

// ✅ 新增：获取当前用户的题库列表
export function listMyQuestionBank() {
  return request({
    url: '/questionBank/questionBank/my',
    method: 'get'
  })
}

// 查询题库主详细
export function getQuestionBank(id) {
  return request({
    url: '/questionBank/questionBank/' + id,
    method: 'get'
  })
}

// 新增题库主（原接口，返回影响行数）
export function addQuestionBank(data) {
  return request({
    url: '/questionBank/questionBank',
    method: 'post',
    data: data
  })
}

// ✅ 创建题库并返回完整对象（供前台使用）
export function createQuestionBankWithReturn(data) {
  return request({
    url: '/questionBank/questionBank/createWithReturn',
    method: 'post',
    data: data
  })
}

// 修改题库主
export function updateQuestionBank(data) {
  return request({
    url: '/questionBank/questionBank',
    method: 'put',
    data: data
  })
}

// 删除题库主
export function delQuestionBank(id) {
  return request({
    url: '/questionBank/questionBank/' + id,
    method: 'delete'
  })
}