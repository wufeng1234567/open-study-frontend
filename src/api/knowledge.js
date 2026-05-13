import request from '@/utils/request'

// 获取知识库列表
export function getKnowledgeBaseList(userId) {
  return request({
    url: '/test/rag/list',
    method: 'get',
    params: { userId }
  })
}

// 创建知识库
export function createKnowledgeBase(data) {
  return request({
    url: '/test/rag/create',
    method: 'post',
    params: {   // ← 这里改成 params，不是 data
      name: data.name,
      description: data.description,
      userId: data.userId || 1
    }
  })
}

// 上传文档
export function uploadDocument(formData) {
  return request({
    url: '/rag/document/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 解析文档
export function parseDocument(documentId) {
  return request({
    url: `/rag/document/parse/${documentId}`,
    method: 'post'
  })
}

// 查询文档状态
export function getDocumentStatus(documentId) {
  return request({
    url: `/rag/document/status/${documentId}`,
    method: 'get'
  })
}

// 普通问答
export function askQuestion(data) {
  return request({
    url: '/rag/ask',
    method: 'post',
    data: data
  })
}

// 流式问答（返回 EventSource）
export function askQuestionStream(question, knowledgeBaseId) {
  const baseUrl = import.meta.env.VITE_APP_BASE_API || ''
  const url = `${baseUrl}/rag/ask/stream?question=${encodeURIComponent(question)}&knowledgeBaseId=${knowledgeBaseId}`
  return new EventSource(url)
}

// 删除知识库
export function deleteKnowledgeBase(id) {
  return request({
    url: `/rag/knowledgeBase/${id}`,
    method: 'delete'
  })
}

// 更新知识库
export function updateKnowledgeBase(id, data) {
  return request({
    url: `/rag/knowledgeBase/${id}`,
    method: 'put',
    data: data
  })
}

// 获取知识库详情
export function getKnowledgeBaseDetail(id) {
  return request({
    url: `/test/rag/get/${id}`,
    method: 'get'
  })
}

// 获取文档列表
export function getDocumentList(knowledgeBaseId) {
  return request({
    url: `/rag/document/list/${knowledgeBaseId}`,
    method: 'get'
  })
}

// 从笔记导入到知识库
export function importNoteToKb(noteId, knowledgeBaseId) {
  return request({
    url: '/rag/document/importFromNote',
    method: 'post',
    data: { noteId, knowledgeBaseId }
  })
}

// 删除文档
export function deleteDocument(documentId) {
  return request({
    url: `/rag/document/${documentId}`,
    method: 'delete'
  })
}

// 上传文本内容
export function uploadTextContent(data) {
  return request({
    url: '/rag/document/uploadText',
    method: 'post',
    data: {
      content: data.content,
      fileName: data.fileName || '文本内容_' + Date.now() + '.txt',
      knowledgeBaseId: data.knowledgeBaseId,
      userId: data.userId
    }
  })
}

// 保存问答记录
export function saveQaRecord(data) {
  return request({
    url: '/rag/qa/save',
    method: 'post',
    data: {
      userId: data.userId,
      knowledgeBaseId: data.knowledgeBaseId,
      question: data.question,
      answer: data.answer,
      durationMs: data.durationMs
    }
  })
}

// 获取问答历史
export function getQaHistory(knowledgeBaseId) {
  return request({
    url: `/rag/qa/list/${knowledgeBaseId}`,
    method: 'get'
  })
}
