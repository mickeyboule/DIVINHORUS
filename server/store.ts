import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {
  ActivityLog,
  AdminBootstrapData,
  AdminUserPublic,
  Article,
  ArticleCategory,
  Category,
  ContactMessage,
  Customer,
  MediaItem,
  Order,
  OrderInvoice,
  OrderStatus,
  Product,
  PublicBootstrapData,
  PublicOrderTrackingInfo,
  ShippingRateRule,
  SiteContent,
  SiteSettings,
  Testimonial,
  TestimonialStatus,
  VideoItem,
  VisitorMemberPublic,
} from '../src/types/cms.ts';

export interface AdminUserRecord extends AdminUserPublic {
  passwordHash: string;
  salt: string;
  firebaseUid?: string;
}

export interface VisitorMemberRecord extends VisitorMemberPublic {
  passwordHash: string;
  salt: string;
  firebaseUid?: string;
}

export interface DatabaseSchema {
  nextOrderSeq: number;
  categories: Category[];
  products: Product[];
  orders: Order[];
  customers: Customer[];
  articleCategories: ArticleCategory[];
  articles: Article[];
  videos: VideoItem[];
  testimonials: Testimonial[];
  visitors: VisitorMemberRecord[];
  media: MediaItem[];
  siteContent: SiteContent;
  settings: SiteSettings;
  admins: AdminUserRecord[];
  activities: ActivityLog[];
  contactMessages: ContactMessage[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'cms-db.json');

export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const derived = crypto.scryptSync(password, salt, 64);
  const stored = Buffer.from(hash, 'hex');
  if (derived.length !== stored.length) return false;
  return crypto.timingSafeEqual(derived, stored);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function makeId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}

function isoDaysAgo(days: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 15, 0, 0);
  return d.toISOString();
}

function createInitialSeed(): DatabaseSchema {
  const categories: Category[] = [];
  const products: Product[] = [];
  const customers: Customer[] = [];
  const orders: Order[] = [];

  const articleCategories: ArticleCategory[] = [
    { id: 'ac_enseignements', name: 'Enseignements', slug: 'enseignements' },
    { id: 'ac_reflexions', name: 'Réflexions', slug: 'reflexions' },
    { id: 'ac_pratique', name: 'Pratique & Rituels', slug: 'pratique-rituels' },
    { id: 'ac_actualites', name: 'Actualités du Sanctuaire', slug: 'actualites' },
  ];

  const articles: Article[] = [];
  const videos: VideoItem[] = [];
  const media: MediaItem[] = [];

  const siteContent: SiteContent = {
    hero: {
      visible: true,
      title: 'Bienvenue dans votre espace de clarté et de présence',
      subtitle:
        'Découvrez les enseignements contemporains de Maître Élias Varenne, rejoignez les échanges de la communauté et commandez des objets rituels façonnés avec sobriété.',
      image: '',
      primaryButtonLabel: 'Découvrir la boutique',
      primaryButtonTarget: '/boutique',
      secondaryButtonLabel: 'Rejoindre la communauté',
      secondaryButtonTarget: '/communaute',
    },
    master: {
      visible: true,
      photo: '',
      name: 'Maître Élias Varenne',
      title: 'Fondateur du Sanctuaire & Guide contemplatif',
      shortBio:
        'Après vingt années consacrées à l’étude des traditions contemplatives et à l’accompagnement individuel, Élias Varenne transmet une spiritualité incarnée, libre de tout artifice et profondément ancrée dans la vie quotidienne.',
      approach:
        'Son approche unit la rigueur du silence, l’écoute attentive et la valeur des gestes simples. Chaque enseignement et chaque objet proposé au sein de la maison répondent à une exigence d’authenticité, de mesure et de respect.',
      buttonLabel: 'En savoir plus',
    },
    homeSections: {
      showFeaturedProducts: true,
      featuredProductsTitle: 'Découvrez notre sélection',
      featuredProductsSubtitle:
        'Objets de pratique et créations naturelles préparés en séries limitées, disponibles uniquement sur demande directe.',
      featuredProductIds: [],
      showCommunityArticles: true,
      featuredArticlesTitle: 'Derniers enseignements & écrits',
      featuredArticleIds: [],
      showCommunityVideos: true,
      featuredVideosTitle: 'Vidéos & méditations guidées',
      featuredVideoIds: [],
      showTestimonials: true,
      featuredTestimonialsTitle: 'Paroles & Témoignages',
      sectionOrder: ['master', 'products', 'articles', 'videos', 'testimonials'],
    },
    aboutPage: {
      heroTitle: 'Une voie contemplative ancrée dans le réel',
      heroSubtitle:
        'DIVIN HORUS réunit transmission écrite, pratique audio-visuelle et artisanat sacré au service de l’équilibre intérieur.',
      philosophyTitle: 'Notre philosophie de transmission',
      philosophyBody:
        'Nous croyons qu’une démarche spirituelle authentique se mesure à la paix qu’elle apporte dans les gestes ordinaires : la parole juste, l’attention portée aux autres, et la sobriété de nos habitudes.\n\nRefusant tout folklore ostentatoire, notre espace privilégie la clarté, l’étude patiente et l’accompagnement humain direct. C’est également la raison pour laquelle chaque commande fait l’objet d’un échange personnel avant préparation.',
      lineageTitle: 'L’atelier des matières nobles',
      lineageBody:
        'Tous les encens, huiles botaniques, bougies en cire d’abeille et minéraux sont sélectionnés ou formulés auprès d’artisans indépendants respectueux des cycles naturels. Aucun paiement automatisé n’est requis en ligne : votre demande est reçue, vérifiée et confirmée personnellement par notre équipe.',
      image: '',
      commitments: [
        {
          title: 'Sérénité & Transparence',
          description: 'Chaque objet est décrit avec exactitude quant à son origine, sa composition et son usage réel.',
        },
        {
          title: 'Relation Humaine Directe',
          description: 'Vos demandes de commande sont traitées individuellement pour garantir disponibilité et conseil adapté.',
        },
        {
          title: 'Communauté Ouverte',
          description: 'Articles, enseignements et vidéos restent librement accessibles afin de nourrir votre pratique.',
        },
      ],
      faqTitle: 'Questions fréquentes',
      faqSubtitle:
        'Retrouvez les réponses essentielles concernant nos enseignements, l’accès à la communauté et le fonctionnement de la boutique sur commande.',
      faqs: [
        {
          id: 'faq_1',
          category: 'Enseignements',
          visible: true,
          question: 'Comment accéder aux enseignements, articles et vidéos de DIVIN HORUS ?',
          answer:
            'Tous les écrits, réflexions et méditations vidéo publiés dans l’espace Communauté sont en accès libre et gratuit. Vous pouvez également créer un compte visiteur depuis la rubrique « Connexion » afin d’enregistrer vos articles préférés et publier votre témoignage.',
        },
        {
          id: 'faq_2',
          category: 'Enseignements',
          visible: true,
          question: 'Faut-il déjà pratiquer la méditation pour suivre les enseignements ?',
          answer:
            'Aucune expérience préalable n’est requise. Les enseignements transmis privilégient des repères clairs, la présence au quotidien et des exercices progressifs accessibles à chacun.',
        },
        {
          id: 'faq_3',
          category: 'Enseignements',
          visible: true,
          question: 'À quelle fréquence de nouvelles vidéos et réflexions sont-elles publiées ?',
          answer:
            'De nouveaux articles sont publiés régulièrement dans la Communauté, et chaque vidéo mise en ligne sur notre chaîne YouTube officielle est synchronisée automatiquement sur le site.',
        },
        {
          id: 'faq_4',
          category: 'Boutique',
          visible: true,
          question: 'Pourquoi n’y a-t-il pas de paiement en ligne sur la boutique ?',
          answer:
            'Par souci d’authenticité et d’accompagnement humain, aucune carte bancaire n’est demandée en ligne. Vous validez simplement votre demande de commande : notre équipe vérifie la disponibilité artisanale et vous contacte personnellement pour confirmer les détails et le règlement.',
        },
        {
          id: 'faq_5',
          category: 'Boutique',
          visible: true,
          question: 'Comment suivre l’évolution de ma demande de commande ?',
          answer:
            'Chaque demande génère un numéro unique (par exemple CMD-1001). Vous pouvez suivre son statut à tout moment depuis la page « Suivre ma commande » ou directement dans votre espace « Mon compte ».',
        },
        {
          id: 'faq_6',
          category: 'Boutique',
          visible: true,
          question: 'Quels sont les délais de préparation et les zones d’expédition ?',
          answer:
            'Les créations en stock sont préparées sous 2 à 3 jours ouvrés ; les pièces réalisées sur commande demandent 5 à 10 jours. Nous expédions en France métropolitaine, Belgique, Suisse, Luxembourg et proposons le retrait sur rendez-vous.',
        },
        {
          id: 'faq_7',
          category: 'Boutique',
          visible: true,
          question: 'D’où proviennent les matières utilisées pour les objets rituels ?',
          answer:
            'Les résines naturelles, cires d’abeille pures, huiles botaniques et minéraux bruts sont sourcés auprès d’artisans indépendants, sans parfums de synthèse ni additifs chimiques.',
        },
        {
          id: 'faq_8',
          category: 'Général',
          visible: true,
          question: 'Comment demander un renseignement ou un accompagnement individuel ?',
          answer:
            'Rendez-vous sur la page Contact pour nous écrire directement. Notre équipe vous répond avec attention du lundi au vendredi sous 24 à 48 heures ouvrées.',
        },
      ],
    },
    contactPage: {
      title: 'Entrer en relation avec DIVIN HORUS',
      subtitle:
        'Pour toute question concernant un enseignement, une demande de commande personnalisée ou une orientation, notre équipe vous répond avec attention.',
      sanctuaryHours: 'Accueil & réponses du lundi au vendredi, de 9h30 à 18h30',
      consultationNote: 'Les demandes de commande passées en boutique sont confirmées par téléphone ou courriel sous 24 heures ouvrées.',
    },
    welcomeAnnouncement: {
      enabled: true,
      type: 'welcome',
      kicker: 'Mot d’accueil',
      title: 'Bienvenue dans l’espace DIVIN HORUS',
      message:
        'Nous sommes heureux de vous accueillir. Découvrez nos enseignements, méditations guidées et objets rituels façonnés avec sobriété.\n\nChaque commande passée sur la boutique fait l’objet d’une confirmation personnalisée par notre équipe.',
      buttonLabel: 'Découvrir la boutique',
      buttonTarget: '/boutique',
      image: '',
      displayFrequency: 'every_visit',
      version: 'v1',
    },
  };

  const settings: SiteSettings = {
    general: {
      siteName: 'DIVIN HORUS',
      tagline: 'Spiritualité, Enseignements & Objets Sacrés',
      logoUrl: '',
      faviconUrl: '',
      currencyCode: 'EUR',
      currencySymbol: '€',
      autoCurrencyByCountry: true,
      orderNotificationEmail: 'commandes@eliasvarenne.fr',
    },
    contact: {
      email: 'bonjour@eliasvarenne.fr',
      phone: '+33 1 84 60 29 14',
      address: '18 Cloître Saint-Merri',
      city: '75004 Paris',
      country: 'France',
    },
    socials: {
      youtube: 'https://www.youtube.com',
      tiktok: 'https://www.tiktok.com',
      facebook: '',
      telegram: '',
    },
    youtubeSync: {
      channelUrl: '',
      channelId: '',
      autoSync: true,
      lastSyncAt: null,
    },
    orderSettings: {
      confirmationMessage:
        'Votre demande de commande a bien été transmise au Sanctuaire. Notre équipe vous contactera sous peu pour confirmer la disponibilité et les modalités de remise.',
      deliveryZones: 'France métropolitaine, Belgique, Suisse, Luxembourg et retrait au Sanctuaire (Paris)',
      requireEmail: false,
      allowMultiProductCart: true,
      defaultShippingFee: 15,
      shippingRatesByCountry: [
        { countryCode: 'FR', countryName: 'France', fee: 5 },
        { countryCode: 'BE', countryName: 'Belgique', fee: 8 },
        { countryCode: 'LU', countryName: 'Luxembourg', fee: 8 },
        { countryCode: 'CH', countryName: 'Suisse', fee: 12 },
        { countryCode: 'CI', countryName: 'Côte d’Ivoire', fee: 15 },
        { countryCode: 'SN', countryName: 'Sénégal', fee: 15 },
        { countryCode: 'CM', countryName: 'Cameroun', fee: 15 },
        { countryCode: 'MA', countryName: 'Maroc', fee: 12 },
        { countryCode: 'CA', countryName: 'Canada', fee: 18 },
        { countryCode: 'US', countryName: 'États-Unis', fee: 18 },
      ],
      defaultPaymentMethod: 'Mobile Money / Virement bancaire',
      defaultPaymentDetails:
        'Merci de régler le montant total par Mobile Money ou Virement bancaire en indiquant votre numéro de commande en référence.',
      defaultInvoiceNotes: 'DIVIN HORUS · Facture à régler dès réception pour finaliser l’expédition.',
      defaultInvoiceSignature: {
        type: 'text',
        imageUrl: '',
        signerName: 'Direction DIVIN HORUS',
        signerRole: 'Service Commandes & Facturation',
      },
      teamWhatsappPhone: '',
    },
  };

  const admins: AdminUserRecord[] = [
    {
      id: 'adm_1',
      name: 'Maître Élias Varenne',
      email: 'bisnessweb24@gmail.com',
      role: 'Super Administrateur',
      passwordHash:
        '687790f1b68f3f0aa9278441c0ed4316f95796330b1455d36a2b92b1cd67c2cd590a483daab0f5a3ce0e736d1cf289ee6514d67e3883cb41c9a17138fe77ea94',
      salt: 'a9fd049dedae68cb1f0f5e5193943124',
      createdAt: isoDaysAgo(60),
      lastLoginAt: isoDaysAgo(0, 8),
    },
  ];

  const activities: ActivityLog[] = [];
  const contactMessages: ContactMessage[] = [];
  const visitors: VisitorMemberRecord[] = [];
  const testimonials: Testimonial[] = [];

  return {
    nextOrderSeq: 1001,
    categories,
    products,
    orders,
    customers,
    articleCategories,
    articles,
    videos,
    testimonials,
    visitors,
    media,
    siteContent,
    settings,
    admins,
    activities,
    contactMessages,
  };
}

