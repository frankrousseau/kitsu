<template>
<div class="data-list">
  <div style="overflow: hidden">
    <table class="table table-header" ref="headerWrapper">
      <thead>
        <tr>
          <th class="thumbnail"></th>
          <th class="episode" v-if="entries && entries.length > 0 && entries[0].episode_name.length > 0">
            {{ $t('shots.fields.episode') }}
          </th>
          <th class="sequence">{{ $t('shots.fields.sequence') }}</th>
          <th class="name">{{ $t('shots.fields.name') }}</th>
          <th class="framein">{{ $t('shots.fields.frame_in') }}</th>
          <th class="frameout">{{ $t('shots.fields.frame_out') }}</th>
          <th class="description">{{ $t('shots.fields.description') }}</th>
          <th
            class="validation"
            :style="{
              'border-left': '2px solid ' + column.color
            }"
            v-for="column in validationColumns">
            {{ column.name }}
          </th>

          <th class="actions">
            <button-link
              class="is-small"
              icon="plus"
              :text="$t('tasks.create_tasks')"
              :path="{
                name: 'create-shot-tasks',
                params: {
                  production_id: currentProduction.id
                }
              }"
              v-if="isCurrentUserManager"
            >
            </button-link>
          </th>
        </tr>
      </thead>
    </table>
  </div>

  <table-info
    :is-loading="isLoading"
    :is-error="isError"
  >
  </table-info>

  <div class="has-text-centered" v-if="isEmptyList">
    <p class="info">{{ $t('shots.empty_list') }}</p>
    <button-link
      class="level-item big-button"
      :text="$t('shots.new_shots')"
      :path="{
        name: 'manage-shots',
        params: {production_id: currentProduction.id}
      }"
    >
    </button-link>
  </div>

  <div class="table-body" v-scroll="onBodyScroll">
    <table class="table">
      <tbody>
        <tr
          :key="entry.id"
          :class="{canceled: entry.canceled}"
          v-for="entry in entries"
        >
          <td class="thumbnail">
            <img
              class="thumbnail-picture"
              v-lazy="'/api/pictures/thumbnails/preview-files/' + entry.preview_file_id + '.png'"
              v-if="entry.preview_file_id && entry.preview_file_id.length > 0"
            />
            <span class="thumbnail-picture thumbnail-empty" v-else>
            </span>
          </td>
          <td :class="{name: !entry.canceled}" v-if="entries[0].episode_name.length > 0">
            {{ entry.episode_name }}
          </td>
          <td :class="{name: !entry.canceled}">
            {{ entry.sequence_name }}
          </td>
          <td :class="{name: !entry.canceled}">
            {{ entry.name }}
          </td>
          <td class="framein">
            {{ entry.data && entry.data.frame_in ? entry.data.frame_in : ''}}
          </td>
          <td class="frameout">
            {{ entry.data && entry.data.frame_out ? entry.data.frame_out : ''}}
          </td>
          <td class="description">
            {{ entry.description }}
          </td>
          <validation-cell
            :key="column.id + '_' + entry.id"
            :id="column.id + '_' + entry.id"
            :column="column"
            :task="entry.validations[column.name]"
            :background-color="validationBackgroundColor(entry.validations[column.name])"
            :text-color="validationTextColor(entry.validations[column.name])"
            :selected="entry.selectedCells[column.id + '_' + entry.id] ? true : false"
            :show-assignees="isSelectionActive"
            @click="(event) => {validationCellClicked(event)}"
            v-for="column in validationColumns"
          >
          </validation-cell>
          <row-actions v-if="isCurrentUserManager"
            :entry="entry"
            :edit-route="{
              name: 'edit-shots',
              params: {
                shot_id: entry.id,
                production_id: currentProduction.id
              }
            }"
            :restore-route="{
              name: 'restore-shots',
              params: {
                shot_id: entry.id,
                production_id: currentProduction.id
              }
            }"
            :delete-route="{
              name: 'delete-shots',
              params: {
                shot_id: entry.id,
                production_id: currentProduction.id
              }
            }"
          >
          </row-actions>
          <td class="actions" v-else>
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <p class="has-text-centered nb-shots" v-if="!isEmptyList">
    {{ entries ? entries.length : 0 }} {{ $tc('shots.number', entries ? entries.length :0 ) }}
  </p>

