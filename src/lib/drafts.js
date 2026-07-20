const DRAFT_PREFIX = 'draft-'

// Set at app init: drafts are private to the logged-in user, so on a
// shared workstation the next user must not see them.
let userScope = ''

const draftKey = taskId =>
  userScope ? `${DRAFT_PREFIX}${userScope}-${taskId}` : DRAFT_PREFIX + taskId

// Pre-scoping drafts were stored under the bare task id.
const legacyKey = taskId => DRAFT_PREFIX + taskId

const EMPTY_DRAFT = { text: '', checklist: [] }

const normalize = draft => {
  if (!draft) return null
  if (typeof draft === 'string') {
    return { text: draft, checklist: [] }
  }
  return {
    // Coerce non-strings to '' so a corrupted stored draft cannot feed
    // an object back into the comment form after a reload.
    text: typeof draft.text === 'string' ? draft.text : '',
    checklist: Array.isArray(draft.checklist) ? draft.checklist : []
  }
}

const isEmpty = draft => {
  return (
    !draft ||
    ((!draft.text || draft.text.length === 0) &&
      (!draft.checklist || draft.checklist.length === 0))
  )
}

const drafts = {
  setUserScope(userId) {
    userScope = userId || ''
  },

  setTaskDraft(taskId, draft) {
    try {
      const normalized = normalize(draft) || EMPTY_DRAFT
      if (isEmpty(normalized)) {
        return drafts.clearTaskDraft(taskId)
      }
      localStorage.removeItem(legacyKey(taskId))
      return localStorage.setItem(draftKey(taskId), JSON.stringify(normalized))
    } catch (e) {
      console.warn('Failed to save draft:', e)
    }
  },

  getTaskDraft(taskId) {
    try {
      // Fall back to the pre-scoping key so in-flight drafts survive the
      // upgrade; they get rewritten scoped on the next save.
      const raw =
        localStorage.getItem(draftKey(taskId)) ??
        localStorage.getItem(legacyKey(taskId))
      if (raw === null) return null
      // Legacy drafts were plain text strings. Try JSON first; on parse
      // failure fall back to treating the value as the draft text.
      try {
        return normalize(JSON.parse(raw))
      } catch {
        return normalize(raw)
      }
    } catch (e) {
      console.warn('Failed to read draft:', e)
      return null
    }
  },

  clearTaskDraft(taskId) {
    try {
      localStorage.removeItem(legacyKey(taskId))
      return localStorage.removeItem(draftKey(taskId))
    } catch (e) {
      console.warn('Failed to clear draft:', e)
    }
  }
}

export default drafts
