import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { identity, WorldToThree, ThreeToWorld } from './utils.js'
import { SturfeeXRSessionManager } from './sturfee-vps-sdk-1.0.1'
import type { SturfeeXRSession } from './sturfee-vps-sdk-1.0.1'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'
import MockGPS from './MockGPS.js'
import { getGpsPosition } from './../../lib/getGpsPosition'
import { GpsPosition } from './../../lib/cms'

// Type Guard
function isMesh(obj: THREE.Object3D): obj is THREE.Mesh {
  return 'isMesh' in obj && (obj as THREE.Mesh).isMesh
}

class CameraController {
  sturfeeXRSession: SturfeeXRSession
  camera: THREE.Camera
  _elevation: number
  _localized: boolean

  constructor(sturfeeXRSession: SturfeeXRSession, camera: THREE.Camera) {
    this.camera = camera
    this.sturfeeXRSession = sturfeeXRSession
    this._elevation = 0
    this._localized = false

    this.camera.parent = new THREE.Mesh()

    this.sturfeeXRSession.on('localizationComplete', () => {
      this._localized = true
    })
    // SturfeeVPSのエラー処理の追加
    this.sturfeeXRSession.on('localizationFail', () => {
      console.error('位置が特定できませんでした。再読み込が必要です。')
      window.alert('位置を特定できませんでした。再読み込が必要です。')
      window.location.reload()
    })
  }

  setCameraElevation(elevation: number) {
    this._elevation = elevation
  }

  update() {
    // Apply offsets

    // Position
    let offsetPos = WorldToThree.getPosition(
      this.sturfeeXRSession.getLocationOffset()
    )
    if (!this._localized) {
      // elevation after localizatino is handled inside SDK and is added inside getLocationOffset
      offsetPos.y = this._elevation
    }
    this._setCameraOffsetPosition(offsetPos)

    // Orientation
    // Get threeJs origin's rotation in VPS World space
    let worldOrigin = ThreeToWorld.getRotation(identity)
    // Multiply offset rotation to parent in VPS World space
    let offset = new THREE.Quaternion(
      this.sturfeeXRSession.getOrientationOffset().x,
      this.sturfeeXRSession.getOrientationOffset().y,
      this.sturfeeXRSession.getOrientationOffset().z,
      this.sturfeeXRSession.getOrientationOffset().w
    )
    offset.multiplyQuaternions(offset, worldOrigin)

    let offsetRotation = WorldToThree.getRotation(offset)
    this._setCameraOffsetRotaion(offsetRotation)
  }

  _setCameraOffsetPosition(offsetPos: THREE.Vector3) {
    this.camera.parent!.position.set(offsetPos.x, offsetPos.y, offsetPos.z)
    this.camera.parent!.updateMatrixWorld()
  }

  _setCameraOffsetRotaion(offsetRot: THREE.Quaternion) {
    this.camera.parent!.setRotationFromQuaternion(offsetRot)
    this.camera.parent!.updateMatrixWorld()
  }
}

export interface SturfeeVPSConfig {
  accessKey?: string
  gpsProvider?: MockGPS
  enableOcclusion?: boolean // オクルージョンするかしないかのフラグ
  showEnvironmentMesh?: boolean // 建物や地形のメッシュを表示するかどうかのフラグ
}

/**
 * SturfeeVPS SDK がイベントベースなのが使いづらいから再構築する感じのクラス
 * Usage:
 *   const vps = new SturfeeVPS(camera, { gpsProvider })
 */
export class SturfeeVPS<T extends SturfeeVPSConfig> {
  session: SturfeeXRSession
  camera: THREE.Camera
  cameraController: CameraController
  scene: THREE.Scene
  enableOcclusion: boolean
  showEnvironmentMesh: boolean

  // SturfeeVPS SDK の各種イベントが発火したかどうかを監視する Promise
  eventPromises: {
    meshDataLoaded: Promise<GLTF>
    localizationComplete: Promise<void>
    ready: Promise<void>
  }

  buildings?: THREE.Group // 建物メッシュ
  ground?: THREE.Group // 地形メッシュ

