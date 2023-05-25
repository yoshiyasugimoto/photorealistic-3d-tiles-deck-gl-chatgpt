import type { Dispatch } from 'react'
import type { Action, State } from './ReactApp'
import * as THREE from 'three'
import DeviceOrientationControls from './share/lib/vendor/three/DeviceOrientationControls'
import { requestPermission } from './share/lib/requestPermission'
import { getWebcamTexture } from './share/lib/getWebcamTexture'
import { proxyClickEvent } from './share/lib/click'
import type { DeviceOrientation } from './share/lib/deviceOrientation'
import { calcDeviceDirection } from './share/lib/calcDeviceDirection'
import { createVideoElement } from './share/lib/videoUtils'
import GetFrontDirection from './share/lib/GetFrontDirection'
import OrbitControls from './share/lib/vendor/three/OrbitControls'

export class ThreeApp extends THREE.EventDispatcher {
  dispatchReactAction?: Dispatch<Action>

  threeRoot: HTMLElement
  domOverlayRoot: HTMLElement
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera | undefined
  light: THREE.Light | undefined
  controls: DeviceOrientationControls | undefined
  deviceOrientation?: DeviceOrientation
  videoElement?: HTMLVideoElement
  videoPlane?: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  getFrontDirection: GetFrontDirection
  orbitControls?: OrbitControls

  constructor(threeRoot: HTMLElement, domOverlayRoot: HTMLElement) {
    super()
    this.threeRoot = threeRoot
    this.domOverlayRoot = domOverlayRoot
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true, //スクリーンショットを有効化する
    })
    this.scene = new THREE.Scene()
    this.getFrontDirection = new GetFrontDirection(false, false, true)
  }

  // 初期化処理を行う関数
  // ユーザがクリックアクションを実施したあとに実行される前提のため、各種センサー API へのリクエストが可能
  async initialize(dispatch: Dispatch<Action>, state: State): Promise<void> {
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    // 色合いをディスプレイに合わせてsRGB補正
    this.renderer.outputEncoding = THREE.sRGBEncoding
    this.renderer.shadowMap.enabled = true
    this.threeRoot.appendChild(this.renderer.domElement)

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.01,
      1000
    )
    this.camera.position.set(0, 0, 0)
    this.scene.add(this.camera)

    this.light = new THREE.HemisphereLight() // 光源色を指定して生成
    this.scene.add(this.light)

    // 3D オブジェクトのクリックを検出できるようにする
    proxyClickEvent(this.renderer.domElement, this.scene, this.camera)

    this.dispatchReactAction = dispatch
    this.deviceOrientation = state.deviceOrientation
    // モーションセンサの利用を許可
    await requestPermission()

    this.controls = new DeviceOrientationControls(this.camera, true)
    // DeviceOrientationControlsのデバイスごとのalpha値の違い吸収する
    window.addEventListener(
      'deviceorientation',
      (event: DeviceOrientationEvent) => {
        // alpha値が取得するのに時間がかかる端末のためにsetTimeoutを入れる
        setTimeout(() => {
          const deg = calcDeviceDirection(event)
          const rad = deg * (Math.PI / 180) // deg2rad (-π 〜 π)
          if (this.controls) this.controls.alphaOffset -= rad
        }, 50)
      },
      { once: true }
    )
    this.controls.connect()

    const video = document.createElement('video')
    const webcamTexture = await getWebcamTexture(video)
    this.scene.background = webcamTexture

    this.videoElement = createVideoElement('./sample.mp4')
    this.videoElement.load()
    const videoTexture = new THREE.VideoTexture(this.videoElement)
    videoTexture.minFilter = THREE.LinearFilter
    videoTexture.magFilter = THREE.LinearFilter

    const scale = 0.5
    this.videoPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(16 * scale, 9 * scale),
      new THREE.MeshBasicMaterial({ map: videoTexture })
    )
    this.videoPlane.rotation.x += Math.PI / 2
    this.scene.add(this.videoPlane)
    this.videoPlane.lookAt(this.camera.position)
    // モデルのコントロール
    this.orbitControls = new OrbitControls(
      this.videoPlane,
      this.renderer.domElement
    )
    this.orbitControls.reverseOrbit = true // touchによる移動方向を反転させる
    this.orbitControls.rotateSpeed = 0.3 // touchによる移動量を調整
    this.orbitControls.maxPolarAngle = Math.PI * 2
  }

  // レンダリングを開始する関数
  async start() {
    this.videoPlane!.position.set(0, 15, -10)
    this.renderer.setAnimationLoop(this.update.bind(this))
  }

  // 毎フレーム呼ばれる関数
  update() {
    this.renderer.render(this.scene, this.camera!)
    this.controls!.update()
    const frontDirection = this.getFrontDirection.updateFrontDirection(
      this.camera!,
      this.videoPlane!
    )
    this.dispatchReactAction!({ type: 'frontDirection', args: frontDirection })
    this.orbitControls!.update()
  }

  // WebGLメモリリークを防ぐ
  disposeModel() {
    this.renderer.dispose()
    this._clearThree(this.scene)
  }

  // Sceneの内部の全オブジェクトに対してメモリ開放する
  _clearThree(obj: any) {
    while (obj.children.length > 0) {
      this._clearThree(obj.children[0])
      obj.remove(obj.children[0])
    }
    if (obj.geometry) obj.geometry.dispose()
    if (obj.material) {
      Object.keys(obj.material).forEach((prop) => {
        if (!obj.material[prop]) return
        if (typeof obj.material[prop].dispose === 'function')
          obj.material[prop].dispose()
      })
      obj.material.dispose()
    }
  }
}
