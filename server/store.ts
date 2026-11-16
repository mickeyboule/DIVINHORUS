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
  OrderStatus,
  Product,
  PublicBootstrapData,
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
}

export interface VisitorMemberRecord extends VisitorMemberPublic {
  passwordHash: string;
  salt: string;
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
  const adminCreds = hashPassword('Sanctuaire2026');

  const categories: Category[] = [
    {
      id: 'cat_encens',
      name: 'Encens & Résines',
      slug: 'encens-resines',
      description: 'Bâtons roulés à la main, bois de cèdre sacré et résines pures de purification.',
      image: '/src/assets/images/product_incense_cedar_1794851466386.jpg',
      order: 1,
      visible: true,
      createdAt: isoDaysAgo(40),
    },
    {
      id: 'cat_huiles',
      name: 'Huiles & Élixirs',
      slug: 'huiles-elixirs',
      description: 'Extraits botaniques pressés à froid et huiles d’onction préparées en petites séries.',
      image: '/src/assets/images/product_elixir_oil_1794851466718.jpg',
      order: 2,
      visible: true,
      createdAt: isoDaysAgo(38),
    },
    {
      id: 'cat_bougies',
      name: 'Bougies Rituelles',
      slug: 'bougies-rituelles',
      description: 'Cire d’abeille sauvage coulée en céramique artisanale pour la veille contemplative.',
      image: '/src/assets/images/product_candle_beeswax_1794851466573.jpg',
      order: 3,
      visible: true,
      createdAt: isoDaysAgo(35),
    },
    {
      id: 'cat_pierres',
      name: 'Pierres & Méditation',
      slug: 'pierres-meditation',
      description: 'Minéraux polis sélectionnés pour l’ancrage, la clarté mentale et la pratique silencieuse.',
      image: '/src/assets/images/product_stone_labradorite_1794851467208.jpg',
      order: 4,
      visible: true,
      createdAt: isoDaysAgo(32),
    },
  ];

  const products: Product[] = [
    {
      id: 'prod_encens_cedre',
      reference: 'EV-ENC-001',
      name: 'Encens Cèdre de l’Atlas & Oliban',
      slug: 'encens-cedre-atlas-oliban',
      price: 34,
      categoryId: 'cat_encens',
      description:
        'Roulés selon une méthode traditionnelle sans liant synthétique, ces bâtons marient le cœur de cèdre de l’Atlas aux larmes d’oliban pur. Leur combustion lente installe un climat de recueillement profond.',
      additionalInfo: 'Boîte de 24 bâtons · Combustion environ 45 minutes par bâton · Origine : Atlas & Oman · Support en basalte vendu séparément.',
      images: ['/src/assets/images/product_incense_cedar_1794851466386.jpg'],
      availability: 'En stock',
      stockCount: 28,
      featured: true,
      active: true,
      orderCount: 19,
      createdAt: isoDaysAgo(30),
      updatedAt: isoDaysAgo(2),
    },
    {
      id: 'prod_huile_sauge',
      reference: 'EV-HUI-004',
      name: 'Élixir Botanique de Sauge Blanche',
      slug: 'elixir-botanique-sauge-blanche',
      price: 58,
      categoryId: 'cat_huiles',
      description:
        'Macération lente de sauge blanche et de néroli dans une huile de jojoba vierge. Quelques gouttes sur les poignets ou sur pierre poreuse accompagnent l’ouverture de la pratique matinale.',
      additionalInfo: 'Flacon en verre ambré 30 ml · Compte-gouttes en laiton brossé · Sans conservateur ni parfum de synthèse.',
      images: ['/src/assets/images/product_elixir_oil_1794851466718.jpg'],
      availability: 'En stock',
      stockCount: 16,
      featured: true,
      active: true,
      orderCount: 14,
      createdAt: isoDaysAgo(28),
      updatedAt: isoDaysAgo(3),
    },
    {
      id: 'prod_bougie_cire',
      reference: 'EV-BOU-002',
      name: 'Bougie de Veille Cire d’Abeille & Grès',
      slug: 'bougie-veille-cire-abeille-gres',
      price: 46,
      categoryId: 'cat_bougies',
      description:
        'Coulée à la main dans un calice de grès tourné en atelier, cette bougie de cire d’abeille brute diffuse une lueur chaude et une note subtile de miel sauvage, propice au silence du soir.',
      additionalInfo: 'Cire d’abeille 100 % pure · Mèche en coton non blanchi · 55 heures de combustion · Contenant réutilisable.',
      images: ['/src/assets/images/product_candle_beeswax_1794851466573.jpg'],
      availability: 'En stock',
      stockCount: 22,
      featured: true,
      active: true,
      orderCount: 16,
      createdAt: isoDaysAgo(25),
      updatedAt: isoDaysAgo(1),
    },
    {
      id: 'prod_pierres_ancrage',
      reference: 'EV-PIE-007',
      name: 'Duo d’Ancrage Labradorite & Quartz Fumé',
      slug: 'duo-ancrage-labradorite-quartz-fume',
      price: 65,
      categoryId: 'cat_pierres',
      description:
        'Deux galets de paume polis à la main, choisis par le Maître pour leur densité et leur toucher apaisant. Livrés dans leur pochette de lin brut pour accompagner l’assise quotidienne.',
      additionalInfo: 'Labradorite de Madagascar & Quartz Fumé alpin · Poids moyen du duo : 260 g · Pièces naturelles uniques.',
      images: ['/src/assets/images/product_stone_labradorite_1794851467208.jpg'],
      availability: 'Édition limitée',
      stockCount: 7,
      featured: true,
      active: true,
      orderCount: 11,
      createdAt: isoDaysAgo(20),
      updatedAt: isoDaysAgo(4),
    },
    {
      id: 'prod_encens_sanctuaire',
      reference: 'EV-ENC-009',
      name: 'Coffret Rituel du Sanctuaire',
      slug: 'coffret-rituel-du-sanctuaire',
      price: 112,
      categoryId: 'cat_encens',
      description:
        'Réunit notre brûleur sculpté en basalte et travertin, une réserve de bâtons au cèdre et le carnet de pratique quotidienne en papier coton.',
      additionalInfo: 'Composition complète : Porte-encens bi-matière, 24 bâtons de cèdre, carnet cousu main · Préparation sous 48h.',
      images: [
        '/src/assets/images/product_incense_cedar_1794851466386.jpg',
        '/src/assets/images/article_sacred_ritual_1794851468079.jpg',
      ],
      availability: 'Sur commande',
      stockCount: 5,
      featured: false,
      active: true,
      orderCount: 8,
      createdAt: isoDaysAgo(15),
      updatedAt: isoDaysAgo(2),
    },
    {
      id: 'prod_bol_contemplation',
      reference: 'EV-MED-012',
      name: 'Carnet de Silence & Bol d’Ouverture',
      slug: 'carnet-silence-bol-ouverture',
      price: 89,
      categoryId: 'cat_pierres',
      description:
        'Ensemble dédié à l’écriture méditative du matin : un carnet artisanal à tranche brute accompagné d’un petit bol chantant en laiton martelé à la tonalité claire et durable.',
      additionalInfo: 'Bol diamètre 10 cm avec mailloche en bois de noyer · Carnet 120 pages papier coton 180 g/m².',
      images: ['/src/assets/images/article_sacred_ritual_1794851468079.jpg'],
      availability: 'En stock',
      stockCount: 12,
      featured: false,
      active: true,
      orderCount: 6,
      createdAt: isoDaysAgo(12),
      updatedAt: isoDaysAgo(1),
    },
  ];

