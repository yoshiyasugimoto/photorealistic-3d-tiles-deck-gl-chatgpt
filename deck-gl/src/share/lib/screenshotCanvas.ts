import * as THREE from 'three'

export interface AddContents {
  contentPath: string
  contentPositionX?: number | 'center' // コンテンツのX方向の位置
  contentPositionY?: number // コンテンツのY方向の位置
  scale?: number // コンテンツのスケール
}

/**
 * HTMLCanvasによるスクリーンショットを可能にするクラス
 */
export default class ScreenshotCanvas {
  threeCanvas: HTMLCanvasElement
  baseCanvas: HTMLCanvasElement
  copyrightCanvas: HTMLCanvasElement
  w: number
  h: number
  resolutionScale: number //解像度の倍率
  addContents?: AddContents[]
  url?: string

  /**
   * @constructor
   * @param {THREE.WebGLRenderer} renderer
   * @param {number} width スクショ対象の幅px
   * @param {number} height スクショ対象の縦px
   * @param {number} resolutionScale 画像の解像度
   * 参考：インスタグラムのアスペクト比： 1350 / 1080
   */
  constructor(
    renderer: THREE.WebGLRenderer,
    width: number,
    height: number,
    resolutionScale = 2
  ) {
    this.threeCanvas = renderer.domElement
    const enableScreenshot =
      renderer.getContextAttributes().preserveDrawingBuffer
    // THREE.WebGLRendererの初期化の際に{ preserveDrawingBuffer: true }を追加しているか確認
    // 上記を追加していない場合、スクリーンショット画像が白になる
    if (!enableScreenshot)
      throw Error('Add { preserveDrawingBuffer: true } to THREE.WebGLRenderer')
    this.baseCanvas = document.createElement('canvas') //ベースとなるキャンバス
    this.w = 1080
    this.h = this.w * (height / width)
    this.resolutionScale = resolutionScale
    // フレームにコピーライトを重ねるためのHTMLCanvas
    this.copyrightCanvas = document.createElement('canvas')
    this.copyrightCanvas.width = this.w * this.resolutionScale
    this.copyrightCanvas.height = this.h * this.resolutionScale
    // 解像度をx倍にする
    this.baseCanvas.width = this.w * this.resolutionScale
    this.baseCanvas.height = this.h * this.resolutionScale
  }

  /**
   * HTMLCanvasを画像にする変換するメソッド
   * @param {HTMLCanvasElement} canvas
   * @returns {Promise<HTMLImageElement>}
   */
  imageFromCanvas(canvas: HTMLCanvasElement): Promise<HTMLImageElement> {
    return new Promise<HTMLImageElement>((resolve) => {
      const image = new Image()
      image.width = this.w
      image.height = this.h
      image.src = canvas.toDataURL('image/png')
      image.onload = () => resolve(image)
    })
  }

  /**
   *コピーライトを付与する付与してスクリーンショットの画像URLを生成するためのメソッド
   * @param {AddContents} addContents フレームに追加するコンテンツ
   * @param {string[]} colorCodes カラーコードを格納するための引数(ランダムにフレームの色をつけたい場合は'random'を設定すると良い)
   * @returns {Promise<string>}
   */
  async compositeCanvas(
    addContents?: AddContents[],
    ...colorCodes: string[]
  ): Promise<string> {
    this.addContents = addContents
    const context = this.baseCanvas.getContext('2d')
    if (!context) throw Error()

    // three.jsで描画したcanvasをcontextに追加する
    const threeCanvasImage: HTMLImageElement = await this.imageFromCanvas(
      this.threeCanvas
    )

    const threeCanvasAspectratio =
      this.threeCanvas.width / this.threeCanvas.height // 元のアスペクト比
    const baseCanvasAspectratio = this.baseCanvas.width / this.baseCanvas.height // キャンバスを重ねるアスペクト比

    // 元のthreeCanvasを格納
    let drawWidth = this.threeCanvas.width
    let drawHeight = this.threeCanvas.height

    // スペクト比を保ったまま元のthreeCanvasのサイズを調整
    if (threeCanvasAspectratio > baseCanvasAspectratio) {
      drawWidth = baseCanvasAspectratio * this.threeCanvas.height
    }
    if (threeCanvasAspectratio < baseCanvasAspectratio) {
      drawHeight = this.threeCanvas.width / baseCanvasAspectratio
    }

    const diffWidth = this.threeCanvas.width - drawWidth
    const diffHeight = this.threeCanvas.height - drawHeight

    context.drawImage(
      threeCanvasImage, //baseCanvasに貼り付ける画像
      diffWidth / 2, //貼り付ける画像の切り取りを始めるx座標
      diffHeight / 2, //貼り付ける画像の切り取りを始めるy座標
      this.threeCanvas.width - diffWidth, //貼り付ける画像の切り取りの横幅
      this.threeCanvas.height - diffHeight, //貼り付ける画像の切り取りの縦幅
      0, //baseCanvasに貼り付けを始めるx座標
      0, //baseCanvasに貼り付けを始めるy座標
      this.baseCanvas.width, //baseCanvasに貼り付ける横幅
      this.baseCanvas.height //baseCanvasに貼り付ける縦幅
    )

    // フレームをbaseCanvasのcontextに追加する
    this.addFrame(context, ...colorCodes)

    const copyrightContext = this.copyrightCanvas.getContext('2d')
    if (!copyrightContext) throw Error()

    // コンテンツの追加
    if (this.addContents) {
      await Promise.all(
        this.addContents?.map((obj) => this.addcontent(copyrightContext, obj))
      )
    }

    const copyrightCanvasImage = await this.imageFromCanvas(
      this.copyrightCanvas
    )
    context.drawImage(
      copyrightCanvasImage,
      0,
      0,
      this.copyrightCanvas.width,
      this.copyrightCanvas.height,
      0,
      0,
      this.baseCanvas.width,
      this.baseCanvas.height
    )
    const screenshotImageDataURL = this.baseCanvas.toDataURL('image/png') // dataURL形式への変換(data:[<mediatype>][;base64],<data>)
    const blob = await (await fetch(screenshotImageDataURL)).blob()
    // 一意なURLへ変換する
    this.url = URL.createObjectURL(blob)

    return this.url
  }

