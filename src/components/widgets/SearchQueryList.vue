<template>
  <div class="search-queries">
    <span
      class="tag folder mr1"
      @click="editGroup()"
      :title="$t('main.filter_group_add')"
      v-if="isGroupEnabled"
    >
      <folder-plus-icon :size="12" />
    </span>
    <span
      class="tag group"
      :class="{
        open: toggleGroupId === group.id,
        'is-shared': group.is_shared
      }"
      :key="`group-${group.id}`"
      :style="{
        backgroundColor: `${group.color}23`
      }"
      @click="toggleFilterGroup(group)"
      v-for="group in userFilterGroups"
      v-if="isGroupEnabled"
    >
      <div class="group-header">
        <span
          class="dot"
          :style="{ borderColor: getDepartment(group).color }"
          :title="getDepartment(group).name"
          v-if="group.is_shared && group.department_id"
        ></span>
        <span>{{ group.name }}</span>
        <chevron-down-icon
          class="chevron ml05"
          :size="12"
          v-if="toggleGroupId !== group.id"
        />
        <chevron-up-icon class="chevron ml05" :size="12" v-else />
        <button
          class="edit"
          :style="{ backgroundColor: `${group.color}53` }"
          @click.stop="editGroup(group)"
          v-if="!group.is_shared || isCurrentUserManager"
        >
          <edit2-icon :size="8" />
        </button>
        <button
          class="del"
          :style="{ backgroundColor: `${group.color}53` }"
          @click.stop="removeGroup(group)"
          v-if="
            !group.queries.length && (!group.is_shared || isCurrentUserManager)
          "
        >
          <trash2-icon :size="8" />
        </button>
      </div>
      <div
        :ref="`group-${group.id}`"
        class="group-list"
        v-if="toggleGroupId === group.id"
      >
        <span class="tag empty" v-if="!group.queries.length">
          <em>{{ $t('main.filter_group_empty') }}</em>
        </span>
        <span
          class="tag"
          :class="{
            'is-shared': searchQuery.is_shared
          }"
          :key="searchQuery.id"
          :style="{ backgroundColor: `${group.color}23` }"
          :title="getSearchQueryTitle(searchQuery)"
          @click="changeSearch(searchQuery)"
          v-for="searchQuery in group.queries"
          v-else
        >
          <span>
            {{ searchQuery.name }}
          </span>
          <button
            class="edit"
            :style="{
              backgroundColor: `${group.color}53`
            }"
            @click.stop="editSearch(searchQuery)"
            v-if="!searchQuery.is_shared || isCurrentUserManager"
          >
            <edit2-icon :size="8" />
          </button>
          <button
            class="del"
            :style="{ backgroundColor: `${group.color}53` }"
            @click.stop="removeSearch(searchQuery)"
            v-if="!searchQuery.is_shared || isCurrentUserManager"
          >
            <trash2-icon :size="8" />
          </button>
        </span>
      </div>
    </span>
    <span
      class="tag"
      :class="{
        'is-shared': searchQuery.is_shared
      }"
      :key="searchQuery.id"
      :title="getSearchQueryTitle(searchQuery)"
      @click="changeSearch(searchQuery)"
      v-for="searchQuery in userFilters"
    >
      <span
        class="dot"
        :style="{ borderColor: getDepartment(searchQuery).color }"
        :title="getDepartment(searchQuery).name"
        v-if="searchQuery.is_shared && searchQuery.department_id"
      ></span>
      {{ searchQuery.name }}
      <button
        class="edit"
        @click.stop="editSearch(searchQuery)"
        v-if="!searchQuery.is_shared || isCurrentUserManager"
      >
        <edit2-icon :size="8" />
      </button>
      <button
        class="del"
        @click.stop="removeSearch(searchQuery)"
        v-if="!searchQuery.is_shared || isCurrentUserManager"
      >
        <trash2-icon :size="8" />
      </button>
    </span>
    <edit-search-filter-modal
      :active="modals.edit"
      :group-options="groupOptions"
      :is-loading="loading.edit"
      :is-error="errors.edit"
      :is-group-enabled="isGroupEnabled"
      :search-query-to-edit="searchQueryToEdit"
      @cancel="modals.edit = false"
      @confirm="confirmEditSearch"
    />
    <edit-search-filter-group-modal
      :active="modals.group"
      :is-loading="loading.group"
      :is-error="errors.group"
      :group-to-edit="groupToEdit"
      @cancel="modals.group = false"
      @confirm="confirmEditFilterGroup"
    />
  </div>
