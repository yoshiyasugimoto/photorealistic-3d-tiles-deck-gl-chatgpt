export type EasingName = 'easeInExpo' | 'easeOutExpo' | 'easeInOutExpo' // easeInExpo=徐々に加速、easeOutExpo=徐々に減速、easeInOutExpo=加速してから減速

/**
 * 引数で指定したイージング関数を返す関数
 * イージング関数:時間経過に応じて変化の速度を調整する
 * @param {EasingName} easingName easeInExpo=徐々に加速、easeOutExpo=徐々に減速、easeInOutExpo=加速してから減速
 * @returns {(currentTime: number,beginningValue: number,changeValue: number,duration: number) => number} easing関数を返却
 * currentTime=経過時間[ms], beginningValue=始点, changeValue=変化量, duration=変化にかける時間[ms]
 * 参考:https://ics.media/entry/17470/
 */
export function getEasing(
  easingName: EasingName
): (
  currentTime: number,
  beginningValue: number,
  changeValue: number,
  duration: number
) => number {
  let ease
  switch (easingName) {
    case 'easeInExpo': {
      ease = function (
        currentTime: number,
        beginningValue: number,
        changeValue: number,
        duration: number
      ) {
        return currentTime == 0
          ? beginningValue
          : changeValue * Math.pow(2, 10 * (currentTime / duration - 1)) +
              beginningValue
      }
      break
    }
    case 'easeOutExpo': {
      ease = function (
        currentTime: number,
        beginningValue: number,
        changeValue: number,
        duration: number
      ) {
        return currentTime == duration
          ? beginningValue + changeValue
          : changeValue * (-Math.pow(2, (-10 * currentTime) / duration) + 1) +
              beginningValue
      }
      break
    }
    case 'easeInOutExpo': {
      ease = function (
        currentTime: number,
        beginningValue: number,
        changeValue: number,
        duration: number
      ) {
        if (currentTime == 0) return beginningValue
        if (currentTime == duration) return beginningValue + changeValue
        if ((currentTime /= duration / 2) < 1)
          return (
            (changeValue / 2) * Math.pow(2, 10 * (currentTime - 1)) +
            beginningValue
          )
        return (
          (changeValue / 2) * (-Math.pow(2, -10 * --currentTime) + 2) +
          beginningValue
        )
      }
      break
    }
  }
  return ease
}
