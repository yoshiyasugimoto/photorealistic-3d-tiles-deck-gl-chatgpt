// **********************************************************
//
// WEB4DV
// THREE.js plug-in for 4Dviews volumetric video sequences
//
// Version: 3.1.0
// Release date: October 2021
//
// Copyright: 4D View Solutions SAS
// Authors: M.Adam & T.Groubet
//
// NOTE:
// ADD: import WEB4DS from 'yourpath/web4dvImporter.js'
// in your main script
// Then create a WEB4DS object with the right parameters
// Call yourObject.load() to start the streaming
// OPTIONS:
// - yourObject.load( bool showPlaceholder, bool playOnload, callback() )
// Then you can call:
// - play/pause
// - mute/unmute
// - destroy
// - get some info like currentFrame or sequenceTotalLength
//
// **********************************************************
import * as THREE from 'three'
import { default as ResourceManagerXHR, Decoder } from './web4dvResource.js'
import { default as Model4D } from './model4D_Three.js'

// MAIN CLASS MANAGING A 4DS
// extends THREE.EventDispatcherを追加
export default class WEB4DS extends THREE.EventDispatcher {
  constructor(
    id,
    urlD,
    urlM,
    urlA,
    position,
    renderer,
    scene,
    camera,
    useCache = false
  ) {
    /** properties, options and status modifiable by user **/
    super()
    // properties
    this.id = id // unique id
    this.urlD = urlD // url Desktop format
    this.urlM = urlM // url Mobile format
    this.urlA = urlA // url Audio
    this.position = position //mesh position in scene
    this.renderer = renderer //three.js rendrer reference
    this.scene = scene //three.js scene reference
    this.camera = camera //three.js camera reference

    console.log(this.urlM)

    this.model4D = new Model4D() //three.js Object represneting the mesh 4d
    this.sequenceTotalLength = 0 //sequence number of frames
    this.sequenceDecodedFrames = 0 //current number of decoded meshes in the buffer

    this.decoder = new Decoder()
    this.resourceManager = new ResourceManagerXHR(this.decoder, useCache)

    // Options
    this.showPlaceholder = false //show a place holder before the sequence is loaded
    this.playOnload = true // play automatically when sequence is loaded

    // Status
    this.isLoaded = false
    this.isPlaying = false
    this.isAudioloaded = false
    this.isAudioplaying = false
    this.wasPlaying = true
    this.isDecoding = false
    this.isMuted = false

    this.currentMesh = null
    this.currentFrame = null

    /** internal data. Should not be modified by user **/

    // Audio
    this.audioListener = null
    this.audioSound = null
    this.audioLoader = null
    // for cross browser compatibility
    const AudioContext = window.AudioContext || window.webkitAudioContext
    this.audioCtx = new AudioContext()
    this.gainNode = null
    this.audioStartOffset = 0
    this.audioStartTime = 0
    this.audioPassedTime = 0
    this.audioTrack = null
    this.audioLevel = null

    // Loop functions
    this.playbackLoop = null
    this.decodeLoop = null

    this.frameOffset = 0

    // Waiter
    this.waiterParent = this.renderer.domElement
    this.waiterElemLogo = new Image(320, 320)
    this.waiterLoaded = false

    if (this.waiterParent) {
      this.waiterParent.style.zIndex = '1'

      this.waiterElem = document.createElement('div')
      const waiterElemOpacity = 50

      this.waiterElem.id = 'web4dv-waiter'
      this.waiterElem.style.position = 'absolute'
      this.waiterElem.style.backgroundImage = 'red'
      this.waiterElem.style.top = '50%'
      this.waiterElem.style.left = '50%'
      this.waiterElem.style.width = '320px'
      this.waiterElem.style.height = '320px'
      this.waiterElem.style.marginTop = '-160px'
      this.waiterElem.style.marginLeft = '-160px'
      this.waiterElem.style.opacity = waiterElemOpacity / 100
      this.waiterElem.style.zIndex = '2'

      this.waiterElemLogo.src = 'https://dev.fourdviews.com/assets/waiter.gif'

      if (this.waiterLoaded === false) {
        this.waiterParent.parentNode.insertBefore(
          this.waiterElem,
          this.waiterParent.nextSibling
        )
        this.waiterElem.appendChild(this.waiterElemLogo)
        const waiterHtml = document.getElementById('web4dv-waiter')
        waiterHtml.style.display = 'none'

        this.waiterLoaded = true
      }
    }
  }

