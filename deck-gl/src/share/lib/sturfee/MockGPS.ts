interface Coords {
  __proto__?: GeolocationCoordinates
  latitude: number
  longitude: number
  altitude: number
}

type ProviderState = 'initializing' | 'ready' | 'notSupported'

/**
 * Sturfee VPSのモック用のクラス
 * @param {Coords} [coords] 緯度,経度,高さ
 * @param {ProviderState} state Sturfee VPSの状態('initializing' | 'ready' | 'notSupported')
 */
export default class MockGPS {
  coords?: Coords
  _state: ProviderState

  constructor(coords?: Coords) {
    this.coords = coords || {
      latitude: parseFloat(import.meta.env.VITE_MOCK_GPS_LATITUDE),
      longitude: parseFloat(import.meta.env.VITE_MOCK_GPS_LONGITUDE),
      altitude: parseFloat(import.meta.env.VITE_MOCK_GPS_ALTITUDE),
    }
    if (window.GeolocationCoordinates)
      this.coords.__proto__ = window.GeolocationCoordinates.prototype
    this._state = 'initializing'
  }
  /**
   * 初期起動時に実行するPromise
   * @returns {Promise<true>}
   */
  init(): Promise<true> {
    this._state = 'ready'
    return Promise.resolve(true)
  }

  /**
   * Sturfee VPSの状態を返却するメソッド
   * @returns {ProviderState}
   */
  state(): ProviderState {
    return this._state
  }

  /**
   * 位置情報を返却orモック情報を返却するメソッド
   * @returns {{coords: Coords | undefined}}
   */
  getCurrentLocation(): {
    coords: Coords | undefined
  } {
    const position = { coords: this.coords }
    if (window.GeolocationPosition)
      // @ts-ignore: 2339
      position.__proto__ = window.GeolocationPosition.prototype
    return position
  }
}
