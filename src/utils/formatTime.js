// src/utils/formatTime.js
export const formatTime = (time, format = '{y}-{m}-{d}') => {
  if (!time) return ''
  
  const date = new Date(time)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  return format
    .replace('{y}', year)
    .replace('{m}', month.toString().padStart(2, '0'))
    .replace('{d}', day.toString().padStart(2, '0'))
}