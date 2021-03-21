<template>
<div>
  <div
    class="production-menu"
  >
    <div
      class="flexrow"
      @click="toggleProductionList"
    >
      <div
        class="selected-production-line flexrow-item"
      >
        <production-name
          :production="currentProduction"
          :no-link="true"
          :size="25"
          v-if="currentProduction"
        />
      </div>
      <chevron-down-icon class="down-icon flexrow-item"/>
    </div>
    <div
      class="select-input"
      ref="select"
      v-if="showProductionList"
    >
      <div
        class="production-line"
        v-for="production in productionList.filter(p => p.id !== currentProduction.id)"
        @click="selectProduction(production)"
        :key="production.id"
      >
        <router-link
          :to="getProductionPath(production)"
        >
        <production-name
          class="link"
          :size="25"
          :no-link="true"
          :production="production"
        />
        </router-link>
      </div>
    </div>
  </div>
  <combobox-mask
    :displayed="showProductionList"
    @click="toggleProductionList"
  />
</div>

</template>

<script>
import { mapGetters } from 'vuex'
import { ChevronDownIcon } from 'vue-feather-icons'

import ComboboxMask from '@/components/widgets/ComboboxMask'
import ProductionName from '@/components/widgets/ProductionName'

export default {
  name: 'combobox-production',

  components: {
    ChevronDownIcon,
    ComboboxMask,
    ProductionName
  },

  data () {
    return {
      showProductionList: false
    }
  },

  props: {
    productionList: {
      required: true,
      type: Array
    },
    section: {
      default: 'assets',
      type: String
    },
    episodeId: {
      default: '',
      type: String
    }
  },

  mounted () {
  },

  computed: {
    ...mapGetters([
      'currentProduction',
      'openProductions'
    ])
  },

  methods: {
    selectProduction (production) {
      this.$emit('input', production.id)
      this.value = production.id
      this.showProductionList = false
    },

    toggleProductionList () {
      this.showProductionList = !this.showProductionList
    },

    getProductionPath (production) {
      console.log(this.section)
      const route = {
        name: this.section,
        params: {
          production_id: production.id
        }
      }

      if (this.episodeId) {
        route.params.episode_id = this.episodeId
        route.name = 'episode-' + route.name
      }

      if (['assets', 'shots'].includes(this.section)) {
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
  .selected-production-line,
  .production-line,
  .production-combo {
    background: $dark-grey-light;
    border-color: $dark-grey;
  }

  .production-line:hover {
    background: $dark-purple;
  }
}

.selected-production-line {
  padding: 0.4em;
  cursor: pointer;
  flex: 1;
}

.production-line {
  background: $white;
  padding: 0.2em;
  cursor: pointer;
  padding: 0.4em;
  margin: 0;

  .link {
    color: $black;
    border-radius: 5px;
    padding: 0.2em;
  }

  &:hover {
    .link {
      background: #EEE;
    }
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
  width: 300px;
  position: absolute;
  border: 1px solid $light-grey-light;
  z-index: 300;
  margin-left: -1px;
  max-height: 200px;
  overflow-y: auto;
  top: 60px;
}

.production-menu {
  cursor: pointer;
}
</style>
