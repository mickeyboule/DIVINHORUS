import type {
  AdminBootstrapData,
  ArticleCategory,
  PublicBootstrapData,
  SiteContent,
  SiteSettings,
} from '../types/cms';

export const DEFAULT_ARTICLE_CATEGORIES: ArticleCategory[] = [
  { id: 'ac_enseignements', name: 'Enseignements', slug: 'enseignements' },
  { id: 'ac_reflexions', name: 'Réflexions', slug: 'reflexions' },
  { id: 'ac_pratique', name: 'Pratique & Rituels', slug: 'pratique-rituels' },
  { id: 'ac_actualites', name: 'Actualités du Sanctuaire', slug: 'actualites' },
];

export function createDefaultSiteContent(): SiteContent {
  return {
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
          description:
            'Chaque objet est décrit avec exactitude quant à son origine, sa composition et son usage réel.',
        },
        {
          title: 'Relation Humaine Directe',
          description:
            'Vos demandes de commande sont traitées individuellement pour garantir disponibilité et conseil adapté.',
        },
        {
          title: 'Communauté Ouverte',
          description:
            'Articles, enseignements et vidéos restent librement accessibles afin de nourrir votre pratique.',
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
          category: 'Boutique',
          visible: true,
          question: 'Pourquoi n’y a-t-il pas de paiement en ligne sur la boutique ?',
          answer:
            'Par souci d’authenticité et d’accompagnement humain, aucune carte bancaire n’est demandée en ligne. Vous validez simplement votre demande de commande : notre équipe vérifie la disponibilité artisanale et vous contacte personnellement pour confirmer les détails et le règlement.',
        },
        {
          id: 'faq_3',
          category: 'Boutique',
          visible: true,
          question: 'Comment suivre l’évolution de ma demande de commande ?',
          answer:
            'Chaque demande génère un numéro unique (par exemple CMD-1001). Vous pouvez suivre son statut à tout moment depuis la page « Suivre ma commande » ou directement dans votre espace « Mon compte ».',
        },
      ],
    },
    contactPage: {
      title: 'Entrer en relation avec DIVIN HORUS',
      subtitle:
        'Pour toute question concernant un enseignement, une demande de commande personnalisée ou une orientation, notre équipe vous répond avec attention.',
      sanctuaryHours: 'Accueil & réponses du lundi au vendredi, de 9h30 à 18h30',
      consultationNote:
        'Les demandes de commande passées en boutique sont confirmées par téléphone ou courriel sous 24 heures ouvrées.',
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
}

export function createDefaultSiteSettings(): SiteSettings {
  return {
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
      deliveryZones:
        'France métropolitaine, Belgique, Suisse, Luxembourg et retrait au Sanctuaire (Paris)',
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
      defaultInvoiceNotes:
        'DIVIN HORUS · Facture à régler dès réception pour finaliser l’expédition.',
      defaultInvoiceSignature: {
        type: 'text',
        imageUrl: '',
        signerName: 'Direction DIVIN HORUS',
        signerRole: 'Service Commandes & Facturation',
      },
      teamWhatsappPhone: '',
    },
  };
}

export function createDefaultPublicBootstrap(): PublicBootstrapData {
  return {
    categories: [],
    products: [],
    articleCategories: DEFAULT_ARTICLE_CATEGORIES,
    articles: [],
    videos: [],
    testimonials: [],
    siteContent: createDefaultSiteContent(),
    settings: createDefaultSiteSettings(),
  };
}

export function createDefaultAdminBootstrap(adminInfo?: {
  uid: string;
  email?: string | null;
  displayName?: string | null;
}): AdminBootstrapData {
  const now = new Date().toISOString();
  return {
    categories: [],
    products: [],
    orders: [],
    customers: [],
    articleCategories: DEFAULT_ARTICLE_CATEGORIES,
    articles: [],
    videos: [],
    testimonials: [],
    visitors: [],
    media: [],
    siteContent: createDefaultSiteContent(),
    settings: createDefaultSiteSettings(),
    admins: adminInfo
      ? [
          {
            id: adminInfo.uid,
            name: adminInfo.displayName || 'Administrateur Divin Horus',
            email: adminInfo.email || 'bisnessweb24@gmail.com',
            role: 'Super Administrateur',
            createdAt: now,
            lastLoginAt: now,
          },
        ]
      : [],
    activities: [],
    contactMessages: [],
  };
}
