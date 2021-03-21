<template>
<div>
  <div
    class="episode-menu"
  >
    <div
      class="flexrow"
      @click="toggleEpisodeList"
    >
      <div
        class="selected-production-line flexrow-item"
      >
        {{ episode }}
      </div>
      <chevron-down-icon class="down-icon flexrow-item"/>
    </div>
    <div
      class="select-input"
      ref="select"
      v-if="showEpisodeList"
    >
      <div
        class="episode-line"
        v-for="episode in episodeList"
        @click="selectEpisode(episode)"
        :key="episode.value"
      >
        <router-link
          :to="{
            name: episode.value,
            params: {
              production_id: currentProduction.id
            }
          }"
        >
          {{ episode.label }}
        </router-link>
      </div>
    </div>
  </div>
  <combobox-mask
    :displayed="showEpisodeList"
    @click="toggleEpisodeList"
  />
</div>

</template>

<script>
import { mapGetters } from 'vuex'
import { ChevronDownIcon } from 'vue-feather-icons'

import ComboboxMask from '@/components/widgets/ComboboxMask'

export default {
  name: 'topbar-episode-menu',

  components: {
    ChevronDownIcon,
    ComboboxMask
  },

  data () {
    return {
      showEpisodeList: false
    }
  },

  props: {
    episodeList: {
      required: true,
      type: Array
    },
    episode: {
      default: 'Asset',
      type: String
    }
  },

  mounted () {
  },

  computed: {
    ...mapGetters([
      'currentProduction'
    ])
  },

  methods: {
    selectEpisode (episode) {
      this.$emit('input', episode.id)
      this.episode = episode.id
      this.showEpisodeList = false
    },

    toggleEpisodeList () {
      this.showEpisodeList = !this.showEpisodeList
    }
  }
}
</script>

<style lang="scss" scoped>
.dark {
  .select-input,
  .selected-episode-line,
  .episode-line,
  .episode-combo {
    background: $dark-grey-light;
    border-color: $dark-grey;
  }

  .episode-line:hover {
    background: $dark-purple;
  }
}

.episode-combo {
  background: $white;
  min-width: 300px;
  width: 300px;
  border: 1px solid $light-grey-light;
  user-select: none;
  cursor: pointer;
  border-radius: 3px;
  margin: 0;
  padding: 0.15em;
  position: relative;
}

.selected-episode-line {
  background: $white;
  padding: 0.4em;
  flex: 1;
}

.episode-line {
  background: $white;
  cursor: pointer;
  padding: 0.4em;
  margin: 0;

  &:hover {
    background: $purple;
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