  const customers: Customer[] = [
    {
      id: 'cust_1',
      firstName: 'Claire',
      lastName: 'Morel',
      phone: '+33 6 14 28 73 90',
      email: 'claire.morel@exemple.fr',
      address: '14 Rue des Archives, 75004 Paris',
      notes: 'Apprécie les livraisons en fin d’après-midi.',
      createdAt: isoDaysAgo(14),
      lastOrderAt: isoDaysAgo(0, 9),
      orderCount: 2,
      totalIndicative: 146,
    },
    {
      id: 'cust_2',
      firstName: 'Marc',
      lastName: 'Lefèvre',
      phone: '+33 6 72 41 19 04',
      email: 'marc.lefevre@exemple.fr',
      address: '8 Place Bellecour, 69002 Lyon',
      notes: '',
      createdAt: isoDaysAgo(9),
      lastOrderAt: isoDaysAgo(1, 15),
      orderCount: 1,
      totalIndicative: 65,
    },
    {
      id: 'cust_3',
      firstName: 'Nadia',
      lastName: 'Benali',
      phone: '+33 6 55 83 12 47',
      email: 'nadia.benali@exemple.fr',
      address: '27 Avenue Jean Médecin, 06000 Nice',
      notes: 'Demande régulière de coffrets pour retraite.',
      createdAt: isoDaysAgo(5),
      lastOrderAt: isoDaysAgo(3, 11),
      orderCount: 1,
      totalIndicative: 112,
    },
    {
      id: 'cust_4',
      firstName: 'Antoine',
      lastName: 'Rousseau',
      phone: '+33 7 81 04 66 21',
      email: '',
      address: '3 Rue Sainte-Catherine, 33000 Bordeaux',
      notes: '',
      createdAt: isoDaysAgo(3),
      lastOrderAt: isoDaysAgo(2, 16),
      orderCount: 1,
      totalIndicative: 80,
    },
  ];

