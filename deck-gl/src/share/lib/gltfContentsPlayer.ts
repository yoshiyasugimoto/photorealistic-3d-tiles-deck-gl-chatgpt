import * as THREE from 'three'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'
import { loadGltf } from './threeUtils'

/**
 * 音声と合わせてGLTFのアニメーションを再生するためのクラス
 */
export default class GltfContentsPlayer extends THREE.EventDispatcher {
  isModelLoaded: boolean
  isAudioLoaded: boolean
  model?: GLTF
  audio: THREE.PositionalAudio
  adjustTime = 0
  mixer?: THREE.AnimationMixer
  animationPlaying: boolean
  startTime: number | null
  animationDuration = 0
  playing = false

  /**
   * @param {THREE.AudioListener}listener
   */
  constructor(listener: THREE.AudioListener) {
    super()
    this.isModelLoaded = false
    this.isAudioLoaded = false
    this.audio = new THREE.PositionalAudio(listener)
    this.mixer = undefined
    this.animationPlaying = false
    this.startTime = null
  }

  load(modelUrl: string, audioUrl: string) {
    return Promise.all([this.loadModel(modelUrl), this.loadAudio(audioUrl)])
  }

  async loadModel(url: string) {
    this.model = await loadGltf(url)
    this.model.scene.visible = false
    this.model.scene.traverse((child) => {
      // if (child.material) child.material.metalness = 0
      child.frustumCulled = false
    })
    this.isModelLoaded = true
  }

  async loadAudio(url: string) {
    const loader = new THREE.AudioLoader()
    const buffer = await loader.loadAsync(url)
    this.audio.setBuffer(buffer)
    this.isAudioLoaded = true
  }

  sceneAdd(scene: THREE.Scene | THREE.Object3D | THREE.Group) {
    if (this.model) scene.add(this.model.scene)
  }

  // ※ adjustTime について
  // アニメーションの長さ < 音の長さ の場合、adjustTime に正の値を指定する
  // アニメーションの長さ > 音の長さ の場合、adjustTime に負の値を指定する
  play(animationIndex: number, adjustTime = 0) {
    if (!this.model) throw new Error('Model is none')
    this.mixer = new THREE.AnimationMixer(this.model.scene)
    const clip = this.model.animations[animationIndex]
    this.animationDuration = clip.duration // アニメーションの長さ (単位不明)
    this.mixer.clipAction(clip).play()

    this.adjustTime = adjustTime // アニメーションの長さを修正するパラメータ
    this.startTime = this.audio.context.currentTime
    this.audio.play()

    this.model.scene.visible = true
    this.playing = true
  }

  update() {
    if (!this.playing) return
    // 再生開始からの経過時間 (秒)
    this.startTime = this.startTime === null ? 0 : this.startTime
    const currentTime = this.audio.context.currentTime - this.startTime
    // 音の長さ (秒)
    const audioDuration = this.audio.buffer ? this.audio.buffer.duration : 0
    // 音の全体の長さに対する再生位置の割合
    // currentTime は再生位置を表すプロパティではなくただのタイマーなので、
    // 音の再生が止まっても増加し続ける → 1.0 (100%) を超えることがある
    // 音が止まった後もアニメーション再生を継続したいケースで必要
    const audioTimeRatio = currentTime / audioDuration
    // 長さ調整済みアニメーション長 (単位は秒ではない)
    const adjustedAnimationTime = this.animationDuration + this.adjustTime
    // アニメーションの現在の再生位置
    const animationCurrentTime = adjustedAnimationTime * audioTimeRatio
    // ミキサーにアニメーション再生位置を設定
    if (this.mixer) this.mixer.setTime(animationCurrentTime)
    // 再生が終わったときの処理
    const animationEnded = animationCurrentTime > this.animationDuration
    const audioEnded = currentTime > audioDuration
    // アニメーション再生が終わった場合の処理
    if (animationEnded && this.mixer) {
      // モデルの最後のポーズで止める
      // animationDuration そのままを指定すると T ポーズになってしまう
      this.mixer.setTime(this.animationDuration - 0.1)
    }
    // 音の再生が終わった場合の処理
    if (audioEnded) {
      // TODO: なんかある？
    }
    // 音とアニメーション両方の再生が終わった場合の処理
    if (animationEnded && audioEnded) {
      this.playing = false
      this.startTime = null
    }
  }
}
