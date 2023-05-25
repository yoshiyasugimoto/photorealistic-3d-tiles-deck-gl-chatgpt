import { FC, Ref } from 'react'
import {
  Dialog,
  Box,
  Card,
  Button,
  CardActions,
  CardContent,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import DownloadIcon from '@mui/icons-material/Download'
import { isIOS } from '../../lib/device'
import type { DeviceOrientation } from '../../lib/deviceOrientation'
import Icon from '../Icon/Icon'
import ReplyIcon from '@mui/icons-material/Reply'

//Androidの時、ダウンロードボタンを表示してスクリーンショットダウンロードを可能にする
const iOS = isIOS()

const isInstagramWebView =
  /Instagram/.test(navigator.userAgent) && !iOS ? true : false

interface Props {
  open: boolean
  onClickShareScreenshotButton: () => void
  onClickScreenshotDonwloadButton: () => void
  onClickCloseButton: () => void
  screenshotImgRef: Ref<HTMLImageElement>
  errorNavigatorShare?: boolean
  deviceOrientation?: DeviceOrientation
}

const ScreenshotModal: FC<Props> = ({
  open,
  onClickShareScreenshotButton,
  onClickScreenshotDonwloadButton,
  onClickCloseButton,
  screenshotImgRef,
  errorNavigatorShare = false,
  deviceOrientation = 'vertical',
}) => {
  return (
    <Dialog fullScreen open={open}>
      <Box
        style={{
          top: 0,
          bottom: 0,
          margin: 'auto',
          display: 'flex',
        }}
      >
        <Card
          style={{
            margin: '0 auto',
            backgroundColor: '#000',
            width: '85%',
          }}
        >
          <CardContent>
            <Icon
              Icon={CloseIcon}
              style={{
                color: '#fff',
                position: 'absolute',
                right: '0.5em',
                fontSize: '3em',
              }}
              onClick={onClickCloseButton}
            />
            <img
              style={{
                width: deviceOrientation.match(/horizontal/) ? '50%' : '80%',
                margin: '0.5em auto',
                display: 'block',
              }}
              ref={screenshotImgRef}
            />
          </CardContent>
          <CardActions style={{ textAlign: 'center' }}>
            {/* Androidの場合はダウンロードボタンを表示する */}
            {iOS ? (
              <></>
            ) : (
              <Button
                variant="contained"
                onClick={onClickScreenshotDonwloadButton}
                style={{
                  width: '50%',
                  padding: '0.5em 2em',
                  backgroundColor: '#19bec8',
                  marginBottom: '0.5em',
                }}
              >
                <DownloadIcon
                  style={{
                    color: '#fff',
                    fontSize: '2em',
                  }}
                />
                <Typography variant="body1">download</Typography>
              </Button>
            )}
            <Button
              variant="contained"
              onClick={onClickShareScreenshotButton}
              style={{
                width: `${iOS ? 100 : 50}%`,
                padding: '0.5em 2em',
                backgroundColor: '#19bec8',
                marginBottom: '0.5em',
              }}
            >
              <ReplyIcon
                style={{
                  color: '#fff',
                  fontSize: '2em',
                  transform: 'scale(-1, 1)',
                }}
              />
              <Typography variant="body1" style={{ paddingRight: '1em' }}>
                share
              </Typography>
            </Button>
          </CardActions>
          {/* なんらかの理由でnavigator.shareが動かなかった場合の案内UI */}
          {errorNavigatorShare && (
            <Typography
              variant="body1"
              style={{
                color: 'rgba(255,255,255,0.5)',
                padding: '0.5em 2em',
                marginBottom: '0.5em',
              }}
            >
              ※Shareボタンが動作しない場合は画像を長押し後「共有」を選択することで同様の操作ができます
            </Typography>
          )}
          {isInstagramWebView && (
            <Typography
              variant="body1"
              style={{
                color: 'rgba(255,255,255,0.5)',
                padding: '0.5em 2em',
                marginBottom: '0.5em',
              }}
            >
              DOWNLOAD機能、SHARE機能を使いたい場合はChromeブラウザをお使いください
            </Typography>
          )}
        </Card>
      </Box>
    </Dialog>
  )
}

export default ScreenshotModal