  const orders: Order[] = [
    {
      id: 'ord_1045',
      orderNumber: 'CMD-1045',
      createdAt: isoDaysAgo(0, 9),
      updatedAt: isoDaysAgo(0, 9),
      status: 'Nouvelle',
      customerId: 'cust_1',
      customerFirstName: 'Claire',
      customerLastName: 'Morel',
      customerPhone: '+33 6 14 28 73 90',
      customerEmail: 'claire.morel@exemple.fr',
      deliveryAddress: '14 Rue des Archives, 75004 Paris',
      message: 'Merci de joindre un mot de guidance pour offrir.',
      items: [
        {
          productId: 'prod_huile_sauge',
          productName: 'Élixir Botanique de Sauge Blanche',
          productRef: 'EV-HUI-004',
          unitPrice: 58,
          quantity: 1,
          image: '/src/assets/images/product_elixir_oil_1794851466718.jpg',
        },
        {
          productId: 'prod_encens_cedre',
          productName: 'Encens Cèdre de l’Atlas & Oliban',
          productRef: 'EV-ENC-001',
          unitPrice: 34,
          quantity: 1,
          image: '/src/assets/images/product_incense_cedar_1794851466386.jpg',
        },
      ],
      indicativeTotal: 92,
      adminNotes: '',
      history: [
        {
          status: 'Nouvelle',
          date: isoDaysAgo(0, 9),
          note: 'Demande de commande reçue depuis la boutique.',
          actor: 'Visiteur',
        },
      ],
    },
    {
      id: 'ord_1044',
      orderNumber: 'CMD-1044',
      createdAt: isoDaysAgo(1, 15),
      updatedAt: isoDaysAgo(1, 17),
      status: 'En cours',
      customerId: 'cust_2',
      customerFirstName: 'Marc',
      customerLastName: 'Lefèvre',
      customerPhone: '+33 6 72 41 19 04',
      customerEmail: 'marc.lefevre@exemple.fr',
      deliveryAddress: '8 Place Bellecour, 69002 Lyon',
      message: 'Disponible par téléphone après 18h pour confirmer la livraison.',
      items: [
        {
          productId: 'prod_pierres_ancrage',
          productName: 'Duo d’Ancrage Labradorite & Quartz Fumé',
          productRef: 'EV-PIE-007',
          unitPrice: 65,
          quantity: 1,
          image: '/src/assets/images/product_stone_labradorite_1794851467208.jpg',
        },
      ],
      indicativeTotal: 65,
      adminNotes: 'Appel prévu ce soir à 18h30.',
      history: [
        {
          status: 'Nouvelle',
          date: isoDaysAgo(1, 15),
          note: 'Demande de commande enregistrée.',
          actor: 'Visiteur',
        },
        {
          status: 'En cours',
          date: isoDaysAgo(1, 17),
          note: 'Sélection des deux pierres en cours à l’atelier.',
          actor: 'Maître Élias Varenne',
        },
      ],
    },
    {
      id: 'ord_1043',
      orderNumber: 'CMD-1043',
      createdAt: isoDaysAgo(2, 16),
      updatedAt: isoDaysAgo(2, 18),
      status: 'Confirmée',
      customerId: 'cust_4',
      customerFirstName: 'Antoine',
      customerLastName: 'Rousseau',
      customerPhone: '+33 7 81 04 66 21',
      customerEmail: '',
      deliveryAddress: '3 Rue Sainte-Catherine, 33000 Bordeaux',
      message: '',
      items: [
        {
          productId: 'prod_bougie_cire',
          productName: 'Bougie de Veille Cire d’Abeille & Grès',
          productRef: 'EV-BOU-002',
          unitPrice: 46,
          quantity: 1,
          image: '/src/assets/images/product_candle_beeswax_1794851466573.jpg',
        },
        {
          productId: 'prod_encens_cedre',
          productName: 'Encens Cèdre de l’Atlas & Oliban',
          productRef: 'EV-ENC-001',
          unitPrice: 34,
          quantity: 1,
          image: '/src/assets/images/product_incense_cedar_1794851466386.jpg',
        },
      ],
      indicativeTotal: 80,
      adminNotes: 'Confirmé par téléphone, expédition demain.',
      history: [
        {
          status: 'Nouvelle',
          date: isoDaysAgo(2, 16),
          note: 'Demande de commande enregistrée.',
          actor: 'Visiteur',
        },
        {
          status: 'Confirmée',
          date: isoDaysAgo(2, 18),
          note: 'Adresse et créneau validés avec le client.',
          actor: 'Maître Élias Varenne',
        },
      ],
    },
    {
      id: 'ord_1042',
      orderNumber: 'CMD-1042',
      createdAt: isoDaysAgo(3, 11),
      updatedAt: isoDaysAgo(2, 10),
      status: 'Terminée',
      customerId: 'cust_3',
      customerFirstName: 'Nadia',
      customerLastName: 'Benali',
      customerPhone: '+33 6 55 83 12 47',
      customerEmail: 'nadia.benali@exemple.fr',
      deliveryAddress: '27 Avenue Jean Médecin, 06000 Nice',
      message: 'Pour notre cercle de méditation mensuel.',
      items: [
        {
          productId: 'prod_encens_sanctuaire',
          productName: 'Coffret Rituel du Sanctuaire',
          productRef: 'EV-ENC-009',
          unitPrice: 112,
          quantity: 1,
          image: '/src/assets/images/product_incense_cedar_1794851466386.jpg',
        },
      ],
      indicativeTotal: 112,
      adminNotes: 'Colis remis en main propre.',
      history: [
        {
          status: 'Nouvelle',
          date: isoDaysAgo(3, 11),
          note: 'Demande reçue.',
          actor: 'Visiteur',
        },
        {
          status: 'Terminée',
          date: isoDaysAgo(2, 10),
          note: 'Commande livrée et clôturée.',
          actor: 'Maître Élias Varenne',
        },
      ],
    },
    {
      id: 'ord_1041',
      orderNumber: 'CMD-1041',
      createdAt: isoDaysAgo(6, 14),
      updatedAt: isoDaysAgo(4, 12),
      status: 'Terminée',
      customerId: 'cust_1',
      customerFirstName: 'Claire',
      customerLastName: 'Morel',
      customerPhone: '+33 6 14 28 73 90',
      customerEmail: 'claire.morel@exemple.fr',
      deliveryAddress: '14 Rue des Archives, 75004 Paris',
      message: '',
      items: [
        {
          productId: 'prod_bougie_cire',
          productName: 'Bougie de Veille Cire d’Abeille & Grès',
          productRef: 'EV-BOU-002',
          unitPrice: 46,
          quantity: 1,
          image: '/src/assets/images/product_candle_beeswax_1794851466573.jpg',
        },
      ],
      indicativeTotal: 54,
      adminNotes: '',
      history: [
        {
          status: 'Nouvelle',
          date: isoDaysAgo(6, 14),
          note: 'Demande reçue.',
          actor: 'Visiteur',
        },
        {
          status: 'Terminée',
          date: isoDaysAgo(4, 12),
          note: 'Livrée.',
          actor: 'Maître Élias Varenne',
        },
      ],
    },
  ];

