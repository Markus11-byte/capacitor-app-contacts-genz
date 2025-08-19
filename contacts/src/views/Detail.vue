<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Contacts } from '@capawesome-team/capacitor-contacts'
import { Clipboard } from '@capacitor/clipboard'
import { useFavoritesStore } from '@/stores/contacts'

const route = useRoute()
const router = useRouter()
const id = String(route.params.id)

const favStore = useFavoritesStore()

const loading = ref(true)
const error = ref<string | null>(null)
const contact = ref<any | null>(null)

const isFav = computed(() => favStore.isFavorite(id))

async function copyToClipboard(text: string) {
  if (!text) return
  try {
    await Clipboard.write({ string: text })
    alert(`"${text}" wurde in die Zwischenablage kopiert`)
  } catch (e) {
    console.error('Clipboard error', e)
  }
}

async function safeGetContactById(cid: string) {
  const anyContacts = Contacts as any
  if (typeof anyContacts.getContactById === 'function') {
    const res = await anyContacts.getContactById({ id: cid })
    return res?.contact ?? null
  }
  const { contacts } = await Contacts.getContacts({
    fields: [
      'id',
      'givenName',
      'familyName',
      'emailAddresses',
      'phoneNumbers',
      'postalAddresses',
      'birthday',
    ],
    limit: 500,
    offset: 0,
  })
  return contacts.find((c: any) => c.id === cid) ?? null
}

const initials = computed(() => {
  const g = (contact.value?.givenName || '').trim()
  const f = (contact.value?.familyName || '').trim()
  return `${g[0] ?? ''}${f[0] ?? ''}`.toUpperCase() || '??'
})
const fullName = computed(
  () =>
    `${contact.value?.givenName ?? ''} ${contact.value?.familyName ?? ''}`.trim() || '(ohne Namen)',
)
const primaryPhone = computed(() => contact.value?.phoneNumbers?.[0]?.value || '')
const primaryMail = computed(() => contact.value?.emailAddresses?.[0]?.value || '')

function fmtBirthday(b: any) {
  if (!b) return ''
  const { day, month, year } = b
  if (!day && !month && !year) return ''
  const d = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1))
  try {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d)
  } catch {
    return `${day ?? '??'}.${month ?? '??'}.${year ?? '????'}`
  }
}

async function removeContact() {
  if (!confirm('Diesen Kontakt wirklich löschen?')) return
  await Contacts.deleteContactById({ id })
  await favStore.remove(id)
  router.replace({ name: 'home' })
}

async function toggleFav() {
  await favStore.toggle(id)
}

function call() {
  if (primaryPhone.value) window.location.href = `tel:${primaryPhone.value}`
}
function mail() {
  if (primaryMail.value) window.location.href = `mailto:${primaryMail.value}`
}