</template>

<script>
/*
 * This component displays a list of queries available to users to filter list
 * results. It allows to modify each query too.
 */
import {
  ChevronDownIcon,
  ChevronUpIcon,
  Edit2Icon,
  FolderPlusIcon,
  Trash2Icon
} from 'lucide-vue'
import { mapActions, mapGetters } from 'vuex'

import { sortByName } from '@/lib/sorting'
import stringHelpers from '@/lib/string'

import EditSearchFilterModal from '@/components/modals/EditSearchFilterModal.vue'
import EditSearchFilterGroupModal from '@/components/modals/EditSearchFilterGroupModal.vue'

export default {
  name: 'search-query-list',

  components: {
    ChevronDownIcon,
    ChevronUpIcon,
    Edit2Icon,
    EditSearchFilterModal,
    EditSearchFilterGroupModal,
    FolderPlusIcon,
    Trash2Icon
  },

  props: {
    queries: {
      type: Array,
      default: () => []
    },
    groups: {
      type: Array,
      default: () => []
    },
    isGroupEnabled: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      required: true
    }
  },

  data() {
    return {
      groupToEdit: {},
      searchQueryToEdit: {},
      errors: {
        edit: false,
        group: false
      },
      loading: {
        edit: false,
        group: false
      },
      modals: {
        edit: false,
        group: false
      },
      toggleGroupId: null
    }
  },

  computed: {
    ...mapGetters([
      'currentProduction',
      'departmentMap',
      'isCurrentUserManager',
      'personMap'
    ]),

    sortedFilters() {
      return sortByName([...this.queries])
    },

    userFilters() {
      return this.sortedFilters
        .filter(query => !query.search_filter_group_id)
        .sort((a, b) => {
          if (a.is_shared && !b.is_shared) {
            return -1
          } else if (!a.is_shared && b.is_shared) {
            return 1
          } else {
            return 0
          }
        })
    },

    userFilterGroups() {
      return sortByName([...this.groups]).map(group => {
        return {
          ...group,
          queries: this.sortedFilters.filter(
            query => query.search_filter_group_id === group.id
          )
        }
      })
    },

    groupOptions() {
      return [
        { label: '', value: null },
        ...this.userFilterGroups.map(group => ({
          label: group.name,
          value: group.id,
          is_shared: group.is_shared
        }))
      ]
    }
  },

  methods: {
    ...mapActions([
      'removeAssetSearchFilterGroup',
      'removeBreakdownSearchFilterGroup',
      'removeShotSearchFilterGroup',
      'saveAssetSearchFilterGroup',
      'saveBreakdownSearchFilterGroup',
      'saveShotSearchFilterGroup',
      'updateSearchFilter',
      'updateSearchFilterGroup'
    ]),

    changeSearch(searchQuery) {
      this.$emit('change-search', searchQuery)
    },

    editGroup(group = {}) {
      this.groupToEdit = group
      this.modals.group = true
    },

    editSearch(searchQuery) {
      this.searchQueryToEdit = searchQuery
      this.modals.edit = true
    },

    async confirmEditFilterGroup(filterGroup) {
      try {
        this.loading.group = true
        this.errors.group = false
        filterGroup.project_id = this.currentProduction
          ? this.currentProduction.id
          : null
        if (!filterGroup.id) {
          await this[
            `save${stringHelpers.capitalize(this.type)}SearchFilterGroup`
          ](filterGroup)
        } else {
          await this.updateSearchFilterGroup(filterGroup)
        }
        this.modals.group = false
      } catch (err) {
        console.error(err)
        this.errors.group = true
      } finally {
        this.loading.group = false
      }
    },

    async confirmEditSearch(searchFilter) {
      try {
        this.loading.edit = true
        this.errors.edit = false
        searchFilter.project_id = this.currentProduction
          ? this.currentProduction.id
          : null
        await this.updateSearchFilter(searchFilter)
        this.modals.edit = false
      } catch (err) {
        console.error(err)
        this.errors.edit = true
      } finally {
        this.loading.edit = false
      }
    },

    closeFilterGroupModal() {
      this.modals.group = false
    },

    removeSearch(searchQuery) {
      this.$emit('remove-search', searchQuery)
    },

    async removeGroup(filterGroup) {
      try {
        await this[
          `remove${stringHelpers.capitalize(this.type)}SearchFilterGroup`
        ](filterGroup)
      } catch (err) {
        console.error(err)
      }
    },

    toggleFilterGroup(group) {
      this.toggleGroupId = this.toggleGroupId !== group.id ? group.id : null
    },

    getSearchQueryTitle(searchQuery) {
      if (searchQuery.is_shared) {
        let title = 'Shared by '
        const person = this.personMap.get(searchQuery.person_id)
        if (person) {
          title += person.full_name
        }
        return title
      } else {
        return null
      }
    },

    getDepartment(group) {
      return this.departmentMap.get(group.department_id)
    }
  }
}
</script>