</div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import ValidationCell from '../cells/ValidationCell'
import RowActions from '../widgets/RowActions'
import ButtonLink from '../widgets/ButtonLink'
import ButtonHrefLink from '../widgets/ButtonHrefLink'
import PageTitle from '../widgets/PageTitle'
import TableInfo from '../widgets/TableInfo'
import colors from '../../lib/colors'

export default {
  name: 'shot-list',
  props: [
    'entries',
    'isLoading',
    'isError',
    'validationColumns'
  ],

  components: {
    ButtonLink,
    ButtonHrefLink,
    PageTitle,
    RowActions,
    TableInfo,
    ValidationCell
  },

  computed: {
    ...mapGetters([
      'currentProduction',
      'isCurrentUserManager',
      'shotSearchText',
      'selectedTasks',
      'selectedValidations',
      'nbSelectedValidations',
      'nbSelectedTasks',
      'shotMap',
      'taskTypeMap'
    ]),

    isEmptyList () {
      return this.entries &&
             this.entries.length === 0 &&
             !this.isLoading &&
             !this.isError &&
             (!this.shotSearchText || this.shotSearchText.length === 0)
    },

    isSelectionActive () {
      return this.nbSelectedTasks !== 0 || this.nbSelectedValidations !== 0
    }
  },

  methods: {
    ...mapActions([
    ]),

    validationCellClicked (event) {
      console.log(event)
      let cellId = event.target.id
      if (!cellId || cellId.length === 0) cellId = event.target.parentNode.id
      if (!cellId || cellId.length === 0) {
        cellId = event.target.parentNode.parentNode.id
      }

      let columnId = cellId.split('_')[0]
      let shotId = cellId.split('_')[1]
      const shot = this.shotMap[shotId]
      const taskType = this.taskTypeMap[columnId]
      let task = shot.validations[taskType.name]
      const validationInfo = {
        entity: shot,
        column: taskType,
        task: task
      }

      if (this.isTaskSelected(task, columnId, shotId)) {
        this.onTaskUnselected(validationInfo)
      } else {
        this.onTaskSelected(validationInfo)
      }
    },

    isTaskSelected (task, columnId, shotId) {
      let isSelected = false
      if (task) {
        isSelected = task !== undefined &&
                     this.selectedTasks[task.id] !== undefined
      } else {
        const validationKey = `${columnId}_${shotId}`
        isSelected = this.selectedValidations[validationKey] !== undefined
      }
      return isSelected
    },

    onHeaderScroll (event, position) {
      this.$refs.tableWrapper.scrollLeft = position.scrollLeft
    },

    onTaskSelected (task) {
      this.$store.commit('ADD_SELECTED_TASK', task)
    },

    onTaskUnselected (task) {
      this.$store.commit('REMOVE_SELECTED_TASK', task)
    },

    onBodyScroll (event, position) {
      this.$refs.headerWrapper.style.left = `-${position.scrollLeft}px`
    },

    validationBackgroundColor: colors.validationBackgroundColor,
    validationTextColor: colors.validationTextColor
  }
}
</script>

<style scoped>
.project {
  min-width: 60px;
  max-width: 60px;
  width: 60px;
}

.actions {
  min-width: 100px;
}

th.actions {
  padding: 0.4em;
}

.name {
  min-width: 100px;
  max-width: 100px;
  width: 100px;
  font-weight: bold;
}

.episode {
  min-width: 100px;
  max-width: 100px;
  width: 100px;
}

.sequence {
  min-width: 100px;
  max-width: 100px;
  width: 100px;
  font-weight: bold;
}

.framein {
  min-width: 50px;
  max-width: 50px;
  width: 50px;
}

.frameout {
  min-width: 50px;
  max-width: 50px;
  width: 50px;
}

.description {
  min-width: 200px;
  max-width: 200px;
  width: 200px;
}

.validation {
  min-width: 120px;
  max-width: 120px;
  width: 120px;
  margin-right: 1em;
}

td.name {
  font-size: 1.2em;
}

td.sequence {
  font-size: 1.2em;
}

.canceled {
  text-decoration: line-through;
}

.thumbnail {
  min-width: 50px;
  max-width: 50px;
  width: 50px;
  padding: 0;
}

.thumbnail img {
  margin-top: 5px;
}

span.thumbnail-empty {
  display: block;
  width: 50px;
  height: 30px;
  background: #F3F3F3;
}

.info {
  margin-top: 2em;
}
</style>
