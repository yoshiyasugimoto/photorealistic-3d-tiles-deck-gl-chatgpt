/**
 *
 * @param {string} text 音声を出したいテキスト
 */
export function speech(text: string): void {
  const utterParam = new SpeechSynthesisUtterance()
  utterParam.text = text
  utterParam.lang = 'ja'
  utterParam.pitch = 1.0
  utterParam.volume = 0.5
  // 再生待ち音声データのキューを空にする
  speechSynthesis.cancel()
  speechSynthesis.speak(utterParam)

  utterParam.onstart = () => {
    console.log(`Speech start: ${text}`)
  }

  utterParam.onerror = () => {
    console.error(`Speech error: ${text}`)
  }

  utterParam.onpause = () => {
    console.log(`Speech pause: ${text}`)
  }

  utterParam.onend = () => {
    console.log(`Speech end: ${text}`)
  }
}
