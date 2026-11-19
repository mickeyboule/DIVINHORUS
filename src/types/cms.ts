export type OrderStatus =
  | 'Nouvelle'
  | 'En cours'
  | 'Confirmée'
  | 'En expédition'
  | 'Terminée'
  | 'Annulée';

export type AvailabilityStatus = 'En stock' | 'Sur commande' | 'Édition limitée' | 'Rupture';

export type ArticleStatus = 'Publié' | 'Brouillon';

export type MediaFolder = 'produits' | 'articles' | 'categories' | 'site';

export type TestimonialStatus = 'Publié' | 'En attente' | 'Masqué';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  order: number;
  visible: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  reference: string;
  name: string;
  slug: string;
  price: number;
  categoryId: string;
  description: string;
  additionalInfo: string;
  images: string[];
  availability: AvailabilityStatus;
  stockCount: number;
  featured: boolean;
  active: boolean;
  orderCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productRef: string;
  unitPrice: number;
  quantity: number;
  image: string;
}

export interface OrderHistoryEntry {
  status: OrderStatus;
  date: string;
  note: string;
  actor: string;
}

export type InvoiceSignatureType = 'none' | 'image' | 'drawn' | 'text';

export interface InvoiceSignature {
  type: InvoiceSignatureType;
  imageUrl?: string;
  signerName: string;
  signerRole: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  reference?: string;
  quantity: number;
  unitPrice: number;
}

export type InvoicePaymentStatus = 'En attente de paiement' | 'Payée' | 'Partiellement payée';

export interface OrderInvoice {
  invoiceNumber: string;
  status: 'Brouillon' | 'Envoyée';
  paymentStatus: InvoicePaymentStatus;
  issuedAt: string;
  dueDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerCountry?: string;
  currencyCode: string;
  currencySymbol: string;
  items: InvoiceLineItem[];
  shippingFee: number;
  discount: number;
  subtotal: number;
  total: number;
  paymentMethod: string;
  paymentDetails: string;
  notes: string;
  signature: InvoiceSignature;
  sentAt: string | null;
  sentBy?: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  customerId: string;
  visitorId?: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  message: string;
  items: OrderItem[];
  subtotal?: number;
  shippingFee?: number;
  indicativeTotal: number;
  customerCountry?: string;
  displayCurrencyCode?: string;
  displayCurrencySymbol?: string;
  displayTotal?: number;
  adminNotes: string;
  history: OrderHistoryEntry[];
  invoice?: OrderInvoice;
}

export interface PublicOrderTrackingInfo {
  id: string;
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  customerFirstName: string;
  customerLastName: string;
  history: OrderHistoryEntry[];
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  country?: string;
  address: string;
  notes: string;
  createdAt: string;
  lastOrderAt: string;
  orderCount: number;
  totalIndicative: number;
}

export interface ArticleCategory {
  id: string;
  name: string;
  slug: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  categoryId: string;
  status: ArticleStatus;
  featured: boolean;
  likesCount: number;
  likedByKeys: string[];
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Testimonial {
  id: string;
  authorName: string;
  authorLocation: string;
  rating: number;
  content: string;
  status: TestimonialStatus;
  featured: boolean;
  visitorId?: string;
  createdAt: string;
}

export interface VisitorMemberPublic {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  country?: string;
  createdAt: string;
}

export interface VideoItem {
  id: string;
  title: string;
  youtubeUrl: string;
  youtubeId: string;
  thumbnail: string;
  description: string;
  duration: string;
  visible: boolean;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  folder: MediaFolder;
  sizeLabel: string;
  createdAt: string;
}

export interface HeroContent {
  visible: boolean;
  title: string;
  subtitle: string;
  image: string;
  primaryButtonLabel: string;
  primaryButtonTarget: string;
  secondaryButtonLabel: string;
  secondaryButtonTarget: string;
}

export interface MasterSectionContent {
  visible: boolean;
  photo: string;
  name: string;
  title: string;
  shortBio: string;
  approach: string;
  buttonLabel: string;
}

export interface HomeSectionsConfig {
  showFeaturedProducts: boolean;
  featuredProductsTitle: string;
  featuredProductsSubtitle: string;
  featuredProductIds: string[];
  showCommunityArticles: boolean;
  featuredArticlesTitle: string;
  featuredArticleIds: string[];
  showCommunityVideos: boolean;
  featuredVideosTitle: string;
  featuredVideoIds: string[];
  showTestimonials: boolean;
  featuredTestimonialsTitle: string;
  sectionOrder: Array<'master' | 'products' | 'articles' | 'videos' | 'testimonials'>;
}

export interface AboutCommitment {
  title: string;
  description: string;
}

export type FaqCategory = 'Enseignements' | 'Boutique' | 'Général';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
  visible: boolean;
}

