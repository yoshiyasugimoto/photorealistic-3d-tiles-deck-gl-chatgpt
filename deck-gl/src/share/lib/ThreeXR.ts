/**
 * Three.js で WebXR Device API を使うためのクラス
 */
export default class ThreeXR {
  renderer: THREE.WebGLRenderer
  domOverlayRoot: HTMLElement
  controller: THREE.XRTargetRaySpace
  session?: XRSession
  hitTestSource?: XRHitTestSource

  constructor(renderer: THREE.WebGLRenderer, domOverlayRoot: HTMLElement) {
    this.renderer = renderer
    this.domOverlayRoot = domOverlayRoot

    this.renderer.xr.enabled = true
    this.controller = this.renderer.xr.getController(0)
  }

  async initialize(): Promise<void> {
    // requestSession
    if (
      !navigator.xr ||
      !(await navigator.xr.isSessionSupported('immersive-ar'))
    )
      throw new Error('WebXR Device API is not supported')
    this.session = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['hit-test', 'dom-overlay'],
      domOverlay: { root: this.domOverlayRoot },
    } as XRSessionInit)
    this.renderer.xr.setReferenceSpaceType('local')
    await this.renderer.xr.setSession(this.session)

    // requestHitTestSource
    this.hitTestSource = await this.session.requestHitTestSource!({
      space: await this.session.requestReferenceSpace('viewer'),
    })
    if (!this.hitTestSource) throw new Error('hitTestSource is undefined')
  }

  // hit test をして成功したら pose を返す
  hitTest(frame: XRFrame): XRPose | null {
    const referenceSpace = this.renderer.xr.getReferenceSpace()
    if (!referenceSpace) throw new Error('referenceSpace is null')
    const hit = frame.getHitTestResults(this.hitTestSource!)
    if (hit.length === 0) return null
    return hit[0].getPose(referenceSpace) || null
  }

  async end() {
    await this.session?.end()
  }
}
