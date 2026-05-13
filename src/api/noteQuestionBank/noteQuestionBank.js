import request from '@/utils/request'

export function listNoteQuestionBank(query) {
  return request({
    url: '/noteQuestionBank/noteQuestionBank/list',
    method: 'get',
    params: query
  })
}

export function getNoteQuestionBank(id) {
  return request({
    url: '/noteQuestionBank/noteQuestionBank/' + id,
    method: 'get'
  })
}

export function addNoteQuestionBank(data) {
  return request({
    url: '/noteQuestionBank/noteQuestionBank',
    method: 'post',
    data: data
  })
}

export function updateNoteQuestionBank(data) {
  return request({
    url: '/noteQuestionBank/noteQuestionBank',
    method: 'put',
    data: data
  })
}

export function delNoteQuestionBank(id) {
  return request({
    url: '/noteQuestionBank/noteQuestionBank/' + id,
    method: 'delete'
  })
}

export function getNoteQuestionBanksByNoteId(noteId) {
  return request({
    url: '/noteQuestionBank/noteQuestionBank/byNote/' + noteId,
    method: 'get'
  })
}

export function getNoteQuestionBanksByBankId(bankId) {
  return request({
    url: '/noteQuestionBank/noteQuestionBank/byBank/' + bankId,
    method: 'get'
  })
}

export function removeNoteQuestionBank(noteId, bankId) {
  return request({
    url: '/noteQuestionBank/noteQuestionBank/note/' + noteId + '/bank/' + bankId,
    method: 'delete'
  })
}
