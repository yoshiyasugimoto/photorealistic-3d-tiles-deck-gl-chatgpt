import { Card } from '@mui/material'
import { ReactNode } from 'react'
import CenteringFullScreenDialog from '../CenteringFullScreenDialog/CenteringFullScreenDialog'

interface Props {
  open: boolean
  children: ReactNode
}

const ErrorModal = (props: Props) => {
  return (
    <CenteringFullScreenDialog open={props.open}>
      <Card
        style={{
          margin: '0 2em',
          backgroundColor: '#fff',
        }}
      >
        {props.children}
      </Card>
    </CenteringFullScreenDialog>
  )
}

export default ErrorModal
