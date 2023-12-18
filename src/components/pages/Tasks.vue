<template>
  <div class="asset-types page fixed-page">
    <list-page-header :title="$t('tasks.title')" :is-exportable="false" />

    <task-list
      class="mt1"
      ref="task-list"
      :is-contact-sheet="false"
      :is-error="errors.tasks"
      :is-grouped="false"
      :is-loading="loading.tasks"
      :tasks="tasks"
      @task-selected="onTaskSelected"
    />
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'

import ListPageHeader from '@/components/widgets/ListPageHeader'
import TaskList from '@/components/lists/TaskList'
// import TaskInfo from '@/components/sides/TaskInfo'

export default {
  name: 'tasks',

  components: {
    ListPageHeader,
    TaskList
  },

  data() {
    return {
      tasks: [],
      errors: {
        tasks: false
      },
      loading: {
        tasks: false
      }
    }
  },

  mounted() {},

  computed: {
    ...mapGetters([])
  },

  methods: {
    ...mapActions([
      'deleteAssetType',
      'editAssetType',
      'newAssetType',
      'loadAssetTypes'
    ]),

    onTaskSelected(task) {
      this.$router.push({ name: 'task', params: { id: task.id } })
    }
  },

  watch: {
    $route() {}
  },

  metaInfo() {
    return {
      title: `${this.$t('tasks.title')} - Kitsu`
    }
  }
}
</script>

<style lang="scss" scoped>
.asset-type-list {
  margin-top: 0;
}
</style>
