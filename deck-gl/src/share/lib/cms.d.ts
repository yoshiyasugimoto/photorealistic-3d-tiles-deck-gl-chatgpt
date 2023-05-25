export interface Vector3 {
  x: number
  y: number
  z: number
}

export interface Content {
  contentId: number
  name: string
  description?: string
  fileUrl: string
  fileHash: string
  fileSize: number
  rotation?: Vector3
  scale?: Vector3
  positionAdjustment?: Vector3
}

export interface PromotionContent extends Content {
  promotionContentId: number
  promotionContentName: string
  promotionContentDescription?: string
}

export interface AnchorContent extends Content {
  anchorContentId: number
  anchorContentName: string
  anchorContentDescription?: string
}

export interface Anchor {
  anchorId: number
  name: string
  description?: string
  relativePosition: {
    x: number
    z: number
  }
  geoPosition?: {
    lat: number
    lon: number
  }
  height: number
  hiddenFlag?: boolean
  anchorContent?: Content
  interactionContent?: Content
  actions?: any // TODO: 使うときが来たらちゃんと型かく
  anchorContents?: AnchorContent[]
}

export interface Promotion {
  promotionId: number
  name: string
  description?: string
  hiddenFlag?: boolean
  promotionType: number
  startMarkerLabel?: string
  photoMaxCount: number
  photoRetentionPeriodHours?: number
  executionCondition: {
    startDate: Date
    endDate: Date
  }
  durationSec?: number
  promotionContents?: PromotionContent[]
  avatar?: any // TODO: 使うときが来たらちゃんと型かく
  anchors?: Anchor[]
}

export interface Event {
  eventId: string
  name: string
  description?: string
  eventContents?: EventContent[]
  markerPromotions?: any // TODO: 使うときが来たらちゃんと型かく
  outdoorPromotions?: any // TODO: 使うときが来たらちゃんと型かく
}

export interface EventContent {
  eventContentId: number
  eventContentName: string
  eventContentDescription?: string
  contentId: number
  name: string
  fileUrl: string
  fileHash: string
  fileSize: number
}
