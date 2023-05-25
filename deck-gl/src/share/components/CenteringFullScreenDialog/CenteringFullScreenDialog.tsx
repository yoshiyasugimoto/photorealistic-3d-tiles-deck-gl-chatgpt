import { Box, Dialog } from '@mui/material'
import type { DialogProps } from '@mui/material'
import { FC, ReactNode } from 'react'

interface Props extends DialogProps {
  children: ReactNode
  contentHeight?: number
}

/**
 * <Dialog fullscreen> のコンテンツを縦方向にセンタリングしたもの
 */
const CenteringFullScreenDialog: FC<Props> = ({
  children,
  contentHeight = 50,
  ...props
}) => {
  return (
    <Dialog fullScreen {...props}>
      <Box
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          height: `${contentHeight}%`,
          width: `100%`,
          margin: 'auto',
          textAlign: 'center',
        }}
      >
        {children}
      </Box>
    </Dialog>
  )
}

export default CenteringFullScreenDialog
