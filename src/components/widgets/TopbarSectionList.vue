<template>
<div>
  <div
    class="section-menu"
  >
    <div
      class="flexrow"
      @click="toggleSectionList"
    >
      <div
        class="selected-production-line flexrow-item"
      >
        {{ sectionList.find(s => s.value === localSection).label }}
      </div>
      <chevron-down-icon class="down-icon flexrow-item"/>
    </div>
    <div
      class="select-input"
      ref="select"
      v-if="showSectionList"
    >
      <div
        class="section-line"
        v-for="section in sectionList"
        @click="selectSection(section)"
        :key="section.value"
      >
        <router-link
          :to="getProductionPath(section)"
        >
          {{ section.label }}
        </router-link>
      </div>
    </div>
  </div>
  <combobox-mask
    :displayed="showSectionList"
    @click="toggleSectionList"
  />
</div>

</template>

<script>
import { mapGetters } from 'vuex'
import { ChevronDownIcon } from 'vue-feather-icons'

import ComboboxMask from '@/components/widgets/ComboboxMask'

export default {
  name: 'topbar-section-menu',

  components: {
    ChevronDownIcon,
    ComboboxMask
  },

  data () {
    return {
      localSection: 'assets',
      showSectionList: false
    }
  },

  props: {
    sectionList: {
      required: true,
      type: Array
    },
    section: {
      default: 'assets',
      type: String
    }
  },

  mounted () {
    this.localSection = this.section
  },

  computed: {
    ...mapGetters([
      'currentProduction'
    ])
  },

  methods: {
    selectSection (section) {
      this.$emit('input', section.value)
      this.localSection = section.value
      this.showSectionList = false
    },

    toggleSectionList () {
      this.showSectionList = !this.showSectionList
    },

    getProductionPath (section) {
      const route = {
        name: section.value,
        params: {
          production_id: this.currentProduction.id
        }
      }

      if (this.episodeId) {
        route.params.episode_id = this.episodeId
        route.name = 'episode-' + route.name
      }

      if (['assets', 'shots'].includes(section.value)) {
        route.query = { search: '' }
      }

      return route
    }
  }
}
</script>

<style lang="scss" scoped>
.dark {
  .select-input,
  .selected-section-line,
  .section-line,
  .section-combo {
    background: $dark-grey-light;
    border-color: $dark-grey;
  }

  .section-line:hover {
    background: $dark-purple;
  }
}

.selected-section-line {
  background: $white;
  padding: 0.4em;
  flex: 1;
  cursor: pointer;
}

.section-line {
  background: $white;
  cursor: pointer;
  padding: 0.4em;
  margin: 0;
  border-radius: 5px;

  a {
    color: $black;
    padding: 0.2em ;
    padding-right: 0.8em;
    display: inline-block;
    width: 100%;
  }

  &:hover {
    background: #EEE;
  }
}

.down-icon {
  width: 15px;
  min-width: 15px;
  margin-right: 0.4em;
  color: $green;
  cursor: pointer;
}

.select-input {
  background: $white;
  position: absolute;
  border: 1px solid $light-grey-light;
  text-align: left;
  margin-left: -10px;
  max-height: 200px;
  overflow-y: auto;
  padding: 10px;
  top: 60px;
  z-index: 300;
}
</style>