  const articleCategories: ArticleCategory[] = [
    { id: 'ac_enseignements', name: 'Enseignements', slug: 'enseignements' },
    { id: 'ac_reflexions', name: 'Réflexions', slug: 'reflexions' },
    { id: 'ac_pratique', name: 'Pratique & Rituels', slug: 'pratique-rituels' },
    { id: 'ac_actualites', name: 'Actualités du Sanctuaire', slug: 'actualites' },
  ];

  const articles: Article[] = [
    {
      id: 'art_silence_interieur',
      title: 'Habiter le silence avant que le monde ne s’éveille',
      slug: 'habiter-le-silence-avant-le-monde',
      excerpt:
        'Pourquoi les vingt premières minutes du matin déterminent la qualité de notre attention, et comment aménager un espace de clarté sans rupture avec la vie moderne.',
      content:
        'Le silence n’est pas l’absence de bruit ; il est la présence d’une écoute sans précipitation. Lorsque nous ouvrons les yeux le matin, notre esprit cherche aussitôt un appui extérieur : une tâche, un message, une inquiétude héritée de la veille.\n\nAménager un seuil entre le sommeil et l’action transforme radicalement notre rapport au temps. Il ne s’agit pas de fuir nos responsabilités, mais d’entrer dans la journée depuis un centre stable. Asseyez-vous face à une lumière sobre, respirez trois fois profondément sans chercher à corriger le souffle, puis observez simplement ce qui demande à être apaisé.\n\nUn objet familier — une tasse de thé tiède, une flamme de cire pure, une pierre fraîche dans la paume — agit alors comme un repère sensoriel. Il rappelle au corps que rien n’exige votre dispersion immédiate.',
      image: '/src/assets/images/article_inner_silence_1794851467763.jpg',
      author: 'Maître Élias Varenne',
      categoryId: 'ac_enseignements',
      status: 'Publié',
      featured: true,
      likesCount: 18,
      likedByKeys: [],
      publishedAt: isoDaysAgo(4),
      createdAt: isoDaysAgo(5),
      updatedAt: isoDaysAgo(4),
    },
    {
      id: 'art_rituel_ecriture',
      title: 'L’écriture contemplative comme miroir de discernement',
      slug: 'ecriture-contemplative-miroir-discernement',
      excerpt:
        'Poser ses pensées sur papier coton libère la mémoire vive et révèle les intentions véritables derrière nos hésitations quotidiennes.',
      content:
        'Écrire à la main ralentit le débit de la pensée jusqu’à la vitesse de la respiration. Dans ce ralentissement apparaît une honnêteté que le tumulte intérieur dissimulait.\n\nChaque soir, consacrez dix minutes à noter trois observations sans jugement : ce qui vous a donné de l’élan, ce qui a troublé votre paix, et ce que vous choisissez de déposer avant le sommeil. Nul besoin de style littéraire ; la simplicité du trait suffit.\n\nAvec les semaines, ces feuillets deviennent une cartographie fidèle de votre évolution intérieure. Vous cessez de répéter les mêmes impasses parce que vous apprenez à en reconnaître les premiers signes.',
      image: '/src/assets/images/article_sacred_ritual_1794851468079.jpg',
      author: 'Maître Élias Varenne',
      categoryId: 'ac_pratique',
      status: 'Publié',
      featured: true,
      likesCount: 14,
      likedByKeys: [],
      publishedAt: isoDaysAgo(10),
      createdAt: isoDaysAgo(11),
      updatedAt: isoDaysAgo(10),
    },
    {
      id: 'art_matiere_sacree',
      title: 'La sobriété des objets qui nous entourent',
      slug: 'sobriete-des-objets-qui-nous-entourent',
      excerpt:
        'Ce que nous touchons façonne notre état d’esprit. Réflexion sur les matières nobles — bois, pierre, argile — et leur rôle dans l’équilibre du foyer.',
      content:
        'Nous vivons entourés d’objets anonymes, légers et jetables qui n’appellent aucun soin. Pourtant, l’être humain entretient un dialogue silencieux avec la matière qui l’environne.\n\nChoisir un brûleur en pierre brute ou une bougie façonnée par une main patiente n’est pas un luxe décoratif : c’est une manière d’honorer le geste. Chaque fois que vous allumez un encens véritable, vous signifiez à votre espace qu’un temps différent commence.\n\nEntourez-vous de peu d’objets, mais veillez à ce que chacun porte une intention claire, une origine lisible et une durée qui dépasse l’instant.',
      image: '/src/assets/images/hero_sanctuary_1794851465479.jpg',
      author: 'Maître Élias Varenne',
      categoryId: 'ac_reflexions',
      status: 'Publié',
      featured: true,
      likesCount: 9,
      likedByKeys: [],
      publishedAt: isoDaysAgo(17),
      createdAt: isoDaysAgo(18),
      updatedAt: isoDaysAgo(17),
    },
    {
      id: 'art_retraite_hiver',
      title: 'Notes préparatoires pour la veille du solstice d’hiver',
      slug: 'notes-preparatoires-solstice-hiver',
      excerpt:
        'Brouillon de travail consacré aux lectures et temps de silence qui rythmeront la rencontre de décembre au Sanctuaire.',
      content:
        'Document de préparation interne pour les participants de la retraite d’hiver. Horaires envisagés : ouverture à 7h30, marche silencieuse à 11h00, entretien collectif à 17h00.',
      image: '/src/assets/images/product_candle_beeswax_1794851466573.jpg',
      author: 'Maître Élias Varenne',
      categoryId: 'ac_actualites',
      status: 'Brouillon',
      featured: false,
      likesCount: 0,
      likedByKeys: [],
      publishedAt: isoDaysAgo(1),
      createdAt: isoDaysAgo(1),
      updatedAt: isoDaysAgo(1),
    },
  ];

