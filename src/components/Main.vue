<template>
  <XyzTransition appear xyz="fade">
    <div class="main">
      <a class="skip-link" href="#main-content">{{
        $t('main.skip_to_content')
      }}</a>
      <topbar />
      <sidebar />
      <main id="main-content">
        <router-view />
      </main>
    </div>
  </XyzTransition>
</template>

<script>
import Topbar from '@/components/tops/Topbar.vue'
import Sidebar from '@/components/sides/Sidebar.vue'

export default {
  name: 'main-wrapper',

  components: {
    Topbar,
    Sidebar
  },

  mounted() {
    this.$socket.connect()
  }
}
</script>

<style>
.main {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  z-index: 100;
  padding: 0.5em 1em;
  background: var(--background);
  color: var(--text);
}

.skip-link:focus {
  top: 0;
}
</style>
