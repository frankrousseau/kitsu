<template>
<div ref="container" class="preview-player dark">

  <div class="preview">
    <video-player
      ref="video-player"
      class="flexrow-item video-player"
      :big="big"
      :is-comparing="isComparing"
      :is-drawing="isDrawing"
      :is-muted="isMuted"
      :is-repeating="isRepeating"
      :is-typing="isTyping"
      :light="light"
      :preview="currentPreview"
      :preview-to-compare-id="previewToCompareId"
      @duration-changed="changeMaxDuration"
      @time-update="updateTime"
      @play-ended="pause"
      @annotation-changed="(payload) => $emit('annotationchanged', payload)"
      v-show="isMovie"
    />

    <picture-viewer
      :preview="currentPreview"
      :light="light"
      :read-only="readOnly"
      :full-screen="fullScreen"
      ref="preview-picture"
      @annotation-changed="(payload) => $emit('annotationchanged', payload)"
      v-show="isPicture"
    />

    <model-viewer
      class="model-viewer"
      :preview-url="originalPath"
      :light="light"
      :empty="!is3DModel"
      v-show="is3DModel"
    />

    <pdf
      class="pdf-viewer"
      :src="originalPath"
      v-if="isPdf"
    />

    <a
      class="button mt2"
      ref="preview-file"
      :href="originalDlPath"
      v-if="isFile"
    >
      <download-icon class="icon" />
      <span class="text">
        {{ $t('tasks.download_pdf_file', {extension}) }}
      </span>
    </a>
  </div>

  <div class="button-bar" ref="button-bar">
    <div class="buttons flexrow pull-bottom">
      <div class="left flexrow" v-if="isMovie">
        <button-simple
          class="flexrow-item"
          :title="$t('playlists.actions.play')"
          icon="play"
          @click="onPlayPauseClicked"
          v-if="!isPlaying"
        />
        <button-simple
          class="flexrow-item"
          :title="$t('playlists.actions.pause')"
          icon="pause"
          @click="onPlayPauseClicked"
          v-else
        />

        <button-simple
          :active="isRepeating"
          :title="$t('playlists.actions.looping')"
          icon="repeat"
          @click="onRepeatClicked"
          v-if="fullScreen"
        />

        <button-simple
          class="flexrow-item"
          :title="$t('playlists.actions.unmute')"
          icon="soundoff"
          @click="onToggleSoundClicked"
          v-if="isMuted"
        />
        <button-simple
          class="flexrow-item"
          :title="$t('playlists.actions.mute')"
          icon="soundon"
          @click="onToggleSoundClicked"
          v-else
        />

        <span
          class="flexrow-item time-indicator"
          :title="$t('playlists.actions.current_time')"
        >
          {{ currentTime }}
        </span>
        <span
          class="flexrow-item time-indicator"
          v-if="!light || readOnly || fullScreen"
        >
        /
        </span>
        <span
          class="flexrow-item time-indicator"
          :title="$t('playlists.actions.max_duration')"
          v-if="!light || readOnly || fullScreen"
        >
         {{ maxDuration }}
        </span>

        <span
          class="flexrow-item time-indicator mr1"
          :title="$t('playlists.actions.frame_number')"
        >
          ({{ currentFrame }})
        </span>

        <button-simple
          class="ml1"
          :active="isComparing"
          icon="compare"
          :title="$t('playlists.actions.split_screen')"
          @click="onCompareClicked"
          v-if="taskTypeOptions.length > 0 && fullScreen"
        />

        <combobox
          class="comparison-combobox dark"
          :options="taskTypeOptions"
          :is-dark="true"
          :thin="true"
          v-model="taskTypeId"
          v-if="isComparing && (!light || fullScreen)"
        />
        <combobox
          class="comparison-combobox dark"
          :options="previewFileOptions"
          :is-dark="true"
          :thin="true"
          v-model="previewToCompareId"
          v-if="isComparing && (!light || fullScreen)"
        />
      </div>

      <div class="right flexrow">
        <div class="flexrow" v-if="isMovie || isPicture">
          <div class="flexrow flexrow-item" v-if="fullScreen">
            <span
              :class="{
                'previous-preview-file': true,
                'current-preview-file': previewFile.revision === preview.revision
              }"
              :key="`last-preview-${previewFile.id}`"
              @click="changeCurrentPreview(previewFile)"
              v-for="previewFile in lastPreviewFiles"
            >
              {{ previewFile.revision }}
            </span>
          </div>
          <button-simple
            class="flexrow-item"
            icon="undo"
            :title="$t('playlists.actions.annotation_undo')"
            v-if="!readOnly && fullScreen"
            @click="undoLastAction"
          />

          <button-simple
            class="flexrow-item"
            :title="$t('playlists.actions.annotation_redo')"
            icon="redo"
            v-if="!readOnly && fullScreen"
            @click="redoLastAction"
          />

          <button-simple
            class="flexrow-item"
            icon="remove"
            :title="$t('playlists.actions.annotation_delete')"
            @click="onDeleteClicked"
            v-if="!readOnly && fullScreen"
          />

          <transition name="slide">
            <div
              class="annotation-tools"
              v-show="isTyping && fullScreen"
            >
              <color-picker
                :isOpen="isShowingPalette"
                :color="this.textColor"
                :palette="this.palette"
                @TogglePalette="onPickColor"
                @change="onChangeTextColor"
              />
            </div>
          </transition>

          <button-simple
            class="flexrow-item"
            icon="type"
            :active="isTyping"
            :title="$t('playlists.actions.annotation_text')"
            @click="onTypeClicked"
            v-if="!readOnly && fullScreen"
          />

          <transition name="slide">
            <div
              class="annotation-tools"
              v-show="isDrawing && fullScreen"
            >
              <pencil-picker
                :isOpen="isShowingPencilPalette"
                :pencil="pencil"
                :sizes="this.pencilPalette"
                @toggle-palette="onPickPencil"
                @change="onChangePencil"
              />

              <color-picker
                :isOpen="isShowingPalette"
                :color="this.color"
                :palette="this.palette"
                @TogglePalette="onPickColor"
                @change="onChangeColor"
              />
            </div>
          </transition>

          <button-simple
            class="flexrow-item"
            icon="pencil"
            :active="isDrawing"
            :title="$t('playlists.actions.annotation_draw')"
            @click="onPencilAnnotateClicked"
            v-if="!readOnly && fullScreen"
          />
        </div>

        <a
          class="button flexrow-item"
          :href="originalPath"
          :title="$t('playlists.actions.see_original_file')"
          target="blank"
          v-if="!readOnly && isPicture"
        >
          <arrow-up-right-icon class="icon is-small" />
        </a>

        <div
          class="separator"
        >
        </div>

        <browsing-bar
          :current-index="currentIndex"
          :previews="previews"
          :read-only="readOnly"
          :light="light"
          :full-screen="fullScreen"
          @add-preview-clicked="$emit('add-preview')"
          @next-clicked="onNextClicked"
          @previous-clicked="onPreviousClicked"
          @remove-preview-clicked="onRemovePreviewClicked"
          v-if="currentPreview"
        />

        <div
          class="separator"
        >
        </div>

        <a
          class="button flexrow-item"
          :href="originalDlPath"
          :title="$t('playlists.actions.download_file')"
        >
          <download-icon class="icon is-small" />
        </a>

        <button-simple
          class="flexrow-item"
          :title="$t('playlists.actions.fullscreen')"
          icon="maximize"
          v-if="isFullScreenEnabled"
          @click="onFullscreenClicked"
        />
      </div>
    </div>
  </div>
