<script setup lang="ts"></script>

<template>
  <div class="app">
    <header class="topbar">
      <h1 class="title">Linkup</h1>
    </header>

    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body,
#app {
  height: 100%;
}
html {
  color-scheme: dark;
}

body {
  margin: 0;
  background: #0b0d12;
  color: #e7eaf0;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  overscroll-behavior: none;
  font-family:
    system-ui,
    -apple-system,
    Segoe UI,
    Roboto,
    Inter,
    Arial,
    sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

.app {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  background: #0b0d12;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: #121622;
  border-bottom: 1px solid #23283a;

  padding-top: max(22px, env(safe-area-inset-top));
  padding-right: max(16px, env(safe-area-inset-right));
  padding-bottom: 12px;
  padding-left: max(20px, env(safe-area-inset-left));

  min-height: 56px;
  display: flex;
  align-items: flex-end;
}

@supports (padding: constant(safe-area-inset-top)) {
  .topbar {
    padding-top: max(22px, constant(safe-area-inset-top));
    padding-left: max(20px, constant(safe-area-inset-left));
    padding-right: max(16px, constant(safe-area-inset-right));
  }
}

.title {
  margin: 0;
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: 0.2px;
  font-size: clamp(20px, 4.2vw, 28px);
}

.content {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}
</style>
