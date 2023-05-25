import React from 'react'
import { Alert } from '@mui/material'

/**
 * ハンドリングしきれなかったエラーをすべて受け取ってエラーメッセージを表示するためのコンポーネント
 * 参考: https://www.asobou.co.jp/blog/web/error-boundary
 */
export default class TopLevelErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_error: any) {
    return { hasError: true }
  }

  componentDidMount() {
    window.addEventListener('unhandledrejection', this.onUnhandledRejection)
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.onUnhandledRejection)
  }

  onUnhandledRejection = (event: PromiseRejectionEvent) => {
    event.promise.catch((error) => {
      this.setState(TopLevelErrorBoundary.getDerivedStateFromError(error))
    })
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.log('Unexpected error occurred!', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '1em' }}>
          <Alert severity="error">
            エラーが発生しました
            <a href="#" onClick={() => location.reload()}>
              再読み込み
            </a>
          </Alert>
        </div>
      )
    }

    return this.props.children
  }
}