export interface AboutPageContent {
  heroTitle: string;
  heroSubtitle: string;
  philosophyTitle: string;
  philosophyBody: string;
  lineageTitle: string;
  lineageBody: string;
  image: string;
  commitments: AboutCommitment[];
  faqTitle?: string;
  faqSubtitle?: string;
  faqs?: FaqItem[];
}

export interface ContactPageContent {
  title: string;
  subtitle: string;
  sanctuaryHours: string;
  consultationNote: string;
}

export type WelcomeAnnouncementType = 'welcome' | 'info' | 'important';

export interface WelcomeAnnouncement {
  enabled: boolean;
  type: WelcomeAnnouncementType;
  kicker?: string;
  kickerEn?: string;
  title: string;
  titleEn?: string;
  message: string;
  messageEn?: string;
  buttonLabel?: string;
  buttonLabelEn?: string;
  buttonTarget?: string;
  image?: string;
  displayFrequency: 'every_visit' | 'once_per_update';
  version: string;
}

export interface SiteContent {
  hero: HeroContent;
  master: MasterSectionContent;
  homeSections: HomeSectionsConfig;
  aboutPage: AboutPageContent;
  contactPage: ContactPageContent;
  welcomeAnnouncement?: WelcomeAnnouncement;
}

export interface SiteSettings {
  general: {
    siteName: string;
    tagline: string;
    logoUrl: string;
    faviconUrl: string;
    currencyCode?: string;
    currencySymbol: string;
    autoCurrencyByCountry?: boolean;
    orderNotificationEmail: string;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
  };
  socials: {
    youtube: string;
    tiktok: string;
    facebook: string;
    telegram: string;
  };
  youtubeSync?: {
    channelUrl: string;
    channelId: string;
    autoSync: boolean;
    lastSyncAt: string | null;
  };
  orderSettings: {
    confirmationMessage: string;
    deliveryZones: string;
    requireEmail: boolean;
    allowMultiProductCart: boolean;
    defaultShippingFee?: number;
    shippingRatesByCountry?: ShippingRateRule[];
    defaultPaymentMethod?: string;
    defaultPaymentDetails?: string;
    defaultInvoiceNotes?: string;
    defaultInvoiceSignature?: InvoiceSignature;
    teamWhatsappPhone?: string;
  };
}

export interface ShippingRateRule {
  countryCode: string;
  countryName: string;
  fee: number;
}

export interface AdminUserPublic {
  id: string;
  name: string;
  email: string;
  role: 'Super Administrateur' | 'Éditeur';
  createdAt: string;
  lastLoginAt: string | null;
}

export interface ActivityLog {
  id: string;
  actorName: string;
  action: string;
  target: string;
  category: 'commande' | 'produit' | 'contenu' | 'parametre' | 'securite';
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface GeoCurrencyInfo {
  countryCode: string;
  source: 'header' | 'ip' | 'accept-language' | 'default';
  rates: Record<string, number>;
}

export interface PublicBootstrapData {
  categories: Category[];
  products: Product[];
  articleCategories: ArticleCategory[];
  articles: Article[];
  videos: VideoItem[];
  testimonials: Testimonial[];
  siteContent: SiteContent;
  settings: SiteSettings;
  geo?: GeoCurrencyInfo;
}

export interface AdminBootstrapData {
  categories: Category[];
  products: Product[];
  orders: Order[];
  customers: Customer[];
  articleCategories: ArticleCategory[];
  articles: Article[];
  videos: VideoItem[];
  testimonials: Testimonial[];
  visitors: VisitorMemberPublic[];
  media: MediaItem[];
  siteContent: SiteContent;
  settings: SiteSettings;
  admins: AdminUserPublic[];
  activities: ActivityLog[];
  contactMessages: ContactMessage[];
}