  /**
   * @param {THREE.Camera} camera
   * @param {THREE.Scene} scene
   * @param {T extends SturfeeVPSConfig} config Sturfee VPSのconfig設定
   */
  constructor(camera: THREE.Camera, scene: THREE.Scene, config: T) {
    if (!config.accessKey)
      config.accessKey = import.meta.env.VITE_STURFEE_ACCESS_KEY
    // Sturfee vpsのアクセスキーが環境変数に設定されていない場合にエラーを投げる
    if (!config.accessKey) throw new Error('Set the Sturfee VPS acess key.')
    this.enableOcclusion = config.enableOcclusion === false ? false : true // オクルージョンのオンオフ(基本オン)
    this.showEnvironmentMesh =
      config.showEnvironmentMesh === true ? true : false // 建物・地形メッシュの表示のオンオフ(基本オフ)

    this.session = SturfeeXRSessionManager.createSession(config)

    this.camera = camera
    this.cameraController = new CameraController(this.session, this.camera)

    this.scene = scene

    this.eventPromises = {
      meshDataLoaded: new Promise((resolve, reject) => {
        this.session.on('meshDataLoaded', (data: unknown) => {
          const loader = new GLTFLoader()
          loader.parse(JSON.stringify(data), '', resolve, reject)
        })
      }),
      ready: new Promise((resolve, reject) => {
        this.session.on('ready', resolve)
      }),
      localizationComplete: new Promise((resolve, reject) => {
        this.session.on('localizationComplete', resolve)
      }),
    }
  }

