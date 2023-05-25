import * as THREE from 'three'

/**
 * 床に投影されたオブジェクトの影
 */
export class FloorShadow {
  scene: THREE.Scene
  shadow: THREE.Mesh<THREE.BoxGeometry, THREE.ShadowMaterial>
  shadowLight: THREE.DirectionalLight

  /**
   * オブジェクトの影を床に投影する
   * ※ renderer.shadowMap.enabled = true は別途設定する必要がある
   * @param {THREE.Scene} scene
   * @param {THREE.Object3D[] | THREE.Group[] | THREE.Mesh[]} targets
   * @param {number} floorHeight
   * @param {number} resolution // 影の解像度(11~13が良さそう) ※高すぎるとiOS Safariで処理落ちする。低すぎると影がそれっぽく無くなる
   * @param {THREE.Camera} camera
   */
  constructor(
    scene: THREE.Scene,
    targets: THREE.Object3D[] | THREE.Group[] | THREE.Mesh[],
    floorHeight = 0,
    resolution = 11,
    camera: THREE.Camera
  ) {
    // 影を映すライトを追加する
    const shadowLight = new THREE.DirectionalLight(0xffffff, 0) // intentisy = 0.0 でも影は出せるらしい
    shadowLight.castShadow = true
    shadowLight.shadow.mapSize.width = Math.pow(2, resolution) // 影の解像度(iOS Safariで処理落ちするので11ぐらいにした方が良さそう)
    shadowLight.shadow.mapSize.height = Math.pow(2, resolution) // 影の解像度
    shadowLight.shadow.radius = 20 // 影のぼかし具合
    // シャドーカメラ領域の大きさを設定
    const distances = targets.map((t) => camera.position.distanceTo(t.position))
    const distance = Math.max(...distances)
    const shadowCameraScale = distance + 5
    shadowLight.shadow.camera.left = -1 * shadowCameraScale
    shadowLight.shadow.camera.right = shadowCameraScale
    shadowLight.shadow.camera.top = shadowCameraScale
    shadowLight.shadow.camera.bottom = -1 * shadowCameraScale
    shadowLight.shadow.camera.far = 50
    scene.add(shadowLight)
    scene.add(shadowLight.target)
    // シャドーカメラ領域を可視化(開発用)
    // const helper = new THREE.CameraHelper(shadowLight.shadow.camera)
    // scene.add(helper)

    // 影を投影する床を追加する
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(2000, 0.01, 2000),
      new THREE.ShadowMaterial()
    )
    floor.material.opacity = 0.6 // 影の濃さ
    floor.receiveShadow = true
    floor.position.y = floorHeight
    scene.add(floor)

    // 各ターゲットオブジェクトに castShadow を設定する
    targets.forEach((target) => {
      target.traverse((object) => {
        if (object instanceof THREE.Mesh) object.castShadow = true
      })
    })

    this.scene = scene
    this.shadow = floor
    this.shadowLight = shadowLight
  }

  /**
   * オブジェクトが動いた場合に影を追従させるメソッド
   * @param target
   */
  update(target: THREE.Object3D | THREE.Group | THREE.Mesh) {
    this.shadow.position.y = target.position.y
    this.shadowLight.position.set(
      target.position.x,
      target.position.y + 30,
      target.position.z
    )
    this.shadowLight.target.position.set(
      target.position.x,
      target.position.y - 10,
      target.position.z
    )
  }

  /**
   * 影を非表示とする
   */
  hide() {
    this.shadowLight.castShadow = false
  }

  /**
   * 影を表示する
   */
  show() {
    this.shadowLight.castShadow = true
  }

  /**
   * Sceneから影を削除する
   */
  dispose() {
    this.scene.remove(this.shadow)
    this.shadow.material.dispose()
    this.shadow.geometry.dispose()

    this.scene.remove(this.shadowLight)
  }
}
