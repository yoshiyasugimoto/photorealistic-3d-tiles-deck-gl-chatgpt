import { isIOS } from './device'

export type DeviceOrientation =
  | 'vertical' //デバイスが縦向きの状態
  | 'horizontal-right' //カメラを右にしてデバイスを横向きの状態
  | 'horizontal-left' //カメラを左にしてデバイスを横向きの状態

/**
 * アプリケーションを起動した時のデバイスの向きの検出
 * iOS Safariならば、window.orientationを利用
 * Android Chromeならば、端末ごとの差異がないとされるscreen.orientation.angleを利用
 * 'horizontal-right'はカメラを右にしてデバイスを横向きの状態
 * 'horizontal-right'はカメラを左にしてデバイスを横向きの状態
 * 'vertical'はデバイスが縦向きの状態
 * @returns {DeviceOrientation}
 */
export function getDeviceOrientation(): DeviceOrientation {
  if (isIOS()) {
    //Safari
    const orientation = window.orientation
    if (orientation === -90) return 'horizontal-right'
    else if (orientation === 90) return 'horizontal-left'
    else return 'vertical'
  } else {
    //Chrome
    const angle = screen.orientation.angle
    if (angle === 270) return 'horizontal-right'
    else if (angle === 90) return 'horizontal-left'
    else return 'vertical'
  }
}
