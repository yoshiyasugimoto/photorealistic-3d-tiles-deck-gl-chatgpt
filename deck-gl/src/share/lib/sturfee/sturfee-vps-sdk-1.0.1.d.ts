import MockGPS from './MockGPS'

type ProviderState = 'initializing' | 'ready' | 'notSupported'

export interface Coordinates {
  latitude: number
  longitude: number
  altitude: number
  heading: number
}

export interface ImuProvider {
  status(): ProviderState
  getOrientation(): THREE.Quaternion
  getPosition(): THREE.Vector3
}

export interface VideoProvider {
  status(): ProviderState
  _canvas: HTMLCanvasElement
  _video: HTMLVideoElement
  getProjectionMatrix(): any
}

// 型が必要そうなやつだけ定義しているので、型エラーが出たら足していく
export interface SturfeeXRSession {
  performLocalization(): void
  getLocationOffset(): THREE.Vector3
  getOrientationOffset(): THREE.Quaternion
  getXRCameraLocation(): { coords: Coordinates }
  getXRCameraOrientation(): THREE.Quaternion
  on(eventType: string, handler: any): void
  off(eventType: string, handler: any): void
  imu: ImuProvider
  video: VideoProvider
  _gps: {
    coords: GeolocationCoordinates
    _currentLocation: {
      coords: {
        latitude
        longitude
      }
    }
  }
  _sturfeeXRConfig: SturfeeVPSConfig
}

export const SturfeeXRSessionManager: {
  createSession(sturfeeXrConfig: any): SturfeeXRSession
}

export const ScanProperties: {
  TargetCount: number
  Angle: number
}

export const PositioningUtils: {
  getWorldPositionFromGeoLocation(lat: number, lon: number): THREE.Vector3
}

export const OrientationUtils
