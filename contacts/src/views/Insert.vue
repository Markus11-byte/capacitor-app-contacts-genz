<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Contacts, EmailAddressType, PhoneNumberType } from '@capawesome-team/capacitor-contacts'
import { DatetimePicker } from '@capawesome-team/capacitor-datetime-picker'

const router = useRouter()

const loading = ref(false)
const error = ref<string | null>(null)

const givenName = ref('')
const familyName = ref('')
const phone = ref('')
const email = ref('')
const birthdayISO = ref<string>('')

function validate() {
  if (!givenName.value.trim() && !familyName.value.trim()) {
    throw new Error('Bitte mindestens Vor- oder Nachnamen eingeben.')
  }
  if (phone.value && !/^[\d+()\-.\s]{4,}$/.test(phone.value)) {
    throw new Error('Bitte eine gültige Telefonnummer eingeben.')
  }
  if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    throw new Error('Bitte eine gültige E-Mail eingeben.')
  }
}

function formatDate(iso?: string) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d)
  } catch {
    return ''
  }
}

const birthdayLabel = computed(() =>
  birthdayISO.value ? formatDate(birthdayISO.value) : 'Geburtstag (optional)',
)

async function pickBirthday() {
  try {
    const current = birthdayISO.value || new Date().toISOString()
    const { value } = await DatetimePicker.present({
      mode: 'date',
      value: current,
      locale: 'de-DE',
      theme: 'auto',
      doneButtonText: 'Fertig',
      cancelButtonText: 'Abbrechen',
    })
    if (value) birthdayISO.value = value
  } catch {
    const raw = window.prompt('Geburtsdatum (YYYY-MM-DD):', birthdayISO.value.slice(0, 10))
    if (raw) {
      const parsed = new Date(raw)
      if (!Number.isNaN(parsed.getTime())) birthdayISO.value = parsed.toISOString()
    }
  }
}
function clearBirthday() {
  birthdayISO.value = ''
}

async function submit() {
  error.value = null
  try {
    validate()
    loading.value = true

    let birthday: { day?: number; month?: number; year?: number } | undefined
    if (birthdayISO.value) {
      const d = new Date(birthdayISO.value)
      if (!Number.isNaN(d.getTime())) {
        birthday = { day: d.getUTCDate(), month: d.getUTCMonth() + 1, year: d.getUTCFullYear() }
      }
    }

    const payload: any = {
      givenName: givenName.value || undefined,
      familyName: familyName.value || undefined,
      phoneNumbers: phone.value
        ? [{ value: phone.value.trim(), type: PhoneNumberType.Mobile, isPrimary: true }]
        : undefined,
      emailAddresses: email.value
        ? [{ value: email.value.trim(), type: EmailAddressType.Home, isPrimary: true }]
        : undefined,
      birthday,
    }

    await Contacts.createContact({ contact: payload })
    router.replace({ name: 'home' })
  } catch (e: any) {
    error.value = e?.message ?? String(e)
  } finally {
    loading.value = false
  }
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
        <span class="toolbar-title">Neuen Kontakt anlegen</span>
      </div>
      <div style="width: 40px"></div>
    </div>

    <div class="pad">
      <article class="form-card">
        <form @submit.prevent="submit" novalidate>
          <fieldset :disabled="loading">
            <div class="row">
              <label>Vorname</label>
              <input v-model="givenName" placeholder="Max" />
            </div>

            <div class="row">
              <label>Nachname</label>
              <input v-model="familyName" placeholder="Mustermann" />
            </div>

            <div class="row">
              <label>Telefonnummer</label>
              <input v-model="phone" inputmode="tel" placeholder="+49 170 1234567" />
            </div>

            <div class="row">
              <label>E-Mail</label>
              <input v-model="email" inputmode="email" placeholder="mail@example.com" />
            </div>

            <div class="row">
              <label>Geburtstag</label>
              <div class="date-row">
                <button
                  type="button"
                  class="date-btn"
                  :class="{ filled: birthdayISO }"
                  @click="pickBirthday"
                >
                  {{ birthdayLabel }}
                </button>
                <button
                  v-if="birthdayISO"
                  type="button"
                  class="clear-btn"
                  @click="clearBirthday"
                  aria-label="Geburtstag löschen"
                  title="Zurücksetzen"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <line
                      x1="6"
                      y1="6"
                      x2="18"
                      y2="18"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                    <line
                      x1="6"
                      y1="18"
                      x2="18"
                      y2="6"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div class="actions">
              <button class="chip ghost" type="button" :disabled="loading" @click="router.back()">
                Abbrechen
              </button>
              <button class="chip ghost" type="submit" :disabled="loading">Speichern</button>
            </div>

            <p v-if="error" class="err">⚠️ {{ error }}</p>
          </fieldset>
        </form>
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

.form-card {
  margin-top: 10px;
  border: 1px solid #151d2b;
  background: #0f1624;
  border-radius: 12px;
  padding: 14px;
}
fieldset {
  border: 0;
  margin: 0;
  padding: 0;
}

.row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
  border: 1px solid #151d2b;
  border-radius: 10px;
  padding: 10px;
  background: #0e1420;
}
label {
  font-size: 12px;
  color: #c8d3ea;
}
input {
  width: 100%;
  padding: 10px;
  border-radius: 8px;
  background: #0d1320;
  border: 1px solid #1c2638;
  color: #e7eaf0;
}

.date-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.date-btn {
  flex: 1 1 auto;
  text-align: left;
  padding: 12px;
  border-radius: 8px;
  background: #0d1320;
  border: 1px solid #1c2638;
  cursor: pointer;
  color: #6b7280;
}
.date-btn.filled {
  color: #e7eaf0;
}
.clear-btn {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: #0f172a;
  border: 1px solid #26314d;
  color: #cfe1ff;
  cursor: pointer;
}
.clear-btn:hover {
  background: #131e36;
  border-color: #30446b;
}

.actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 6px;
}
.chip {
  border: 1px solid #2a3554;
  background: #111a2c;
  color: #dbe6ff;
  border-radius: 999px;
  padding: 8px 14px;
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
.chip:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.err {
  color: #ffb3b3;
  margin-top: 10px;
}
</style>