  initSequence(
    nbFrames,
    nbBlocs,
    framerate,
    maxVertices,
    maxTriangles,
    textureEncoding,
    textureSizeX,
    textureSizeY,
    modelPosition
  ) {
    const vertices = new Float32Array(maxVertices * 3)
    const uvs = new Float32Array(maxVertices * 2)
    const indices = new Uint32Array(maxTriangles * 3)
    const normals = new Float32Array(maxVertices * 3)

    this.model4D.initMesh(
      vertices,
      uvs,
      indices,
      normals,
      textureEncoding,
      textureSizeX,
      textureSizeY,
      modelPosition
    )

    this.scene.add(this.model4D.mesh)

    this.scene.add(this.model4D.surface)
    this.scene.add(this.model4D.light)

    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMapSoft = true
  }

  // methods
  load(showPlaceholder, playOnload, callback) {
    if (!this.isLoaded) {
      this.showPlaceholder = showPlaceholder
      this.playOnload = playOnload

      if (this.renderer.extensions.get('WEBGL_compressed_texture_astc')) {
        this.resourceManager.set4DSFile(this.urlM)
        this.decoder.SetInputTextureEncoding(164)
      } else {
        this.resourceManager.set4DSFile(this.urlD)
        this.decoder.SetInputTextureEncoding(100)
      }

      this.resourceManager.Open(() => {
        const si = this.resourceManager._sequenceInfo

        this.initSequence(
          si.NbFrames,
          si.NbBlocs,
          si.Framerate,
          si.MaxVertices,
          si.MaxTriangles,
          si.TextureEncoding,
          si.TextureSizeX,
          si.TextureSizeY,
          this.position
        ) // Get sequence information

        this.Decode() // Start decoding, downloading

        this.loadAudio(this.urlA)

        const waiterHtml = document.getElementById('web4dv-waiter')

        const waiter = setInterval(() => {
          if (this.decoder._meshesCache.length >= this.decoder._maxCacheSize) {
            clearInterval(waiter) // Stop the waiter loop

            if (this.waiterElem) {
              // Hide Waiter
              waiterHtml.style.display = 'none'
            }

            if (showPlaceholder === true) {
              // Placeholder equals frame 0
              // Display the frame 0
              this.currentMesh = this.decoder._meshesCache.shift()
              this.currentFrame = this.currentMesh.frame
              this.updateSequenceMesh(this.currentMesh)
            } else {
              // Else, play sequence
              if (this.playOnload === true || this.playOnload == null) {
                this.play()
              } else {
                // alert(`sequence is ready | showPlaceholder: ${this.showPlaceholder} | playOnload: ${this.playOnload}`)
              }
            }
            if (callback) {
              callback()
            }
          } else {
            // Start waiter animation
            if (this.waiterElem && !this.waiterDisplayed) {
              // Display waiter
              waiterHtml.style.display = 'block'
              this.waiterDisplayed = true
            }
          }
        }, 0.1)

        this.isLoaded = true
        this.dispatchEvent({ type: 'loaded' })
        this.sequenceTotalLength = si.NbFrames
      })
    } else {
      alert('A sequence is already loaded. One sequence at a time.')
    }
  }

  updateSequenceMesh(mesh) {
    this.model4D.updateMesh(
      mesh.vertices,
      mesh.faces,
      mesh.uvs,
      mesh.normals,
      mesh.texture,
      mesh.nbVertices,
      mesh.nbFaces
    )
  }

  // Decode 4D Sequence
  Decode() {
    if (this.isDecoding) {
      return
    }

    const dt = 1000.0 / (this.resourceManager._sequenceInfo.FrameRate * 6)

    this.isDecoding = true

    /* Decoding loop, 3*fps */
    this.decodeLoop = setInterval(() => {
      /* Decode chunk */
      for (let i = 0; i < 6; i++) this.decoder.DecodeChunk()

      /* If a few chunks, download more */
      const maxCache =
        this.resourceManager._sequenceInfo.NbFrames * 2 < 300
          ? this.resourceManager._sequenceInfo.NbFrames * 2
          : 300

      if (
        this.decoder._chunks4D.length < maxCache ||
        (this.decoder._keepChunksInCache === true &&
          this.decoder._chunks4D.length <
            this.resourceManager._sequenceInfo.NbFrames * 2)
      ) {
        this.resourceManager._internalCacheSize = 6000000 // 6 Mo

        this.resourceManager.getBunchOfChunks()
      }

      this.sequenceDecodedFrames = this.decoder._meshesCache.length
    }, dt)
  }

