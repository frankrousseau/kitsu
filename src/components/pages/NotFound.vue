<template>
  <div class="not-found page has-text-centered">
    <img class="illustration" src="@/assets/illustrations/404.png" />
    <h1 class="title">{{ $t('not_found.title') }}</h1>
    <p>
      {{ $t('not_found.text') }}
    </p>
    <p>
      <a href="/">{{ $t('main.home') }}</a>
    </p>
  </div>
</template>

<script>
export default {
  name: 'not-found'
}
</script>

<style lang="scss" scoped>
.illustration {
  max-width: 1000px;
  margin: auto;
}

p {
  color: var(--text);
  font-size: 1.3em;
  padding-bottom: 1em;

  a {
    text-decoration: underline;
  }
}

.title {
  color: var(--text);
  font-weight: bold;
  font-size: 2.6em;
}
</style>
