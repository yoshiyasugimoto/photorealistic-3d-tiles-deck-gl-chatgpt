import * as THREE from 'three'

/**
 * 音に合わせてアニメーションを再生するクラス
 */
export default class AnimationPlayer {
  playing = false
  startTime: number | null = null
  audioPath: string
  audioBuffer?: AudioBuffer
  mesh: THREE.Object3D
  animationClip: THREE.AnimationClip
  audio: THREE.Audio
  mixer: THREE.AnimationMixer
  adjustTime: number

  /**
   * @param {THREE.Object3D} mesh
   * @param {THREE.AnimationClip} animationClip
   * @param {audioPath} audioPath
   * @param {number} adjustTime
   */
  constructor(
    mesh: THREE.Object3D,
    animationClip: THREE.AnimationClip,
    audioPath: string,
    adjustTime = 0
  ) {
    this.mesh = mesh
    this.animationClip = animationClip
    this.audioPath = audioPath
    const listener = new THREE.AudioListener()
    this.audio = new THREE.Audio(listener)
    this.mixer = new THREE.AnimationMixer(this.mesh)
    const animationClipAction = this.mixer.clipAction(this.animationClip)
    animationClipAction.clampWhenFinished = true //アニメーションの最後で止まるように設定
    animationClipAction.play()
    this.adjustTime = adjustTime
  }

  /**
   * ロードをするメソッド
   * playメソッドを実行する前に実行していください
   */
  async load() {
    const audioResponse = await fetch(this.audioPath)
    const audioArrayBuffer = await audioResponse.arrayBuffer()
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    this.audioBuffer = await ctx.decodeAudioData(audioArrayBuffer)
    this.audio.setBuffer(this.audioBuffer)
  }

  /**
   * アニメーションと音声を実行するメソッド
   * updateメソッドの実行前に行なってください(loadメソッドを実行後)
   */
  play() {
    if (!this.audioBuffer) throw new Error('loadメソッドを実行してください。')
    this.playing = true
    this.startTime = this.audio.context.currentTime
    this.audio.play()
  }
  /**
   * アニメーションと音声を停止するメソッド
   */
  pause() {
    if (!this.audioBuffer) throw new Error('loadメソッドを実行してください。')
    this.mixer.stopAllAction()
    this.audio.stop()
  }
  /*
   * requestAnimationFrameの中で実行するメソッド
   */
  update() {
    if (!this.playing || !this.startTime) return
    // 再生開始からの経過時間 (秒)
    const currentTime = this.audio.context.currentTime - this.startTime
    // 音の長さ (秒)
    const audioDuration = this.audio.buffer!.duration
    // 音の全体の長さに対する再生位置の割合
    // currentTime は再生位置を表すプロパティではなくただのタイマーなので、
    // 音の再生が止まっても増加し続ける → 1.0 (100%) を超えることがある
    // 音が止まった後もアニメーション再生を継続したいケースで必要
    const audioTimeRatio = currentTime / audioDuration
    // 長さ調整済みアニメーション長 (単位は秒ではない)

    const adjustedAnimationTime = this.animationClip.duration + this.adjustTime
    // アニメーションの現在の再生位置
    const animationCurrentTime = adjustedAnimationTime * audioTimeRatio
    // ミキサーにアニメーション再生位置を設定
    this.mixer.setTime(animationCurrentTime)
    // 再生が終わったときの処理
    const animationEnded = animationCurrentTime > this.animationClip.duration
    const audioEnded = currentTime > audioDuration
    // アニメーション再生が終わった場合の処理
    if (animationEnded) {
      // TODO: なにかあれば書く
    }
    // 音の再生が終わった場合の処理
    if (audioEnded) {
      // TODO: なにかあれば書く
    }
    // 音とアニメーション両方の再生が終わった場合の処理
    if (animationEnded && audioEnded) {
      this.playing = false
      this.startTime = null
    }
  }
}
