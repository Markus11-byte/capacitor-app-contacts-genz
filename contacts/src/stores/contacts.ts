import { defineStore } from 'pinia'
import { ref } from 'vue'
import { Preferences } from '@capacitor/preferences'

const FAV_KEY = 'contact_favs_v1'

export const useFavoritesStore = defineStore('favorites', () => {
  const ids = ref<Set<string>>(new Set())

  async function load() {
    const { value } = await Preferences.get({ key: FAV_KEY })
    ids.value = new Set(value ? JSON.parse(value) : [])
  }

  async function save() {
    await Preferences.set({ key: FAV_KEY, value: JSON.stringify([...ids.value]) })
  }

  function isFavorite(id: string | undefined | null) {
    return !!id && ids.value.has(id)
  }

  async function toggle(id: string) {
    if (!id) return
    ids.value.has(id) ? ids.value.delete(id) : ids.value.add(id)
    await save()
  }

  async function add(id: string) {
    if (!id) return
    ids.value.add(id)
    await save()
  }

  async function remove(id: string) {
    if (!id) return
    if (ids.value.delete(id)) await save()
  }

  return { ids, load, save, isFavorite, toggle, add, remove }
})
