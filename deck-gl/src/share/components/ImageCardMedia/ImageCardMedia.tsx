import { CardMedia } from '@mui/material'
import { FC } from 'react'

interface Props {
  src: string
}

const ImageCardMedia: FC<Props> = ({ src }) => {
  return (
    <CardMedia
      component={'img'}
      image={src}
      sx={{
        // 横向きの時のスタイルを当てる
        '@media screen and (orientation: landscape)': {
          margin: 'auto',
          right: '0',
          left: '0',
          height: '40vh',
          width: 'auto',
        },
      }}
    />
  )
}

export default ImageCardMedia
