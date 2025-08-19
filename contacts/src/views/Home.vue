<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Contacts } from '@capawesome-team/capacitor-contacts'
import { useFavoritesStore } from '@/stores/contacts'

const router = useRouter()
const favStore = useFavoritesStore()
const goToInsert = () => router.push({ name: 'contacts-insert' })

const loading = ref(false)
const contacts = ref<any[]>([])
const total = ref<number | null>(null)
const query = ref('')

async function fetchContacts() {
  loading.value = true
  try {
    const { contacts: list } = await Contacts.getContacts({
      fields: ['id', 'givenName', 'familyName'],
      limit: 500,
      offset: 0,
    })
    contacts.value = list
    total.value = list.length
  } finally {
    loading.value = false
  }
}

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return contacts.value
  return contacts.value.filter((c: any) => {
    const name = `${c.givenName ?? ''} ${c.familyName ?? ''}`.toLowerCase()
    return name.includes(q)
  })
})

const sortByName = (a: any, b: any) =>
  `${a.givenName ?? ''} ${a.familyName ?? ''}`.localeCompare(
    `${b.givenName ?? ''} ${b.familyName ?? ''}`,
    'de',
  )

const favs = computed(() =>
  [...filtered.value].filter((c) => favStore.isFavorite(c.id)).sort(sortByName),
)
const others = computed(() =>
  [...filtered.value].filter((c) => !favStore.isFavorite(c.id)).sort(sortByName),
)

function openDetail(id: string) {
  router.push({ name: 'contact-detail', params: { id } })
}

onMounted(async () => {
  await favStore.load()
  await fetchContacts()
})
</script>

<template>
  <section class="wrap">
    <div class="toolbar">
      <h2 class="title-line">
        Kontakte
        <span class="count-badge">
          <template v-if="!loading">{{ total ?? 0 }}</template>
          <span v-else class="mini-spinner"></span>
        </span>
      </h2>
      <div class="actions">
        <button
          class="icon-btn"
          @click="goToInsert"
          title="Neuen Kontakt hinzufügen"
          aria-label="Neuen Kontakt hinzufügen"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              d="M12 5v14M5 12h14"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>
    </div>

    <div class="search-row">
      <input v-model="query" class="search" placeholder="Suche (Name)" />
    </div>

    <div class="pad" v-if="loading">
      <div class="loader">
        <div class="spinner" />
        <span>Lade Kontakte…</span>
      </div>
    </div>

    <ul v-if="!loading && (favs.length || others.length)" class="list">
      <li v-if="favs.length" class="section">Favoriten</li>
      <li
        v-for="c in favs"
        :key="'fav-' + c.id"
        class="card fav"
        @click="openDetail(c.id)"
        role="button"
        tabindex="0"
      >
        <div class="avatar">
          {{ (c.givenName?.[0] ?? '?') + (c.familyName?.[0] ?? '') }}
        </div>
        <div class="content">
          <div class="title">
            <svg class="star" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path
                d="M12 17.3l-5.5 3 1-6.1L3 9.8l6.2-.9L12 3l2.8 5.9 6.2.9-4.5 4.4 1 6.1z"
                fill="currentColor"
              />
            </svg>
            {{ c.givenName }} {{ c.familyName }}
          </div>
        </div>
      </li>

      <li v-if="others.length" class="section">Alle Kontakte</li>
      <li
        v-for="c in others"
        :key="'other-' + c.id"
        class="card"
        @click="openDetail(c.id)"
        role="button"
        tabindex="0"
      >
        <div class="avatar">
          {{ (c.givenName?.[0] ?? '?') + (c.familyName?.[0] ?? '') }}
        </div>
        <div class="content">
          <div class="title">{{ c.givenName }} {{ c.familyName }}</div>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.wrap {
  padding: 0;
}

.toolbar {
  padding: 12px calc(16px + env(safe-area-inset-right)) 12px calc(16px + env(safe-area-inset-left));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 1px solid #1a2334;
}
.title-line {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}
.count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 22px;
  min-width: 28px;
  padding: 0 8px;
  border-radius: 999px;
  background: #0f172a;
  border: 1px solid #26314d;
  color: #cfe1ff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2px;
}
.mini-spinner {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #30446b;
  border-top-color: #8fb0ff;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.actions {
  display: flex;
  gap: 8px;
}
.icon-btn {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: #0f172a;
  border: 1px solid #26314d;
  color: #cfe1ff;
  transition:
    transform 0.1s ease,
    background 0.12s ease,
    border-color 0.12s ease;
}
.icon-btn:hover {
  background: #131e36;
  border-color: #30446b;
}
.icon-btn:active {
  transform: scale(0.96);
}

.search-row {
  padding: 0;
  margin: 10px 0;
}
.search {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  background: #0d1320;
  border: 1px solid #1c2638;
  color: #e7eaf0;
  box-sizing: border-box;
}

.loader {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
}
.spinner {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #1f2b43;
  border-top-color: #89a4ff;
  animation: spin 0.9s linear infinite;
}

.list {
  list-style: none;
  margin: 8px 0 0 0;
  padding: 0;
}
.section {
  position: sticky;
  top: 0;
  padding: 6px calc(16px + env(safe-area-inset-right)) 6px calc(16px + env(safe-area-inset-left));
  background: #0b111ce6;
  backdrop-filter: blur(4px);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #9fb4e8;
  border-top: 1px solid #152033;
  border-bottom: 1px solid #152033;
  text-transform: uppercase;
}
.card {
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 6px;
  align-items: center;
  padding: 10px calc(16px + env(safe-area-inset-right)) 10px calc(16px + env(safe-area-inset-left));
  border-bottom: 1px solid #151d2b;
  cursor: pointer;
}
.card:last-child {
  border-bottom: none;
}
.card:hover {
  background: #0e1420;
}
.card.fav {
  background: #0f1626;
  border-left: 3px solid #4a7cff;
}
.card.fav:hover {
  background: #111a2e;
}

.avatar {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #1c2a40 0%, #2b4b7a 100%);
  color: #eef;
  font-weight: 700;
  font-size: 13px;
}
.content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  margin-left: 2px;
}
.title {
  font-weight: 700;
  font-size: 15px;
  line-height: 1.2;
  color: #eaf2ff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.star {
  margin-right: 6px;
  color: #ffd76a;
  vertical-align: -2px;
}
</style>
