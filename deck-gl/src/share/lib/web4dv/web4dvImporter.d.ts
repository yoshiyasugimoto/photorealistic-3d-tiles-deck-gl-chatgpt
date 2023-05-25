export default class WEB4DS extends THREE.EventDispatcher {
  constructor(
    id: string,
    urlD: string,
    urlM: string,
    urlA: string,
    position: number[],
    renderer: THREE.Renderer,
    scene: THREE.Scene | THREE.Object3D | THREE.Group,
    camera: THREE.Camera,
    useCache = false
  )
  model4D: Model4D
  destroy(callback?: () => void)
  load(showPlaceholder: boolean, playOnload: boolean, callback: () => void)
  play(autoUpdate: boolean)
}
