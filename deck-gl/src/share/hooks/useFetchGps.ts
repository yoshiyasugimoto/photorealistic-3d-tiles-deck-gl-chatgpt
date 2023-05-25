import { Dispatch, useEffect } from 'react'
import { checkGps, ContentArea, GpsPosition } from '../lib/cms'

/**
 * CMSに位置情報登録された描画反映可能な場所かどうか判定するカスタムフック
 * React側でuseReducerのactionにsetWelcomeWindow, setUnavailablePositionModal, setErrorGpsApiModalを追加すること
 * @param {Dispatch<any>} dispach useReducerのdispach
 * @param {boolean} enableMockGps GPSのモックをするAPI
 * @param {ContentArea} contentArea CMSのanchorに設定された位置情報を参照すための引数,設定しない場合はプロモーションに設定された位置情報を扱う
 */
const useFetchGps = (
  dispach: Dispatch<any>, // TODO anyにしない方法あるかな
  enableMockGps = false,
  contentArea?: ContentArea,
  cmsInfo: any = {},
  timeout = 5000
) => {
  useEffect(() => {
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
            const data = async () => {
              // CMSに設定されている範囲にいるかチェックする
              // enableMockGpsがtrueの時は必ずsuccessにする
              const res =
                enableMockGps &&
                window.confirm('位置情報モックを利用しますか？')
                  ? true
                  : await checkGps(gpsPosition, contentArea, cmsInfo)
              res
                ? dispach({ type: 'setWelcomeWindow', args: true })
                : dispach({ type: 'setUnavailablePositionModal', args: true })
            }
            data()
          },
          (err) => {
            console.error(err)
            // 位置情報を取得できなかったとき
            dispach({ type: 'setErrorGpsApiModal', args: true })
          },
          { timeout }
        )
      }, 100)
    } else {
      dispach({ type: 'setErrorGpsApiModal', args: true })
    }
  }, [])
}

export default useFetchGps
