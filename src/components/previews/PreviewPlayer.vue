<template>
<div ref="container" class="preview-player dark">

  <div class="preview">
    <div class="canvas-wrapper" ref="canvas-wrapper">
      <canvas
        id="annotation-canvas"
        ref="annotation-canvas"
        class="canvas"
      >
      </canvas>
    </div>

    <video-player
      ref="video-player"
      class="video-player"
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
      v-show="isMovie"
    />

    <picture-viewer
      ref="picture-player"
      :preview="currentPreview"
      :default-height="defaultHeight"
      :big="big"
      :light="light"
      :read-only="readOnly"
      :full-screen="fullScreen"
      :is-drawing="isDrawing"
      :is-typing="isTyping"
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
                'current-preview-file': previewFile.revision === currentPreview.revision
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

        <div
          class="separator"
          v-if="!readOnly && fullScreen"
        >
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
          v-if="!fullScreen || (fullScreen && previews.length > 1)"
        >
        </div>

        <browsing-bar
          :current-index="currentIndex"
          :previews="previews"
          :read-only="readOnly"
          :light="light"
          :full-screen="fullScreen"
          @add-preview-clicked="$emit('add-extra-preview')"
          @next-clicked="onNextClicked"
          @previous-clicked="onPreviousClicked"
          @remove-preview-clicked="onRemovePreviewClicked"
          v-if="currentPreview"
        />

        <div
          class="separator"
          v-if="!fullScreen || (fullScreen && previews.length > 1)"
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
import { fabric } from 'fabric'
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
      annotations: [],
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
    this.configureEvents()
    if (this.isVideo) this.configureVideo()
  },

  beforeDestroy () {
    if (this.container) {
      this.container.removeEventListener('keydown', this.onKeyDown)
    }
    window.removeEventListener('resize', this.onWindowResize)
    document.removeEventListener(
      'fullscreenchange', this.onExitFullScreen)
    document.removeEventListener(
      'mozfullscreenchange', this.onExitFullScreen)
    document.removeEventListener(
      'MSFullscreenChange', this.onExitFullScreen)
    document.removeEventListener(
      'webkitfullscreenchange', this.onExitFullScreen)
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
      return this.$refs['video-player']
    },

    picturePlayer () {
      return this.$refs['picture-player']
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
    },

    defaultHeight () {
      if (this.isFullScreen()) {
        return screen.height + 60
      } else {
        const bigHeight = screen.height > 900 ? 470 : 300
        return screen.width > 1300 && (
          !this.light || this.big
        ) ? bigHeight : 170
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
      this.fixCanvasSize()
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
      this.fixCanvasSize()
    },

    onDeleteClicked () {
      this.deleteSelection()
    },

    deleteSelection () {
      if (this.isMovie) this.videoPlayer.deleteSelection()
      if (this.isPicture) this.picturePlayer.deleteSelection()
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
        this.removeTypeArea()
        this.exitFullScreen()
      } else {
        this.addTypeArea()
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

    /*
    saveAnnotations () {
      const currentTime = roundToFrame(this.video.currentTime, this.fps) || 0
      const annotation = this.getAnnotation(currentTime)
      const annotations = this.getNewAnnotations(currentTime, annotation)
      if (!this.readOnly) {
        this.$emit('annotation-changed', {
          preview: this.preview,
          annotations: annotations
        })
      }
    },

    loadAnnotation (annotation) {
      if (!annotation) {
        console.error('Annotations are malformed and cannot be loaded.')
        return
      }
      let currentTime = annotation.time || 0
      currentTime = roundToFrame(currentTime, this.fps)
      this.video.pause()

      if (!this.fabricCanvas) this.setupFabricCanvas()
      this.resetCanvasSize()

      this.video.currentTime = currentTime
      this.fabricCanvas.isDrawingMode = false
      // this.isDrawing = false

      this.clearCanvas()

      let scaleMultiplierX = 1
      let scaleMultiplierY = 1
      if (annotation.width) {
        scaleMultiplierX = this.fabricCanvas.width / annotation.width
        scaleMultiplierY = this.fabricCanvas.width / annotation.width
      }
      if (annotation.height) {
        scaleMultiplierY = this.fabricCanvas.height / annotation.height
      }

      annotation.drawing.objects.forEach((obj) => {
        const base = {
          left: obj.left * scaleMultiplierX,
          top: obj.top * scaleMultiplierY,
          fill: 'transparent',
          stroke: obj.stroke,
          strokeWidth: obj.strokeWidth,
          radius: obj.radius * scaleMultiplierX,
          width: obj.width,
          height: obj.height,
          scaleX: obj.scaleX * scaleMultiplierX,
          scaleY: obj.scaleY * scaleMultiplierY
        }
        if (obj.type === 'path') {
          let strokeMultiplier = 1
          if (obj.canvasWidth) {
            strokeMultiplier = annotation.width / this.fabricCanvas.width
          }
          const path = new fabric.Path(
            obj.path,
            {
              ...base,
              strokeWidth: obj.strokeWidth * strokeMultiplier,
              canvasWidth: obj.canvasWidth
            }
          )
          path.setControlsVisibility({
            mt: false,
            mb: false,
            ml: false,
            mr: false,
            bl: false,
            br: false,
            tl: false,
            tr: false,
            mtr: false
          })
          this.fabricCanvas.add(path)
        } else if ((obj.type === 'i-text') || (obj.type === 'text')) {
          const text = new fabric.Text(
            obj.text,
            {
              ...base,
              fill: obj.fill,
              left: obj.left * scaleMultiplierX,
              top: obj.top * scaleMultiplierY,
              fontFamily: obj.fontFamily,
              fontSize: obj.fontSize,
              width: obj.width * scaleMultiplierX
            }
          )
          this.fabricCanvas.add(text)
        }
      })
    },

    reloadAnnotations () {
      this.annotations = []
      if (this.preview.annotations) {
        const annotations = []
        this.preview.annotations.forEach(a => annotations.push({ ...a }))
        this.annotations = annotations.sort((a, b) => {
          return a.time < b.time
        }) || []
      } else {
        this.annotations = []
      }
      return this.annotations
    },

    onWindowResize (callback) {
      const now = (new Date().getTime())
      this.lastCall = this.lastCall || 0
      if (now - this.lastCall > 600) {
        this.lastCall = now
        if (callback && typeof callback === 'function') callback()
      }
    },
    */

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
        } else if (event.keyCode === 27) {
          if (this.picturePlayer) {
          }
        }
      }
    },

    undoLastAction () {
      if (this.isMovie) this.videoPlayer.undoLastAction()
      if (this.isPicture) this.picturePlayer.undoLastAction()
    },

    redoLastAction () {
      if (this.isMovie) this.videoPlayer.redoLastAction()
      if (this.isPicture) this.picturePlayer.redoLastAction()
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
      console.log('remove-clicked')
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
      if (this.currentIndex > 1) this.currentIndex = 1
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
    },

    configureEvents () {
      this.container.addEventListener('keydown', this.onKeyDown, false)
      window.addEventListener('resize', this.onWindowResize)
      document.addEventListener('fullscreenchange', this.onExitFullScreen, false)
      document.addEventListener('mozfullscreenchange', this.onExitFullScreen, false)
      document.addEventListener('MSFullscreenChange', this.onExitFullScreen, false)
      document.addEventListener('webkitfullscreenchange', this.onExitFullScreen, false)
    },

    onExitFullScreen () {
      if (!document.webkitIsFullScreen && !document.mozFullScreen && document.msFullscreenElement === null) {
        this.fullScreen = false
      }
    },

    setupFabricCanvas () {
      const dimensions = this.getDimensions()
      const width = dimensions.width
      const height = dimensions.height
      const fabricCanvas = new fabric.Canvas('annotation-canvas', {
        fireRightClick: true
      })

      this.container.style.height = this.getDefaultHeight() + 'px'
      fabricCanvas.setDimensions({
        width: width,
        height: height
      })

      fabricCanvas.freeDrawingBrush.color = this.color
      fabricCanvas.freeDrawingBrush.width = 4

      fabricCanvas.off('object:added', this.stackAddAction)
      fabricCanvas.on('object:added', this.stackAddAction)
      fabricCanvas.off('object:moved', this.saveAnnotations)
      fabricCanvas.on('object:moved', this.saveAnnotations)
      fabricCanvas.on('mouse:up', () => {
        this.$refs.loupe.style.display = 'none'
        this.$options.loupe = false
        if (this.isDrawing) {
          this.clearUndoneStack()
          this.saveAnnotations()
        }
      })
      fabricCanvas.on('mouse:move', this.onCanvasMouseMoved)
      fabricCanvas.on('mouse:down', this.onCanvasClicked)
      this.fabricCanvas = fabricCanvas
    },

    fixCanvasSize () {
      const width = 0
      const height = 0
      if (this.fabricCanvas) {
        this.fabricCanvas.setDimensions({ width, height })
        const containerWidth = this.container.offsetWidth
        const margin = Math.round((containerWidth - width) / 2)
        if (this.canvasWrapper) {
          this.canvasWrapper.style.left = margin + 'px'
          this.canvasWrapper.style.width = width + 'px'
          this.canvasWrapper.style.height = height + 'px'
          setTimeout(() => {
            this.fabricCanvas.calcOffset()
            this.fabricCanvas.setDimensions({ width, height })
          }, 10)
        }
      }
    },

    onChangeColor (newValue) {
      this.color = newValue
      this.fabricCanvas.freeDrawingBrush.color = this.color
      this.isShowingPalette = false
    },

    reloadAnnotations () {
      this.annotations = []
      if (this.preview.annotations) {
        const annotations = []
        this.preview.annotations.forEach(a => annotations.push({ ...a }))
        this.annotations = annotations.sort((a, b) => {
          return a.time < b.time
        }) || []
      } else {
        this.annotations = []
      }
      return this.annotations
    }
  },

  watch: {
    preview () {
      if (this.isMovie) {
        this.configureVideo()
        this.pause()
        this.maxDuration = '00:00.000'
        this.isDrawing = false
        if (this.isComparing) this.isComparing = false
        this.setDefaultComparisonTaskType()
      } else if (this.isPicture) {
        this.pause()
        this.isDrawing = false
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

    isDrawing () {
      if (this.fabricCanvas) this.fabricCanvas.isDrawingMode = this.isDrawing
    },

    isTyping () {
      const clickarea =
        this.canvasWrapper.getElementsByClassName('upper-canvas')[0]
      if (this.isTyping && clickarea) {
        clickarea.addEventListener('dblclick', this.addText)
      } else {
        clickarea.removeEventListener('dblclick', this.addText)
      }
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

.canvas-wrapper {
  width: 100%;
  position: absolute;
  left: 0;
  z-index: 300;
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
