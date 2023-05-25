import { FC, CSSProperties } from 'react'
import Icon from '../Icon/Icon'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'

export type FrontDirection = 'back' | 'right' | 'left' | 'up' | 'down'

export const Arrows: FC<{
  arrowDirection: 'right' | 'left' | 'up' | 'down'
}> = ({ arrowDirection }) => {
  const baseArrowStyle: CSSProperties = {
    color: '#fff',
    fontSize: '5em',
    position: 'absolute',
  }

  return (
    <>
      {[...Array(2)].map((_, index) => {
        const arrowStyle =
          arrowDirection === 'right'
            ? {
                transform: 'rotate(180deg)',
                right: `${10 * (index + 1)}%`,
                top: '50%',
                ...baseArrowStyle,
              }
            : arrowDirection === 'left'
            ? {
                left: `${10 * (index + 1)}%`,
                top: '50%',
                ...baseArrowStyle,
              }
            : arrowDirection === 'up'
            ? {
                transform: 'rotate(90deg)',
                left: '40%',
                top: '5%',
                ...baseArrowStyle,
              }
            : {
                transform: 'rotate(-90deg)',
                left: '40%',
                bottom: '5%',
                ...baseArrowStyle,
              }
        return (
          <div key={index}>
            <Icon Icon={ArrowBackIosIcon} style={{ ...arrowStyle }} />
          </div>
        )
      })}
    </>
  )
}

interface Props {
  frontDirectionState: FrontDirection | null
}

const FrontDetectionArrows: FC<Props> = ({ frontDirectionState }) => {
  return frontDirectionState ? (
    <>
      {(frontDirectionState === 'right' || frontDirectionState === 'back') && (
        <Arrows arrowDirection="right" />
      )}
      {(frontDirectionState === 'left' || frontDirectionState === 'back') && (
        <Arrows arrowDirection="left" />
      )}
      {frontDirectionState === 'up' && <Arrows arrowDirection="up" />}
      {frontDirectionState === 'down' && <Arrows arrowDirection="down" />}
    </>
  ) : (
    <></>
  )
}

export default FrontDetectionArrows
