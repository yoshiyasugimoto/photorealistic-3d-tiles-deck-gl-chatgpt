import * as THREE from 'three'
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

/**
 * THREE.Object3D, THREE.Group, THREE.Meshの解放するための関数。
 * 必要無くなったオブジェクトをvisible=falseだけでは、計算リソースを使っているのでこの関数を使ってオブジェクトの削除をするのがよさそう。
 * https://threejs.org/docs/#manual/en/introduction/How-to-dispose-of-objects
 * @param {THREE.Scene} scene
 * @param {THREE.Object3D | THREE.Group | THREE.Mesh} object 削除したいTHREE.Object3D, THREE.Group, THREE.Meshのいずれかを設定
 */
export function destoryObject(
  scene: THREE.Scene,
  object: THREE.Object3D | THREE.Group | THREE.Mesh
) {
  // シーンから必要無くなったメッシュの削除
  scene.remove(object)
  // THREE.Object3D, THREE.Groupの場合は返す
  if (!(object instanceof THREE.Mesh)) return
  // ジオメトリの削除
  object.geometry.dispose()
  // マテリアルの削除
  if (Array.isArray(object.material)) {
    object.material.forEach((material) => {
      material.dispose()
    })
  } else {
    object.material.dispose()
  }
}

/**
 * 非同期でGLTFをロードするための便利関数
 * @param {string} fileUrl gltfモデルのファイルパス
 * @returns {GLTF} gltfモデル
 */
export async function loadGltf(fileUrl: string): Promise<GLTF> {
  const gltfLoader = new GLTFLoader()
  const gltf = gltfLoader.loadAsync(fileUrl)
  return gltf
}