  const videos: VideoItem[] = [
    {
      id: 'vid_1',
      title: 'Entretien sur la paix intérieure et l’art de la présence',
      youtubeUrl: 'https://www.youtube.com/watch?v=inpok4MKVLM',
      youtubeId: 'inpok4MKVLM',
      thumbnail: 'https://img.youtube.com/vi/inpok4MKVLM/hqdefault.jpg',
      description: 'Une méditation guidée de cinq minutes pour retrouver votre ancrage au cœur de la journée.',
      duration: '05:12',
      visible: true,
      featured: true,
      sortOrder: 1,
      createdAt: isoDaysAgo(12),
    },
    {
      id: 'vid_2',
      title: 'Respiration consciente et apaisement du système nerveux',
      youtubeUrl: 'https://www.youtube.com/watch?v=ZToicYcHIOU',
      youtubeId: 'ZToicYcHIOU',
      thumbnail: 'https://img.youtube.com/vi/ZToicYcHIOU/hqdefault.jpg',
      description: 'Pratique vocale et silencieuse pour relâcher les tensions accumulées avant le repos nocturne.',
      duration: '10:05',
      visible: true,
      featured: true,
      sortOrder: 2,
      createdAt: isoDaysAgo(21),
    },
    {
      id: 'vid_3',
      title: 'Le discernement face aux cycles de changement',
      youtubeUrl: 'https://www.youtube.com/watch?v=O-6f5wQXSu8',
      youtubeId: 'O-6f5wQXSu8',
      thumbnail: 'https://img.youtube.com/vi/O-6f5wQXSu8/hqdefault.jpg',
      description: 'Enseignement d’ouverture sur l’accueil des transitions personnelles avec lucidité et douceur.',
      duration: '10:18',
      visible: true,
      featured: false,
      sortOrder: 3,
      createdAt: isoDaysAgo(30),
    },
  ];