async function load() {
  loading.value = true
  error.value = null
  try {
    await favStore.load()

    contact.value = await safeGetContactById(id)
    if (!contact.value) throw new Error('Kontakt nicht gefunden.')
  } catch (e: any) {
    error.value = e?.message ?? String(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load()
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') router.back()
}
</script>

<template>
  <section class="wrap">
    <div class="toolbar">
      <div class="toolbar-left">
        <button class="icon-btn" aria-label="Zurück" title="Zurück" @click="router.back()">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path
              d="M15 19l-7-7 7-7"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </button>
        <span class="toolbar-title">Kontaktdetails</span>
      </div>
      <div style="width: 40px"></div>
    </div>

    <div class="pad" v-if="loading">
      <div class="loader">
        <div class="spinner" />
        <span>Lade Kontakt…</span>
      </div>
    </div>
    <div class="pad" v-else-if="error">
      <p class="err">⚠️ {{ error }}</p>
    </div>

    <div v-else class="pad">
      <article class="detail-card">
        <header class="card-head">
          <div class="avatar">{{ initials }}</div>
          <div class="head-text">
            <h2 class="title">{{ fullName }}</h2>
            <p v-if="contact?.birthday" class="sub">🎂 {{ fmtBirthday(contact.birthday) }}</p>
          </div>

          <div class="head-actions">
            <button
              class="icon-btn ghost"
              :aria-label="isFav ? 'Favorit entfernen' : 'Als Favorit markieren'"
              :title="isFav ? 'Favorit entfernen' : 'Als Favorit markieren'"
              @click="toggleFav"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  :fill="isFav ? 'currentColor' : 'none'"
                  stroke="currentColor"
                  stroke-width="2"
                  d="M12 17.3l-5.5 3 1-6.1L3 9.8l6.2-.9L12 3l2.8 5.9 6.2.9-4.5 4.4 1 6.1z"
                />
              </svg>
            </button>

            <button
              class="icon-btn danger"
              title="Löschen"
              aria-label="Löschen"
              @click="removeContact"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path d="M3 6h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                <path
                  d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
                <rect
                  x="6"
                  y="6"
                  width="12"
                  height="14"
                  rx="2"
                  ry="2"
                  stroke="currentColor"
                  stroke-width="2"
                  fill="none"
                />
                <line
                  x1="10"
                  y1="11"
                  x2="10"
                  y2="17"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
                <line
                  x1="14"
                  y1="11"
                  x2="14"
                  y2="17"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>
        </header>

        <div class="rows">
          <div class="row" v-if="primaryPhone">
            <span class="icon">📞</span>
            <span class="text not-clickable">{{ primaryPhone }}</span>
            <button
              class="copy-btn"
              title="Nummer kopieren"
              aria-label="Nummer kopieren"
              @click="copyToClipboard(primaryPhone)"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <rect
                  x="9"
                  y="9"
                  width="10"
                  height="10"
                  rx="2"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                />
                <rect
                  x="5"
                  y="5"
                  width="10"
                  height="10"
                  rx="2"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  opacity=".7"
                />
              </svg>
            </button>
          </div>

          <div class="row" v-if="primaryMail">
            <span class="icon">✉️</span>
            <span class="text not-clickable">{{ primaryMail }}</span>
            <button
              class="copy-btn"
              title="E-Mail kopieren"
              aria-label="E-Mail kopieren"
              @click="copyToClipboard(primaryMail)"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
                <rect
                  x="9"
                  y="9"
                  width="10"
                  height="10"
                  rx="2"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                />
                <rect
                  x="5"
                  y="5"
                  width="10"
                  height="10"
                  rx="2"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  opacity=".7"
                />
              </svg>
            </button>
          </div>

          <div class="row" v-if="contact?.postalAddresses?.length">
            <span class="icon">📍</span>
            <span class="text">
              {{
                [
                  contact.postalAddresses[0]?.street,
                  contact.postalAddresses[0]?.postalCode,
                  contact.postalAddresses[0]?.city,
                ]
                  .filter(Boolean)
                  .join(' ')
              }}
            </span>
          </div>

          <div class="actions" v-if="primaryPhone || primaryMail">
            <button class="chip" v-if="primaryPhone" @click="call">Anrufen</button>
            <button class="chip" v-if="primaryMail" @click="mail">E-Mail</button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.wrap {
  padding: 0;
}
.pad {
  padding-left: calc(16px + env(safe-area-inset-left));
  padding-right: calc(16px + env(safe-area-inset-right));
}
.toolbar {
  padding: 12px calc(16px + env(safe-area-inset-right)) 12px calc(16px + env(safe-area-inset-left));
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-bottom: 1px solid #1a2334;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.toolbar-title {
  font-size: 18px;
  font-weight: 700;
  color: #eaf2ff;
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
.icon-btn.danger {
  color: #ffbcbc;
  border-color: #4b2a2a;
  background: #1a1113;
}
.icon-btn.danger:hover {
  background: #221416;
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
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.err {
  color: #ffb3b3;
}

.detail-card {
  margin-top: 10px;
  border: 1px solid #151d2b;
  background: #0f1624;
  border-radius: 12px;
  padding: 14px;
}
.card-head {
  display: grid;
  grid-template-columns: 42px 1fr auto;
  gap: 8px;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid #151d2b;
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
.head-text {
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
.sub {
  font-size: 12px;
  color: #c8d3ea;
}
.head-actions {
  display: flex;
  gap: 8px;
}

.rows {
  display: grid;
  gap: 8px;
  padding-top: 10px;
}
.row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  border: 1px solid #151d2b;
  border-radius: 10px;
  padding: 10px;
  background: #0e1420;
}
.icon {
  opacity: 0.9;
  font-size: 14px;
}
.text {
  opacity: 0.95;
  color: #c8d3ea;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1 1 auto;
}
.not-clickable {
  pointer-events: none;
  user-select: text;
}

.copy-btn {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #0f172a;
  border: 1px solid #26314d;
  color: #cfe1ff;
  transition:
    transform 0.08s ease,
    background 0.12s ease,
    border-color 0.12s ease;
}
.copy-btn:hover {
  background: #131e36;
  border-color: #30446b;
  transform: translateY(-1px);
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding-top: 2px;
}

.chip {
  border: 1px solid #2a3554;
  background: #111a2c;
  color: #dbe6ff;
  border-radius: 999px;
  padding: 7px 12px;
  cursor: pointer;
  transition:
    border-color 0.12s ease,
    background 0.12s ease,
    transform 0.08s ease;
}
.chip:hover {
  background: #15203a;
  border-color: #3b4f86;
  transform: translateY(-1px);
}
</style>
