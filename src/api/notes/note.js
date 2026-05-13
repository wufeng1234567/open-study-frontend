import request from '@/utils/request'

// 查询用户笔记主，每篇笔记必须归属于一个用户自定义的分类列表
export function listNote(query) {
  return request({
    url: '/notes/note/list',
    method: 'get',
    params: query
  })
}

// 查询用户笔记主，每篇笔记必须归属于一个用户自定义的分类详细
export function getNote(id) {
  return request({
    url: '/notes/note/' + id,
    method: 'get'
  })
}

// 新增用户笔记主，每篇笔记必须归属于一个用户自定义的分类
export function addNote(data) {
  return request({
    url: '/notes/note',
    method: 'post',
    data: data
  })
}

// 修改用户笔记主，每篇笔记必须归属于一个用户自定义的分类
export function updateNote(data) {
  return request({
    url: '/notes/note',
    method: 'put',
    data: data
  })
}

// 删除用户笔记主，每篇笔记必须归属于一个用户自定义的分类
export function delNote(id) {
  return request({
    url: '/notes/note/' + id,
    method: 'delete'
  })
}

// 批量删除笔记
export function batchDelNote(ids) {
  return request({
    url: '/notes/note/' + ids.join(','),
    method: 'delete'
  })
}
