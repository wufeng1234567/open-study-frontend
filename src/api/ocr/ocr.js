import request from '@/utils/request'

export function ocrRecognize(data) {
  return request({
    url: '/ocr/recognize',
    method: 'post',
    data: data,
    timeout: 600000
  })
}