  /**
   * 画像をロードするメソッド
   * @param {string} imagePath
   * @returns {Promise<HTMLImageElement>}
   */
  loadImage(imagePath: string): Promise<HTMLImageElement> {
    return new Promise<HTMLImageElement>((resolve) => {
      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.onload = () => resolve(image)
      image.src = imagePath
    })
  }

  /**
   * コンテンツをコピーライトに追加
   * @param context
   * @param {AddContents} addContents
   */
  async addcontent(
    context: CanvasRenderingContext2D,
    addContents: AddContents
  ) {
    if (!addContents) throw Error()
    const contentImgCanvas = await this.loadImage(addContents.contentPath).then(
      (img) => {
        // コンテンツの元素材のリサイズ
        const canvas = document.createElement('canvas')
        // コンテンツの縦サイズをピクセル * 解像度
        const contentHeight = 70
        // コンテンツのオリジナルの縦サイズを取得
        const originalHeight = img.height
        // キャンバスの縦サイズをコンテンツのオリジナルの縦サイズにする
        canvas.height = originalHeight
        // キャンバスの横サイズをコンテンツのオリジナルの縦サイズに合わせてリサイズ
        canvas.width = (img.width * contentHeight) / originalHeight
        const context = canvas.getContext('2d')
        context?.drawImage(
          img,
          0,
          0,
          (img.width * contentHeight) / originalHeight, //コンテンツの横サイズを縦サイズに合わせて調整
          contentHeight
        )
        return canvas
      }
    )

    const contentPositionX = addContents.contentPositionX || 0
    const contentPositionY = addContents.contentPositionY || 0
    const scale = addContents.scale || 1.0
    const contentPositionWidthCenter =
      (this.copyrightCanvas.width - contentImgCanvas.width * scale) / 2

    context.drawImage(
      contentImgCanvas, //描画するコンテンツイメージ
      0, //元コンテンツイメージの使用範囲のx座標
      0, //元コンテンツイメージの使用範囲のy座標
      contentImgCanvas.width, // 元コンテンツイメージの使用範囲の幅
      contentImgCanvas.height, // 元コンテンツイメージの使用範囲の高さ
      contentPositionX === 'center'
        ? contentPositionWidthCenter
        : contentPositionX * this.resolutionScale, // 描画するコンテンツイメージのx座標
      contentPositionY * this.resolutionScale, // 描画イメージのy座標
      contentImgCanvas.width * scale, //コンテンツイメージを描画する幅
      contentImgCanvas.height * scale //コンテンツイメージを描画する高さ
    )
  }