class CmsStore {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadOrSeed();
  }

  private migrateLoadedData(parsed: DatabaseSchema): DatabaseSchema {
    const seed = createInitialSeed();
    let changed = false;

    if (!Array.isArray(parsed.testimonials)) {
      parsed.testimonials = seed.testimonials;
      changed = true;
    }
    if (!Array.isArray(parsed.visitors)) {
      parsed.visitors = seed.visitors;
      changed = true;
    }
    parsed.articles = (parsed.articles || []).map((art, idx) => {
      const next = { ...art };
      if (typeof next.likesCount !== 'number') {
        next.likesCount = idx === 0 ? 18 : idx === 1 ? 14 : idx === 2 ? 9 : 0;
        changed = true;
      }
      if (!Array.isArray(next.likedByKeys)) {
        next.likedByKeys = [];
        changed = true;
      }
      return next;
    });
    if (typeof parsed.siteContent?.homeSections?.showTestimonials !== 'boolean') {
      parsed.siteContent.homeSections.showTestimonials = true;
      parsed.siteContent.homeSections.featuredTestimonialsTitle = 'Paroles & Témoignages';
      changed = true;
    }
    if (
      Array.isArray(parsed.siteContent?.homeSections?.sectionOrder) &&
      !parsed.siteContent.homeSections.sectionOrder.includes('testimonials')
    ) {
      parsed.siteContent.homeSections.sectionOrder.push('testimonials');
      changed = true;
    }
    if (parsed.settings?.socials) {
      const socialsAny = parsed.settings.socials as Record<string, string | undefined>;
      if (typeof socialsAny.instagram === 'string') {
        if (!socialsAny.tiktok) {
          socialsAny.tiktok = socialsAny.instagram.includes('instagram.com')
            ? 'https://www.tiktok.com'
            : socialsAny.instagram;
        }
        delete socialsAny.instagram;
        changed = true;
      }
      if (typeof socialsAny.tiktok !== 'string') {
        socialsAny.tiktok = 'https://www.tiktok.com';
        changed = true;
      }
    }
    if (!parsed.settings?.youtubeSync) {
      parsed.settings.youtubeSync = {
        channelUrl: '',
        channelId: '',
        autoSync: true,
        lastSyncAt: null,
      };
      changed = true;
    }
    if (parsed.settings?.general?.siteName === 'Élias Varenne') {
      parsed.settings.general.siteName = 'DIVIN HORUS';
      changed = true;
    }
    if (parsed.siteContent?.aboutPage) {
      if (
        typeof parsed.siteContent.aboutPage.heroSubtitle === 'string' &&
        parsed.siteContent.aboutPage.heroSubtitle.includes('Sanctuaire Élias Varenne')
      ) {
        parsed.siteContent.aboutPage.heroSubtitle = parsed.siteContent.aboutPage.heroSubtitle.replace(
          'Le Sanctuaire Élias Varenne',
          'DIVIN HORUS',
        );
        changed = true;
      }
      if (!parsed.siteContent.aboutPage.faqTitle) {
        parsed.siteContent.aboutPage.faqTitle = seed.siteContent.aboutPage.faqTitle;
        changed = true;
      }
      if (!parsed.siteContent.aboutPage.faqSubtitle) {
        parsed.siteContent.aboutPage.faqSubtitle = seed.siteContent.aboutPage.faqSubtitle;
        changed = true;
      }
      if (!Array.isArray(parsed.siteContent.aboutPage.faqs)) {
        parsed.siteContent.aboutPage.faqs = seed.siteContent.aboutPage.faqs;
        changed = true;
      }
    }
    if (parsed.siteContent && !parsed.siteContent.welcomeAnnouncement) {
      parsed.siteContent.welcomeAnnouncement = seed.siteContent.welcomeAnnouncement;
      changed = true;
    }

    if (parsed.settings?.general && typeof parsed.settings.general.autoCurrencyByCountry !== 'boolean') {
      parsed.settings.general.autoCurrencyByCountry = true;
      changed = true;
    }
    if (parsed.settings?.general && !parsed.settings.general.currencyCode) {
      const sym = (parsed.settings.general.currencySymbol || '').trim().toUpperCase();
      parsed.settings.general.currencyCode = sym === 'FCFA' || sym === 'CFA' ? 'XOF' : sym === '$' ? 'USD' : 'EUR';
      changed = true;
    }

    if (parsed.settings?.orderSettings) {
      const curCode = (parsed.settings.general?.currencyCode || 'EUR').toUpperCase().trim();
      const eurRates: Record<string, number> = {
        EUR: 1,
        XOF: 655.957,
        XAF: 655.957,
        USD: 1.08,
        CAD: 1.5,
        CHF: 0.94,
        GBP: 0.84,
        MAD: 10.85,
        TND: 3.38,
        DZD: 145,
        CDF: 3050,
        GNF: 9300,
        MGA: 4950,
        HTG: 142,
      };
      const rate = eurRates[curCode] ?? 1;
      const zeroDec = new Set(['XOF', 'XAF', 'DZD', 'CDF', 'GNF', 'MGA', 'HTG']);
      const scaleFromEur = (amt: number) =>
        zeroDec.has(curCode) ? Math.round(amt * rate) : Math.round(amt * rate * 100) / 100;

      if (typeof parsed.settings.orderSettings.defaultShippingFee !== 'number') {
        parsed.settings.orderSettings.defaultShippingFee = scaleFromEur(
          seed.settings.orderSettings.defaultShippingFee ?? 15,
        );
        changed = true;
      }
      if (!Array.isArray(parsed.settings.orderSettings.shippingRatesByCountry)) {
        parsed.settings.orderSettings.shippingRatesByCountry = (
          seed.settings.orderSettings.shippingRatesByCountry || []
        ).map((r) => ({
          ...r,
          fee: scaleFromEur(r.fee),
        }));
        changed = true;
      }
      if (!parsed.settings.orderSettings.defaultPaymentMethod) {
        parsed.settings.orderSettings.defaultPaymentMethod = seed.settings.orderSettings.defaultPaymentMethod;
        changed = true;
      }
      if (typeof parsed.settings.orderSettings.defaultPaymentDetails !== 'string') {
        parsed.settings.orderSettings.defaultPaymentDetails = seed.settings.orderSettings.defaultPaymentDetails;
        changed = true;
      }
      if (typeof parsed.settings.orderSettings.defaultInvoiceNotes !== 'string') {
        parsed.settings.orderSettings.defaultInvoiceNotes = seed.settings.orderSettings.defaultInvoiceNotes;
        changed = true;
      }
      if (!parsed.settings.orderSettings.defaultInvoiceSignature) {
        parsed.settings.orderSettings.defaultInvoiceSignature = seed.settings.orderSettings.defaultInvoiceSignature;
        changed = true;
      }
      if (typeof parsed.settings.orderSettings.teamWhatsappPhone !== 'string') {
        parsed.settings.orderSettings.teamWhatsappPhone = '';
        changed = true;
      }
    }

    if (changed) {
      this.writeDisk(parsed);
    }
    return parsed;
  }

  private loadOrSeed(): DatabaseSchema {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return this.migrateLoadedData(JSON.parse(raw) as DatabaseSchema);
      } catch {
        const seeded = createInitialSeed();
        this.writeDisk(seeded);
        return seeded;
      }
    }
    const seeded = createInitialSeed();
    this.writeDisk(seeded);
    return seeded;
  }

  private writeDisk(snapshot: DatabaseSchema): void {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(snapshot, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  }

  private save(): void {
    this.writeDisk(this.data);
  }

  public logActivity(
    actorName: string,
    action: string,
    target: string,
    category: ActivityLog['category'],
  ): void {
    this.data.activities.unshift({
      id: makeId('act'),
      actorName,
      action,
      target,
      category,
      createdAt: new Date().toISOString(),
    });
    if (this.data.activities.length > 100) {
      this.data.activities = this.data.activities.slice(0, 100);
    }
    this.save();
  }

  public getPublicBootstrap(): PublicBootstrapData {
    const visibleCategories = [...this.data.categories]
      .filter((c) => c.visible)
      .sort((a, b) => a.order - b.order);
    const visibleCategoryIds = new Set(visibleCategories.map((c) => c.id));

    return {
      categories: visibleCategories,
      products: this.data.products.filter((p) => p.active && visibleCategoryIds.has(p.categoryId)),
      articleCategories: this.data.articleCategories,
      articles: [...this.data.articles]
        .filter((a) => a.status === 'Publié')
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()),
      videos: [...this.data.videos]
        .filter((v) => v.visible)
        .sort((a, b) => a.sortOrder - b.sortOrder),
      testimonials: [...this.data.testimonials]
        .filter((t) => t.status === 'Publié')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      siteContent: this.data.siteContent,
      settings: this.data.settings,
    };
  }

  public getAdminBootstrap(): AdminBootstrapData {
    return {
      categories: [...this.data.categories].sort((a, b) => a.order - b.order),
      products: [...this.data.products].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
      orders: [...this.data.orders].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
      customers: [...this.data.customers].sort(
        (a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime(),
      ),
      articleCategories: this.data.articleCategories,
      articles: [...this.data.articles].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
      videos: [...this.data.videos].sort((a, b) => a.sortOrder - b.sortOrder),
      testimonials: [...this.data.testimonials].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
      visitors: this.data.visitors.map(({ passwordHash: _ph, salt: _s, ...pub }) => pub),
      media: [...this.data.media].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
      siteContent: this.data.siteContent,
      settings: this.data.settings,
      admins: this.data.admins.map(({ passwordHash: _ph, salt: _s, ...pub }) => pub),
      activities: this.data.activities,
      contactMessages: [...this.data.contactMessages].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    };
  }

  public findAdminByEmail(email: string): AdminUserRecord | undefined {
    return this.data.admins.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());
  }

  public findAdminById(id: string): AdminUserRecord | undefined {
    return this.data.admins.find((a) => a.id === id);
  }

  public findAdminByFirebaseUid(firebaseUid: string): AdminUserRecord | undefined {
    return this.data.admins.find((a) => a.firebaseUid === firebaseUid);
  }

  public linkAdminFirebaseUid(id: string, firebaseUid: string): void {
    const adm = this.data.admins.find((a) => a.id === id);
    if (adm && adm.firebaseUid !== firebaseUid) {
      adm.firebaseUid = firebaseUid;
      this.save();
    }
  }

  public ensureAdminFromFirebase(input: {
    uid: string;
    email: string;
    name?: string;
  }): AdminUserRecord {
    const cleanEmail = input.email.trim().toLowerCase();
    const existing =
      this.findAdminByFirebaseUid(input.uid) || this.findAdminByEmail(cleanEmail);
    if (existing) {
      if (existing.firebaseUid !== input.uid) {
        existing.firebaseUid = input.uid;
        this.save();
      }
      return existing;
    }

    const creds = hashPassword(crypto.randomBytes(24).toString('hex'));
    const created: AdminUserRecord = {
      id: makeId('adm'),
      name: input.name?.trim() || cleanEmail.split('@')[0] || 'Administrateur',
      email: cleanEmail,
      role: 'Super Administrateur',
      passwordHash: creds.hash,
      salt: creds.salt,
      firebaseUid: input.uid,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    this.data.admins.push(created);
    this.logActivity(created.name, 'Administrateur reconnu via Firebase Auth', cleanEmail, 'securite');
    return created;
  }

  public touchAdminLogin(id: string): void {
    const adm = this.data.admins.find((a) => a.id === id);
    if (adm) {
      adm.lastLoginAt = new Date().toISOString();
      this.save();
    }
  }

  public createOrder(input: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    deliveryAddress: string;
    message: string;
    items: Array<{ productId: string; quantity: number }>;
    visitorId?: string;
    customerCountry?: string;
    displayCurrencyCode?: string;
    displayCurrencySymbol?: string;
    displayTotal?: number;
  }): Order {
    const now = new Date().toISOString();
    const orderItems = input.items.map((reqItem) => {
      const product = this.data.products.find((p) => p.id === reqItem.productId && p.active);
      if (!product) {
        throw new Error('Produit introuvable ou indisponible.');
      }
      const qty = Math.max(1, Math.min(99, Math.floor(reqItem.quantity || 1)));
      product.orderCount += qty;
      return {
        productId: product.id,
        productName: product.name,
        productRef: product.reference,
        unitPrice: product.price,
        quantity: qty,
        image: product.images[0] || '',
      };
    });

    if (orderItems.length === 0) {
      throw new Error('Veuillez sélectionner au moins un produit.');
    }

    const subtotal = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const resolvedCountry = (input.customerCountry || 'FR').toUpperCase().trim();
    const matchedShippingRule = (
      this.data.settings.orderSettings.shippingRatesByCountry || []
    ).find((r) => r.countryCode.toUpperCase().trim() === resolvedCountry);
    const rawShippingFee =
      matchedShippingRule && typeof matchedShippingRule.fee === 'number'
        ? matchedShippingRule.fee
        : typeof this.data.settings.orderSettings.defaultShippingFee === 'number'
          ? this.data.settings.orderSettings.defaultShippingFee
          : 0;
    const shippingFee = Math.max(0, Math.round(rawShippingFee * 100) / 100);
    const indicativeTotal = Math.round((subtotal + shippingFee) * 100) / 100;

    const normalizedPhone = input.phone.replace(/\s+/g, '');
    let customer = this.data.customers.find(
      (c) =>
        c.phone.replace(/\s+/g, '') === normalizedPhone ||
        (input.email && c.email && c.email.toLowerCase() === input.email.trim().toLowerCase()),
    );

    if (customer) {
      customer.firstName = input.firstName.trim();
      customer.lastName = input.lastName.trim();
      customer.phone = input.phone.trim();
      if (input.email.trim()) customer.email = input.email.trim();
      customer.country = resolvedCountry;
      customer.address = input.deliveryAddress.trim();
      customer.lastOrderAt = now;
      customer.orderCount += 1;
      customer.totalIndicative += indicativeTotal;
    } else {
      customer = {
        id: makeId('cust'),
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone.trim(),
        email: input.email.trim(),
        country: resolvedCountry,
        address: input.deliveryAddress.trim(),
        notes: '',
        createdAt: now,
        lastOrderAt: now,
        orderCount: 1,
        totalIndicative: indicativeTotal,
      };
      this.data.customers.unshift(customer);
    }

    const orderNumber = `CMD-${this.data.nextOrderSeq}`;
    this.data.nextOrderSeq += 1;

    const order: Order = {
      id: makeId('ord'),
      orderNumber,
      createdAt: now,
      updatedAt: now,
      status: 'Nouvelle',
      customerId: customer.id,
      ...(input.visitorId ? { visitorId: input.visitorId } : {}),
      customerFirstName: input.firstName.trim(),
      customerLastName: input.lastName.trim(),
      customerPhone: input.phone.trim(),
      customerEmail: input.email.trim(),
      deliveryAddress: input.deliveryAddress.trim(),
      message: input.message.trim(),
      items: orderItems,
      subtotal,
      shippingFee,
      indicativeTotal,
      customerCountry: resolvedCountry,
      ...(input.displayCurrencyCode ? { displayCurrencyCode: input.displayCurrencyCode } : {}),
      ...(input.displayCurrencySymbol ? { displayCurrencySymbol: input.displayCurrencySymbol } : {}),
      ...(typeof input.displayTotal === 'number' && Number.isFinite(input.displayTotal)
        ? { displayTotal: input.displayTotal }
        : {}),
      adminNotes: '',
      history: [
        {
          status: 'Nouvelle',
          date: now,
          note: 'Demande de commande enregistrée depuis la boutique.',
          actor: `${input.firstName.trim()} ${input.lastName.trim()}`,
        },
      ],
    };

    if (input.visitorId) {
      const linkedVisitor = this.findVisitorById(input.visitorId);
      if (linkedVisitor) {
        if ((!linkedVisitor.firstName || linkedVisitor.firstName === 'Membre') && input.firstName.trim()) {
          linkedVisitor.firstName = input.firstName.trim();
        }
        if ((!linkedVisitor.lastName || linkedVisitor.lastName === 'Sanctuaire') && input.lastName.trim()) {
          linkedVisitor.lastName = input.lastName.trim();
        }
        if (!linkedVisitor.phone && input.phone.trim()) {
          linkedVisitor.phone = input.phone.trim();
        }
        if (!linkedVisitor.address && input.deliveryAddress.trim()) {
          linkedVisitor.address = input.deliveryAddress.trim();
        }
        if (!linkedVisitor.country && resolvedCountry) {
          linkedVisitor.country = resolvedCountry;
        }
      }
    }

    this.data.orders.unshift(order);
    this.logActivity(
      `${order.customerFirstName} ${order.customerLastName}`,
      'Nouvelle demande de commande enregistrée',
      `${order.orderNumber} (${indicativeTotal} ${this.data.settings.general.currencySymbol})`,
      'commande',
    );
    return order;
  }

  public updateOrder(
    id: string,
    patch: { status?: OrderStatus; adminNotes?: string; statusNote?: string },
    actorName: string,
  ): Order | null {
    const order = this.data.orders.find((o) => o.id === id);
    if (!order) return null;
    const now = new Date().toISOString();

    if (patch.status && patch.status !== order.status) {
      order.status = patch.status;
      order.history.push({
        status: patch.status,
        date: now,
        note: patch.statusNote?.trim() || `Statut modifié vers ${patch.status}`,
        actor: actorName,
      });
      this.logActivity(actorName, `Statut modifié vers ${patch.status}`, `${order.orderNumber} · ${order.customerFirstName} ${order.customerLastName}`, 'commande');
    }
    if (typeof patch.adminNotes === 'string') {
      order.adminNotes = patch.adminNotes;
    }
    order.updatedAt = now;
    this.save();
    return order;
  }

  public saveOrderInvoice(
    orderId: string,
    payload: Partial<OrderInvoice> & { sendToClient?: boolean; saveAsDefault?: boolean },
    actorName: string,
  ): { order: Order; settings?: SiteSettings } | null {
    const order = this.data.orders.find((o) => o.id === orderId);
    if (!order) return null;
    const now = new Date().toISOString();

    const rawItems = Array.isArray(payload.items) && payload.items.length > 0
      ? payload.items
      : order.items.map((i, idx) => ({
          id: `${i.productId}_${idx}`,
          description: i.productName,
          reference: i.productRef,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        }));

    const items = rawItems.map((line, idx) => ({
      id: line.id || `line_${idx}_${Date.now()}`,
      description: String(line.description || 'Article').trim() || 'Article',
      reference: line.reference ? String(line.reference).trim() : '',
      quantity: Math.max(1, Math.round(Number(line.quantity) || 1)),
      unitPrice: Math.max(0, Number(line.unitPrice) || 0),
    }));

    const shippingFee = Math.max(0, Number(payload.shippingFee ?? order.shippingFee ?? 0) || 0);
    const discount = Math.max(0, Number(payload.discount ?? 0) || 0);
    const subtotal = Math.round(items.reduce((s, l) => s + l.quantity * l.unitPrice, 0) * 100) / 100;
    const total = Math.max(0, Math.round((subtotal + shippingFee - discount) * 100) / 100);

    const isSending = Boolean(payload.sendToClient);
    const prevInvoice = order.invoice;
    const nextStatus: 'Brouillon' | 'Envoyée' = isSending
      ? 'Envoyée'
      : prevInvoice?.status === 'Envoyée'
        ? 'Envoyée'
        : 'Brouillon';

    const defaultSig = this.data.settings.orderSettings.defaultInvoiceSignature || {
      type: 'text' as const,
      imageUrl: '',
      signerName: actorName,
      signerRole: 'Direction · DIVIN HORUS',
    };

    const sigInput = payload.signature || prevInvoice?.signature || defaultSig;
    const signature = {
      type: sigInput.type || 'none',
      imageUrl: sigInput.imageUrl ? String(sigInput.imageUrl).trim() : '',
      signerName: String(sigInput.signerName ?? '').trim(),
      signerRole: String(sigInput.signerRole ?? '').trim(),
    };

    const invoice: OrderInvoice = {
      invoiceNumber:
        String(payload.invoiceNumber || prevInvoice?.invoiceNumber || order.orderNumber.replace(/^CMD-/, 'FAC-')).trim(),
      status: nextStatus,
      paymentStatus: payload.paymentStatus || prevInvoice?.paymentStatus || 'En attente de paiement',
      issuedAt: payload.issuedAt || prevInvoice?.issuedAt || now.slice(0, 10),
      dueDate: payload.dueDate || prevInvoice?.dueDate || now.slice(0, 10),
      customerName:
        String(
          payload.customerName ??
            prevInvoice?.customerName ??
            `${order.customerFirstName} ${order.customerLastName}`,
        ).trim(),
      customerEmail: String(payload.customerEmail ?? prevInvoice?.customerEmail ?? order.customerEmail).trim(),
      customerPhone: String(payload.customerPhone ?? prevInvoice?.customerPhone ?? order.customerPhone).trim(),
      customerAddress: String(
        payload.customerAddress ?? prevInvoice?.customerAddress ?? order.deliveryAddress,
      ).trim(),
      customerCountry: payload.customerCountry || prevInvoice?.customerCountry || order.customerCountry,
      currencyCode:
        String(payload.currencyCode || prevInvoice?.currencyCode || this.data.settings.general.currencyCode || 'EUR').trim(),
      currencySymbol:
        String(payload.currencySymbol || prevInvoice?.currencySymbol || this.data.settings.general.currencySymbol || '€').trim(),
      items,
      shippingFee,
      discount,
      subtotal,
      total,
      paymentMethod: String(
        payload.paymentMethod ??
          prevInvoice?.paymentMethod ??
          this.data.settings.orderSettings.defaultPaymentMethod ??
          'Virement / Mobile Money',
      ).trim(),
      paymentDetails: String(
        payload.paymentDetails ??
          prevInvoice?.paymentDetails ??
          this.data.settings.orderSettings.defaultPaymentDetails ??
          '',
      ).trim(),
      notes: String(
        payload.notes ??
          prevInvoice?.notes ??
          this.data.settings.orderSettings.defaultInvoiceNotes ??
          '',
      ).trim(),
      signature,
      sentAt: isSending ? now : prevInvoice?.sentAt || null,
      sentBy: isSending ? actorName : prevInvoice?.sentBy,
      updatedAt: now,
    };

    order.invoice = invoice;
    order.updatedAt = now;

    if (isSending) {
      order.history.push({
        status: order.status,
        date: now,
        note: `Facture ${invoice.invoiceNumber} et moyen de paiement (${invoice.paymentMethod}) envoyés au client.`,
        actor: actorName,
      });
      this.logActivity(
        actorName,
        `Facture ${invoice.invoiceNumber} envoyée au client`,
        `${order.orderNumber} · ${invoice.total} ${invoice.currencySymbol}`,
        'commande',
      );
    } else {
      this.logActivity(
        actorName,
        `Facture ${invoice.invoiceNumber} enregistrée (${invoice.status})`,
        `${order.orderNumber} · ${invoice.total} ${invoice.currencySymbol}`,
        'commande',
      );
    }

    let updatedSettings: SiteSettings | undefined;
    if (payload.saveAsDefault) {
      this.data.settings.orderSettings.defaultPaymentMethod = invoice.paymentMethod;
      this.data.settings.orderSettings.defaultPaymentDetails = invoice.paymentDetails;
      this.data.settings.orderSettings.defaultInvoiceNotes = invoice.notes;
      this.data.settings.orderSettings.defaultInvoiceSignature = invoice.signature;
      updatedSettings = this.data.settings;
    }

    this.save();
    return { order, ...(updatedSettings ? { settings: updatedSettings } : {}) };
  }

  public createCustomer(
    input: {
      firstName: string;
      lastName: string;
      phone?: string;
      email?: string;
      country?: string;
      address?: string;
      notes?: string;
    },
    actorName: string,
  ): Customer {
    const firstName = (input.firstName || '').trim();
    const lastName = (input.lastName || '').trim();
    const phone = (input.phone || '').trim();
    const email = (input.email || '').trim();
    const rawCountry = (input.country || '').trim();
    const country = rawCountry.length === 2 ? rawCountry.toUpperCase() : rawCountry;
    const address = (input.address || '').trim();
    const notes = (input.notes || '').trim();

    if (!firstName || !lastName) {
      throw new Error('Veuillez renseigner le prénom et le nom du client.');
    }
    if (!phone && !email) {
      throw new Error('Veuillez renseigner au moins un téléphone ou une adresse email.');
    }

    const normPhone = phone.replace(/\s+/g, '');
    const normEmail = email.toLowerCase();
    const duplicate = this.data.customers.find(
      (c) =>
        (normPhone && c.phone.replace(/\s+/g, '') === normPhone) ||
        (normEmail && c.email && c.email.toLowerCase() === normEmail),
    );
    if (duplicate) {
      throw new Error('Un client avec ce numéro de téléphone ou cet email existe déjà.');
    }

    const now = new Date().toISOString();
    const created: Customer = {
      id: makeId('cust'),
      firstName,
      lastName,
      phone,
      email,
      ...(country ? { country } : {}),
      address,
      notes,
      createdAt: now,
      lastOrderAt: '',
      orderCount: 0,
      totalIndicative: 0,
    };
    this.data.customers.unshift(created);
    this.logActivity(actorName, 'Client ajouté manuellement', `${created.firstName} ${created.lastName}`, 'commande');
    return created;
  }

  public updateCustomer(
    id: string,
    patch: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string;
      country?: string;
      address?: string;
      notes?: string;
    },
    actorName: string,
  ): Customer | null {
    const cust = this.data.customers.find((c) => c.id === id);
    if (!cust) return null;
    if (typeof patch.firstName === 'string' && patch.firstName.trim()) {
      cust.firstName = patch.firstName.trim();
    }
    if (typeof patch.lastName === 'string' && patch.lastName.trim()) {
      cust.lastName = patch.lastName.trim();
    }
    if (typeof patch.phone === 'string') {
      cust.phone = patch.phone.trim();
    }
    if (typeof patch.email === 'string') {
      cust.email = patch.email.trim();
    }
    if (typeof patch.country === 'string') {
      const rc = patch.country.trim();
      cust.country = rc.length === 2 ? rc.toUpperCase() : rc;
    }
    if (typeof patch.address === 'string') {
      cust.address = patch.address.trim();
    }
    if (typeof patch.notes === 'string') {
      cust.notes = patch.notes;
    }
    this.logActivity(actorName, 'Fiche client mise à jour', `${cust.firstName} ${cust.lastName}`, 'commande');
    return cust;
  }

  public updateCustomerNotes(id: string, notes: string, actorName: string): Customer | null {
    return this.updateCustomer(id, { notes }, actorName);
  }

  public deleteCustomer(id: string, actorName: string): boolean {
    const idx = this.data.customers.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    const [removed] = this.data.customers.splice(idx, 1);
    this.logActivity(actorName, 'Client supprimé', `${removed.firstName} ${removed.lastName}`, 'commande');
    return true;
  }

  public upsertProduct(input: Partial<Product> & { id?: string }, actorName: string): Product {
    const now = new Date().toISOString();
    if (input.id) {
      const existing = this.data.products.find((p) => p.id === input.id);
      if (!existing) throw new Error('Produit introuvable.');
      existing.name = input.name?.trim() || existing.name;
      existing.slug = slugify(existing.name);
      existing.reference = input.reference?.trim() || existing.reference;
      existing.price = typeof input.price === 'number' ? Math.max(0, input.price) : existing.price;
      existing.categoryId = input.categoryId || existing.categoryId;
      existing.description = input.description ?? existing.description;
      existing.additionalInfo = input.additionalInfo ?? existing.additionalInfo;
      existing.images = Array.isArray(input.images) ? input.images : existing.images;
      existing.availability = input.availability || existing.availability;
      existing.stockCount = typeof input.stockCount === 'number' ? Math.max(0, input.stockCount) : existing.stockCount;
      existing.featured = typeof input.featured === 'boolean' ? input.featured : existing.featured;
      existing.active = typeof input.active === 'boolean' ? input.active : existing.active;
      existing.updatedAt = now;
      this.logActivity(actorName, 'Produit modifié', existing.name, 'produit');
      return existing;
    }

    const name = (input.name || 'Nouveau produit').trim();
    const created: Product = {
      id: makeId('prod'),
      reference: (input.reference || `EV-${Math.floor(100 + Math.random() * 900)}`).trim(),
      name,
      slug: slugify(name),
      price: typeof input.price === 'number' ? Math.max(0, input.price) : 0,
      categoryId: input.categoryId || this.data.categories[0]?.id || '',
      description: input.description || '',
      additionalInfo: input.additionalInfo || '',
      images: Array.isArray(input.images) ? input.images : [],
      availability: input.availability || 'En stock',
      stockCount: typeof input.stockCount === 'number' ? Math.max(0, input.stockCount) : 10,
      featured: Boolean(input.featured),
      active: input.active !== false,
      orderCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.data.products.unshift(created);
    if (created.featured && !this.data.siteContent.homeSections.featuredProductIds.includes(created.id)) {
      this.data.siteContent.homeSections.featuredProductIds.unshift(created.id);
    }
    this.logActivity(actorName, 'Produit créé', created.name, 'produit');
    return created;
  }

  public duplicateProduct(id: string, actorName: string): Product | null {
    const src = this.data.products.find((p) => p.id === id);
    if (!src) return null;
    const now = new Date().toISOString();
    const copy: Product = {
      ...src,
      id: makeId('prod'),
      reference: `${src.reference}-COPIE`,
      name: `${src.name} (Copie)`,
      slug: slugify(`${src.name}-copie-${Date.now().toString().slice(-4)}`),
      orderCount: 0,
      active: false,
      createdAt: now,
      updatedAt: now,
    };
    this.data.products.unshift(copy);
    this.logActivity(actorName, 'Produit dupliqué', copy.name, 'produit');
    return copy;
  }

  public deleteProduct(id: string, actorName: string): boolean {
    const idx = this.data.products.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    const [removed] = this.data.products.splice(idx, 1);
    this.data.siteContent.homeSections.featuredProductIds =
      this.data.siteContent.homeSections.featuredProductIds.filter((pid) => pid !== id);
    this.logActivity(actorName, 'Produit supprimé', removed.name, 'produit');
    return true;
  }

  public upsertCategory(input: Partial<Category> & { id?: string }, actorName: string): Category {
    if (input.id) {
      const existing = this.data.categories.find((c) => c.id === input.id);
      if (!existing) throw new Error('Catégorie introuvable.');
      existing.name = input.name?.trim() || existing.name;
      existing.slug = slugify(existing.name);
      existing.description = input.description ?? existing.description;
      existing.image = input.image ?? existing.image;
      existing.visible = typeof input.visible === 'boolean' ? input.visible : existing.visible;
      if (typeof input.order === 'number') existing.order = input.order;
      this.logActivity(actorName, 'Catégorie modifiée', existing.name, 'produit');
      return existing;
    }

    const name = (input.name || 'Nouvelle catégorie').trim();
    const maxOrder = this.data.categories.reduce((m, c) => Math.max(m, c.order), 0);
    const created: Category = {
      id: makeId('cat'),
      name,
      slug: slugify(name),
      description: input.description || '',
      image: input.image || '',
      order: maxOrder + 1,
      visible: input.visible !== false,
      createdAt: new Date().toISOString(),
    };
    this.data.categories.push(created);
    this.logActivity(actorName, 'Catégorie créée', created.name, 'produit');
    return created;
  }

  public reorderCategories(orderedIds: string[], actorName: string): Category[] {
    orderedIds.forEach((id, index) => {
      const cat = this.data.categories.find((c) => c.id === id);
      if (cat) cat.order = index + 1;
    });
    this.logActivity(actorName, 'Ordre des catégories modifié', `${orderedIds.length} catégories`, 'produit');
    return [...this.data.categories].sort((a, b) => a.order - b.order);
  }

  public deleteCategory(id: string, actorName: string): boolean {
    const idx = this.data.categories.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    const [removed] = this.data.categories.splice(idx, 1);
    this.logActivity(actorName, 'Catégorie supprimée', removed.name, 'produit');
    return true;
  }

  public upsertArticleCategory(input: { id?: string; name: string }, actorName: string): ArticleCategory {
    if (input.id) {
      const cat = this.data.articleCategories.find((c) => c.id === input.id);
      if (!cat) throw new Error('Catégorie introuvable.');
      cat.name = input.name.trim();
      cat.slug = slugify(cat.name);
      this.logActivity(actorName, 'Catégorie d’article modifiée', cat.name, 'contenu');
      return cat;
    }
    const created: ArticleCategory = {
      id: makeId('ac'),
      name: input.name.trim(),
      slug: slugify(input.name),
    };
    this.data.articleCategories.push(created);
    this.logActivity(actorName, 'Catégorie d’article créée', created.name, 'contenu');
    return created;
  }

  public deleteArticleCategory(id: string, actorName: string): boolean {
    const idx = this.data.articleCategories.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    const [removed] = this.data.articleCategories.splice(idx, 1);
    this.logActivity(actorName, 'Catégorie d’article supprimée', removed.name, 'contenu');
    return true;
  }

  public upsertArticle(input: Partial<Article> & { id?: string }, actorName: string): Article {
    const now = new Date().toISOString();
    if (input.id) {
      const existing = this.data.articles.find((a) => a.id === input.id);
      if (!existing) throw new Error('Article introuvable.');
      existing.title = input.title?.trim() || existing.title;
      existing.slug = slugify(existing.title);
      existing.excerpt = input.excerpt ?? existing.excerpt;
      existing.content = input.content ?? existing.content;
      existing.image = input.image ?? existing.image;
      existing.author = input.author?.trim() || existing.author;
      existing.categoryId = input.categoryId || existing.categoryId;
      const wasDraft = existing.status === 'Brouillon';
      existing.status = input.status || existing.status;
      if (wasDraft && existing.status === 'Publié') {
        existing.publishedAt = now;
      }
      existing.featured = typeof input.featured === 'boolean' ? input.featured : existing.featured;
      existing.updatedAt = now;
      this.logActivity(actorName, 'Article mis à jour', existing.title, 'contenu');
      return existing;
    }

    const title = (input.title || 'Nouvel enseignement').trim();
    const created: Article = {
      id: makeId('art'),
      title,
      slug: slugify(title),
      excerpt: input.excerpt || '',
      content: input.content || '',
      image: input.image || '',
      author: input.author?.trim() || this.data.siteContent.master.name,
      categoryId: input.categoryId || this.data.articleCategories[0]?.id || '',
      status: input.status || 'Brouillon',
      featured: Boolean(input.featured),
      likesCount: 0,
      likedByKeys: [],
      publishedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    this.data.articles.unshift(created);
    if (created.featured && !this.data.siteContent.homeSections.featuredArticleIds.includes(created.id)) {
      this.data.siteContent.homeSections.featuredArticleIds.unshift(created.id);
    }
    this.logActivity(actorName, `Article créé (${created.status})`, created.title, 'contenu');
    return created;
  }

  public deleteArticle(id: string, actorName: string): boolean {
    const idx = this.data.articles.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    const [removed] = this.data.articles.splice(idx, 1);
    this.data.siteContent.homeSections.featuredArticleIds =
      this.data.siteContent.homeSections.featuredArticleIds.filter((aid) => aid !== id);
    this.logActivity(actorName, 'Article supprimé', removed.title, 'contenu');
    return true;
  }

  public upsertVideo(input: Partial<VideoItem> & { id?: string }, actorName: string): VideoItem {
    if (input.id) {
      const existing = this.data.videos.find((v) => v.id === input.id);
      if (!existing) throw new Error('Vidéo introuvable.');
      existing.title = input.title?.trim() || existing.title;
      existing.youtubeUrl = input.youtubeUrl?.trim() || existing.youtubeUrl;
      existing.youtubeId = input.youtubeId?.trim() || existing.youtubeId;
      existing.thumbnail = input.thumbnail?.trim() || existing.thumbnail;
      existing.description = input.description ?? existing.description;
      existing.duration = input.duration ?? existing.duration;
      existing.visible = typeof input.visible === 'boolean' ? input.visible : existing.visible;
      existing.featured = typeof input.featured === 'boolean' ? input.featured : existing.featured;
      this.logActivity(actorName, 'Vidéo modifiée', existing.title, 'contenu');
      return existing;
    }

    const maxOrder = this.data.videos.reduce((m, v) => Math.max(m, v.sortOrder), 0);
    const created: VideoItem = {
      id: makeId('vid'),
      title: (input.title || 'Nouvelle vidéo').trim(),
      youtubeUrl: input.youtubeUrl || '',
      youtubeId: input.youtubeId || '',
      thumbnail: input.thumbnail || '',
      description: input.description || '',
      duration: input.duration || '',
      visible: input.visible !== false,
      featured: Boolean(input.featured),
      sortOrder: maxOrder + 1,
      createdAt: new Date().toISOString(),
    };
    this.data.videos.push(created);
    if (created.featured && !this.data.siteContent.homeSections.featuredVideoIds.includes(created.id)) {
      this.data.siteContent.homeSections.featuredVideoIds.unshift(created.id);
    }
    this.logActivity(actorName, 'Vidéo YouTube ajoutée', created.title, 'contenu');
    return created;
  }

  public reorderVideos(orderedIds: string[], actorName: string): VideoItem[] {
    orderedIds.forEach((id, idx) => {
      const vid = this.data.videos.find((v) => v.id === id);
      if (vid) vid.sortOrder = idx + 1;
    });
    this.logActivity(actorName, 'Ordre des vidéos modifié', `${orderedIds.length} vidéos`, 'contenu');
    return [...this.data.videos].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  public deleteVideo(id: string, actorName: string): boolean {
    const idx = this.data.videos.findIndex((v) => v.id === id);
    if (idx === -1) return false;
    const [removed] = this.data.videos.splice(idx, 1);
    this.data.siteContent.homeSections.featuredVideoIds =
      this.data.siteContent.homeSections.featuredVideoIds.filter((vid) => vid !== id);
    this.logActivity(actorName, 'Vidéo supprimée', removed.title, 'contenu');
    return true;
  }

  public addMedia(item: Omit<MediaItem, 'id' | 'createdAt'>, actorName: string): MediaItem {
    const created: MediaItem = {
      ...item,
      id: makeId('med'),
      createdAt: new Date().toISOString(),
    };
    this.data.media.unshift(created);
    this.logActivity(actorName, 'Média ajouté', created.name, 'contenu');
    return created;
  }

  public deleteMedia(id: string, actorName: string): boolean {
    const idx = this.data.media.findIndex((m) => m.id === id);
    if (idx === -1) return false;
    const [removed] = this.data.media.splice(idx, 1);
    this.logActivity(actorName, 'Média supprimé', removed.name, 'contenu');
    return true;
  }

  public updateSiteContent(content: SiteContent, actorName: string): SiteContent {
    const normalizedFaqs = Array.isArray(content.aboutPage?.faqs)
      ? content.aboutPage.faqs
          .map((item) => ({
            id: item.id?.trim() || makeId('faq'),
            question: (item.question || '').trim(),
            answer: (item.answer || '').trim(),
            category:
              item.category === 'Enseignements' || item.category === 'Boutique' || item.category === 'Général'
                ? item.category
                : ('Général' as const),
            visible: item.visible !== false,
          }))
          .filter((item) => item.question.length > 0 && item.answer.length > 0)
      : this.data.siteContent.aboutPage.faqs || [];

    const prevAnnouncement = this.data.siteContent.welcomeAnnouncement;
    const rawAnnouncement = content.welcomeAnnouncement;
    let normalizedAnnouncement = prevAnnouncement;
    if (rawAnnouncement) {
      const nextType =
        rawAnnouncement.type === 'info' || rawAnnouncement.type === 'important'
          ? rawAnnouncement.type
          : ('welcome' as const);
      const nextTitle = (rawAnnouncement.title || '').trim();
      const nextMessage = (rawAnnouncement.message || '').trim();
      const nextEnabled = Boolean(rawAnnouncement.enabled);
      const nextFrequency =
        rawAnnouncement.displayFrequency === 'once_per_update'
          ? ('once_per_update' as const)
          : ('every_visit' as const);
      const nextKickerEn = (rawAnnouncement.kickerEn || '').trim();
      const nextTitleEn = (rawAnnouncement.titleEn || '').trim();
      const nextMessageEn = (rawAnnouncement.messageEn || '').trim();
      const nextButtonLabelEn = (rawAnnouncement.buttonLabelEn || '').trim();
      const contentModified =
        !prevAnnouncement ||
        prevAnnouncement.title !== nextTitle ||
        prevAnnouncement.message !== nextMessage ||
        (prevAnnouncement.titleEn || '') !== nextTitleEn ||
        (prevAnnouncement.messageEn || '') !== nextMessageEn ||
        prevAnnouncement.type !== nextType ||
        (!prevAnnouncement.enabled && nextEnabled);
      const requestedVersion = (rawAnnouncement.version || '').trim();
      const nextVersion =
        requestedVersion && requestedVersion !== prevAnnouncement?.version
          ? requestedVersion
          : contentModified
            ? `v_${Date.now().toString(36)}`
            : prevAnnouncement?.version || 'v1';

      normalizedAnnouncement = {
        enabled: nextEnabled,
        type: nextType,
        kicker: (rawAnnouncement.kicker || '').trim(),
        ...(nextKickerEn ? { kickerEn: nextKickerEn } : {}),
        title: nextTitle,
        ...(nextTitleEn ? { titleEn: nextTitleEn } : {}),
        message: nextMessage,
        ...(nextMessageEn ? { messageEn: nextMessageEn } : {}),
        buttonLabel: (rawAnnouncement.buttonLabel || '').trim(),
        ...(nextButtonLabelEn ? { buttonLabelEn: nextButtonLabelEn } : {}),
        buttonTarget: (rawAnnouncement.buttonTarget || '').trim(),
        image: (rawAnnouncement.image || '').trim(),
        displayFrequency: nextFrequency,
        version: nextVersion,
      };
    }

    this.data.siteContent = {
      ...content,
      aboutPage: {
        ...content.aboutPage,
        faqTitle: content.aboutPage.faqTitle?.trim() || 'Questions fréquentes',
        faqSubtitle:
          content.aboutPage.faqSubtitle?.trim() ||
          'Retrouvez les réponses essentielles concernant nos enseignements et la boutique sur commande.',
        faqs: normalizedFaqs,
      },
      ...(normalizedAnnouncement ? { welcomeAnnouncement: normalizedAnnouncement } : {}),
    };
    this.logActivity(actorName, 'Contenu du site mis à jour', 'Page d’accueil & éditorial', 'contenu');
    return this.data.siteContent;
  }

  public updateSettings(
    settings: SiteSettings,
    actorName: string,
    options?: { convertCatalogPrices?: boolean; rates?: Record<string, number> },
  ): { settings: SiteSettings; products?: Product[] } {
    const prevCode = (this.data.settings.general.currencyCode || 'EUR').toUpperCase().trim();
    const nextCode = (settings.general.currencyCode || 'EUR').toUpperCase().trim();
    const sanitizedShippingRules: ShippingRateRule[] = Array.isArray(
      settings.orderSettings?.shippingRatesByCountry,
    )
      ? settings.orderSettings.shippingRatesByCountry
          .filter((r) => r && r.countryCode)
          .map((r) => ({
            countryCode: String(r.countryCode).toUpperCase().trim(),
            countryName: String(r.countryName || r.countryCode).trim(),
            fee: Math.max(0, Number(r.fee) || 0),
          }))
      : [];

    const normalizedSettings: SiteSettings = {
      ...settings,
      general: {
        ...settings.general,
        currencyCode: nextCode || 'EUR',
        currencySymbol: settings.general.currencySymbol?.trim() || '€',
      },
      orderSettings: {
        ...settings.orderSettings,
        defaultShippingFee: Math.max(0, Number(settings.orderSettings?.defaultShippingFee) || 0),
        shippingRatesByCountry: sanitizedShippingRules,
      },
    };
    this.data.settings = normalizedSettings;

    let convertedProducts: Product[] | undefined;
    if (
      options?.convertCatalogPrices &&
      prevCode !== nextCode &&
      prevCode !== 'CUSTOM' &&
      nextCode !== 'CUSTOM'
    ) {
      const fallbackRates: Record<string, number> = {
        EUR: 1,
        XOF: 655.957,
        XAF: 655.957,
        USD: 1.08,
        CAD: 1.5,
        CHF: 0.94,
        GBP: 0.84,
        MAD: 10.85,
        TND: 3.38,
        DZD: 145,
        CDF: 3050,
        GNF: 9300,
        MGA: 4950,
        HTG: 142,
      };
      const rates = { ...fallbackRates, ...(options.rates || {}) };
      const fromRate = rates[prevCode] ?? 1;
      const toRate = rates[nextCode] ?? 1;
      const zeroDec = new Set(['XOF', 'XAF', 'DZD', 'CDF', 'GNF', 'MGA', 'HTG']);
      const convertVal = (val: number) => {
        const eur = fromRate > 0 ? val / fromRate : val;
        const raw = eur * toRate;
        return zeroDec.has(nextCode) ? Math.round(raw) : Math.round(raw * 100) / 100;
      };
      const now = new Date().toISOString();

      this.data.products.forEach((p) => {
        p.price = convertVal(p.price);
        p.updatedAt = now;
      });
      if (typeof this.data.settings.orderSettings.defaultShippingFee === 'number') {
        this.data.settings.orderSettings.defaultShippingFee = convertVal(
          this.data.settings.orderSettings.defaultShippingFee,
        );
      }
      if (Array.isArray(this.data.settings.orderSettings.shippingRatesByCountry)) {
        this.data.settings.orderSettings.shippingRatesByCountry =
          this.data.settings.orderSettings.shippingRatesByCountry.map((r) => ({
            ...r,
            fee: convertVal(r.fee),
          }));
      }
      convertedProducts = this.data.products;
      this.logActivity(
        actorName,
        `Catalogue converti (${prevCode} → ${nextCode})`,
        `${this.data.products.length} produits`,
        'parametre',
      );
    }

    this.logActivity(
      actorName,
      'Paramètres du site enregistrés',
      `${normalizedSettings.general.siteName} (${normalizedSettings.general.currencySymbol})`,
      'parametre',
    );
    return { settings: this.data.settings, ...(convertedProducts ? { products: convertedProducts } : {}) };
  }

  public createAdmin(
    input: { name: string; email: string; password: string; role: 'Super Administrateur' | 'Éditeur' },
    actorName: string,
  ): AdminUserPublic {
    if (this.findAdminByEmail(input.email)) {
      throw new Error('Un administrateur utilise déjà cette adresse email.');
    }
    const creds = hashPassword(input.password);
    const record: AdminUserRecord = {
      id: makeId('adm'),
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      role: input.role,
      passwordHash: creds.hash,
      salt: creds.salt,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
    };
    this.data.admins.push(record);
    this.logActivity(actorName, 'Administrateur ajouté', record.email, 'securite');
    const { passwordHash: _ph, salt: _s, ...pub } = record;
    return pub;
  }

  public deleteAdmin(id: string, currentAdminId: string, actorName: string): boolean {
    if (id === currentAdminId) {
      throw new Error('Vous ne pouvez pas supprimer votre propre compte connecté.');
    }
    if (this.data.admins.length <= 1) {
      throw new Error('Il doit rester au moins un administrateur.');
    }
    const idx = this.data.admins.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    const [removed] = this.data.admins.splice(idx, 1);
    this.logActivity(actorName, 'Administrateur supprimé', removed.email, 'securite');
    return true;
  }

  public changeAdminPassword(id: string, newPassword: string, actorName: string): void {
    const adm = this.data.admins.find((a) => a.id === id);
    if (!adm) throw new Error('Administrateur introuvable.');
    const creds = hashPassword(newPassword);
    adm.passwordHash = creds.hash;
    adm.salt = creds.salt;
    this.logActivity(actorName, 'Mot de passe modifié', adm.email, 'securite');
  }

  public updateAdminProfile(
    id: string,
    patch: { email?: string; name?: string },
    actorName: string,
  ): AdminUserPublic {
    const adm = this.data.admins.find((a) => a.id === id);
    if (!adm) throw new Error('Administrateur introuvable.');

    if (typeof patch.email === 'string') {
      const nextEmail = patch.email.trim().toLowerCase();
      if (!nextEmail || !/\S+@\S+\.\S+/.test(nextEmail)) {
        throw new Error('Veuillez saisir une adresse email valide.');
      }
      const conflictAdmin = this.data.admins.find(
        (a) => a.id !== id && a.email.toLowerCase() === nextEmail,
      );
      if (conflictAdmin) {
        throw new Error('Un autre administrateur utilise déjà cette adresse email.');
      }
      const conflictVisitor = this.data.visitors.find((v) => v.email.toLowerCase() === nextEmail);
      if (conflictVisitor) {
        throw new Error('Un compte visiteur utilise déjà cette adresse email.');
      }
      adm.email = nextEmail;
    }

    if (typeof patch.name === 'string' && patch.name.trim()) {
      adm.name = patch.name.trim();
    }

    this.logActivity(actorName, 'Adresse de connexion modifiée', adm.email, 'securite');
    const { passwordHash: _ph, salt: _s, ...pub } = adm;
    return pub;
  }

  public createContactMessage(input: {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
  }): ContactMessage {
    const msg: ContactMessage = {
      id: makeId('msg'),
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      subject: input.subject.trim(),
      message: input.message.trim(),
      read: false,
      createdAt: new Date().toISOString(),
    };
    this.data.contactMessages.unshift(msg);
    this.logActivity(msg.name, 'Message de contact reçu', msg.subject, 'contenu');
    return msg;
  }

  public markMessageRead(id: string, read: boolean): ContactMessage | null {
    const msg = this.data.contactMessages.find((m) => m.id === id);
    if (!msg) return null;
    msg.read = read;
    this.save();
    return msg;
  }

  public deleteContactMessage(id: string): boolean {
    const idx = this.data.contactMessages.findIndex((m) => m.id === id);
    if (idx === -1) return false;
    this.data.contactMessages.splice(idx, 1);
    this.save();
    return true;
  }

  // ---------------- VISITOR AUTH, TRACKING, LIKES & TESTIMONIALS ----------------

  public findVisitorByEmail(email: string): VisitorMemberRecord | undefined {
    return this.data.visitors.find((v) => v.email.toLowerCase() === email.trim().toLowerCase());
  }

  public findVisitorById(id: string): VisitorMemberRecord | undefined {
    return this.data.visitors.find((v) => v.id === id);
  }

  public findVisitorByFirebaseUid(firebaseUid: string): VisitorMemberRecord | undefined {
    return this.data.visitors.find((v) => v.firebaseUid === firebaseUid);
  }

  public linkVisitorFirebaseUid(id: string, firebaseUid: string): void {
    const vis = this.data.visitors.find((v) => v.id === id);
    if (vis && vis.firebaseUid !== firebaseUid) {
      vis.firebaseUid = firebaseUid;
      this.save();
    }
  }

  public registerVisitor(input: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    country?: string;
    password: string;
    firebaseUid?: string;
  }): VisitorMemberPublic {
    const email = input.email.trim().toLowerCase();
    const cleanCountry = input.country ? input.country.trim().toUpperCase() : '';
    const existing = this.findVisitorByEmail(email);
    if (existing) {
      if (input.firebaseUid && !existing.firebaseUid) {
        existing.firebaseUid = input.firebaseUid;
        if (cleanCountry && !existing.country) existing.country = cleanCountry;
        this.save();
        const { passwordHash: _ph, salt: _s, firebaseUid: _fu, ...pubExisting } = existing;
        return pubExisting;
      }
      throw new Error('Un compte existe déjà avec cette adresse email.');
    }
    const creds = hashPassword(input.password);
    const created: VisitorMemberRecord = {
      id: makeId('vis'),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email,
      phone: input.phone.trim(),
      address: input.address.trim(),
      ...(cleanCountry ? { country: cleanCountry } : {}),
      passwordHash: creds.hash,
      salt: creds.salt,
      ...(input.firebaseUid ? { firebaseUid: input.firebaseUid } : {}),
      createdAt: new Date().toISOString(),
    };
    this.data.visitors.unshift(created);
    this.logActivity(`${created.firstName} ${created.lastName}`, 'Nouveau compte visiteur créé', created.email, 'securite');
    const { passwordHash: _ph, salt: _s, firebaseUid: _fu, ...pub } = created;
    return pub;
  }

  public findOrCreateVisitorFromFirebase(input: {
    uid: string;
    email?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    country?: string;
  }): VisitorMemberRecord {
    const cleanEmail = (input.email || '').trim().toLowerCase();
    const cleanCountry = input.country ? input.country.trim().toUpperCase() : '';
    let existing =
      this.findVisitorByFirebaseUid(input.uid) ||
      (cleanEmail ? this.findVisitorByEmail(cleanEmail) : undefined);

    if (existing) {
      let dirty = false;
      if (existing.firebaseUid !== input.uid) {
        existing.firebaseUid = input.uid;
        dirty = true;
      }
      if (cleanEmail && !existing.email) {
        existing.email = cleanEmail;
        dirty = true;
      }
      if (input.firstName?.trim() && (!existing.firstName || existing.firstName === 'Membre')) {
        existing.firstName = input.firstName.trim();
        dirty = true;
      }
      if (input.lastName?.trim() && (!existing.lastName || existing.lastName === 'Sanctuaire')) {
        existing.lastName = input.lastName.trim();
        dirty = true;
      }
      if (input.phone?.trim() && !existing.phone) {
        existing.phone = input.phone.trim();
        dirty = true;
      }
      if (input.address?.trim() && !existing.address) {
        existing.address = input.address.trim();
        dirty = true;
      }
      if (cleanCountry && !existing.country) {
        existing.country = cleanCountry;
        dirty = true;
      }
      if (dirty) this.save();
      return existing;
    }

    const displayParts = (input.name || '').trim().split(/\s+/).filter(Boolean);
    const fallbackFirst =
      input.firstName?.trim() ||
      displayParts[0] ||
      (cleanEmail ? cleanEmail.split('@')[0] : 'Membre');
    const fallbackLast =
      input.lastName?.trim() ||
      (displayParts.length > 1 ? displayParts.slice(1).join(' ') : 'Sanctuaire');
    const randomCreds = hashPassword(crypto.randomBytes(24).toString('hex'));

    const created: VisitorMemberRecord = {
      id: makeId('vis'),
      firstName: fallbackFirst,
      lastName: fallbackLast,
      email: cleanEmail || `${input.uid}@firebase.local`,
      phone: input.phone?.trim() || '',
      address: input.address?.trim() || '',
      ...(cleanCountry ? { country: cleanCountry } : {}),
      passwordHash: randomCreds.hash,
      salt: randomCreds.salt,
      firebaseUid: input.uid,
      createdAt: new Date().toISOString(),
    };
    this.data.visitors.unshift(created);
    this.logActivity(
      `${created.firstName} ${created.lastName}`,
      'Compte visiteur synchronisé via Firebase Auth',
      created.email,
      'securite',
    );
    return created;
  }

  public updateVisitorProfile(
    id: string,
    patch: { firstName: string; lastName: string; phone: string; address: string; country?: string },
  ): VisitorMemberPublic | null {
    const v = this.findVisitorById(id);
    if (!v) return null;
    v.firstName = patch.firstName.trim() || v.firstName;
    v.lastName = patch.lastName.trim() || v.lastName;
    v.phone = patch.phone.trim();
    v.address = patch.address.trim();
    if (patch.country !== undefined) {
      const cleanCountry = patch.country.trim().toUpperCase();
      if (cleanCountry) v.country = cleanCountry;
    }
    this.save();
    const { passwordHash: _ph, salt: _s, ...pub } = v;
    return pub;
  }

  private sanitizeOrderForPublic(order: Order): Order {
    if (order.invoice && order.invoice.status !== 'Envoyée') {
      const { invoice: _draft, ...rest } = order;
      return rest;
    }
    return order;
  }

  public getOrdersForVisitor(visitor: VisitorMemberRecord): Order[] {
    const normEmail = visitor.email.toLowerCase();
    const normPhone = visitor.phone.replace(/\s+/g, '');
    return [...this.data.orders]
      .filter((o) => {
        const visitorMatch = Boolean(o.visitorId && o.visitorId === visitor.id);
        const emailMatch = Boolean(o.customerEmail && o.customerEmail.toLowerCase() === normEmail);
        const phoneMatch = Boolean(normPhone && o.customerPhone.replace(/\s+/g, '') === normPhone);
        return visitorMatch || emailMatch || phoneMatch;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((o) => this.sanitizeOrderForPublic(o));
  }

  public trackOrder(orderNumberInput: string, contactInput: string): PublicOrderTrackingInfo | null {
    const cleanNum = orderNumberInput.trim().toUpperCase().replace(/^#/, '');
    const cleanContact = contactInput.trim().toLowerCase();
    const cleanPhone = contactInput.replace(/\s+/g, '');
    const found = this.data.orders.find((o) => {
      if (o.orderNumber.toUpperCase() !== cleanNum) return false;
      const emailOk = o.customerEmail && o.customerEmail.toLowerCase() === cleanContact;
      const phoneOk = o.customerPhone.replace(/\s+/g, '') === cleanPhone;
      return Boolean(emailOk || phoneOk);
    });
    if (!found) return null;
    return {
      id: found.id,
      orderNumber: found.orderNumber,
      createdAt: found.createdAt,
      updatedAt: found.updatedAt,
      status: found.status,
      customerFirstName: found.customerFirstName,
      customerLastName: found.customerLastName,
      history: found.history.map((entry) => ({
        status: entry.status,
        date: entry.date,
        note: /^Facture\s/i.test(entry.note)
          ? 'Dossier mis à jour par notre équipe.'
          : entry.note,
        actor: entry.actor,
      })),
    };
  }

  public toggleArticleLike(articleId: string, actorKey: string): { article: Article; liked: boolean } | null {
    const article = this.data.articles.find((a) => a.id === articleId && a.status === 'Publié');
    if (!article) return null;
    if (!Array.isArray(article.likedByKeys)) article.likedByKeys = [];
    const idx = article.likedByKeys.indexOf(actorKey);
    let liked: boolean;
    if (idx !== -1) {
      article.likedByKeys.splice(idx, 1);
      article.likesCount = Math.max(0, (article.likesCount || 0) - 1);
      liked = false;
    } else {
      article.likedByKeys.push(actorKey);
      article.likesCount = (article.likesCount || 0) + 1;
      liked = true;
    }
    this.save();
    return { article, liked };
  }

  public createTestimonial(input: {
    authorName: string;
    authorLocation: string;
    rating: number;
    content: string;
    visitorId?: string;
  }): Testimonial {
    const created: Testimonial = {
      id: makeId('test'),
      authorName: input.authorName.trim(),
      authorLocation: input.authorLocation.trim(),
      rating: Math.min(5, Math.max(1, Math.round(input.rating || 5))),
      content: input.content.trim(),
      status: 'Publié',
      featured: true,
      visitorId: input.visitorId,
      createdAt: new Date().toISOString(),
    };
    this.data.testimonials.unshift(created);
    this.logActivity(created.authorName, 'Nouveau témoignage publié', created.content.slice(0, 50), 'contenu');
    return created;
  }

  public updateTestimonial(
    id: string,
    patch: { status?: TestimonialStatus; featured?: boolean },
    actorName: string,
  ): Testimonial | null {
    const t = this.data.testimonials.find((item) => item.id === id);
    if (!t) return null;
    if (patch.status) t.status = patch.status;
    if (typeof patch.featured === 'boolean') t.featured = patch.featured;
    this.logActivity(actorName, 'Témoignage mis à jour', t.authorName, 'contenu');
    return t;
  }

  public deleteTestimonial(id: string, actorName: string): boolean {
    const idx = this.data.testimonials.findIndex((item) => item.id === id);
    if (idx === -1) return false;
    const [removed] = this.data.testimonials.splice(idx, 1);
    this.logActivity(actorName, 'Témoignage supprimé', removed.authorName, 'contenu');
    return true;
  }

  public getYoutubeSyncSettings(): NonNullable<SiteSettings['youtubeSync']> {
    if (!this.data.settings.youtubeSync) {
      this.data.settings.youtubeSync = {
        channelUrl: '',
        channelId: '',
        autoSync: true,
        lastSyncAt: null,
      };
    }
    return this.data.settings.youtubeSync;
  }

  public updateYoutubeSyncSettings(patch: {
    channelUrl?: string;
    channelId?: string;
    autoSync?: boolean;
  }): NonNullable<SiteSettings['youtubeSync']> {
    const current = this.getYoutubeSyncSettings();
    if (typeof patch.channelUrl === 'string') {
      current.channelUrl = patch.channelUrl.trim();
      if (current.channelUrl) {
        this.data.settings.socials.youtube = current.channelUrl;
      }
    }
    if (typeof patch.channelId === 'string') {
      current.channelId = patch.channelId.trim();
    }
    if (typeof patch.autoSync === 'boolean') {
      current.autoSync = patch.autoSync;
    }
    this.save();
    return current;
  }

  public syncChannelVideos(
    entries: Array<{
      youtubeId: string;
      title: string;
      description: string;
      thumbnail: string;
      youtubeUrl: string;
      publishedAt?: string;
    }>,
    channelUrl: string,
    channelId: string,
    actorName: string,
  ): { added: VideoItem[]; total: number; youtubeSync: NonNullable<SiteSettings['youtubeSync']> } {
    const syncCfg = this.getYoutubeSyncSettings();
    if (channelUrl.trim()) {
      syncCfg.channelUrl = channelUrl.trim();
      this.data.settings.socials.youtube = channelUrl.trim();
    }
    if (channelId.trim()) {
      syncCfg.channelId = channelId.trim();
    }
    syncCfg.lastSyncAt = new Date().toISOString();

    const existingIds = new Set(this.data.videos.map((v) => v.youtubeId));
    const newEntries = entries.filter((e) => e.youtubeId && !existingIds.has(e.youtubeId));

    const added: VideoItem[] = [];
    if (newEntries.length > 0) {
      // Place newest synced videos at top of sortOrder, shifting existing orders down
      this.data.videos.forEach((v) => {
        v.sortOrder += newEntries.length;
      });
      newEntries.forEach((entry, index) => {
        const created: VideoItem = {
          id: makeId('vid'),
          title: entry.title.trim() || `Vidéo (${entry.youtubeId})`,
          youtubeUrl: entry.youtubeUrl || `https://www.youtube.com/watch?v=${entry.youtubeId}`,
          youtubeId: entry.youtubeId,
          thumbnail: entry.thumbnail || `https://i.ytimg.com/vi/${entry.youtubeId}/hqdefault.jpg`,
          description: entry.description.trim(),
          duration: '',
          visible: true,
          featured: false,
          sortOrder: index + 1,
          createdAt: entry.publishedAt || new Date().toISOString(),
        };
        added.push(created);
      });
      this.data.videos = [...added, ...this.data.videos];
      this.logActivity(
        actorName,
        `Chaîne YouTube synchronisée (+${added.length} vidéo${added.length > 1 ? 's' : ''})`,
        channelId || channelUrl,
        'contenu',
      );
    } else {
      this.save();
    }

    return {
      added,
      total: this.data.videos.length,
      youtubeSync: syncCfg,
    };
  }
}

export const cmsStore = new CmsStore();