  const media: MediaItem[] = [
    {
      id: 'med_hero',
      name: 'Sanctuaire Matin Lumière',
      url: '/src/assets/images/hero_sanctuary_1794851465479.jpg',
      folder: 'site',
      sizeLabel: '16:9 · Éditorial',
      createdAt: isoDaysAgo(40),
    },
    {
      id: 'med_master',
      name: 'Portrait Maître Élias Varenne',
      url: '/src/assets/images/master_portrait_1794851465814.jpg',
      folder: 'site',
      sizeLabel: '3:4 · Portrait',
      createdAt: isoDaysAgo(40),
    },
    {
      id: 'med_incense',
      name: 'Encens Cèdre & Basalte',
      url: '/src/assets/images/product_incense_cedar_1794851466386.jpg',
      folder: 'produits',
      sizeLabel: '4:3 · Produit',
      createdAt: isoDaysAgo(35),
    },
    {
      id: 'med_oil',
      name: 'Élixir Sauge Blanche',
      url: '/src/assets/images/product_elixir_oil_1794851466718.jpg',
      folder: 'produits',
      sizeLabel: '4:3 · Produit',
      createdAt: isoDaysAgo(35),
    },
    {
      id: 'med_candle',
      name: 'Bougie Cire & Grès',
      url: '/src/assets/images/product_candle_beeswax_1794851466573.jpg',
      folder: 'produits',
      sizeLabel: '4:3 · Produit',
      createdAt: isoDaysAgo(35),
    },
    {
      id: 'med_stones',
      name: 'Pierres Labradorite & Quartz',
      url: '/src/assets/images/product_stone_labradorite_1794851467208.jpg',
      folder: 'produits',
      sizeLabel: '4:3 · Produit',
      createdAt: isoDaysAgo(35),
    },
    {
      id: 'med_art1',
      name: 'Cérémonie du Thé & Silence',
      url: '/src/assets/images/article_inner_silence_1794851467763.jpg',
      folder: 'articles',
      sizeLabel: '4:3 · Article',
      createdAt: isoDaysAgo(20),
    },
    {
      id: 'med_art2',
      name: 'Carnet Coton & Bol Laiton',
      url: '/src/assets/images/article_sacred_ritual_1794851468079.jpg',
      folder: 'articles',
      sizeLabel: '4:3 · Article',
      createdAt: isoDaysAgo(20),
    },
  ];

  const siteContent: SiteContent = {
    hero: {
      visible: true,
      title: 'Bienvenue dans votre espace de clarté et de présence',
      subtitle:
        'Découvrez les enseignements contemporains de Maître Élias Varenne, rejoignez les échanges de la communauté et commandez des objets rituels façonnés avec sobriété.',
      image: '/src/assets/images/hero_sanctuary_1794851465479.jpg',
      primaryButtonLabel: 'Découvrir la boutique',
      primaryButtonTarget: '/boutique',
      secondaryButtonLabel: 'Rejoindre la communauté',
      secondaryButtonTarget: '/communaute',
    },
    master: {
      visible: true,
      photo: '/src/assets/images/master_portrait_1794851465814.jpg',
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
      featuredProductIds: [
        'prod_encens_cedre',
        'prod_huile_sauge',
        'prod_bougie_cire',
        'prod_pierres_ancrage',
      ],
      showCommunityArticles: true,
      featuredArticlesTitle: 'Derniers enseignements & écrits',
      featuredArticleIds: ['art_silence_interieur', 'art_rituel_ecriture', 'art_matiere_sacree'],
      showCommunityVideos: true,
      featuredVideosTitle: 'Vidéos & méditations guidées',
      featuredVideoIds: ['vid_1', 'vid_2'],
      showTestimonials: true,
      featuredTestimonialsTitle: 'Paroles & Témoignages',
      sectionOrder: ['master', 'products', 'articles', 'videos', 'testimonials'],
    },
    aboutPage: {
      heroTitle: 'Une voie contemplative ancrée dans le réel',
      heroSubtitle:
        'Le Sanctuaire Élias Varenne réunit transmission écrite, pratique audio-visuelle et artisanat sacré au service de l’équilibre intérieur.',
      philosophyTitle: 'Notre philosophie de transmission',
      philosophyBody:
        'Nous croyons qu’une démarche spirituelle authentique se mesure à la paix qu’elle apporte dans les gestes ordinaires : la parole juste, l’attention portée aux autres, et la sobriété de nos habitudes.\n\nRefusant tout folklore ostentatoire, notre espace privilégie la clarté, l’étude patiente et l’accompagnement humain direct. C’est également la raison pour laquelle chaque commande fait l’objet d’un échange personnel avant préparation.',
      lineageTitle: 'L’atelier des matières nobles',
      lineageBody:
        'Tous les encens, huiles botaniques, bougies en cire d’abeille et minéraux sont sélectionnés ou formulés auprès d’artisans indépendants respectueux des cycles naturels. Aucun paiement automatisé n’est requis en ligne : votre demande est reçue, vérifiée et confirmée personnellement par notre équipe.',
      image: '/src/assets/images/master_portrait_1794851465814.jpg',
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
    },
    contactPage: {
      title: 'Entrer en relation avec le Sanctuaire',
      subtitle:
        'Pour toute question concernant un enseignement, une demande de commande personnalisée ou une orientation, notre équipe vous répond avec attention.',
      sanctuaryHours: 'Accueil & réponses du lundi au vendredi, de 9h30 à 18h30',
      consultationNote: 'Les demandes de commande passées en boutique sont confirmées par téléphone ou courriel sous 24 heures ouvrées.',
    },
  };

