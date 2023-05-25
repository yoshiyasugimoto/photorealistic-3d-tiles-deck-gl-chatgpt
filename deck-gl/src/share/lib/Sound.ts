declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext
  }
}

/**
 * 一度のclickイベントの後なら自由に音声ファイルを操作できるようにするクラス
 */
export default class Sound {
  soundPath: string
  audioArrayBuffer?: ArrayBuffer
  audioContext?: AudioContext
  audioDuration?: number
  constructor(soundPath: string) {
    this.soundPath = soundPath
  }
  /**
   * 音声ファイルをロードするメソッド
   * audioデータをArrayBufferに詰める
   */
  async load() {
    // audioデータの取得にはXMLHttpRequest, fetch(), FileReaderのどれかを利用すれば良し
    const audioResponse = await fetch(this.soundPath)
    this.audioArrayBuffer = await audioResponse.arrayBuffer()
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }
  /**
   * 音声を再生するメソッド
   * loadメソッドを実行後使用してください
   */
  async play() {
    if (!this.audioArrayBuffer || !this.audioContext)
      throw new Error('load メソッドを実行してください。')
    // メモリ上に音声データを保持できるようにする
    const source = this.audioContext.createBufferSource()
    // 非同期に音声データをデコードして音声データを保持する
    source.buffer = await this.audioContext.decodeAudioData(
      this.audioArrayBuffer.slice(0) // ArrayBufferのデータをコピーする
    )
    this.audioDuration = source.buffer.duration // 音声データの全長を保存
    source.loop = false
    source.connect(this.audioContext.destination)
    source.start(0) // 再生
  }
  /**
   * 音声を停止するメソッド
   * loadメソッドを実行後使用してください
   */
  async pause() {
    if (!this.audioArrayBuffer || !this.audioContext)
      throw new Error('load メソッドを実行してください。')
    if (this.audioContext?.state === 'running')
      await this.audioContext.suspend()
  }
  /**
   * 音声の全長を取得するメソッド(s)
   * loadメソッドを実行後使用してください
   */
  getAudioDuration() {
    return this.audioDuration
  }
}
