import * as THREE from 'three'

const worldToThree = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(1, 0, 0),
  THREE.MathUtils.degToRad(-90)
)
const threeToWorld = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(1, 0, 0),
  THREE.MathUtils.degToRad(90)
)

export const identity = new THREE.Quaternion(0, 0, 0, 1)

/**
 * ワールド空間の位置情報・向きをThree空間に変換したオブジェクト
 */
export const WorldToThree = {
  getRotation(worldrotation: THREE.Quaternion): THREE.Quaternion {
    const rotationThree = new THREE.Quaternion(
      worldrotation.x,
      worldrotation.y,
      worldrotation.z,
      worldrotation.w
    )
    rotationThree.multiplyQuaternions(worldToThree, rotationThree)
    return rotationThree
  },

  getPosition(worldPosition: THREE.Vector3): THREE.Vector3 {
    return new THREE.Vector3(worldPosition.x, worldPosition.z, -worldPosition.y)
  },
}
/**
 * Three空間の位置情報・向きをワールド空間に変換したオブジェクト
 */
export const ThreeToWorld = {
  getRotation(threeRotation: THREE.Quaternion): THREE.Quaternion {
    const worldRotation = new THREE.Quaternion(
      threeRotation.x,
      threeRotation.y,
      threeRotation.z,
      threeRotation.w
    )
    worldRotation.multiplyQuaternions(threeToWorld, worldRotation)
    return worldRotation
  },

  getPosition(threePosition: THREE.Vector3): THREE.Vector3 {
    return new THREE.Vector3(threePosition.x, -threePosition.z, threePosition.y)
  },
}