<style lang="scss" scoped>
.dark {
  .search-queries .del,
  .search-queries .edit {
    background: $dark-grey-light;
    color: white;
  }
}

.tag {
  border-radius: 1em;
  margin-left: 0;
  cursor: pointer;
}

.search-queries .group {
  position: relative;

  &.open {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }

  .chevron {
    position: relative;
    top: 3px;
  }

  .group-list {
    align-items: flex-start;
    background-color: var(--background-alt);
    border-bottom-left-radius: 1em;
    border-bottom-right-radius: 1em;
    display: flex;
    flex-direction: column;
    left: 0;
    max-height: 200px;
    overflow-y: auto;
    padding: 0.5rem 0;
    position: absolute;
    top: 100%;
    z-index: 1000;

    .tag {
      margin: 0 0.5em;
    }
    .tag + .tag {
      margin-top: 0.5em;
    }
  }
}

.search-queries .tag {
  margin: 0 1em 0.2em 0;

  &.empty {
    background-color: transparent;
  }
}

.search-queries .tag:hover {
  transform: scale(1.1);
}

.search-queries .group.tag.open .tag:hover {
  transform: scale(1.03);
}

.search-queries .group.tag:hover, // avoid bug  (overflow)
.search-queries .tag.empty:hover {
  transform: none;
}

.search-queries .del {
  display: none;
}

.search-queries .tag:hover .del,
.search-queries .tag:hover .edit {
  display: inline-block;
}

.search-queries .group.tag:hover .del,
.search-queries .group.tag:hover .edit {
  display: none;
}

.search-queries .group.tag.open .group-header:hover .del,
.search-queries .group.tag.open .group-header:hover .edit {
  display: inline-block;
}

.search-queries .group.tag .tag:hover .del,
.search-queries .group.tag .tag:hover .edit {
  display: inline-block;
}

.search-queries .del:hover,
.search-queries .edit:hover {
  background: $dark-grey-lighter;
}

.search-queries .edit,
.search-queries .del {
  background: $light-grey;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: none;
  height: 14px;
  width: 14px;
  line-height: 8px;
}

.search-queries .edit {
  margin-left: 1em;
  margin-right: 0;
}

.search-queries .del {
  margin-left: 0.5em;
}

.tag.is-shared {
  border: 1px solid $blue;
}

.dot {
  display: inline-block;
  border: 4px solid;
  border-radius: 50%;
  margin-right: 0.5em;
}
</style>