  const settings: SiteSettings = {
    general: {
      siteName: 'Élias Varenne',
      tagline: 'Spiritualité, Enseignements & Objets Sacrés',
      logoUrl: '',
      faviconUrl: '',
      currencySymbol: '€',
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
      instagram: 'https://www.instagram.com',
      facebook: '',
      telegram: '',
    },
    orderSettings: {
      confirmationMessage:
        'Votre demande de commande a bien été transmise au Sanctuaire. Notre équipe vous contactera sous peu pour confirmer la disponibilité et les modalités de remise.',
      deliveryZones: 'France métropolitaine, Belgique, Suisse, Luxembourg et retrait au Sanctuaire (Paris)',
      requireEmail: false,
      allowMultiProductCart: true,
    },
  };

  const admins: AdminUserRecord[] = [
    {
      id: 'adm_1',
      name: 'Maître Élias Varenne',
      email: 'admin@eliasvarenne.fr',
      role: 'Super Administrateur',
      passwordHash: adminCreds.hash,
      salt: adminCreds.salt,
      createdAt: isoDaysAgo(60),
      lastLoginAt: isoDaysAgo(0, 8),
    },
  ];

  const activities: ActivityLog[] = [
    {
      id: 'act_1',
      actorName: 'Claire Morel',
      action: 'Nouvelle demande de commande enregistrée',
      target: 'CMD-1045 (92 €)',
      category: 'commande',
      createdAt: isoDaysAgo(0, 9),
    },
    {
      id: 'act_2',
      actorName: 'Maître Élias Varenne',
      action: 'Statut mis à jour vers En cours',
      target: 'CMD-1044 · Marc Lefèvre',
      category: 'commande',
      createdAt: isoDaysAgo(1, 17),
    },
    {
      id: 'act_3',
      actorName: 'Maître Élias Varenne',
      action: 'Article publié dans Communauté',
      target: 'Habiter le silence avant que le monde ne s’éveille',
      category: 'contenu',
      createdAt: isoDaysAgo(4, 10),
    },
    {
      id: 'act_4',
      actorName: 'Maître Élias Varenne',
      action: 'Produit mis à jour',
      target: 'Bougie de Veille Cire d’Abeille & Grès',
      category: 'produit',
      createdAt: isoDaysAgo(1, 11),
    },
  ];

  const contactMessages: ContactMessage[] = [
    {
      id: 'msg_1',
      name: 'Hélène Laurent',
      email: 'helene.laurent@exemple.fr',
      phone: '+33 6 42 19 88 10',
      subject: 'Question sur la prochaine retraite silencieuse',
      message:
        'Bonjour, je souhaiterais connaître les dates des prochaines rencontres d’hiver ainsi que la disponibilité du coffret du Sanctuaire.',
      read: false,
      createdAt: isoDaysAgo(1, 14),
    },
  ];

  const visitorCreds = hashPassword('Visiteur2026');
  const visitors: VisitorMemberRecord[] = [
    {
      id: 'vis_1',
      firstName: 'Claire',
      lastName: 'Morel',
      email: 'claire.morel@exemple.fr',
      phone: '+33 6 14 28 73 90',
      address: '14 Rue des Archives, 75004 Paris',
      passwordHash: visitorCreds.hash,
      salt: visitorCreds.salt,
      createdAt: isoDaysAgo(14),
    },
  ];

