import { writable } from "svelte/store"
import { browser } from "$app/environment"

const STORAGE_KEY = "selectedSubjectId"

function createSubjectStore() {
  const storedSubject = browser ? localStorage.getItem(STORAGE_KEY) : null
  const { subscribe, set, update } = writable<string | null>(storedSubject)

  return {
    subscribe,
    setSubject: (subjectId: string | null) => {
      if (browser) {
        if (subjectId) {
          localStorage.setItem(STORAGE_KEY, subjectId)
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      }
      set(subjectId)
    },
    reset: () => {
      if (browser) {
        localStorage.removeItem(STORAGE_KEY)
      }
      set(null)
    },
  }
}

export const selectedSubject = createSubjectStore()