</div>
</template>

<script>
import pdf from 'vue-pdf'
import { mapGetters } from 'vuex'
import { formatFrame, formatTime } from '@/lib/video'

import { annotationMixin } from '@/components/mixins/annotation_mixin'
import { domMixin } from '@/components/mixins/dom'

import {
  ArrowUpRightIcon,
  DownloadIcon
} from 'vue-feather-icons'
import ButtonSimple from '@/components/widgets/ButtonSimple'
import BrowsingBar from '@/components/previews/BrowsingBar'
import ColorPicker from '@/components/widgets/ColorPicker'
import Combobox from '@/components/widgets/Combobox'
import ModelViewer from '@/components/previews/ModelViewer'
import PencilPicker from '@/components/widgets/PencilPicker'
import PictureViewer from '@/components/previews/PictureViewer'
import VideoPlayer from '@/components/previews/VideoPlayer'

export default {
  name: 'preview-player',
  mixins: [annotationMixin, domMixin],

  components: {
    ArrowUpRightIcon,
    ButtonSimple,
    BrowsingBar,
    ColorPicker,
    Combobox,
    DownloadIcon,
    ModelViewer,
    pdf,
    PencilPicker,
    PictureViewer,
    VideoPlayer
  },

  props: {
    previews: {
      type: Array,
      default: () => []
    },
    entityPreviewFiles: {
      type: Object,
      default: () => {}
    },
    taskTypeMap: {
      type: Object,
      default: () => {}
    },
    light: {
      type: Boolean,
      default: false
    },
    readOnly: {
      type: Boolean,
      default: false
    },
    lastPreviewFiles: {
      type: Array,
      default: () => []
    },
    big: {
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      currentIndex: 1,
      fullScreen: false,
      color: '#ff3860',
      currentTime: '00:00.000',
      currentTimeRaw: 0,
      isComparing: false,
      isDrawing: false,
      isTyping: false,
      isLoading: false,
      isPlaying: false,
      isMuted: false,
      isRepeating: false,
      maxDuration: '00:00.000',
      palette: ['#ff3860', '#008732', '#5E60BA', '#f57f17'],
      pencil: 'big',
      pencilPalette: ['big', 'medium', 'small'],
      previewToCompareId: null,
      taskTypeId:
        this.entityPreviewFIles ? Object.keys(this.entityPreviewFiles)[0] : null,
      textColor: '#ff3860'
    }
  },

  mounted () {
    if (!this.container) return
    if (this.videoPlayer) this.configureVideo()
  },

  beforeDestroy () {
    if (this.container) {
      this.container.removeEventListener('keydown', this.onKeyDown)
    }
    window.removeEventListener('resize', this.onWindowResize)
  },

  computed: {
    ...mapGetters([
      'currentProduction'
    ]),

    currentFrame () {
      return formatFrame(this.currentTimeRaw, this.fps)
    },

    container () {
      return this.$refs.container
    },

    extension () {
      return this.currentPreview ? this.currentPreview.extension : ''
    },

    fps () {
      return this.currentProduction.fps || 24
    },

    originalPath () {
      if (this.currentPreview) {
        const previewId = this.currentPreview.id
        const extension = this.extension ? this.extension : 'png'
        const type = this.isMovie ? 'movies' : 'pictures'
        return `/api/${type}/originals/preview-files/${previewId}.${extension}`
      } else {
        return ''
      }
    },

    originalDlPath () {
      if (this.currentPreview) {
        const type = this.isMovie ? 'movies' : 'pictures'
        return `/api/${type}/originals/preview-files/` +
               `${this.currentPreview.id}/download`
      } else {
        return ''
      }
    },

    isPicture () {
      return ['gif', 'png', 'jpg', 'jpeg'].includes(this.extension)
    },

    isMovie () {
      return this.extension === 'mp4'
    },

    is3DModel () {
      return this.extension === 'obj'
    },

    isPdf () {
      return this.extension === 'pdf'
    },

    isFile () {
      return !this.isPicture && !this.isMovie && !this.is3DModel && !this.isPdf
    },

    isFullScreenEnabled () {
      return !!(
        document.fullscreenEnabled ||
        document.mozFullScreenEnabled ||
        document.msFullscreenEnabled ||
        document.webkitSupportsFullscreen ||
        document.webkitFullscreenEnabled ||
        document.createElement('video').webkitRequestFullScreen
      )
    },

    videoPlayer () {
      console.log(this.$refs)
      return this.$refs['video-player']
    },

    taskTypeOptions () {
      if (!this.entityPreviewFiles) return []
      const taskTypeIds = Object.keys(this.entityPreviewFiles)
      return taskTypeIds
        .filter((taskTypeId) => {
          if (this.entityPreviewFiles[taskTypeId].length > 1) {
            return true
          } else if (this.entityPreviewFiles[taskTypeId].length === 1) {
            return (
              this.entityPreviewFiles[taskTypeId][0].id !== this.currentPreview.id
            )
          } else {
            return false
          }
        })
        .map((taskTypeId) => {
          const taskType = this.taskTypeMap[taskTypeId]
          if (taskType) {
            return {
              label: taskType.name,
              value: taskType.id
            }
          } else {
            return {
              label: '',
              value: ''
            }
          }
        })
    },

    previewFileOptions () {
      let previewFiles = this.entityPreviewFiles[this.taskTypeId]
      if (previewFiles) {
        previewFiles = previewFiles.filter(p => p.id !== this.currentPreview.id)
        if (previewFiles && previewFiles.length > 0) {
          return previewFiles.map((previewFile) => {
            return {
              label: `v${previewFile.revision}`,
              value: previewFile.id
            }
          })
        } else {
          return []
        }
      } else {
        return []
      }
    },

    currentPreview () {
      if (this.previews &&
          this.previews.length > 0 &&
          this.currentIndex - 1 < this.previews.length) {
        return this.previews[this.currentIndex - 1]
      } else {
        return {}
      }
    }
  },

  methods: {
    formatFrame,

    formatTime,

    isFullScreen () {
      return !!(
        document.fullScreen ||
        document.webkitIsFullScreen ||
        document.mozFullScreen ||
        document.msFullscreenElement ||
        document.fullscreenElement
      )
    },

    updateTime (time) {
      this.currentTimeRaw = time
      this.currentTime = this.formatTime(this.currentTimeRaw)
    },

    changeMaxDuration (duration) {
      if (duration) {
        this.maxDuration = this.formatTime(duration)
      } else {
        this.maxDuration = '00:00.000'
      }
    },

    play () {
      this.isPlaying = true
      this.isDrawing = false
      if (this.videoPlayer) this.videoPlayer.play()
    },

    pause () {
      this.isPlaying = false
      if (this.videoPlayer) this.videoPlayer.pause()
    },

    goPreviousFrame () {
      this.videoPlayer.goPreviousFrame()
    },

    goNextFrame () {
      this.videoPlayer.goNextFrame()
    },

    exitFullScreen () {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen()
      } else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen()
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen()
      }
      this.container.setAttribute('data-fullscreen', !!false)
      this.isComparing = false
      this.fullScreen = false
    },

    setFullScreen () {
      if (this.container.requestFullscreen) {
        this.container.requestFullscreen()
      } else if (this.container.mozRequestFullScreen) {
        this.container.mozRequestFullScreen()
      } else if (this.container.webkitRequestFullScreen) {
        this.container.webkitRequestFullScreen()
      } else if (this.container.msRequestFullscreen) {
        this.container.msRequestFullscreen()
      }
      this.container.setAttribute('data-fullscreen', !!true)
      this.fullScreen = true
      this.$refs['button-bar'].focus()
    },

    onDeleteClicked () {
      this.deleteSelection()
    },

    deleteSelection () {
      if (this.isMovie) this.videoPlayer.deleteSelection()
    },

    onVideoEnd () {
      this.isPlaying = false
      if (this.isRepeating) {
        this.videoPlayer.currentTime = 0
        this.play()
      }
    },

    onPlayPauseClicked () {
      if (!this.isPlaying) {
        this.play()
      } else {
        this.pause()
      }
    },

    onRepeatClicked () {
      if (this.isRepeating) {
        this.isRepeating = false
      } else {
        this.isRepeating = true
      }
    },

    onToggleSoundClicked () {
      this.isMuted = !this.isMuted
    },

    onCompareClicked () {
      if (this.isComparing) {
        this.isComparing = false
      } else {
        this.isComparing = true
        this.isDrawing = false
      }
    },

    onFullscreenClicked () {
      if (this.isFullScreen()) {
        if (this.isMovie) this.videoPlayer.removeTypeArea()
        this.exitFullScreen()
      } else {
        if (this.isMovie) this.videoPlayer.addTypeArea()
        this.setFullScreen()
      }
    },

    onPencilAnnotateClicked () {
      if (this.isDrawing) {
        this.isDrawing = false
      } else {
        this.isTyping = false
        this.isDrawing = true
      }
    },

    onTypeClicked () {
      if (this.isTyping) {
        this.isTyping = false
      } else {
        this.isDrawing = false
        this.isTyping = true
      }
    },

    onWindowResize (callback) {
      const now = (new Date().getTime())
      this.lastCall = this.lastCall || 0
      if (now - this.lastCall > 600) {
        this.lastCall = now
        if (callback && typeof callback === 'function') callback()
      }
    },

    onKeyDown (event) {
      if (!['INPUT', 'TEXTAREA'].includes(event.target.tagName)) {
        if (event.keyCode === 46) {
          this.deleteSelection()
        } else if (event.keyCode === 37) {
          this.goPreviousFrame()
        } else if (event.keyCode === 39) {
          this.goNextFrame()
        } else if (event.keyCode === 32) {
          this.onPlayPauseClicked()
        } else if (event.keyCode === 68) {
          this.onPencilAnnotateClicked()
        } else if (event.ctrlKey && event.altKey && event.keyCode === 68) {
          this.onPencileAnnotateClicked()
        } else if (event.keyCode === 16) {
          this.onPlayPauseClicked()
        } else if (event.ctrlKey && event.keyCode === 90) {
          this.undoLastAction()
        } else if (event.altKey && event.keyCode === 82) {
          this.redoLastAction()
        }
      }
    },

    undoLastAction () {
      this.videoPlayer.undoLastAction()
    },

    redoLastAction () {
      this.videoPlayer.redoLastAction()
    },

    loadAnnotation (annotation) {
      return annotation
    },

    setDefaultComparisonTaskType () {
      const taskTypeIds = Object.keys(this.entityPreviewFiles)
      if (taskTypeIds && taskTypeIds.length > 0) {
        const taskTypeOption = this.taskTypeOptions.find((option) => {
          return this.entityPreviewFiles[option.value].findIndex(
            p => p.id === this.currentPreview.id
          ) >= 0
        })
        if (taskTypeOption) {
          this.taskTypeId = taskTypeOption.value
        } else if (this.taskTypeOptions.length > 0) {
          this.taskTypeId = this.taskTypeOptions[0].value
        }

        if (this.taskTypeId) this.setDefaultComparisonPreview()
      } else {
        this.previewToCompareId = null
      }
    },

    setDefaultComparisonPreview () {
      let previewFiles = this.entityPreviewFiles[this.taskTypeId]
      if (previewFiles) {
        previewFiles = previewFiles.filter(p => p.id !== this.currentPreview.id)
        if (previewFiles.length > 0) {
          this.previewToCompareId = previewFiles[0].id
        } else {
          this.previewToCompareId = null
        }
      } else {
        this.previewToCompareId = null
      }
    },

    changeCurrentPreview (previewFile) {
      this.$emit('change-current-preview', previewFile)
    },

    onAddPreviewClicked () {
      this.$emit('add-preview')
    },

    onRemovePreviewClicked () {
      this.$emit('remove-extra-preview', this.currentPreview)
    },

    onPreviousClicked () {
      if (this.currentIndex > 1) {
        this.currentIndex--
      } else {
        this.currentIndex = this.previews.length
      }
    },

    onNextClicked () {
      if (this.currentIndex < this.previews.length) {
        this.currentIndex++
      } else {
        this.currentIndex = 1
      }
    },

    displayFirst () {
      if (this.currentIndex > 1) {
        this.currentIndex = 1
      }
    },

    displayLast () {
      this.currentIndex = this.previews.length
    },

    configureVideo () {
      this.isPlaying = false
      this.isMuted = false
      this.isRepeating = false
      /*
      this.container.addEventListener('keydown', (event) => {
        this.pauseEvent(event)
        return false
      })
      */
      this.container.addEventListener('keydown', this.onKeyDown, false)
      window.addEventListener('resize', this.onWindowResize)
    }
  },

  watch: {
    preview () {
      if (this.videoPlayer) {
        this.configureVideo()
        this.maxDuration = '00:00.000'
        this.isDrawing = false
        this.pause()
        if (this.isComparing) this.isComparing = false
        this.setDefaultComparisonTaskType()
      }
    },

    previewToCompareId () {
      if (this.isComparing) {
        this.pause()
        const currentTime = this.videoPlayer.currentTime
        const comparisonVideo = document.getElementById('comparison-movie')
        if (comparisonVideo) comparisonVideo.currentTime = currentTime
      }
    },

    taskTypeId () {
      this.setDefaultComparisonPreview()
    },

    light () {
      this.onWindowResize()
    },

    currentIndex () {
      console.log(this.preview)
      console.log(this.entityPreviewFiles)
    }
  }
}
</script>