  const testimonials: Testimonial[] = [
    {
      id: 'test_1',
      authorName: 'Claire Morel',
      authorLocation: 'Paris · Bougie & Élixir',
      rating: 5,
      content:
        'La qualité de l’encens au cèdre et l’attention portée à chaque demande de commande créent une véritable relation de confiance. Le suivi téléphonique avant l’envoi est d’une grande délicatesse.',
      status: 'Publié',
      featured: true,
      visitorId: 'vis_1',
      createdAt: isoDaysAgo(3),
    },
    {
      id: 'test_2',
      authorName: 'Marc Lefèvre',
      authorLocation: 'Lyon · Duo Labradorite',
      rating: 5,
      content:
        'Les textes publiés dans la communauté m’accompagnent chaque matin avant le travail. Sans jamais tomber dans l’excès, les enseignements de Maître Élias apportent une clarté immédiate.',
      status: 'Publié',
      featured: true,
      createdAt: isoDaysAgo(8),
    },
    {
      id: 'test_3',
      authorName: 'Nadia Benali',
      authorLocation: 'Nice · Coffret du Sanctuaire',
      rating: 5,
      content:
        'Notre cercle de lecture utilise le carnet de silence et la bougie de cire d’abeille depuis plusieurs mois. Les matières sont sobres, durables et fidèles à l’esprit du Sanctuaire.',
      status: 'Publié',
      featured: true,
      createdAt: isoDaysAgo(15),
    },
  ];

  return {
    nextOrderSeq: 1046,
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

    const indicativeTotal = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

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
      customerFirstName: input.firstName.trim(),
      customerLastName: input.lastName.trim(),
      customerPhone: input.phone.trim(),
      customerEmail: input.email.trim(),
      deliveryAddress: input.deliveryAddress.trim(),
      message: input.message.trim(),
      items: orderItems,
      indicativeTotal,
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

  public updateCustomerNotes(id: string, notes: string, actorName: string): Customer | null {
    const cust = this.data.customers.find((c) => c.id === id);
    if (!cust) return null;
    cust.notes = notes;
    this.logActivity(actorName, 'Fiche client mise à jour', `${cust.firstName} ${cust.lastName}`, 'commande');
    return cust;
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
    this.data.siteContent = content;
    this.logActivity(actorName, 'Contenu du site mis à jour', 'Page d’accueil & éditorial', 'contenu');
    return this.data.siteContent;
  }

  public updateSettings(settings: SiteSettings, actorName: string): SiteSettings {
    this.data.settings = settings;
    this.logActivity(actorName, 'Paramètres du site enregistrés', settings.general.siteName, 'parametre');
    return this.data.settings;
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

  public registerVisitor(input: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    password: string;
  }): VisitorMemberPublic {
    const email = input.email.trim().toLowerCase();
    if (this.findVisitorByEmail(email)) {
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
      passwordHash: creds.hash,
      salt: creds.salt,
      createdAt: new Date().toISOString(),
    };
    this.data.visitors.unshift(created);
    this.logActivity(`${created.firstName} ${created.lastName}`, 'Nouveau compte visiteur créé', created.email, 'securite');
    const { passwordHash: _ph, salt: _s, ...pub } = created;
    return pub;
  }

  public updateVisitorProfile(
    id: string,
    patch: { firstName: string; lastName: string; phone: string; address: string },
  ): VisitorMemberPublic | null {
    const v = this.findVisitorById(id);
    if (!v) return null;
    v.firstName = patch.firstName.trim() || v.firstName;
    v.lastName = patch.lastName.trim() || v.lastName;
    v.phone = patch.phone.trim();
    v.address = patch.address.trim();
    this.save();
    const { passwordHash: _ph, salt: _s, ...pub } = v;
    return pub;
  }

  public getOrdersForVisitor(visitor: VisitorMemberRecord): Order[] {
    const normEmail = visitor.email.toLowerCase();
    const normPhone = visitor.phone.replace(/\s+/g, '');
    return [...this.data.orders]
      .filter((o) => {
        const emailMatch = o.customerEmail && o.customerEmail.toLowerCase() === normEmail;
        const phoneMatch = normPhone && o.customerPhone.replace(/\s+/g, '') === normPhone;
        return Boolean(emailMatch || phoneMatch);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public trackOrder(orderNumberInput: string, contactInput: string): Order | null {
    const cleanNum = orderNumberInput.trim().toUpperCase().replace(/^#/, '');
    const cleanContact = contactInput.trim().toLowerCase();
    const cleanPhone = contactInput.replace(/\s+/g, '');
    const found = this.data.orders.find((o) => {
      if (o.orderNumber.toUpperCase() !== cleanNum) return false;
      const emailOk = o.customerEmail && o.customerEmail.toLowerCase() === cleanContact;
      const phoneOk = o.customerPhone.replace(/\s+/g, '') === cleanPhone;
      return Boolean(emailOk || phoneOk);
    });
    return found || null;
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
}

export const cmsStore = new CmsStore();
