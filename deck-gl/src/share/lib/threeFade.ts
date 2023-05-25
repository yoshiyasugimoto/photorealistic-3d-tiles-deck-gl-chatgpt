import * as THREE from 'three'

type FadeType = 'fadeIn' | 'fadeOut' // フェードインとフェードアウトの判別をするための型

/**
 * Three空間上のTHREE.Object3D | THREE.Group | THREE.Meshに対してフェードする機能を付与するクラス
 * 透明度は0で透明, 1で完全に不透明になります。
 */
export class ThreeFade {
  object: THREE.Object3D | THREE.Group | THREE.Mesh
  maxOpacity = 1 // 最大の透過度
  minOpacity = 0 // 最小の透過度
  opacity?: number // 現在の透過度

  /**
   * @param {THREE.Object3D | THREE.Group | THREE.Mesh} object フェードをしたいTHREE.Mesh
   */
  constructor(object: THREE.Object3D | THREE.Group | THREE.Mesh) {
    this.object = object
  }

  /**
   * フェードイン・アウトするためにマイフレーム実行するメソッド。
   * 透明度は0で透明, 1で完全に不透明になります。
   * @param {FadeType} fadeType
   * @param {number} opacitySpeed  フェードイン・アウトして透明になるまでの速度(0~1)
   * @param {number} maxOpacity 最大の透過度を指定してください(0~1), デフォルト1
   * @param {number} minOpacity 最小の透過度を指定してください(0~1), デフォルト0
   */
  update(
    fadeType: FadeType = 'fadeOut',
    opacitySpeed = 0.01,
    maxOpacity = 1,
    minOpacity = 0
  ) {
    this.maxOpacity = maxOpacity
    this.minOpacity = minOpacity

    if (fadeType === 'fadeOut') {
      this._fadeOut(opacitySpeed)
    } else {
      this._fadeIn(opacitySpeed)
    }
  }

  /**
   * フェードアウトするメソッド。
   * @param {number} opacitySpeed フェードアウトが完了するまでの速度
   */
  private _fadeOut(opacitySpeed: number) {
    // フェードアウト時の透明度の初期値の追加
    if (!this.opacity) this.opacity = this.maxOpacity
    // フェードアウトの終わりを検出
    if (this.opacity <= this.minOpacity) return
    this.opacity -= opacitySpeed
    // THREE.Object3D | THREE.Group | THREE.Meshのそれぞれの型に対応して処理を書く
    if (this.object instanceof THREE.Mesh) {
      this._changeMaterialOpacity(this.object.material, this.opacity)
    } else {
      const opacity = this.opacity
      this.object.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          this._changeMaterialOpacity(obj.material, opacity)
        }
      })
    }
  }

  /**
   * フェードインするメソッド。
   * @param {number} opacitySpeed フェードインが完了するまでの速度
   */
  private _fadeIn(opacitySpeed: number) {
    // フェードイン時の透明度の初期値の追加
    if (!this.opacity) this.opacity = this.minOpacity
    // フェードインの終わりを検出
    if (this.opacity >= this.maxOpacity) {
      return
    }
    this.opacity += opacitySpeed
    // THREE.Object3D | THREE.Group | THREE.Meshのそれぞれの型に対応して処理を書く
    if (this.object instanceof THREE.Mesh) {
      this._changeMaterialOpacity(this.object.material, this.opacity)
    } else {
      const opacity = this.opacity
      this.object.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          this._changeMaterialOpacity(obj.material, opacity)
        }
      })
    }
  }

  /**
   * マテリアルの透過度を変更するメソッド
   * @param {THREE.Material} material
   * @param {number} opacity
   */
  private _changeMaterialOpacity(
    material: THREE.Material | THREE.Material[],
    opacity: number
  ) {
    if (Array.isArray(material)) {
      material.forEach((material) => {
        material.opacity = opacity
      })
    } else {
      material.opacity = opacity
    }
  }
}