  /**
   * 建物と地形データを3D空間上にロードするメソッド
   * 実行タイミング:スキャン完了後に実行してください。
   */
  async load(): Promise<void> {
    const data = await this.eventPromises.meshDataLoaded
    if (data.scenes.length < 2) throw new Error('Invalid data')
    // rotate tile to match threejs coordinate system
    data.scenes.forEach((scene) => (scene.rotation.x = -(Math.PI / 2)))

    // Scene 内のメッシュにランダムな色で透明なマテリアルを設定する
    function _preprocessMeshData(scene: THREE.Group, depthTest?: boolean) {
      scene.traverse((child) => {
        if (!isMesh(child)) return
        child.material = new THREE.MeshBasicMaterial({
          color: Math.random() * 0xffffff,
          transparent: true,
          opacity: 0,
          depthTest: depthTest,
          side: THREE.DoubleSide,
        })
      })
      return scene
    }
    console.warn('object instanceof THREE.Mesh')
    // 建物メッシュデータ
    this.buildings = _preprocessMeshData(data.scenes[0], this.enableOcclusion)
    this.buildings.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      if (this.showEnvironmentMesh) object.material.opacity = 0.5
    })
    // 地形メッシュデータ
    this.ground = _preprocessMeshData(data.scenes[1], this.enableOcclusion)
    this.ground.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      if (this.showEnvironmentMesh) object.material.opacity = 0.5
    })
    this.scene.add(this.buildings)
    this.scene.add(this.ground)
    // 地形データから標高を設定する
    this.cameraController.setCameraElevation(this._getTerrainElevation())
  }

  /**
   * デバイス類の準備がすべて完了するまで待つメソッド
   * 実行タイミング:スキャンを開始する前に実行してください。
   */
  async ready(): Promise<void> {
    await this.eventPromises.ready

    const webcamTexture = this._getWebcamTexture()
    this.scene.background = webcamTexture
  }

  /**
   * ユーザが SturfeeVPS の対象エリア内にいるか判定する
   * @returns true:対象エリア内, false:対象エリア外
   */
  async checkCoverage() {
    const sturfeeXRConfig = this.session._sturfeeXRConfig

    // 緯度経度を取得
    let gpslatitude: number | undefined, gpslongitude: number | undefined
    if (sturfeeXRConfig.gpsProvider instanceof MockGPS) {
      // 開発用 Mock使用
      gpslatitude = sturfeeXRConfig.gpsProvider.coords.latitude
      gpslongitude = sturfeeXRConfig.gpsProvider.coords.longitude
    } else {
      await getGpsPosition()
        .then((data) => {
          gpslatitude = data.latitude
          gpslongitude = data.longitude
        })
        .catch((error) => {
          console.error(error)
          throw new Error(error)
        })
    }
    if (!gpslatitude || !gpslongitude) return

    // 対象エリアかどうか判定
    const result = await this.isTargetArea(
      gpslatitude,
      gpslongitude,
      sturfeeXRConfig
    )
      .then(() => true)
      .catch((error) => {
        console.error('SturfeeVPSの対象エリア外です', error)
        return false
      })
    return result
  }

  /**
   * 緯度経度が SturfeeVPS の対象エリアか判定する
   * @param latitude ユーザの緯度
   * @param longitude ユーザの経度
   * @param sturfeeXRConfig SturfeeVPSの設定情報
   */
  isTargetArea(
    latitude: number,
    longitude: number,
    sturfeeXRConfig: SturfeeVPSConfig
  ): Promise<boolean> {
    const STURFEE_API_URL = 'api.sturfee.com/api/0.2.0'
    const accessKey = sturfeeXRConfig.accessKey
    const url = `https://${STURFEE_API_URL}/alignment_available/?lat=${latitude}&lng=${longitude}&token=${accessKey}`
    const header = {
      Authorization: `Bearer ${accessKey}`,
    }

    return new Promise(function (resolve, reject) {
      fetch(url, {
        headers: header,
      })
        .then((response) => {
          if (!response.ok) {
            reject('VPS not available at this location')
          } else {
            resolve(true)
          }
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  // 位置補正が完了するまで待つ関数
  async localize(): Promise<void> {
    await this.eventPromises.localizationComplete
    // 標高を一時的に設定するが、後ほど VPS 結果の地形データに基づいて更新する
    this.cameraController.setCameraElevation(
      this.session.getXRCameraLocation().coords.altitude
    )
  }

  // 地形データから標高を返す関数
  // 上空から地面に向かって垂直に RayCaster して最初に当たったところの y を標高ってことにする
  // ※ だいたいサンプルコードそのまま
  _getTerrainElevation(): number {
    if (!this.ground) throw new Error('GroundScene is null')
    const raycaster = new THREE.Raycaster()

    const origin = new THREE.Vector3()
    this.camera.getWorldPosition(origin)
    origin.y = 1000

    raycaster.set(origin, new THREE.Vector3(0, -1, 0))
    const intersects = raycaster.intersectObjects(this.ground.children)
    if (intersects.length > 0) return intersects[0].point.y

    console.warn('Terrain raycast failed')
    return 0
  }

  // カメラのパラメータを更新する関数 (毎フレーム呼ばれる想定)
  update(): void {
    this.cameraController.update()

    const pos = WorldToThree.getPosition(this.session.imu.getPosition())
    this.camera.position.set(pos.x, pos.y, pos.z)

    const rot = WorldToThree.getRotation(this.session.imu.getOrientation())
    this.camera.setRotationFromQuaternion(rot)

    const projectionMatrix = this.session.video.getProjectionMatrix()
    this.camera.projectionMatrix.set(
      projectionMatrix.m00 || projectionMatrix.e00,
      projectionMatrix.m01 || projectionMatrix.e01,
      projectionMatrix.m02 || projectionMatrix.e02,
      projectionMatrix.m03 || projectionMatrix.e03,
      projectionMatrix.m10 || projectionMatrix.e10,
      projectionMatrix.m11 || projectionMatrix.e11,
      projectionMatrix.m12 || projectionMatrix.e12,
      projectionMatrix.m13 || projectionMatrix.e13,
      projectionMatrix.m20 || projectionMatrix.e20,
      projectionMatrix.m21 || projectionMatrix.e21,
      projectionMatrix.m22 || projectionMatrix.e22,
      projectionMatrix.m23 || projectionMatrix.e23,
      projectionMatrix.m30 || projectionMatrix.e30,
      projectionMatrix.m31 || projectionMatrix.e31,
      projectionMatrix.m32 || projectionMatrix.e32,
      projectionMatrix.m33 || projectionMatrix.e33
    )

    // TODO: これなんだっけ
    if (this.camera.projectionMatrixInverse) {
      // camera.projectionMatrixInverse.getInverse(camera.projectionMatrix);
      this.camera.projectionMatrixInverse
        .copy(this.camera.projectionMatrix)
        .invert()
    }
  }

  /**
   * SturfeeVPS用のカメラ映像(Three.js環境の背景)を取得するためのメソッド
   * @returns {THREE.VideoTexture}
   */
  _getWebcamTexture(): THREE.VideoTexture {
    const videoElement = this.session.video._video
    // カメラ映像をThreeJSのテクスチャとして取得する
    const webcamTexture = new THREE.VideoTexture(videoElement)
    webcamTexture.magFilter = THREE.LinearFilter
    webcamTexture.minFilter = THREE.LinearFilter
    webcamTexture.format = THREE.RGBFormat
    //色合いをディスプレイに合わせてsRGB補正(これを入れないと白飛びする)
    webcamTexture.encoding = THREE.sRGBEncoding
    // CanvasElementの下にvideoElementを隠す
    videoElement.style.position = 'absolute'
    videoElement.style.zIndex = '-1'
    return webcamTexture
  }
}
