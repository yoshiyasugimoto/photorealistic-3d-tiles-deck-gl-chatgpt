import * as THREE from 'three'
/**
 * HTMLCanvasElementをテクスチャとして、
 * 文字入りのTHREE.PlaneGeometryを生成する関数
 */
interface TransformArgs {
  position?: { x: number; y: number; z: number }
  rotation?: { x: number; y: number; z: number }
  scale?: { x: number; y: number; z: number }
}
interface textConfig {
  text: string
  textColor: string
  textStrokeColor: string
  abortTime: number
  durationTime: number
}
function drawTextCanvas(
  canvas: HTMLCanvasElement,
  textConfig: textConfig,
  fontSize: number,
  progress: number,
  mask = false
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.font = String(fontSize) + 'px "Zen Old Mincho"'
  ctx.lineWidth = 10
  const pLength = Math.floor(
    textConfig.text.replace(/\r?\n/g, '').length * progress
  )

  // 正規表現を使って改行で分割する
  const lines = textConfig.text.split(/\r?\n/)

  let maxWidth = 0
  lines.forEach((line) => {
    ctx.beginPath()
    const lineInspect = ctx.measureText(line)
    maxWidth = Math.max(maxWidth, lineInspect.width)
  })

  canvas.width = maxWidth
  canvas.height = lines.length * (fontSize + 20) * 1.1

  ctx.beginPath()
  if (mask) {
    ctx.fillStyle = 'rgb(0, 0, 0)'
  } else {
    ctx.fillStyle = textConfig.textStrokeColor
  }
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  let count = 0
  const pLines: string[] = []
  while (count < pLength) {
    const checkLine: string | undefined = lines.shift()
    if (!(typeof checkLine === 'string')) return
    if (count + checkLine.length < pLength) {
      pLines.push(checkLine)
      count += checkLine.length
    } else {
      pLines.push(checkLine?.slice(0, pLength - count))
      count = pLength
    }
  }

  pLines.forEach((line, i) => {
    const y = i * (fontSize * 1.1)

    // 縁取り文字描画
    ctx.beginPath()
    ctx.font = String(fontSize) + 'px "Zen Old Mincho"'
    ctx.textBaseline = 'top'
    ctx.lineWidth = 10
    if (mask) {
      ctx.strokeStyle = 'rgb(255, 255, 255)'
    } else {
      ctx.strokeStyle = textConfig.textStrokeColor
    }
    ctx.strokeText(line, 0, y, canvas.width)

    // 縁取らない文字描画
    ctx.beginPath()
    ctx.font = String(fontSize) + 'px "Zen Old Mincho"'
    if (mask) {
      ctx.fillStyle = 'rgb(255, 255, 255)'
    } else {
      ctx.fillStyle = textConfig.textColor
    }
    ctx.fillText(line, 0, y, canvas.width)
  })
  return canvas
}

export function addTextCanvasPlane(
  scene: THREE.Scene,
  textConfig: textConfig,
  transform: TransformArgs = {}
) {
  const textCanvas = document.createElement('canvas')
  drawTextCanvas(textCanvas, textConfig, 100, 0)
  if (!textCanvas) return
  const textTexture = new THREE.CanvasTexture(textCanvas)
  if (!textTexture) return
  textTexture.needsUpdate = true

  const maskCanvas = document.createElement('canvas')
  drawTextCanvas(maskCanvas, textConfig, 100, 0, true)
  if (!maskCanvas) return
  const maskTexture = new THREE.CanvasTexture(maskCanvas)
  if (!maskTexture) return
  maskTexture.needsUpdate = true

  const geometry = new THREE.PlaneGeometry()
  const material = new THREE.MeshBasicMaterial({
    map: textTexture,
    alphaMap: maskTexture,
    transparent: true,
  })

  const mesh = new THREE.Mesh(geometry, material)
  if (!material.map) return
  material.map.needsUpdate = true

  const startTime = Date.now()
  let currentTime = Date.now()
  let stopFlag = false
  function render() {
    currentTime = Date.now()
    const elapsedTime = currentTime - startTime
    if (elapsedTime > textConfig.abortTime * 1000) {
      const progress = Math.min(
        (elapsedTime - textConfig.abortTime * 1000) /
          (textConfig.durationTime * 1000),
        1
      )
      drawTextCanvas(textCanvas, textConfig, 100, progress)
      drawTextCanvas(maskCanvas, textConfig, 100, progress, true)
      textTexture.needsUpdate = true
      maskTexture.needsUpdate = true
      if (progress === 1) stopFlag = true
    }
    if (!stopFlag) requestAnimationFrame(render)
  }
  requestAnimationFrame(render)

  const canvasRatio = textCanvas.height / textCanvas.width

  if (transform.position)
    mesh.position.set(
      transform.position.x,
      transform.position.y,
      transform.position.z
    )

  if (transform.rotation)
    mesh.rotation.set(
      transform.rotation.x,
      transform.rotation.y,
      transform.rotation.z
    )

  if (transform.scale)
    mesh.scale.set(
      transform.scale.x,
      transform.scale.y * canvasRatio,
      transform.scale.z
    )

  scene.add(mesh)
  return mesh
}
