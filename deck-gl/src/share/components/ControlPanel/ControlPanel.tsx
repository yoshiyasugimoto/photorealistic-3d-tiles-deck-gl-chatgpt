import { FC } from 'react'
import { ReactNode } from 'react'
import style from './ControlPanel.module.css'

interface Props {
  children: ReactNode
  size?: number
  show?: boolean
}

/**
 * 画面右上にボタンを並べる
 */
const ControlPanel: FC<Props> = ({ children, size = 1, show = true }) => {
  return (
    <div
      className={style.ControlPanel}
      style={{
        display: show ? 'block' : 'none',
        fontSize: size + 'em',
        zIndex: '999',
      }}
    >
      {children}
    </div>
  )
}

export default ControlPanel