  stopDecoding() {
    console.log('Stop decoding')
    clearInterval(this.decodeLoop)
    this.isDecoding = false
  }

  // For now, will pause any WEB4DV object created (function is generic)
  pause() {
    cancelAnimationFrame(this.playbackLoop)
    this.isPlaying = false

    if (this.decoder._meshesCache >= this.decoder._maxCacheSize) {
      this.stopDecoding()
    }
    this.pauseAudio()
    this.frameOffset = this.currentFrame
  }

  // For now, will play any WEB4DV object created (function is generic)
  play(autoUpdate) {
    if (this.isPlaying) {
      // If sequence is already playing, do nothing
      return
    }

    this.showPlaceholder = false

    // If not decoding, decode
    this.Decode()
    this.playAudio()

    this.isPlaying = true

    this.lastUpdateTime = 0

    this.startDate = Date.now() / 1000
    this.seqDuration =
      this.resourceManager._sequenceInfo.NbFrames /
      this.resourceManager._sequenceInfo.FrameRate
    this.timeOffset =
      this.frameOffset / this.resourceManager._sequenceInfo.FrameRate

    if (autoUpdate) {
      function loop() {
        this.update()
        this.playbackLoop = requestAnimationFrame(loop.bind(this))
      }
      this.playbackLoop = requestAnimationFrame(loop.bind(this))
    }
  }

  update() {
    if (!this.isPlaying) {
      return
    }

    let frameToDisplay = 0
    // if audio, base time on audio playback
    if (this.isAudioloaded) {
      if (this.isAudioplaying === true) {
        this.audioPassedTime = this.audioCtx.currentTime - this.audioStartTime

        // loop
        if (this.audioStartOffset + this.audioPassedTime > this.seqDuration) {
          this.audioStartTime += this.seqDuration - this.audioStartOffset
          this.audioPassedTime -= this.seqDuration - this.audioStartOffset
          this.audioStartOffset = 0
          this.currentFrame = -1
          // 1ループ終わったコンテンツ終了イベントを発火
          this.dispatchEvent({ type: 'loopEnd' })
          // イベントハンドラ側で destroy が呼ばれていたら後続の処理を停止するために return する
          if (!this.isPlaying) return
        }

        frameToDisplay =
          (this.audioStartOffset + this.audioPassedTime) *
          this.resourceManager._sequenceInfo.FrameRate
      }
    } else {
      // no audio, base time on system
      let passedTime = Date.now() / 1000 - this.startDate

      if (this.timeOffset + passedTime > this.seqDuration) {
        this.startDate += this.seqDuration - this.timeOffset
        passedTime -= this.seqDuration - this.timeOffset
        this.timeOffset = 0
        this.currentFrame = -1
        // 1ループ終わったコンテンツ終了イベントを発火
        this.dispatchEvent({ type: 'loopEnd' })
        // イベントハンドラ側で destroy が呼ばれていたら後続の処理を停止するために return する
        if (!this.isPlaying) return
      }

      frameToDisplay =
        (this.timeOffset + passedTime) *
        this.resourceManager._sequenceInfo.FrameRate
    }

    // get first mesh if needed
    if (this.currentMesh == null) {
      this.currentMesh = this.decoder._meshesCache.shift()
      if (this.currentMesh) this.currentFrame = this.currentMesh.frame
    }

    while (
      this.currentMesh &&
      this.currentFrame != parseInt(frameToDisplay) &&
      this.decoder._meshesCache.length > 0
    ) {
      // this.currentMesh.delete()
      this.currentMesh = this.decoder._meshesCache.shift()
      this.currentFrame = this.currentMesh.frame
    }

    if (this.currentFrame === -1) this.pauseAudio()
    else if (this.isAudioplaying === false) this.playAudio()

    /* update buffers for rendering */
    this.updateSequenceMesh(this.currentMesh)
  }

