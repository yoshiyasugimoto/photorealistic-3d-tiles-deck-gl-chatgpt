/**
 * スクリーンが垂直になるようにスマホを持っているときの
 * スクリーン裏面が向いている方角 (-180 〜 180) を計算する関数
 * 用法としてはThree.jsのDeviceOrientationControlsのデバイスごとの向きの違いに対応するために利用する
 * @param {DeviceOrientationEvent} e
 * @return {number} angle
 */
export function calcDeviceDirection(e: DeviceOrientationEvent): number {
  const ry = ((e.gamma || 0) * Math.PI) / 180
  const rx = ((e.beta || 0) * Math.PI) / 180
  const rz = ((e.alpha || 0) * Math.PI) / 180
  const cy = Math.cos(ry)
  const sy = Math.sin(ry)
  const cx = Math.cos(rx)
  const sx = Math.sin(rx)
  const cz = Math.cos(rz)
  const sz = Math.sin(rz)
  const x = -(sy * cz + cy * sx * sz)
  const y = -(sy * sz - cy * sx * cz)
  const z = -(cy * cx)

  const angle = Math.atan2(-x, y) * (180.0 / Math.PI)
  return angle
}
