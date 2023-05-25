import * as THREE from 'three'

// ブラウザのMediaDevices.getUserMedia() APIのメディアをしている定数オブジェクトを定義する
// この制約条件だとだいたいいい感じで取得できるのでデフォルトこれを使う
// TODO 外部から制約条件を受け取れるようにしたい
const videoConstraints = {
  video: {
    width: {
      min: 1280,
      ideal: 1920,
      max: 2560,
    },
    height: {
      min: 720,
      ideal: 1080,
      max: 1440,
    },
    facingMode: 'environment', //リアカメラ
  },
}

/**
 * 通常のThree.jsのWebARプロジェクトでのカメラ映像(Three.jsの環境の背景)を取得するためのメソッド
 * @param {HTMLVideoElement} video
 * @returns {Promise<THREE.VideoTexture>}
 */
export async function getWebcamTexture(
  video: HTMLVideoElement
): Promise<THREE.VideoTexture> {
  // カメラ映像を video 要素に流す
  video.setAttribute('autoplay', '')
  video.setAttribute('playsinline', '')

  video.srcObject = await navigator.mediaDevices.getUserMedia(videoConstraints)
  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => {
      video.play()
      resolve()
    }
  })

  // カメラ映像をThreeJSのテクスチャとして取得する
  const webcamTexture = new THREE.VideoTexture(video)
  webcamTexture.magFilter = THREE.LinearFilter
  webcamTexture.minFilter = THREE.LinearFilter
  webcamTexture.format = THREE.RGBFormat
  //色合いをディスプレイに合わせてsRGB補正(これを入れないと白飛びする)
  webcamTexture.encoding = THREE.sRGBEncoding

  return webcamTexture
}
