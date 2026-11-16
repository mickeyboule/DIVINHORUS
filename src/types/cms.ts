export type OrderStatus = 'Nouvelle' | 'En cours' | 'Confirmée' | 'Terminée' | 'Annulée';

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

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  customerId: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryAddress: string;
  message: string;
  items: OrderItem[];
  indicativeTotal: number;
  adminNotes: string;
  history: OrderHistoryEntry[];
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
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

export interface AboutPageContent {
  heroTitle: string;
  heroSubtitle: string;
  philosophyTitle: string;
  philosophyBody: string;
  lineageTitle: string;
  lineageBody: string;
  image: string;
  commitments: AboutCommitment[];
}

export interface ContactPageContent {
  title: string;
  subtitle: string;
  sanctuaryHours: string;
  consultationNote: string;
}

export interface SiteContent {
  hero: HeroContent;
  master: MasterSectionContent;
  homeSections: HomeSectionsConfig;
  aboutPage: AboutPageContent;
  contactPage: ContactPageContent;
}

export interface SiteSettings {
  general: {
    siteName: string;
    tagline: string;
    logoUrl: string;
    faviconUrl: string;
    currencySymbol: string;
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
    instagram: string;
    facebook: string;
    telegram: string;
  };
  orderSettings: {
    confirmationMessage: string;
    deliveryZones: string;
    requireEmail: boolean;
    allowMultiProductCart: boolean;
  };
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

export interface PublicBootstrapData {
  categories: Category[];
  products: Product[];
  articleCategories: ArticleCategory[];
  articles: Article[];
  videos: VideoItem[];
  testimonials: Testimonial[];
  siteContent: SiteContent;
  settings: SiteSettings;
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
