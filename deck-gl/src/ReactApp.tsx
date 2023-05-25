import { FC, useEffect, useReducer } from 'react'
import { Typography } from '@mui/material'
import { Close } from '@mui/icons-material'
import CenteringFullScreenDialog from './share/components/CenteringFullScreenDialog/CenteringFullScreenDialog'
import ControlPanel from './share/components/ControlPanel/ControlPanel'
import Loading from './share/components/Loading/Loading'
import { ThreeApp } from './ThreeApp'
import ExplainCard from './share/components/ExplainCard/ExplainCard'
import Icon from './share/components/Icon/Icon'
import { getDeviceOrientation } from './share/lib/deviceOrientation'
import type { DeviceOrientation } from './share/lib/deviceOrientation'
import FrontDetectionArrows from './share/components/FrontDirectionArrows/FrontDirectionArrows'
import type { FrontDirection } from './share/components/FrontDirectionArrows/FrontDirectionArrows'
import {
  createVideoElement,
  onCanPlayVideoPromise,
} from './share/lib/videoUtils'

interface Props {
  threeApp: ThreeApp
}

export interface State {
  showWelcomeWindow: boolean
  showLoading: boolean
  screenshotModal: boolean
  deviceOrientation: DeviceOrientation
  startThreeApp: boolean
  frontDirection: FrontDirection | null
}

export interface Action {
  type:
    | 'setWelcomeWindow'
    | 'showLoading'
    | 'hideLoading'
    | 'setSwitchModal'
    | 'deviceOrientation'
    | 'startThreeApp'
    | 'frontDirection'
  args?: any
}

function reducer(state: State, { type, args }: Action): State {
  switch (type) {
    case 'setWelcomeWindow':
      return { ...state, showWelcomeWindow: args }
    case 'showLoading':
      return { ...state, showLoading: true }
    case 'hideLoading':
      return { ...state, showLoading: false }
    case 'deviceOrientation':
      return { ...state, deviceOrientation: args }
    case 'startThreeApp':
      return { ...state, startThreeApp: args }
    case 'frontDirection':
      return { ...state, frontDirection: args }
    default:
      return state
  }
}

const ReactApp: FC<Props> = ({ threeApp }) => {
  // useState だと ThreeApp 側から状態を変更させるために setter を大量に渡さなければいけないが、
  // useReducer であれば dispatch だけを渡せばよいので、このアプリでは useReducer で状態を管理する
  const [state, dispach] = useReducer(reducer, {
    showWelcomeWindow: true,
    showLoading: false,
    screenshotModal: false,
    deviceOrientation: 'vertical',
    startThreeApp: false,
    frontDirection: null,
  })

  async function onClickStartButton() {
    threeApp.videoElement?.load()
    await threeApp.videoElement?.play()
    await threeApp.initialize(dispach, state)
    dispach({ type: 'setWelcomeWindow', args: false })
    dispach({ type: 'showLoading' })
    dispach({ type: 'startThreeApp', args: true })
    await threeApp.start()
    dispach({ type: 'hideLoading' })
  }

  // デバイスの向きの検出
  useEffect(() => {
    // アプリケーション起動時のデバイスの向きの検出
    const startDeviceOrientation = getDeviceOrientation()
    dispach({ type: 'deviceOrientation', args: startDeviceOrientation })
    // アプリケーション起動後の向きの変更の検出
    const orientationchangeEventListener = () => {
      const deviceOrientation = getDeviceOrientation()
      dispach({ type: 'deviceOrientation', args: deviceOrientation })
    }
    window.addEventListener('orientationchange', orientationchangeEventListener)
    return () => {
      window.removeEventListener(
        'orientationchange',
        orientationchangeEventListener
      )
    }
  }, [])

  // three.jsのcanvasの描画を始めた後にアプリケーションの向きが変更された場合は、リロードを入れる
  useEffect(() => {
    if (state.startThreeApp) {
      dispach({ type: 'startThreeApp', args: false })
      threeApp.disposeModel()
      location.reload()
    }
  }, [state.deviceOrientation])

  // threeの初期メソッドを初回レンダリング時に実行しておく
  useEffect(() => {
    const init = async () => {
      const video = createVideoElement('./sample.mp4')
      await onCanPlayVideoPromise(video)
      threeApp.videoElement = video
    }
    init()
  }, [])

  // title
  useEffect(() => {
    document.title = 'ドリームスイッチ2体験版WebAR'
  }, [])

  return (
    <>
      {/* 最初に表示するモーダル */}
      <CenteringFullScreenDialog open={state.showWelcomeWindow}>
        <ExplainCard onClick={onClickStartButton} buttonText={'start'}>
          <Typography color="text.secondary">
            <br />
            スマートフォンの画面を地面に対して垂直にしてください。
          </Typography>
        </ExplainCard>
      </CenteringFullScreenDialog>
      {/* 読み込み中画像 */}
      <Loading show={state.showLoading} />

      <ControlPanel show={!state.showWelcomeWindow} size={3}>
        <Icon
          Icon={Close}
          style={{ color: '#fff' }}
          onClick={() => {
            dispach({ type: 'startThreeApp', args: false })
            // 戻る機能
            const historyLength = window.history.length
            window.history.go(-(historyLength - 1))
          }}
        />
      </ControlPanel>
      <FrontDetectionArrows
        frontDirectionState={
          state.frontDirection !== 'back' ? state.frontDirection : null
        }
      />
    </>
  )
}

export default ReactApp
