import { IconProps } from '@mui/material'
import { FC } from 'react'
import style from './ControlPanelIcon.module.css'

interface Props extends IconProps {
  Icon: FC // TODO: 型がゆるいのでちゃんとしたい
}

const ControlPanelIcon: FC<Props> = ({ Icon, ...props }) => {
  return (
    <div className={style.ControlPanelIcon}>
      <Icon fontSize="inherit" {...props} />
    </div>
  )
}

export default ControlPanelIcon
