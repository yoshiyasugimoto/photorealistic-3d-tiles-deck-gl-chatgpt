import { Button, Card, CardActions, CardContent } from '@mui/material'
import { FC, ReactElement, ReactNode } from 'react'

interface Props {
  children: ReactNode
  onClick: () => void
  buttonText: string
  buttonWidth?: number
  backgroundColor?: string
  customeButtonElement?: ReactElement
}

const ExplainCard: FC<Props> = ({
  children,
  onClick,
  buttonText,
  buttonWidth = 100,
  backgroundColor = '#fff',
  customeButtonElement,
}) => {
  return (
    <Card
      style={{
        margin: '0 2em',
        backgroundColor: backgroundColor,
      }}
    >
      <CardContent>{children}</CardContent>
      <CardActions style={{ textAlign: 'center' }}>
        <>
          <Button
            variant="contained"
            onClick={onClick}
            style={{
              width: `${buttonWidth}%`,
              padding: '0.5em 2em',
              backgroundColor: '#19bec8',
              marginBottom: '0.5em',
            }}
          >
            {buttonText}
          </Button>
          {customeButtonElement}
        </>
      </CardActions>
    </Card>
  )
}

export default ExplainCard
