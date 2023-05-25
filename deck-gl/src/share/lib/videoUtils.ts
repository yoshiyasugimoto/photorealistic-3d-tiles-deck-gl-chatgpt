/**
 * videoElementを非同期処理でロードするメソッド
 * @param {string} src
 * @param {boolean} mute
 * @param {boolean} loop
 * @returns {HTMLVideoElement}
 */
export function createVideoElement(
  src: string,
  mute = true,
  loop = false
): HTMLVideoElement {
  const videoElement = document.createElement('video')
  videoElement.setAttribute('playsinline', '')
  // videoElement.setAttribute('autoplay', '')
  videoElement.setAttribute('crossorigin', 'anonymous')
  if (mute) videoElement.setAttribute('mute', '')
  if (loop) videoElement.setAttribute('loop', '')
  videoElement.setAttribute('preload', 'metadata')
  if (!videoElement) throw new Error('動画が読み込めませんでした。')
  videoElement.src = src
  videoElement.onemptied = () =>
    console.warn('videoElementのload()を呼び出してください')
  return videoElement
}

/**
 * 動画の再生が可能になるまで待つためのPromise
 * @param {HTMLVideoElement} videoElement
 * @returns {Promise<void>}
 */
export async function onCanPlayVideoPromise(
  videoElement: HTMLVideoElement
): Promise<void> {
  return new Promise<void>((resolve) => {
    // readyStateプロパティが0,1,2の場合は再生即時再生不可,3は部分的再生が可能, 4は全体再生可能
    if (videoElement.readyState >= 3) resolve()
    else {
      videoElement.oncanplay = () => {
        resolve()
      }
    }
  })
}
