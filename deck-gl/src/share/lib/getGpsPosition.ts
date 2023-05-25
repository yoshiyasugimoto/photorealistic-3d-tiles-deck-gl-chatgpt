import { GpsPosition } from './cms'

/**
 * THREE.Object3D, THREE.Group, THREE.Meshの解放するための関数。
 * 必要無くなったオブジェクトをvisible=falseだけでは、計算リソースを使っているのでこの関数を使ってオブジェクトの削除をするのがよさそう。
 * https://threejs.org/docs/#manual/en/introduction/How-to-dispose-of-objects
 * @param {THREE.Scene} scene
 * @param {THREE.Object3D | THREE.Group | THREE.Mesh} object 削除したいTHREE.Object3D, THREE.Group, THREE.Meshのいずれかを設定
 */
export async function getGpsPosition(): Promise<GpsPosition> {
  return new Promise((resolve, reject) => {
    // Geolocation APIが利用できるかチェック
    if (navigator.geolocation) {
      // iOS Safari対応
      // 特定の条件でGPS情報を取得できない問題(navigator.geolocation.getCurrentPositionが発火しない)が発生
      // 特定の条件: iPhoneで位置情報をoff, Safariをバックグラウンドから消す, WebViewもしくはQRコードから起動する
      window.setTimeout(() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const gpsPosition: GpsPosition = {
              // GPS APIの緯度経度のレスポンス
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }
            resolve(gpsPosition)
          },
          (_) => {
            // 位置情報を取得できなかったとき
            reject('位置情報が取得できません')
          }
        )
      }, 100)
    } else {
      reject('Geolocation APIが利用できません')
    }
  })
}
