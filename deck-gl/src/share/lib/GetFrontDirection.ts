import * as THREE from 'three'
import type { FrontDirection } from '../components/FrontDirectionArrows/FrontDirectionArrows'

/**
 * 特定の方向(THREE.Mesh)とカメラの向きが正面からどの位置にあるか判定するためのクラス
 */
export default class GetFrontDirection {
  cameraDirection: THREE.Vector3
  enableRightLeftArrows: boolean
  enableBack: boolean
  enableUpDownArrows: boolean
  /**
   * @param enableRightLeftArrows 正面に対して一定以上左右にカメラが回転しいる場合に左右に正面を案内する矢印を出すフラグ
   * @param enableBack 正面に対して一定以上カメラが左右方向に回転している場合に矢印を左右どちらにも出すフラグ
   * @param enableUpDownArrows 正面に対して一定以上上下にカメラが回転している場合に上下に正面を案内する矢印を出すフラグ
   */
  constructor(
    enableRightLeftArrows = true,
    enableBack = false,
    enableUpDownArrows = false
  ) {
    // TODO 上下左右の矢印を同時に扱うことができるようにする
    if (enableRightLeftArrows && enableUpDownArrows)
      throw new Error('左右上下の矢印を扱う実装は未実装です。')
    if (!enableRightLeftArrows && enableBack)
      throw new Error(
        '左右の矢印を扱うフラグ(enableRightLeftArrows)がfalseになっている時にenableBack=trueは設定できません。'
      )
    this.cameraDirection = new THREE.Vector3()
    this.enableRightLeftArrows = enableRightLeftArrows
    this.enableBack = enableBack
    this.enableUpDownArrows = enableUpDownArrows
  }

  /**
   * 正面として扱いたいMeshに対してカメラの向きが左右後のどこにあるのか毎フレーム判定するメソッド
   * requestAnimation内部で実行してください。
   * @param {THREE.Camera} camera
   * @param {THREE.Object3D | THREE.Group | THREE.Mesh}  正面として扱いたいTHREE.Meshを設定してください。
   * @param {number} frontValue 正面として扱う範囲0~1
   * @returns {FrontDirection | null}
   */
  updateFrontDirection(
    camera: THREE.Camera,
    object: THREE.Object3D | THREE.Group | THREE.Mesh,
    frontValue = 0.8
  ): FrontDirection | null {
    // カメラの正面のポジションを取得
    this.cameraDirection = camera.getWorldDirection(this.cameraDirection)

    if (this.enableRightLeftArrows) {
      // XZ平面におけるカメラの方向ベクトル
      const frontXZVector = new THREE.Vector3(
        this.cameraDirection.x,
        0,
        this.cameraDirection.z
      )

      // XZ正面における正面として扱いたい方向ベクトル
      const frontDirectionVector = new THREE.Vector3(
        object.position.x,
        0,
        object.position.z
      )
      // 内積 (カメラの方向ベクトルが正面として扱いたい方向ベクトルに対してどういう向きなのかを調べる)
      // -1 < dot < 0 は正面として扱いたい方向ベクトルがカメラの向きの反対側にある
      // 0 =< dot < 1 は正面として扱いたい方向ベクトルがカメラの向き側にある
      const dot = frontDirectionVector.normalize().dot(frontXZVector)
      // 0.8以上なら代替画面に対象(mesh)が描画される
      if (dot >= frontValue) {
        return null
      } else {
        // -0.2未満ならおおよそカメラが向いている方向から背中側に対象(mesh)がある
        if (dot < -0.2 && this.enableBack) {
          return 'back'
        } else {
          // 外積(正面として扱いたい方向ベクトルがカメラの方向ベクトルの左右どちら側にあるのかを計算する)
          const cross = frontXZVector.cross(frontDirectionVector)
          // crossのYがプラスならばカメラの方向ベクトルより左側に正面として扱いたい方向ベクトルがある
          // crossのYがプラスならばカメラの方向ベクトルより右側に正面として扱いたい方向ベクトルがある
          const rotationDirection = cross.y < 0 ? 'right' : 'left'

          return rotationDirection
        }
      }
    } else if (this.enableUpDownArrows) {
      // YZ平面におけるカメラの方向ベクトル
      const frontYZVector = new THREE.Vector3(
        0,
        this.cameraDirection.y,
        this.cameraDirection.z
      )
      // YZ正面における正面として扱いたい方向ベクトル
      const frontDirectionVector = new THREE.Vector3(
        0,
        object.position.y,
        object.position.z
      )
      const dot = frontDirectionVector.normalize().dot(frontYZVector)

      if (dot >= frontValue) {
        return null
      }
      // 90度以上ズレている場合は上下の判定がうまくいかないので暫定的に back を返す
      if (dot < 0) {
        return 'back'
      }
      const cross = frontYZVector.cross(frontDirectionVector)
      const rotationDirection = cross.x > 0 ? 'up' : 'down'
      return rotationDirection
    } else {
      return null
    }
  }
}
