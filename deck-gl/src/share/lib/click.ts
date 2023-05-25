import * as THREE from 'three'

/**
 * 3D オブジェクトのクリックを検出できるようにする関数
 * @param {HTMLElement} target  clickイベントが発火する元となる要素
 * @param {THREE.Scene} THREE.Scene
 * @param {THREE.Camera} THREE.Camera
 */
export function proxyClickEvent(
  target: HTMLElement, // click イベントが発火する元となる要素
  scene: THREE.Scene,
  camera: THREE.Camera
) {
  const raycaster = new THREE.Raycaster()
  target.addEventListener('click', (event) => {
    // 画面左下を (-1, -1) 画面右上を (1, 1) とする座標系でクリックした位置を表現する
    // ※ クリック位置が期待する座標とズレてしまう問題があるが根本解決できていないので、
    //    以下の adjustTouchAreaX で調整することで暫定対応している
    const adjustTouchAreaX = target.clientWidth / window.innerWidth
    const vec = new THREE.Vector2(
      ((event.clientX / window.innerWidth) * 2 - 1) / adjustTouchAreaX,
      (event.clientY / window.innerHeight) * -2 + 1
    )
    raycaster.setFromCamera(vec, camera)
    const intersects = raycaster.intersectObjects(scene.children)
    // 1クリックでひとつのオブジェクトに対して多数の intersects が得られることがあるので、重複排除する
    const objects = Array.from(
      new Set(intersects.map((i) => i.object).filter((o) => o.visible))
    )
    objects.forEach((object) => object.dispatchEvent({ type: 'click' }))
  })
}