  loadAudio(audioFile) {
    if (typeof this.camera !== 'undefined') {
      this.model4D.initAudio(this.audioCtx)

      this.camera.add(this.model4D.audioListener)
      this.gainNode = this.audioCtx.createGain()

      if (audioFile !== '') {
        console.log(`loading audio file: ${audioFile}`)

        this.model4D.loadAudioFile(audioFile, this.isAudioloaded, () => {
          this.gainNode.gain.value = 1.0
          this.isAudioloaded = true
        })
      } else if (
        this.resourceManager._audioTrack !== 'undefined' &&
        this.resourceManager._audioTrack !== [] &&
        this.resourceManager._audioTrack != ''
      ) {
        console.log('loading internal audio ')

        this.audioCtx.decodeAudioData(
          this.resourceManager._audioTrack,
          (buffer) => {
            this.model4D.setAudioBuffer(buffer)
            this.gainNode.gain.value = 1.0
            this.isAudioloaded = true
          }
        )
      }
    } else {
      alert(
        'Please add a camera to your scene or set your camera to var = camera. AudioListener not attached.'
      )
    }
  }

  playAudio() {
    if (this.isAudioplaying === false) {
      this.audioTrack = this.audioCtx.createBufferSource()
      this.audioTrack.loop = true
      this.audioTrack.buffer = this.model4D.audioSound.buffer
      this.audioTrack.connect(this.gainNode)
      this.gainNode.connect(this.audioCtx.destination)
      if (this.isMuted) this.gainNode.gain.value = 0

      this.audioStartOffset =
        this.currentFrame / this.resourceManager._sequenceInfo.FrameRate

      this.audioTrack.start(this.audioCtx.currentTime, this.audioStartOffset)
      // console.log(`start audio at time ${this.audioStartOffset} ; ${this.audioCtx.currentTime}`)

      this.isAudioplaying = true
      this.audioStartTime = this.audioCtx.currentTime
    }
  }

  pauseAudio() {
    if (this.isAudioplaying === true) {
      if (this.audioTrack) this.audioTrack.stop()

      this.isAudioplaying = false
    }
  }

  restartAudio() {
    console.log('restart audio playback')
    if (this.audioTrack) this.audioTrack.stop()
    this.isAudioplaying = false
    this.audioPassedTime = 0

    this.playAudio()
  }

  // For now, will mute any WEB4DV object created (function is generic)
  mute() {
    this.audioLevel = this.gainNode.gain.value
    console.log(`volume will be set back at:${this.audioLevel}`)

    this.gainNode.gain.value = 0
    this.isMuted = true
  }

  // For now, will unmute any WEB4DV object created (function is generic)
  unmute() {
    this.isMuted = false

    if (this.audioLevel) {
      this.gainNode.gain.value = this.audioLevel
    } else {
      this.gainNode.gain.value = 0.5
    }
  }

  keepsChunksInCache(booleanVal) {
    this.decoder._keepChunksInCache = booleanVal
  }

  setWaitingGif(url) {
    this.waiterElemLogo.src = url
  }

  destroy(callback) {
    cancelAnimationFrame(this.playbackLoop)
    this.stopDecoding()
    this.decoder.Destroy()
    // clearInterval(renderLoop); // No more needed: renderLoop is managed outside

    if (this.model4D.audioSound) {
      if (this.audioTrack) {
        this.audioTrack.stop()
      }

      this.model4D.audioLoader = null
      this.model4D.audioSound = null
      this.model4D.audioListener = null

      this.audioStartTime = 0
      this.audioStartOffset = 0
      this.audioPassedTime = 0
    }

    this.resourceManager.reinitResources()

    if (this.isLoaded) {
      this.scene.remove(this.model4D.mesh)
    }

    this.isLoaded = false
    this.isPlaying = false
    this.isDecoding = false
    this.isAudioplaying = false
    this.isAudioloaded = false

    this.currentMesh = null

    this.decoder._meshesCache = []
    this.decoder._chunks4D = []

    // Reset Sequence Infos
    this.currentFrame = 0
    this.sequenceTotalLength = 0
    this.sequenceDecodedFrames = 0

    // Callback
    if (callback) {
      callback()
    }
  }
}
