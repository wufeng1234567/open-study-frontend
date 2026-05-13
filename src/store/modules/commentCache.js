import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useCommentCacheStore = defineStore('commentCache', () => {
  const currentPage = ref(1)
  const expandedThreads = ref(new Set())
  const replyTarget = ref(null)
  const currentNoteId = ref(null)

  const setNoteId = (noteId) => {
    if (currentNoteId.value !== noteId) {
      currentNoteId.value = noteId
      currentPage.value = 1
      expandedThreads.value = new Set()
      replyTarget.value = null
    }
  }

  const toggleThread = (commentId) => {
    const set = new Set(expandedThreads.value)
    if (set.has(commentId)) {
      set.delete(commentId)
    } else {
      set.add(commentId)
    }
    expandedThreads.value = set
  }

  const setReplyTarget = (target) => {
    replyTarget.value = target
  }

  const clearReplyTarget = () => {
    replyTarget.value = null
  }

  const setPage = (page) => {
    currentPage.value = page
  }

  const reset = () => {
    currentPage.value = 1
    expandedThreads.value = new Set()
    replyTarget.value = null
    currentNoteId.value = null
  }

  return {
    currentPage,
    expandedThreads,
    replyTarget,
    currentNoteId,
    setNoteId,
    toggleThread,
    setReplyTarget,
    clearReplyTarget,
    setPage,
    reset
  }
})
