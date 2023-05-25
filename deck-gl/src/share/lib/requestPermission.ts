interface DeviceOrientationEventiOS extends DeviceOrientationEvent {
  requestPermission: () => Promise<'granted' | 'denied'>
}

interface DeviceMotionEventiOS extends DeviceMotionEvent {
  requestPermission: () => Promise<'granted' | 'denied'>
}

/**
 * デバイスのジャイロセンサー(モーションと画面の向き)へのアクセス許可確認の関数
 * @returns {Promise<void>}
 */
export async function requestPermission(): Promise<void> {
  // iOS だけ DeviceMotionEvent も許可を得る必要がある
  if (
    typeof DeviceMotionEvent !== 'undefined' &&
    typeof (DeviceMotionEvent as unknown as DeviceMotionEventiOS) // unknown型にキャストしてから使うことでany型よりは型安全になる
      .requestPermission === 'function'
  ) {
    // unknown型にキャストしてから型定義をすることで、any型よりは型安全になる
    const requestPermission = (
      DeviceOrientationEvent as unknown as DeviceOrientationEventiOS
    ).requestPermission
    if (typeof requestPermission === 'function') await requestPermission()
  }
  // video の許可は後ろの方でやるのでここには書かないでいる
  // getUserMedia を2回呼ぶと Google Pixel などでエラーが出ることがあるので、2回呼ばないためにもここではやらない
  // https://lealog.hateblo.jp/entry/2020/01/29/170250
}
