import type { WebGLRenderer } from 'three'
import type ThreeXR from './ThreeXR'
import * as ImageUtils from './ImageUtils'

function mediaTrackIsInavtive(track: MediaStreamTrack): boolean {
  return track.readyState != 'live' || !track.enabled || track.muted
}

/**
 * ThreeApp で使用している WebXR Device API を一時的に止めて
 * カメラの映像ストリームを利用できるようにする関数
 */
async function temporarilyBorrowVideoStream<T>(
  renderer: WebGLRenderer,
  threeXR: ThreeXR,
  process: (track: MediaStreamTrack) => Promise<T>
) {
  // WebXR Device API を止める処理
  await threeXR.end()
  renderer.xr.enabled = false
  const mediaStream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'environment', // リアカメラ固定
    },
  })
  const track = mediaStream.getVideoTracks()[0]
  if (mediaTrackIsInavtive(track)) throw new Error('video track is inactive')

  const result = await process(track)

  // 元に戻す処理
  track.stop() // 止めておかないと2回目以降で同じトラックが使用できなくなる
  renderer.xr.enabled = true
  await threeXR.initialize()

  return result
}

export default async function ScreenCapture(
  renderer: WebGLRenderer,
  threeXR: ThreeXR,
  render: () => void
) {
  const threeCanvas = renderer.domElement
  // WebXR Device API で使用している映像ストリームを一時的に借りてきて写真を撮る
  const [cameraImageBlob, threeImageUrl] = await temporarilyBorrowVideoStream(
    renderer,
    threeXR,
    // 映像ストリームを借りている間に処理する関数
    async (track) => {
      // カメラで写真を撮る
      // @ts-ignore: ImageCapture の型がなくてエラーになるのを回避
      const cameraImageBlob: Blob = await new window.ImageCapture(
        track
      ).takePhoto()
      // Three.js でレンダリングしている部分を画像に変換する
      render()
      const threeImageUrl = threeCanvas.toDataURL()
      return [cameraImageBlob, threeImageUrl]
    }
  )
  // 2枚の画像を重ね合わせる
  const cameraImageUrl = await ImageUtils.blobToDataURL(cameraImageBlob)
  return await ImageUtils.mergeImages(
    await Promise.all(
      [cameraImageUrl, threeImageUrl].map(ImageUtils.dataUrlToImageElement)
    ),
    { w: threeCanvas.width, h: threeCanvas.height }
  )
}
