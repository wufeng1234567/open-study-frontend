import request from '@/utils/request'

export function listFavoriteNote(query) {
  return request({
    url: '/favoriteNote/favoriteNote/list',
    method: 'get',
    params: query
  })
}

export function getFavoriteNote(favoriteId) {
  return request({
    url: '/favoriteNote/favoriteNote/' + favoriteId,
    method: 'get'
  })
}

export function addFavoriteNote(data) {
  return request({
    url: '/favoriteNote/favoriteNote',
    method: 'post',
    data: data
  })
}

export function updateFavoriteNote(data) {
  return request({
    url: '/favoriteNote/favoriteNote',
    method: 'put',
    data: data
  })
}

export function delFavoriteNote(favoriteId) {
  return request({
    url: '/favoriteNote/favoriteNote/' + favoriteId,
    method: 'delete'
  })
}

export function checkNoteFavoriteExists(userId, noteId) {
  return request({
    url: `/favoriteNote/favoriteNote/checkFavorite/${userId}/${noteId}`,
    method: 'get'
  })
}

export function deleteFavoriteNoteByUserAndNote(userId, noteId) {
  return request({
    url: `/favoriteNote/favoriteNote/deleteByUserAndNote/${userId}/${noteId}`,
    method: 'delete'
  })
}

export function getFavoriteNoteDetails() {
  return request({
    url: '/favoriteNote/favoriteNote/details',
    method: 'get'
  })
}

export function checkNoteExists(noteId) {
  return request({
    url: '/favoriteNote/favoriteNote/checkNote/' + noteId,
    method: 'get'
  })
}
