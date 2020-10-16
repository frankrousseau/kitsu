<template>
<div
  ref="model-viewer"
  id="model-viewer"
  :class="{
    light: light && !readOnly
  }"
>
</div>
</template>

<script>
import {
} from 'vue-feather-icons'
import {
  clearScene,
  loadObject,
  prepareScene
} from '../../../node_modules/js-3d-model-viewer/src/index'

export default {
  name: 'model-viewer',

  components: {
  },

  data () {
    return {
      isLoading: false
    }
  },

  props: {
    previewUrl: {
      default: '',
      type: String
    },
    previewDlPath: {
      default: '',
      type: String
    },
    light: {
      default: false,
      type: Boolean
    },
    readOnly: {
      default: false,
      type: Boolean
    },
    empty: {
      default: false,
      type: Boolean
    }
  },

  computed: {
    element () {
      return this.$refs['model-viewer']
    },

    container () {
      return this.$refs.container
    }
  },

  methods: {
    loadObject () {
      this.isLoading = true
      loadObject(this.scene, this.previewUrl, null, () => {
        this.isLoading = false
      })
    }
  },

  mounted () {
    setTimeout(() => {
      if (!this.empty) {
        this.scene = prepareScene(this.element)
        this.loadObject()
      }
    }, 100)
  },

  watch: {
    previewUrl () {
      if (!this.empty) {
        clearScene(this.scene)
        this.loadObject()
      }
    },

    light () {
      clearScene(this.scene)
      this.element.innerHTML = ''
      setTimeout(() => {
        if (!this.empty) {
          this.scene = prepareScene(this.element)
          loadObject(this.scene, this.previewUrl)
        }
      }, 100)
    }
  }
}
</script>

<style lang="scss" scoped>
#model-viewer {
  height: 500px;
  width: 100%;
  background: black;
}

#model-viewer.light {
  height: 200px;
}
</style>
