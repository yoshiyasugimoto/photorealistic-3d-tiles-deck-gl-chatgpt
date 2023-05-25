import { FC } from 'react'
import type { IconProps } from '@mui/material'

interface Props extends IconProps {
  Icon: FC
}

const Icon: FC<Props> = ({ Icon, ...props }) => {
  return (
    <div>
      <Icon fontSize="inherit" {...props} />
    </div>
  )
}

export default Icon
