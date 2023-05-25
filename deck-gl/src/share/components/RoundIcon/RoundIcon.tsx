import { FC } from 'react'
import type { IconProps } from '@mui/material'
import style from './RoundIcon.module.css'

interface Props extends IconProps {
  Icon: FC // TODO: 型がゆるいのでちゃんとしたい
}

/**
 * カメラ映像の上に被せても見やすいようにアイコンを配置する
 */
const RoundIcon: FC<Props> = ({ Icon, ...props }) => {
  return (
    <div className={style.RoundIcon}>
      <Icon fontSize="inherit" {...props} />
    </div>
  )
}

export default RoundIcon
