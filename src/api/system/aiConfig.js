import request from '@/utils/request'

export function listAiConfig() {
  return request({
    url: '/system/ai/config/list',
    method: 'get'
  })
}

export function getAiConfig(configId) {
  return request({
    url: `/system/ai/config/${configId}`,
    method: 'get'
  })
}

export function getEffectiveConfig() {
  return request({
    url: '/system/ai/config/effective',
    method: 'get'
  })
}

export function getCurrentModel() {
  return request({
    url: '/system/ai/config/current',
    method: 'get'
  })
}

export function addAiConfig(data) {
  return request({
    url: '/system/ai/config',
    method: 'post',
    data
  })
}

export function updateAiConfig(data) {
  return request({
    url: '/system/ai/config',
    method: 'put',
    data
  })
}

export function deleteAiConfig(configIds) {
  return request({
    url: `/system/ai/config/${configIds}`,
    method: 'delete'
  })
}

export function setDefaultConfig(configId) {
  return request({
    url: `/system/ai/config/default/${configId}`,
    method: 'put'
  })
}

export function testAiConnection(data) {
  return request({
    url: '/system/ai/config/test',
    method: 'post',
    data
  })
}
