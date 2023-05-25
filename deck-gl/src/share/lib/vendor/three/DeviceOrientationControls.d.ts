import { Camera } from 'three'

export default class DeviceOrientationControls {
  constructor(object: Camera, enabled?: boolean)

  object: Camera

  // API

  alphaOffset: number
  deviceOrientation: any
  enabled: boolean
  screenOrientation: number

  connect(): void
  disconnect(): void
  dispose(): void
  update(): void
}
