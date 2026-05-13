import request from '@/utils/request'

export function listPublicNotes(query) {
  return request({
    url: '/notes/note/public/list',
    method: 'get',
    params: query
  })
}

export function getPublicNote(id) {
  return request({
    url: `/notes/note/public/${id}`,
    method: 'get'
  })
}

export function recordClick(noteId) {
  return request({
    url: `/notes/note/public/click/${noteId}`,
    method: 'post',
    headers: {
      repeatSubmit: false
    }
  })
}

export function getRanking(type) {
  return request({
    url: '/notes/note/public/ranking',
    method: 'get',
    params: { type, limit: 10 }
  })
}