import type {
  Promotion,
  Content,
  Anchor,
  PromotionContent,
  EventContent,
  Event,
} from './cms.d'

interface GetPromotionArgs {
  API_ENDPOINT?: string
  API_KEY?: string
  APP_ID?: string
  EVENT_ID?: string
  PROMOTION_ID?: string
}

/**
 * CMSのプロモーションを返却する関数
 * @param {GetPromotionArgs} args
 * @returns {Promise<Promotion>}
 */
export async function getPromotion(
  args: GetPromotionArgs = {}
): Promise<Promotion> {
  const _args = Object.assign(
    {
      API_ENDPOINT: import.meta.env.VITE_CMS_API_ENDPOINT,
      API_KEY: import.meta.env.VITE_CMS_API_KEY,
      APP_ID: import.meta.env.VITE_CMS_APP_ID,
      EVENT_ID: import.meta.env.VITE_CMS_EVENT_ID,
      PROMOTION_ID: import.meta.env.VITE_CMS_PROMOTION_ID,
    },
    args
  )
  const url = `${_args.API_ENDPOINT}/cms/v1/events/_me/promotions/${_args.PROMOTION_ID}`
  const headers = {
    'X-FS-API-KEY': _args.API_KEY,
    'X-FS-APP-ID': _args.APP_ID,
    'X-FS-EVENT-ID': _args.EVENT_ID,
  }
  const response = await fetch(url, { headers })
  const promotion: Promotion = await response.json()
  return promotion
}

/**
 * CMS に設定された値をもとにオブジェクトの 位置・大きさ・向き を更新する関数
 * @param {THREE.Object3D} obj
 * @param {Content} content
 */
export function applyCmsContentParams(
  obj: THREE.Object3D,
  content: Content
): void {
  if (content.positionAdjustment) {
    obj.position.x += content.positionAdjustment.x // 左右
    obj.position.y += content.positionAdjustment.y // 高さ
    obj.position.z += content.positionAdjustment.z // 前後
  }
  if (content.scale) {
    obj.scale.x *= content.scale.x
    obj.scale.y *= content.scale.y
    obj.scale.z *= content.scale.z
  }
  if (content.rotation) {
    obj.rotation.x += content.rotation.x
    obj.rotation.y += content.rotation.y
    obj.rotation.z += content.rotation.z
  }
  obj.updateMatrixWorld()
}

/**
 * アンカーの名前でアンカーを取得するメソッド
 * @param {string} name
 * @param {Anchor[]} anchors
 * @returns {Anchor}
 */
export function getAnchor(name: string, anchors: Anchor[]): Anchor {
  const anchor = anchors.find((obj) => obj.name === name)
  if (!anchor) throw Error('Anchor is None.')
  return anchor
}

/**
 * プロモーションコンテンツの名前でコンテンツ取得をするメソッド
 * @param {string} promotionContentName
 * @param {PromotionContent[]} promotionContents
 * @returns {PromotionContent}
 */
export function getPromotionContent(
  promotionContentName: string,
  promotionContents: PromotionContent[]
): PromotionContent {
  const promotionContent = promotionContents.find(
    (obj) => obj.promotionContentName === promotionContentName
  )
  if (!promotionContent) throw new Error('PromotionContent is None')
  return promotionContent
}

type GetEventContentsArgs = Omit<GetPromotionArgs, 'PROMOTION_ID'>
/**
 * イベントコンテンツの取得をするメソッド
 * @param {GetEventContentsArgs} args
 * @returns {Promise<EventContent[]>}
 */
export async function getEventContents(
  args?: GetEventContentsArgs
): Promise<EventContent[]> {
  const _args = Object.assign(
    {
      API_ENDPOINT: import.meta.env.VITE_CMS_API_ENDPOINT,
      API_KEY: import.meta.env.VITE_CMS_API_KEY,
      APP_ID: import.meta.env.VITE_CMS_APP_ID,
      EVENT_ID: import.meta.env.VITE_CMS_EVENT_ID,
    },
    args
  )

  const url = `${_args.API_ENDPOINT}/cms/v1/events/_me`
  const headers = {
    'X-FS-API-KEY': _args.API_KEY,
    'X-FS-APP-ID': _args.APP_ID,
    'X-FS-EVENT-ID': _args.EVENT_ID,
  }
  const response = await fetch(url, { headers })
  const data: Event = await response.json()
  if (!data.eventContents) throw new Error('EventContents is None')
  return data.eventContents
}

export interface GpsPosition {
  latitude: number
  longitude: number
}

/**
 * 緯度経度から距離を計算するメソッド
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} distance[m]
 */
export function calcDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0
  const R = Math.PI / 180
  lat1 *= R
  lon1 *= R
  lat2 *= R
  lon2 *= R
  return (
    6371000 *
    Math.acos(
      Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1) +
        Math.sin(lat1) * Math.sin(lat2)
    )
  )
}

export interface GpsPosition {
  latitude: number
  longitude: number
}

export type ContentArea = {
  area: 'promotion' | 'anchor'
  anchorName: string | null
}

/**
 * 現在地点がアプリケーションを描画して良い座標なのかをチェックするメソッド
 * @param {GpsPosition} gpsPosition
 * @param {ContentArea} contentArea anchorでGPSのチェックをしたい場合はanchorNameを指定してください。
 * @returns {Promise<boolean>}
 */
export async function checkGps(
  gpsPosition: GpsPosition,
  contentArea: ContentArea = { area: 'promotion', anchorName: null },
  cmsInfo: any = {}
): Promise<boolean> {
  if (contentArea.area === 'anchor' && !contentArea?.anchorName)
    throw new Error(
      'AnchorでGPSによるアプリケーションの利用制限を決めるにはanchorNameを指定してください。'
    )
  const _args = Object.assign(
    {
      API_ENDPOINT: import.meta.env.VITE_CMS_API_ENDPOINT,
      API_KEY: import.meta.env.VITE_CMS_API_KEY,
      APP_ID: import.meta.env.VITE_CMS_APP_ID,
      EVENT_ID: import.meta.env.VITE_CMS_EVENT_ID,
      PROMOTION_ID: import.meta.env.VITE_CMS_PROMOTION_ID,
    },
    cmsInfo
  )

  const url = `${_args.API_ENDPOINT}/cms/v1/events/_me/promotions/${_args.PROMOTION_ID}`
  const headers = {
    'X-FS-API-KEY': _args.API_KEY,
    'X-FS-APP-ID': _args.APP_ID,
    'X-FS-EVENT-ID': _args.EVENT_ID,
  }

  const response = await fetch(url, { headers })
  const promotion: Promotion = await response.json()
  const content =
    contentArea.area === 'promotion'
      ? promotion
      : promotion.anchors?.find(
          (anchor) => anchor.name === contentArea.anchorName
        )
  if (!content?.description) {
    console.error(
      'CMSからアプリケーションの使用可能な範囲が取得できませんでした。'
    )
    return false
  }
  // アプリケーションの使用可能な範囲をCMSに登録されている半径から取得
  const radius = parseInt(JSON.parse(content.description)['radius[m]'])
  // アプリケーションの使用可能な範囲をCMSに登録されている緯度から取得
  const latitude = parseFloat(JSON.parse(content.description)['latitude'])
  // アプリケーションの使用可能な範囲をCMSに登録されている経度から取得
  const longitude = parseFloat(JSON.parse(content.description)['longitude'])
  // 現在地からアプリケーションの利用可能な位置の中心からの距離の取得
  const distance = calcDistance(
    gpsPosition.latitude,
    gpsPosition.longitude,
    latitude,
    longitude
  )

  return radius > distance ? true : false
}