  /**
   * 対象のキャンバスにフレームを追加するメソッド
   * @param {CanvasRenderingContext2D} context
   * @param {string[]} colorCodes
   */
  addFrame(context: CanvasRenderingContext2D, ...colorCodes: string[]) {
    // 何も設定されないのであれば、フレームをなくす
    if (!colorCodes.length) return
    context.rect(
      0,
      0,
      this.w * this.resolutionScale,
      this.h * this.resolutionScale
    )
    // フレームの色をランダムで設定
    //第二引数を消すことでランダムにフレームのカラーを設定する
    if (colorCodes[0] === 'random') this.setFrameColor(context)

    // フレームの幅のピクセル設定
    context.lineWidth = 250
    // フレームを描画
    context.stroke()
  }

  /**
   * フレームの色を設定するメソッド
   * TODO リファクタリング
   * @param {CanvasRenderingContext2D} context
   * @param {string[]} colorCodes カラーコードを格納するための引数
   * (指定しない場合はランダムでフレームにグラデーションがかかる。
   *  単色を指定した場合はその色単体のフレームになる。
   *  複数色を指定した場合は0番目から順に白になるように上からグラデーションがかかる)
   * @returns
   */
  setFrameColor(context: CanvasRenderingContext2D, ...colorCodes: string[]) {
    const lineargradient = context.createLinearGradient(
      0, // グラデーションの始まりx座標
      0, // グラデーションの始まりy座標
      0, // グラデーションの終わりx座標
      this.h * this.resolutionScale // グラデーションの終わりy座標
    )
    const length = colorCodes.length
    // ランダムでフレームにグラデーションした色をつける
    if (length === 0) {
      this.randomFrameColor(context, lineargradient)
    } else if (length === 1) {
      context.strokeStyle = colorCodes[0]
      return
      // グラデーションを複数色を指定した場合
    } else {
      colorCodes.forEach((colorCode, index) => {
        lineargradient.addColorStop(index / (length + 2), colorCode)
      })
      lineargradient.addColorStop((length + 1) / (length + 2), '#FFF')
      lineargradient.addColorStop((length + 2) / (length + 2), '#FFF')
    }
    context.strokeStyle = lineargradient
  }

  /**
   * ランダムでフレームの色をつけるメソッド
   * @param {CanvasRenderingContext2D} context
   * @param {CanvasGradient} lineargradient
   */
  randomFrameColor(
    context: CanvasRenderingContext2D,
    lineargradient: CanvasGradient
  ) {
    const randomNum = Math.floor(Math.random() * 4)
    if (randomNum === 0) {
      // 紺色のグラデーション
      lineargradient.addColorStop(0, 'rgb(4,20,52)')
      lineargradient.addColorStop(0.7, '#4169E1')
      lineargradient.addColorStop(0.85, '#FFF')
      lineargradient.addColorStop(1, '#FFF')

      //シルバー
    } else if (randomNum === 1) {
      lineargradient.addColorStop(0, '#757575')
      lineargradient.addColorStop(0.45, '#9E9E9E')
      lineargradient.addColorStop(0.7, '#E8E8E8')
      lineargradient.addColorStop(0.85, '#9E9E9E')
      lineargradient.addColorStop(1, '#757575')
    } else if (randomNum === 2) {
      //ゴールド&シルバー
      lineargradient.addColorStop(0, '#B67B03')
      lineargradient.addColorStop(0.45, '#DAAF08')
      lineargradient.addColorStop(0.7, '#FEE9A0')
      lineargradient.addColorStop(0.85, '#DAAF08')
      lineargradient.addColorStop(1, '#B67B03')

      lineargradient.addColorStop(0, '#757575')
      lineargradient.addColorStop(0.45, '#9E9E9E')
      lineargradient.addColorStop(0.7, '#E8E8E8')
      lineargradient.addColorStop(0.85, '#9E9E9E')
      lineargradient.addColorStop(1, '#757575')
    } else {
      // ゴールド
      lineargradient.addColorStop(0, '#B67B03')
      lineargradient.addColorStop(0.45, '#DAAF08')
      lineargradient.addColorStop(0.7, '#FEE9A0')
      lineargradient.addColorStop(0.85, '#DAAF08')
      lineargradient.addColorStop(1, '#B67B03')
    }
  }

  /**
   * 生成したHTMLCanvasの解放処理をするメソッド
   * 連続して、スクショを利用する場合は利用してください
   */
  feelingMemory() {
    if (this.baseCanvas) {
      this.baseCanvas.height = 0
      this.baseCanvas.width = 0
      this.baseCanvas.remove()
    }
    if (this.copyrightCanvas) {
      this.copyrightCanvas.height = 0
      this.copyrightCanvas.width = 0
      this.copyrightCanvas.remove()
    }
    if (this.url) {
      URL.revokeObjectURL(this.url)
    }
  }
}
