import { FC } from 'react'
import style from './Loading.module.css'

interface Props {
  show: boolean
}

const Loading: FC<Props> = ({ show }) => {
  return (
    <div
      className={style.Loading}
      style={{ display: show ? 'block' : 'none' }}
    />
  )
}

export default Loading