<style lang="scss" scoped>
.container {
}

.loading-background {
  width: 100%;
  height: 100%;
  background: black;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.spinner {
  margin: auto;
}

.icon {
  height: 20px;
}

.smaller {
  height: 16px;
}

.right {
  margin-left: auto;
}

.video-player {
  display: flex;
  flex-direction: column;
  align-content: flex-end;
  height: 100%;
}

.video-wrapper {
  flex: 1;
  display: flex;
  background: black;
  align-items: center;
  justify-content: center;
  text-align: center;
  margin: auto;
  width: 100%;
  position: relative;
}

.annotation-movie {
  margin: auto;
  width: 100%;
}

.time-indicator {
  color: $light-grey;
  padding-left: 0.8em;
  margin-right: 0;
}

.canvas-wrapper {
  margin: auto;
  position: absolute;
  left: 0;
  z-index: 300;
}

.video-player {
  width: 100%;
  text-align: center;
  background: #36393F;
}

.buttons {
  background: #36393F;
  height: 32px;
  border-bottom-left-radius: 5px;
  border-bottom-right-radius: 5px;
}

.buttons .button:first-child {
  border-bottom-left-radius: 5px;
}
.buttons .button:last-child {
  border-bottom-right-radius: 5px;
}

.buttons .button {
  background: transparent;
  border-radius: 0;
  color: #BBB;
  border: 0;
  margin: 0;
  transition: all 0.3s ease;
}

.buttons .button.active,
.buttons .button:hover {
  color: #43B581;
}

.buttons .button:hover {
  border-radius: 5px;
  transform: scale(1.2);
}

.comparison-combobox {
  margin-bottom: 0;
}

.buttons .comparison-button {
  margin-left: 1em;
}

.previous-preview-file {
  padding: 1px 8px;
  margin-right: 0.4em;
  border: 1px solid $grey;
  border-radius: 50%;
  cursor: pointer;
  color: $grey;
}

.current-preview-file {
  padding: 1px 8px;
  margin-right: 0.4em;
  border: 1px solid $grey;
  border-radius: 50%;
  cursor: pointer;
  color: white;
  background: $purple-strong;
  transition: 0.3s background ease;
}

.annotation-tools {
  align-items: stretch;
  display: flex;
  height: 33px;
  background: $dark-grey;
}

.slide-enter-active {
  transition: all .3s ease;
}

.slide-leave-active {
  transition: all .3s ease;
}

.slide-enter, .slide-leave-to {
  transform: translateX(100%);
}

.buttons .button.ml1 {
  margin-left: 1em;
}

.video-player {
  background: $dark-grey-stronger;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
}

.preview-player {
  background: $dark-grey-light;
  display: flex;
  flex-direction: column;
  border-radius: 5px;
  box-shadow: 0px 0px 4px #0007;
  min-height: 200px;

  .preview {
    align-items: center;
    box-shadow: inset 4px 2px 20px 4px #000A;
    display: flex;
    flex: 1;
    justify-content: center;

    .button {
      padding: 1.5em;
      transition: background 0.3s ease;

      &:hover {
        background: $dark-grey-lightest;
      }
    }
  }
}
</style>
