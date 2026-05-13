import request from '@/utils/request'

// 上传图片并进行OCR识别
export function ocrRecognize(data) {
  return request({
    url: '/ocr/recognize',
    method: 'post',
    data: data,
    timeout: 120000
  })
}