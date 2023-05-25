/**
 * Blob 画像を Data URL 画像に変換する関数
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
export async function blobToDataURL(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const fileReader = new FileReader()

    const subscribe = () => {
      fileReader.addEventListener('abort', onAbort)
      fileReader.addEventListener('error', onError)
      fileReader.addEventListener('load', onLoad)
    }

    const unsubscribe = () => {
      fileReader.removeEventListener('abort', onAbort)
      fileReader.removeEventListener('error', onError)
      fileReader.removeEventListener('load', onLoad)
    }

    const onAbort = () => {
      unsubscribe()
      reject(new Error('abort'))
    }

    const onError = (event: ProgressEvent<FileReader>) => {
      unsubscribe()
      reject(event.target!.error)
    }

    const onLoad = (event: ProgressEvent<FileReader>) => {
      unsubscribe()
      resolve(event.target!.result as string)
    }

    subscribe()
    fileReader.readAsDataURL(blob)
  })
}

/**
 * Data URL 画像を Blob 画像に変換する関数
 * @param {string} dataUrl
 * @returns {Promise<Blob>}
 */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return await (await fetch(dataUrl)).blob()
}

/**
 * Data URL 画像を img 要素に変換する関数
 * @param {string} dataUrl
 * @returns {Promise<HTMLImageElement>}
 */
export function dataUrlToImageElement(
  dataUrl: string
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = (e) => reject(e)
    image.src = dataUrl
  })
}

/**
 * 複数の img 要素の画像を重ね合わせてひとつの img 要素を返す関数
 * @param {HTMLElement[]} images
 * @param {{ w:number; h:number }} size
 * @returns {Promise<HTMLImageElement>}
 */
export async function mergeImages(
  images: HTMLImageElement[],
  size: { w: number; h: number }
): Promise<HTMLImageElement> {
  if (images.length === 0) throw new Error('画像が指定されていません')
  const canvas = document.createElement('canvas')
  canvas.width = size.w
  canvas.height = size.h
  const ctx = canvas.getContext('2d')!
  images.forEach((image) => ctx.drawImage(image, 0, 0, size.w, size.h))
  return await dataUrlToImageElement(canvas.toDataURL())
}
