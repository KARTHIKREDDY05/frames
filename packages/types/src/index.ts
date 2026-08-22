export type Privacy = "PUBLIC" | "FRIENDS";
export type MediaType = "IMAGE" | "VIDEO";
export type FrameStyle =
  | "POLAROID"
  | "FILMSTRIP"
  | "TORN_PAPER"
  | "STICKER"
  | "MINIMAL"
  | "VINTAGE"
  | "INSTANT_CLASSIC"
  | "CONTACT_SHEET"
  | "NEGATIVE_STRIP"
  | "SLIDE_MOUNT"
  | "POSTCARD"
  | "NOTEBOOK"
  | "WASHI_COLLAGE"
  | "CINEMA"
  | "MAGAZINE"
  | "STAMP";
export type FriendshipStatus = "PENDING" | "ACCEPTED" | "BLOCKED";
export type YearbookStatus = "GENERATING" | "READY" | "FAILED";
export type UserRole = "USER" | "ADMIN";
export type ProfileVisibility = "PUBLIC" | "PRIVATE";
export type PhotoFilter =
  | "ORIGINAL"
  | "WARM"
  | "COOL"
  | "MONO"
  | "FADE"
  | "PUNCH"
  | "DREAMY"
  | "NOIR"
  | "CHROME"
  | "BLUSH"
  | "TEAL"
  | "GOLD"
  | "DRAMA"
  | "SOFT"
  | "GRAIN"
  | "SUNSET";

export interface UserDto {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatarUrl?: string | null;
  bio?: string | null;
  defaultPrivacy: Privacy;
  profileVisibility?: ProfileVisibility;
  usernameUpdatedAt?: string | null;
  lastSeenAt?: string | null;
  role?: UserRole;
}

export interface PostDto {
  id: string;
  user: UserDto;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl?: string | null;
  caption?: string | null;
  locationName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  privacy: Privacy;
  frameStyle: FrameStyle;
  filterPreset?: PhotoFilter;
  profileFeatured?: boolean;
  createdAt: string;
  expiresAt: string;
  reactionCount: number;
  commentCount: number;
}

export interface DailyFrameDto {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  coverMediaUrl?: string | null;
  renderedImageUrl?: string | null;
  metadata: Record<string, unknown>;
  posts: PostDto[];
}

export interface MonthlyCollageDto {
  id: string;
  year: number;
  month: number;
  title: string;
  coverUrl?: string | null;
  renderedImageUrl?: string | null;
  metadata: Record<string, unknown>;
}

export interface YearbookDto {
  id: string;
  year: number;
  title: string;
  coverUrl?: string | null;
  pdfUrl?: string | null;
  videoUrl?: string | null;
  status: YearbookStatus;
  metadata: Record<string, unknown>;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export type PrintOrderStatus =
  | "PENDING"
  | "SUBMITTED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "FAILED";

export interface PrintShippingAddress {
  name: string;
  addressLine1: string;
  city: string;
  zipCode: string;
  country?: string;
}

export interface PrintOrderDto {
  id: string;
  orderId: string;
  userId: string;
  dateTitle: string;
  photoUrls: string[];
  shippingAddress: PrintShippingAddress;
  totalPrice: string;
  status: PrintOrderStatus;
  partnerOrderId?: string | null;
  trackingNumber?: string | null;
  estimatedDelivery?: string | null;
  createdAt: string;
  updatedAt: string;
}
export type ProductType =
  | "POLAROID_PACK"
  | "FRIDGE_MAGNETS"
  | "SCRAPBOOK_ALBUM"
  | "KEEPSAKE_CAPSULE";

export interface CreatePrintOrderRequest {
  dateTitle: string;
  photoUrls: string[];
  shippingName: string;
  shippingAddress: string;
  city: string;
  zipCode: string;
  country?: string;
  totalPrice?: string;
  productType?: ProductType;
  quantity?: number;
  magnetTypes?: string[];
  giftNote?: string;
}

export interface PrintPricingOption {
  id: string;
  productType?: ProductType;
  name: string;
  description: string;
  paperStock: string;
  dimensions: string;
  basePrice: string;
  tierPrice: string;
  currency: string;
  shippingEstimateDays: string;
  badge?: string;
  icon?: string;
}

export interface PrintPricingDto {
  currency: string;
  defaultSku: string;
  options: PrintPricingOption[];
}

export type PaymentProvider = "RAZORPAY" | "STRIPE" | "UPI_DIRECT";

export interface CreatePaymentOrderRequest {
  amountInPaise: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
  productType?: ProductType;
  provider?: PaymentProvider;
}

export interface PaymentOrderResponse {
  paymentOrderId: string;
  keyId?: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  clientSecret?: string;
  status: "CREATED" | "PROCESSING" | "PAID";
}

export interface VerifyPaymentRequest {
  paymentOrderId: string;
  paymentId: string;
  signature?: string;
  orderId?: string;
}

export interface VerifyPaymentResponse {
  verified: boolean;
  transactionId: string;
  status: string;
}


