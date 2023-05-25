import * as THREE from 'three'
import ThreeXR from './ThreeXR'

// モデルが回転するためのプロパティをTHREE.Object3Dに追加するための型定義
interface ModelObject extends THREE.Object3D {
  _animation: boolean
}
/**
 * WebXR Device APIにおいて対象のモデルのサイズをピンチイン・ピンチアウトで変更可能にするクラス
 * また、画面を一本指で長押しするとヒットテストを再実行してモデルの位置を変更できる
 * WebXR Devide APIのヒットテストの実行の終わりに実行してください。
 * TODO フラグで機能制限を可能にする
 */
export default class WebXrChangeModelSizeEvent {
  domOverlay: HTMLElement
  pinchDistance?: number
  modelObject: ModelObject
  moveModel = false
  selectPosition?: THREE.Vector3

  /**
   *
   * @param domOverlay
   * @param modelObject カスタムのモデルオブジェクト
   * @param selectPosition ヒットテスト時に取得したモデルのポジション
   */
  constructor(
    domOverlay: HTMLElement,
    modelObject: ModelObject,
    selectPosition?: THREE.Vector3
  ) {
    this.domOverlay = domOverlay
    this.modelObject = modelObject
    this.selectPosition = selectPosition
  }

  /**
   * WebXR Devide APIのヒットテストの実行の終わりに実行してください。
   */
  start() {
    this.domOverlay.addEventListener('touchmove', (e) => {
      e.preventDefault()
      // 画面を一本指でタッチしているかの判定
      const isOneTouch = e.touches.length === 1
      if (this.modelObject && this.selectPosition && isOneTouch) {
        this.moveModel = true
      }
      // 画面を二本指でタッチしているかの判定
      const isDoubleTouch = e.touches.length === 2
      // ヒットテストでモデルの初期描画ポジションを決定後、
      // 画面を二本指でタッチしているかの判定がtrueの場合
      if (this.modelObject && this.selectPosition && isDoubleTouch) {
        // 画面を一本指でタッチしているかの判定をfalseにする
        this.moveModel = false
        const x1 = e.touches[0].pageX //一本目の指のx座標
        const y1 = e.touches[0].pageY //一本目の指のy座標
        const x2 = e.touches[1].pageX //二本目の指のx座標
        const y2 = e.touches[1].pageY //二本目の指のy座標
        // ピンチの距離
        const pinchDistance = Math.sqrt(
          Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)
        )
        // ピンチを始めた初回はthis.pinchDistanceにピンチの距離を設定する
        if (!this.pinchDistance) {
          this.pinchDistance = pinchDistance
          return
        }
        const prevPichDistance = this.pinchDistance // 前回のピンチの距離
        this.pinchDistance = pinchDistance // 今回のピンチの距離
        const changeScaleVector3 = new THREE.Vector3(0.01, 0.01, 0.01) // スケールの変更量
        // ピンチアウト
        if (pinchDistance - prevPichDistance > 0.1) {
          if (this.modelObject.scale.x > 10) return
          this.modelObject.scale.add(changeScaleVector3) // モデルを拡大
          // ピンチイン
        } else if (pinchDistance - prevPichDistance < 0.1) {
          if (this.modelObject.scale.x < 0.1) return
          this.modelObject.scale.sub(changeScaleVector3) // モデルを縮小
        }
      }
    })
    // 位置を決定する
    this.domOverlay.addEventListener('touchend', () => {
      // falseにすることで、位置決めを終了する
      this.moveModel = false
    })
  }
  /**
   * モデルの位置を変更するためのupdateメソッド
   * requestAnimationの更新タイミングに合わせて実行されるように設定してください。
   * @param reticle // 位置決めのために地面に投影する円
   */
  update(reticle: THREE.Mesh, xr: ThreeXR, frame: XRFrame) {
    // モデルの位置を再設定する
    if (this.moveModel) {
      const pose = xr.hitTest(frame)
      reticle.visible = !!pose
      if (pose) reticle.matrix.fromArray(pose.transform.matrix)
    }
  }
}
