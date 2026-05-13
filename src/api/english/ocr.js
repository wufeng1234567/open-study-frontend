import request from '@/utils/request'

// OCR 识别
export function ocrRecognize(data) {
    return request({
        url: '/ocr/recognize',
        method: 'post',
        data: data,
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
}