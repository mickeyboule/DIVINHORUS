import type {
  Article,
  ArticleCategory,
  Category,
  FaqCategory,
  Product,
  PublicBootstrapData,
  SiteContent,
  SiteSettings,
  Testimonial,
  VideoItem,
} from '../types/cms';

export type AppLanguage = 'fr' | 'en';

export const TRANSLATIONS = {
  fr: {
    // Common
    'common.close': 'Fermer',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.saving': 'Enregistrement...',
    'common.copy': 'Copier',
    'common.copied': 'Copié',
    'common.copyLink': 'Copier le lien',
    'common.linkCopied': 'Lien copié',
    'common.optional': 'facultatif',
    'common.free': 'Offerte',
    'common.perUnit': 'unité',
    'common.learnMore': 'En savoir plus',

    // Navigation & Header
    'nav.home': 'Accueil',
    'nav.shop': 'Boutique',
    'nav.community': 'Communauté',
    'nav.about': 'À propos',
    'nav.contact': 'Contact',
    'nav.trackOrder': 'Suivre ma commande',
    'nav.myAccount': 'Mon compte',
    'nav.myAccountFull': 'Mon compte visiteur',
    'nav.login': 'Connexion',
    'nav.loginOrAccount': 'Connexion / Mon compte',
    'nav.myAccountNamed': 'Mon compte ({name})',
    'nav.openMenu': 'Ouvrir le menu',
    'nav.closeMenu': 'Fermer le menu',
    'nav.mainNav': 'Navigation principale',
    'nav.mobileNav': 'Navigation mobile',
    'nav.navigation': 'Navigation',
    'nav.languageLabel': 'Langue',
    'nav.langFr': 'Français',
    'nav.langEn': 'English',
    'header.orderCta': 'Commander',
    'header.mobileOrderCta': 'Ma demande de commande ({count})',
    'header.openBasketAriaSingle': 'Ouvrir ma demande de commande ({count} article)',
    'header.openBasketAriaPlural': 'Ouvrir ma demande de commande ({count} articles)',

    // Footer
    'footer.taglineDescription':
      '{tagline}. Un espace dédié à la transmission contemplative, au partage communautaire et à la préparation attentive d’objets rituels.',
    'footer.sanctuaryHeading': 'Sanctuaire & Coordonnées',
    'footer.rightsReserved': '© {year} {siteName}. Tous droits réservés.',
    'footer.countryCurrencyLabel': 'Pays et devise',

    // Country select
    'countrySelect.placeholder': 'Sélectionnez votre pays',
    'countrySelect.searchPlaceholder': 'Rechercher un pays...',
    'countrySelect.clearSearch': 'Effacer la recherche',
    'countrySelect.noResults': 'Aucun pays trouvé pour « {query} ».',

    // Welcome & Announcement modal
    'announcement.kickerWelcome': 'Mot d’accueil',
    'announcement.kickerInfo': 'Information boutique',
    'announcement.kickerImportant': 'Annonce importante',
    'announcement.kickerDefault': 'Information',
    'announcement.closeAria': 'Fermer le message',
    'announcement.continueVisit': 'Continuer la visite',

    // Home page
    'home.viewAllShop': 'Voir toute la boutique',
    'home.viewAllCommunity': 'Voir toute la communauté',
    'home.articlesSubtitle':
      'Réflexions et textes publiés régulièrement pour nourrir votre cheminement.',
    'home.readArticle': 'Lire l’article',
    'home.likeArticleAria': 'Aimer {title}',
    'home.allVideos': 'Toutes les vidéos',
    'home.videosSubtitle':
      'Entretiens filmés et séances de méditation accessibles directement depuis le site.',
    'home.playVideo': 'Lire la vidéo',
    'home.leaveTestimonial': 'Laisser un témoignage',
    'home.allTestimonials': 'Tous les avis',
    'home.testimonialsSubtitle':
      'Retours d’expérience partagés par celles et ceux qui suivent les enseignements ou reçoivent nos objets.',
    'home.emptyTestimonials': 'Soyez la première personne à partager votre témoignage.',
    'home.communityMember': 'Membre de la communauté',
    'home.teachingFallback': 'Enseignement',

    // Shop page
    'shop.kicker': 'Boutique du Sanctuaire',
    'shop.allProductsTitle': 'Objets de pratique & créations',
    'shop.allProductsSubtitle':
      'Sélectionnez les créations souhaitées et transmettez directement votre demande de commande sans paiement en ligne.',
    'shop.allProductsTab': 'Tous les produits ({count})',
    'shop.categoriesAria': 'Catégories de produits',
    'shop.searchPlaceholder': 'Rechercher un produit...',
    'shop.sortAria': 'Trier les produits',
    'shop.sortFeatured': 'Sélection mise en avant',
    'shop.sortPriceAsc': 'Prix croissant',
    'shop.sortPriceDesc': 'Prix décroissant',
    'shop.countryCurrencyAria': 'Pays et devise d’affichage',
    'shop.emptyTitle': 'Aucun produit trouvé',
    'shop.emptyDesc': 'Essayez de modifier votre recherche ou de consulter une autre catégorie.',
    'shop.resetFilters': 'Réinitialiser les filtres',

    // Product card & detail
    'product.creationFallback': 'Création',
    'product.unavailable': 'Indisponible',
    'product.order': 'Commander',
    'product.notFoundTitle': 'Produit introuvable',
    'product.notFoundDesc': 'Ce produit n’est plus disponible ou a été déplacé.',
    'product.backToShop': 'Retour à la boutique',
    'product.refPrefix': 'Réf.',
    'product.adjustedCurrency': 'Devise ajustée : {country} · {code}',
    'product.additionalInfo': 'Informations complémentaires',
    'product.desiredQty': 'Quantité souhaitée',
    'product.decreaseQty': 'Diminuer la quantité',
    'product.increaseQty': 'Augmenter la quantité',
    'product.temporarilyUnavailable': 'Momentanément indisponible',
    'product.addAndContinue': 'Ajouter à ma sélection et continuer',
    'product.noOnlinePaymentNote':
      'Aucun paiement en ligne. Confirmation et modalités de remise par notre équipe.',
    'product.similarProducts': 'Produits similaires',
    'product.viewLabel': '{name} vue {index}',

    // Community page
    'community.kicker': 'Communauté & Transmission',
    'community.title': 'Enseignements, écrits & vidéos',
    'community.subtitle':
      'Retrouvez l’ensemble des réflexions publiées par le Maître ainsi que les séances et entretiens filmés.',
    'community.tabAll': 'Tout voir',
    'community.tabArticles': 'Articles ({count})',
    'community.tabVideos': 'Vidéos YouTube ({count})',
    'community.tabTestimonials': 'Témoignages ({count})',
    'community.searchPlaceholder': 'Rechercher un enseignement ou une vidéo...',
    'community.articlesHeading': 'Articles & réflexions',
    'community.allTopics': 'Toutes les rubriques',
    'community.noArticles': 'Aucun article publié ne correspond à vos critères.',
    'community.teachingFallback': 'Enseignement',
    'community.read': 'Lire',
    'community.videosHeading': 'Vidéos & méditations YouTube',
    'community.videosSubtitle':
      'Séances guidées et causeries spirituelles visionnables directement ici.',
    'community.noVideos': 'Aucune vidéo disponible pour le moment.',
    'community.playVideo': 'Lire la vidéo',
    'community.testimonialsHeading': 'Témoignages de la communauté',
    'community.testimonialsSubtitle':
      'Partagez votre expérience des lectures, méditations ou objets du Sanctuaire.',
    'community.leaveTestimonial': 'Laisser un témoignage',
    'community.noTestimonials':
      'Aucun témoignage publié pour le moment. Soyez le premier à partager votre ressenti.',
    'community.visitorFallback': 'Visiteur',

    // Article detail page
    'articleDetail.notFoundTitle': 'Article introuvable',
    'articleDetail.notFoundDesc': 'Cet article n’est pas disponible ou a été dépublié.',
    'articleDetail.backToCommunity': 'Retour à la communauté',
    'articleDetail.teachingFallback': 'Enseignement',
    'articleDetail.byAuthor': 'Par {author}',
    'articleDetail.likedTeaching': 'Vous aimez cet enseignement',
    'articleDetail.likeTeaching': 'J’aime cet enseignement',
    'articleDetail.likedShort': 'Aimé',
    'articleDetail.likeArticle': 'Aimer cet article',
    'articleDetail.backToTeachings': 'Retour aux enseignements',
    'articleDetail.similarArticles': 'Articles similaires',
    'articleDetail.readArticle': 'Lire l’article',

    // About & FAQ page
    'about.kicker': 'À propos · {siteName}',
    'about.discoverCreations': 'Découvrir les créations',
    'about.contactUs': 'Prendre contact',
    'about.commitmentsHeading': 'Nos engagements essentiels',
    'about.faqKicker': 'Foire aux questions · Enseignements & Boutique',
    'about.faqTitleDefault': 'Questions fréquentes',
    'about.faqSubtitleDefault':
      'Retrouvez les réponses essentielles concernant nos enseignements, la communauté et la boutique sur commande.',
    'about.faqSearchSr': 'Rechercher dans la FAQ',
    'about.faqSearchPlaceholder': 'Rechercher un sujet (commande, méditation...)',
    'about.faqFilterLabel': 'Filtrer par thème',
    'about.faqCategoriesAria': 'Catégories de la FAQ',
    'about.faqCatAll': 'Toutes',
    'about.faqCatEnseignements': 'Enseignements',
    'about.faqCatBoutique': 'Boutique',
    'about.faqCatGeneral': 'Général',
    'about.faqNotFoundPrompt': 'Vous ne trouvez pas la réponse à votre question ?',
    'about.faqWriteTo': 'Écrire directement à {siteName} →',
    'about.faqCountSingle': '{count} question affichée',
    'about.faqCountPlural': '{count} questions affichées',
    'about.faqCollapseAll': 'Tout replier',
    'about.faqExpandAll': 'Tout déplier',
    'about.faqEmptyTitle': 'Aucune question ne correspond à votre recherche.',
    'about.faqEmptyDesc':
      'Essayez un autre mot-clé ou réinitialisez les filtres pour parcourir toutes les réponses.',
    'about.faqResetFilters': 'Réinitialiser les filtres',
    'about.faqAskQuestion': 'Poser une question',

    // Contact page
    'contact.kicker': 'Contact & Accueil',
    'contact.addressTitle': 'Adresse du Sanctuaire',
    'contact.phoneTitle': 'Téléphone',
    'contact.emailTitle': 'Courriel',
    'contact.sentTitle': 'Votre message a été transmis',
    'contact.sentDesc':
      'Nous avons bien reçu votre demande et vous répondrons dans les meilleurs délais.',
    'contact.sendAnother': 'Envoyer un autre message',
    'contact.formTitle': 'Écrire un message',
    'contact.fullName': 'Nom complet',
    'contact.fullNamePlaceholder': 'Votre nom',
    'contact.email': 'Adresse email',
    'contact.emailPlaceholder': 'votre@email.com',
    'contact.phoneOptional': 'Téléphone (facultatif)',
    'contact.phonePlaceholder': '+33 6 ...',
    'contact.subject': 'Objet',
    'contact.subjectPlaceholder': 'Renseignement, commande, retraite...',
    'contact.message': 'Message',
    'contact.messagePlaceholder': 'Partagez votre question ou votre demande...',
    'contact.sending': 'Envoi en cours...',
    'contact.submit': 'Envoyer le message',
    'contact.sendError': 'Erreur lors de l’envoi du message.',

    // Order tracking page
    'tracking.kicker': 'Suivi de commande',
    'tracking.title': 'Où en est votre demande ?',
    'tracking.subtitle':
      'Consultez à tout moment le statut actuel et l’avancement de votre commande grâce à votre référence (ex : CMD-1001) et à votre email ou numéro de téléphone.',
    'tracking.orderNumberLabel': 'Numéro de commande',
    'tracking.orderNumberPlaceholder': 'Ex : CMD-1001',
    'tracking.contactLabel': 'Email ou numéro de téléphone',
    'tracking.contactPlaceholder': 'votre@email.com ou téléphone',
    'tracking.submit': 'Consulter le statut',
    'tracking.searching': 'Recherche...',
    'tracking.missingFields':
      'Veuillez saisir votre numéro de commande et votre email ou téléphone.',
    'tracking.notFound': 'Aucune commande trouvée.',
    'tracking.viewAccountOrders': 'Voir mes commandes dans Mon compte',
    'tracking.haveAccount': 'Vous avez un compte ? Accéder à Mon compte',
    'tracking.registeredAt': 'Référence #{orderNumber} · Enregistrée le {date}',
    'tracking.lastUpdate': 'Dernière mise à jour : {date}',
    'tracking.currentStatus': 'Statut actuel',
    'tracking.cancelledTitle': 'Demande annulée',
    'tracking.cancelledDesc':
      'Cette demande de commande a été annulée. Contactez le Sanctuaire pour toute précision.',
    'tracking.historyTitle': 'Historique des statuts',
    'tracking.stepNewLabel': 'Demande reçue',
    'tracking.stepNewDesc': 'Votre demande a bien été transmise au Sanctuaire.',
    'tracking.stepInProgressLabel': 'Vérification & échange',
    'tracking.stepInProgressDesc':
      'Notre équipe étudie votre demande et prépare son suivi.',
    'tracking.stepConfirmedLabel': 'Confirmée',
    'tracking.stepConfirmedDesc': 'Votre commande et ses modalités ont été validées.',
    'tracking.stepShippingLabel': 'En expédition',
    'tracking.stepShippingDesc':
      'Votre commande a été expédiée et est en cours d’acheminement.',
    'tracking.stepCompletedLabel': 'Remise effectuée',
    'tracking.stepCompletedDesc': 'Votre commande a été remise ou livrée.',

    // Visitor account page
    'account.kicker': 'Espace Visiteur',
    'account.verifyEmailTitle': 'Vérifiez votre e-mail',
    'account.loginTitle': 'Se connecter',
    'account.registerTitle': 'Créer votre compte',
    'account.subtitle':
      'Suivez l’avancement de vos commandes, retrouvez vos articles aimés et simplifiez vos prochaines demandes.',
    'account.loginTab': 'Connexion',
    'account.registerTab': 'Créer un compte',
    'account.firstName': 'Prénom',
    'account.firstNamePlaceholder': 'Votre prénom',
    'account.lastName': 'Nom',
    'account.lastNamePlaceholder': 'Votre nom',
    'account.country': 'Pays',
    'account.countryPlaceholder': 'Sélectionnez votre pays',
    'account.phoneRecommended': 'Téléphone (recommandé pour relier vos commandes)',
    'account.phonePlaceholder': '+33 6 00 00 00 00',
    'account.usualAddressOptional': 'Adresse habituelle (facultatif)',
    'account.addressPlaceholder': 'Adresse postale complète',
    'account.emailAddress': 'Adresse email',
    'account.emailPlaceholder': 'votre@email.com',
    'account.password': 'Mot de passe',
    'account.passwordMinPlaceholder': '6 caractères minimum',
    'account.hide': 'Masquer',
    'account.show': 'Afficher',
    'account.loading': 'Chargement...',
    'account.accessSpace': 'Accéder à mon espace',
    'account.createSpace': 'Créer mon espace visiteur',
    'account.or': 'ou',
    'account.googleLoading': 'Connexion avec Google...',
    'account.googleSignup': 'S’inscrire avec Google',
    'account.googleContinue': 'Continuer avec Google',
    'account.facebookLoading': 'Connexion avec Facebook...',
    'account.facebookSignup': 'S’inscrire avec Facebook',
    'account.facebookContinue': 'Continuer avec Facebook',
    'account.trackWithoutAccount': 'Suivre une commande sans compte avec son numéro',
    'account.errSelectCountry': 'Veuillez sélectionner votre pays.',
    'account.errPasswordLength': 'Le mot de passe doit contenir au moins 6 caractères.',
    'account.errGeneric': 'Une erreur est survenue.',
    'account.errSocial': 'Connexion impossible pour le moment.',
    'account.welcomeBack': 'Bienvenue, {name}.',
    'account.profileUpdated': 'Vos coordonnées ont été mises à jour.',
    'account.profileUpdateError': 'Erreur lors de la mise à jour.',
    'account.hello': 'Bonjour, {name}',
    'account.searchOtherOrder': 'Rechercher une autre commande',
    'account.logout': 'Déconnexion',
    'account.tabOrders': 'Mes commandes ({count})',
    'account.tabLikes': 'Articles aimés ({count})',
    'account.tabProfile': 'Mes coordonnées',
    'account.noOrdersTitle': 'Aucune commande associée à ce compte pour le moment.',
    'account.noOrdersDesc':
      'Vos futures demandes effectuées avec votre email ou téléphone apparaîtront ici automatiquement.',
    'account.discoverShop': 'Découvrir la boutique',
    'account.invoiceReady': 'Facture prête',
    'account.itemsDetail': 'Détail des objets',
    'account.productsSubtotal': 'Sous-total produits',
    'account.delivery': 'Livraison ({country})',
    'account.freeShipping': 'Offerte',
    'account.grandTotal': 'Somme totale',
    'account.deliveryLabel': 'Livraison :',
    'account.invoiceNum': 'Facture {num}',
    'account.paymentMethod': 'Moyen de paiement :',
    'account.viewInvoicePay': 'Voir la facture & payer',
    'account.stepsTracking': 'Suivi des étapes',
    'account.notifyWhatsapp': 'Avertir l’équipe sur WhatsApp',
    'account.copyLink': 'Copier le lien',
    'account.linkCopied': 'Lien copié',
    'account.noLikesTitle': 'Vous n’avez pas encore enregistré d’article favori.',
    'account.noLikesDesc':
      'Cliquez sur le cœur sur n’importe quel enseignement dans la Communauté pour le retrouver ici.',
    'account.exploreCommunity': 'Explorer la communauté',
    'account.readAgain': 'Relire l’enseignement',
    'account.profileHeading': 'Mes coordonnées de livraison et de contact',
    'account.phone': 'Téléphone',
    'account.usualAddress': 'Adresse habituelle',
    'account.saveProfile': 'Enregistrer mes coordonnées',
    'account.invoiceModalTitle': 'Facture {invoiceNumber} · Commande #{orderNumber}',
    'account.invoiceModalAria': 'Facture {invoiceNumber}',

    // Email verification screen
    'emailVerify.title': 'Vérification de votre adresse e-mail',
    'emailVerify.bodyPrefix': 'Nous vous avons envoyé un e-mail de vérification à',
    'emailVerify.bodySuffix': 'Veuillez le vérifier et vous connecter.',
    'emailVerify.goToLogin': 'Se connecter',

    // Order drawer
    'orderDrawer.ariaLabel': 'Demande de commande',
    'orderDrawer.confirmedTitle': 'Demande enregistrée',
    'orderDrawer.title': 'Demande de commande',
    'orderDrawer.subtitle': 'Aucun paiement en ligne · Confirmation directe par notre équipe',
    'orderDrawer.refLabel': 'Référence #{orderNumber}',
    'orderDrawer.thankYou': 'Merci {name}, votre demande est transmise',
    'orderDrawer.productsSubtotal': 'Sous-total produits',
    'orderDrawer.delivery': 'Livraison ({country})',
    'orderDrawer.grandTotal': 'Somme totale',
    'orderDrawer.phoneLabel': 'Téléphone :',
    'orderDrawer.deliveryLabel': 'Livraison :',
    'orderDrawer.whatsappTitle': 'Avertir immédiatement l’équipe sur WhatsApp',
    'orderDrawer.whatsappDesc':
      'Votre code de commande et son lien direct ont été générés automatiquement. Envoyez-les à notre équipe en un clic :',
    'orderDrawer.orderCode': 'Code commande',
    'orderDrawer.directLink': 'Lien direct de commande',
    'orderDrawer.notifyWhatsapp': 'Avertir l’équipe sur WhatsApp',
    'orderDrawer.trackOrderBtn': 'Suivre l’état de ma commande',
    'orderDrawer.continueVisit': 'Poursuivre la visite',
    'orderDrawer.selectedProducts': 'Produits sélectionnés ({count})',
    'orderDrawer.totalLabel': 'Total : {total}',
    'orderDrawer.countryCurrencyLabel': 'Pays de livraison & devise :',
    'orderDrawer.countryOnlyLabel': 'Pays de livraison :',
    'orderDrawer.countrySelectAria': 'Pays de livraison de la commande',
    'orderDrawer.emptyTitle': 'Aucun produit sélectionné pour le moment',
    'orderDrawer.emptyDesc':
      'Sélectionnez un objet ci-dessous ou depuis la boutique pour formuler votre demande.',
    'orderDrawer.decreaseQty': 'Diminuer la quantité',
    'orderDrawer.increaseQty': 'Augmenter la quantité',
    'orderDrawer.removeProductAria': 'Retirer {name}',
    'orderDrawer.addOtherProductSr': 'Ajouter un autre produit',
    'orderDrawer.addOtherProductOption': '+ Ajouter un autre produit à cette demande...',
    'orderDrawer.yourDetails': 'Vos coordonnées',
    'orderDrawer.firstName': 'Prénom',
    'orderDrawer.firstNamePlaceholder': 'Votre prénom',
    'orderDrawer.lastName': 'Nom',
    'orderDrawer.lastNamePlaceholder': 'Votre nom',
    'orderDrawer.phone': 'Téléphone',
    'orderDrawer.email': 'Email',
    'orderDrawer.deliveryAddress': 'Adresse ou zone de livraison',
    'orderDrawer.deliveryAddressPlaceholder': 'Adresse complète, ville et code postal',
    'orderDrawer.servedZones': 'Zones desservies : {zones}',
    'orderDrawer.messageOptional': 'Message ou précision (facultatif)',
    'orderDrawer.messagePlaceholder':
      'Disponibilité horaire, demande particulière, mot de guidance...',
    'orderDrawer.submitting': 'Envoi de votre demande...',
    'orderDrawer.submit': 'Confirmer ma demande de commande',
    'orderDrawer.errNoItems': 'Veuillez sélectionner au moins un produit.',
    'orderDrawer.errMissingContact':
      'Merci de renseigner votre prénom, nom, téléphone et adresse de livraison.',
    'orderDrawer.errMissingEmail': 'Votre adresse email est requise pour cette demande.',
    'orderDrawer.errGeneric': 'Une erreur est survenue.',
    'orderDrawer.errEmailRequired': 'Veuillez saisir votre adresse email.',
    'orderDrawer.errNamesRequired': 'Veuillez renseigner votre prénom et votre nom.',
    'orderDrawer.authTitle': 'Connexion requise',
    'orderDrawer.authBanner':
      'Connectez-vous ou créez votre compte pour valider votre commande. Votre sélection et vos coordonnées sont conservées.',
    'orderDrawer.authTabLogin': 'Se connecter',
    'orderDrawer.authTabRegister': 'Créer un compte',
    'orderDrawer.authBackToOrder': '← Revenir à ma commande',
    'orderDrawer.authLoginBtn': 'Se connecter et continuer mon achat',
    'orderDrawer.authRegisterBtn': 'Créer mon compte et continuer mon achat',
    'orderDrawer.authProcessing': 'Validation en cours...',
    'orderDrawer.authSignedInAs': 'Connecté(e) : {name}',
    'orderDrawer.authReadyBanner':
      'Votre compte est prêt ! Vérifiez vos coordonnées de livraison ci-dessous puis validez votre commande.',
    'orderDrawer.authExistingSwitch': 'Passer à la connexion',
    'orderDrawer.alreadyHaveAccount': 'Déjà un compte ?',
    'orderDrawer.signInShortcut': 'Se connecter',

    // Testimonial modal
    'testimonialModal.ariaLabel': 'Laisser un témoignage',
    'testimonialModal.title': 'Partager un témoignage',
    'testimonialModal.subtitle':
      'Votre expérience des enseignements ou des objets du Sanctuaire',
    'testimonialModal.yourName': 'Votre nom',
    'testimonialModal.yourNamePlaceholder': 'Votre nom ou pseudonyme',
    'testimonialModal.locationOrProduct': 'Ville ou objet reçu (facultatif)',
    'testimonialModal.locationPlaceholder': 'Ex : Paris · Encens Cèdre',
    'testimonialModal.ratingLabel': 'Appréciation',
    'testimonialModal.starAriaSingle': '{count} étoile',
    'testimonialModal.starAriaPlural': '{count} étoiles',
    'testimonialModal.yourTestimonial': 'Votre témoignage',
    'testimonialModal.testimonialPlaceholder':
      'Décrivez ce que ces enseignements ou créations vous ont apporté...',
    'testimonialModal.submitting': 'Publication...',
    'testimonialModal.submit': 'Publier mon témoignage',
    'testimonialModal.errValidation':
      'Veuillez renseigner votre nom et un témoignage d’au moins 10 caractères.',
    'testimonialModal.errGeneric': 'Impossible d’enregistrer votre témoignage.',

    // Video modal
    'videoModal.closeAria': 'Fermer la vidéo',

    // Invoice preview
    'invoice.printBtn': 'Imprimer',
    'invoice.downloadPdfBtn': 'Télécharger (PDF)',
    'invoice.downloadingBtn': 'Génération...',
    'invoice.shareBtn': 'Partager',
    'invoice.shareWhatsapp': 'Partager via WhatsApp',
    'invoice.shareEmail': 'Envoyer par e-mail',
    'invoice.shareCopy': 'Copier les détails',
    'invoice.shareCopied': 'Détails copiés !',
    'invoice.downloadError': 'Impossible de générer le PDF de la facture.',
    'invoice.officialInvoice': 'Facture Officielle',
    'invoice.orderPrefix': 'Commande #{orderNumber}',
    'invoice.billedTo': 'Facturé à',
    'invoice.countryLabel': 'Pays : {country}',
    'invoice.issuanceDetails': 'Détails d’émission',
    'invoice.issuedAt': 'Date d’émission :',
    'invoice.dueDate': 'Échéance :',
    'invoice.sentAt': 'Transmise le :',
    'invoice.colDesignation': 'Désignation',
    'invoice.colQty': 'Qté',
    'invoice.colUnitPrice': 'Prix unit.',
    'invoice.colTotal': 'Total',
    'invoice.refPrefix': 'Réf. {ref}',
    'invoice.productsSubtotal': 'Sous-total produits',
    'invoice.shippingFee': 'Frais de livraison',
    'invoice.discount': 'Remise accordée',
    'invoice.totalDue': 'Total à payer',
    'invoice.paymentMethod': 'Moyen de paiement : {method}',
    'invoice.noPaymentDetails': 'Aucune instruction complémentaire précisée.',
    'invoice.signatureValidation': 'Signature & Validation',
    'invoice.directionFallback': 'la direction',
    'invoice.signatureAlt': 'Signature de {name}',

    // Admin login & layout
    'admin.backPublic': 'Retour au site public',
    'admin.loginTitle': 'Administration · {siteName}',
    'admin.loginSubtitle': 'Accès réservé à la gestion de la boutique et des contenus',
    'admin.emailLabel': 'Adresse email administrateur',
    'admin.passwordLabel': 'Mot de passe',
    'admin.passwordPlaceholder': 'Votre mot de passe',
    'admin.hidePassword': 'Masquer le mot de passe',
    'admin.showPassword': 'Afficher le mot de passe',
    'admin.loggingIn': 'Connexion en cours...',
    'admin.loginSubmit': 'Se connecter au tableau de bord',
    'admin.invalidCreds': 'Identifiants invalides.',
    'admin.backOfficeSubtitle': 'Back-Office Administrateur',
    'admin.closeMenu': 'Fermer le menu',
    'admin.openMenu': 'Ouvrir le menu administration',
    'admin.navAria': 'Menu administration',
    'admin.breadcrumb': 'Administration',
    'admin.publicSiteShort': 'Site public',
    'admin.viewPublicSite': 'Voir le site public',
    'admin.logout': 'Déconnexion',
    'admin.groupPilotage': 'Pilotage',
    'admin.groupCatalogue': 'Catalogue',
    'admin.groupCms': 'Communauté & CMS',
    'admin.groupConfig': 'Relation & Configuration',
    'admin.secDashboard': 'Tableau de bord',
    'admin.secOrders': 'Commandes',
    'admin.secProducts': 'Produits',
    'admin.secCategories': 'Catégories',
    'admin.secCustomers': 'Clients',
    'admin.secArticles': 'Articles',
    'admin.secArticlesBreadcrumb': 'Communauté · Articles',
    'admin.secVideos': 'Vidéos',
    'admin.secVideosBreadcrumb': 'Vidéos YouTube',
    'admin.secTestimonials': 'Témoignages',
    'admin.secMedia': 'Médias',
    'admin.secMediaBreadcrumb': 'Bibliothèque média',
    'admin.secSiteContent': 'Contenu du site',
    'admin.secMessages': 'Messages',
    'admin.secMessagesBreadcrumb': 'Messages de contact',
    'admin.secSettings': 'Paramètres',

    // App root
    'app.verifyingSession': 'Vérification de la session...',
    'app.loadingAdmin': 'Chargement de l’espace administrateur...',
    'app.loadingSite': 'Chargement de l’espace...',
    'app.connUnavailable': 'Connexion temporairement indisponible',
    'app.loadError': 'Impossible de charger le site.',
    'app.retry': 'Réessayer',
    'app.addedToSelection': '« {name} » ajouté à votre sélection.',
    'app.orderCreated': 'Demande {orderNumber} enregistrée.',
    'app.testimonialPublished': 'Merci ! Votre témoignage a bien été publié.',
    'app.articleLiked': 'Article ajouté à vos favoris.',
    'app.articleUnliked': 'Mention « J’aime » retirée.',
    'app.actionImpossible': 'Action impossible.',
    'app.adminWelcome': 'Bienvenue, {name}.',
    'app.adminLogout': 'Session administrateur fermée.',
    'app.visitorLogout': 'Vous êtes déconnecté de votre espace visiteur.',
    'app.newOrderReceived': 'Nouvelle commande reçue : {orderNumber}',
    'app.newOrdersReceived': '{count} nouvelles commandes reçues.',
    'app.orderNotFound': 'Commande « {orderParam} » introuvable.',
  },
  en: {
    // Common
    'common.close': 'Close',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.saving': 'Saving...',
    'common.copy': 'Copy',
    'common.copied': 'Copied',
    'common.copyLink': 'Copy link',
    'common.linkCopied': 'Link copied',
    'common.optional': 'optional',
    'common.free': 'Free',
    'common.perUnit': 'unit',
    'common.learnMore': 'Learn more',

    // Navigation & Header
    'nav.home': 'Home',
    'nav.shop': 'Shop',
    'nav.community': 'Community',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.trackOrder': 'Track order',
    'nav.myAccount': 'My account',
    'nav.myAccountFull': 'My visitor account',
    'nav.login': 'Sign in',
    'nav.loginOrAccount': 'Sign in / My account',
    'nav.myAccountNamed': 'My account ({name})',
    'nav.openMenu': 'Open menu',
    'nav.closeMenu': 'Close menu',
    'nav.mainNav': 'Main navigation',
    'nav.mobileNav': 'Mobile navigation',
    'nav.navigation': 'Navigation',
    'nav.languageLabel': 'Language',
    'nav.langFr': 'Français',
    'nav.langEn': 'English',
    'header.orderCta': 'Order',
    'header.mobileOrderCta': 'My order request ({count})',
    'header.openBasketAriaSingle': 'Open my order request ({count} item)',
    'header.openBasketAriaPlural': 'Open my order request ({count} items)',

    // Footer
    'footer.taglineDescription':
      '{tagline}. A space dedicated to contemplative transmission, community sharing, and thoughtfully crafted ritual objects.',
    'footer.sanctuaryHeading': 'Sanctuary & Contact',
    'footer.rightsReserved': '© {year} {siteName}. All rights reserved.',
    'footer.countryCurrencyLabel': 'Country and currency',

    // Country select
    'countrySelect.placeholder': 'Select your country',
    'countrySelect.searchPlaceholder': 'Search for a country...',
    'countrySelect.clearSearch': 'Clear search',
    'countrySelect.noResults': 'No country found for "{query}".',

    // Welcome & Announcement modal
    'announcement.kickerWelcome': 'Welcome note',
    'announcement.kickerInfo': 'Shop information',
    'announcement.kickerImportant': 'Important announcement',
    'announcement.kickerDefault': 'Information',
    'announcement.closeAria': 'Close message',
    'announcement.continueVisit': 'Continue browsing',

    // Home page
    'home.viewAllShop': 'Explore the full shop',
    'home.viewAllCommunity': 'Explore the community',
    'home.articlesSubtitle':
      'Reflections and essays published regularly to nourish your daily path.',
    'home.readArticle': 'Read article',
    'home.likeArticleAria': 'Like {title}',
    'home.allVideos': 'All videos',
    'home.videosSubtitle':
      'Recorded talks and guided meditation sessions available directly on the site.',
    'home.playVideo': 'Watch video',
    'home.leaveTestimonial': 'Leave a testimonial',
    'home.allTestimonials': 'All reviews',
    'home.testimonialsSubtitle':
      'Experiences shared by those who follow the teachings or receive our creations.',
    'home.emptyTestimonials': 'Be the first person to share your testimonial.',
    'home.communityMember': 'Community member',
    'home.teachingFallback': 'Teaching',

    // Shop page
    'shop.kicker': 'Sanctuary Shop',
    'shop.allProductsTitle': 'Practice objects & creations',
    'shop.allProductsSubtitle':
      'Select your desired creations and submit your order request directly with no online payment.',
    'shop.allProductsTab': 'All products ({count})',
    'shop.categoriesAria': 'Product categories',
    'shop.searchPlaceholder': 'Search products...',
    'shop.sortAria': 'Sort products',
    'shop.sortFeatured': 'Featured selection',
    'shop.sortPriceAsc': 'Price: low to high',
    'shop.sortPriceDesc': 'Price: high to low',
    'shop.countryCurrencyAria': 'Display country and currency',
    'shop.emptyTitle': 'No products found',
    'shop.emptyDesc': 'Try adjusting your search or browsing another category.',
    'shop.resetFilters': 'Reset filters',

    // Product card & detail
    'product.creationFallback': 'Creation',
    'product.unavailable': 'Unavailable',
    'product.order': 'Order',
    'product.notFoundTitle': 'Product not found',
    'product.notFoundDesc': 'This product is no longer available or has been moved.',
    'product.backToShop': 'Back to shop',
    'product.refPrefix': 'Ref.',
    'product.adjustedCurrency': 'Adjusted currency: {country} · {code}',
    'product.additionalInfo': 'Additional information',
    'product.desiredQty': 'Desired quantity',
    'product.decreaseQty': 'Decrease quantity',
    'product.increaseQty': 'Increase quantity',
    'product.temporarilyUnavailable': 'Temporarily unavailable',
    'product.addAndContinue': 'Add to my selection and continue',
    'product.noOnlinePaymentNote':
      'No online payment. Confirmation and delivery arrangements handled by our team.',
    'product.similarProducts': 'Similar products',
    'product.viewLabel': '{name} view {index}',

    // Community page
    'community.kicker': 'Community & Transmission',
    'community.title': 'Teachings, writings & videos',
    'community.subtitle':
      'Explore all reflections published by the Master alongside recorded sessions and talks.',
    'community.tabAll': 'View all',
    'community.tabArticles': 'Articles ({count})',
    'community.tabVideos': 'YouTube Videos ({count})',
    'community.tabTestimonials': 'Testimonials ({count})',
    'community.searchPlaceholder': 'Search a teaching or video...',
    'community.articlesHeading': 'Articles & reflections',
    'community.allTopics': 'All topics',
    'community.noArticles': 'No published articles match your criteria.',
    'community.teachingFallback': 'Teaching',
    'community.read': 'Read',
    'community.videosHeading': 'YouTube videos & meditations',
    'community.videosSubtitle':
      'Guided sessions and spiritual talks playable directly here.',
    'community.noVideos': 'No videos available at the moment.',
    'community.playVideo': 'Watch video',
    'community.testimonialsHeading': 'Community testimonials',
    'community.testimonialsSubtitle':
      'Share your experience with our readings, meditations, or Sanctuary creations.',
    'community.leaveTestimonial': 'Leave a testimonial',
    'community.noTestimonials':
      'No published testimonials yet. Be the first to share your thoughts.',
    'community.visitorFallback': 'Visitor',

    // Article detail page
    'articleDetail.notFoundTitle': 'Article not found',
    'articleDetail.notFoundDesc': 'This article is unavailable or has been unpublished.',
    'articleDetail.backToCommunity': 'Back to community',
    'articleDetail.teachingFallback': 'Teaching',
    'articleDetail.byAuthor': 'By {author}',
    'articleDetail.likedTeaching': 'You liked this teaching',
    'articleDetail.likeTeaching': 'Like this teaching',
    'articleDetail.likedShort': 'Liked',
    'articleDetail.likeArticle': 'Like this article',
    'articleDetail.backToTeachings': 'Back to teachings',
    'articleDetail.similarArticles': 'Similar articles',
    'articleDetail.readArticle': 'Read article',

    // About & FAQ page
    'about.kicker': 'About · {siteName}',
    'about.discoverCreations': 'Discover creations',
    'about.contactUs': 'Get in touch',
    'about.commitmentsHeading': 'Our core commitments',
    'about.faqKicker': 'Frequently Asked Questions · Teachings & Shop',
    'about.faqTitleDefault': 'Frequently asked questions',
    'about.faqSubtitleDefault':
      'Find essential answers regarding our teachings, community access, and made-to-order shop.',
    'about.faqSearchSr': 'Search the FAQ',
    'about.faqSearchPlaceholder': 'Search a topic (order, meditation...)',
    'about.faqFilterLabel': 'Filter by topic',
    'about.faqCategoriesAria': 'FAQ categories',
    'about.faqCatAll': 'All',
    'about.faqCatEnseignements': 'Teachings',
    'about.faqCatBoutique': 'Shop',
    'about.faqCatGeneral': 'General',
    'about.faqNotFoundPrompt': 'Can’t find the answer to your question?',
    'about.faqWriteTo': 'Write directly to {siteName} →',
    'about.faqCountSingle': '{count} question shown',
    'about.faqCountPlural': '{count} questions shown',
    'about.faqCollapseAll': 'Collapse all',
    'about.faqExpandAll': 'Expand all',
    'about.faqEmptyTitle': 'No questions match your search.',
    'about.faqEmptyDesc':
      'Try another keyword or reset the filters to browse all answers.',
    'about.faqResetFilters': 'Reset filters',
    'about.faqAskQuestion': 'Ask a question',

    // Contact page
    'contact.kicker': 'Contact & Welcome',
    'contact.addressTitle': 'Sanctuary Address',
    'contact.phoneTitle': 'Phone',
    'contact.emailTitle': 'Email',
    'contact.sentTitle': 'Your message has been sent',
    'contact.sentDesc':
      'We have received your message and will get back to you as soon as possible.',
    'contact.sendAnother': 'Send another message',
    'contact.formTitle': 'Write a message',
    'contact.fullName': 'Full name',
    'contact.fullNamePlaceholder': 'Your name',
    'contact.email': 'Email address',
    'contact.emailPlaceholder': 'your@email.com',
    'contact.phoneOptional': 'Phone (optional)',
    'contact.phonePlaceholder': '+1 555 ...',
    'contact.subject': 'Subject',
    'contact.subjectPlaceholder': 'Inquiry, order, retreat...',
    'contact.message': 'Message',
    'contact.messagePlaceholder': 'Share your question or request...',
    'contact.sending': 'Sending...',
    'contact.submit': 'Send message',
    'contact.sendError': 'Failed to send message.',

    // Order tracking page
    'tracking.kicker': 'Order tracking',
    'tracking.title': 'What is the status of your request?',
    'tracking.subtitle':
      'Check the current status and progress of your order at any time using your reference (e.g. CMD-1001) and your email or phone number.',
    'tracking.orderNumberLabel': 'Order number',
    'tracking.orderNumberPlaceholder': 'E.g. CMD-1001',
    'tracking.contactLabel': 'Email or phone number',
    'tracking.contactPlaceholder': 'your@email.com or phone',
    'tracking.submit': 'Check status',
    'tracking.searching': 'Searching...',
    'tracking.missingFields':
      'Please enter your order number and your email or phone number.',
    'tracking.notFound': 'No order found.',
    'tracking.viewAccountOrders': 'View my orders in My account',
    'tracking.haveAccount': 'Have an account? Go to My account',
    'tracking.registeredAt': 'Reference #{orderNumber} · Placed on {date}',
    'tracking.lastUpdate': 'Last updated: {date}',
    'tracking.currentStatus': 'Current status',
    'tracking.cancelledTitle': 'Request cancelled',
    'tracking.cancelledDesc':
      'This order request has been cancelled. Contact the Sanctuary for any clarification.',
    'tracking.historyTitle': 'Status history',
    'tracking.stepNewLabel': 'Request received',
    'tracking.stepNewDesc': 'Your request has been received by the Sanctuary.',
    'tracking.stepInProgressLabel': 'Review & consultation',
    'tracking.stepInProgressDesc':
      'Our team is reviewing your request and preparing follow-up.',
    'tracking.stepConfirmedLabel': 'Confirmed',
    'tracking.stepConfirmedDesc': 'Your order and arrangements have been confirmed.',
    'tracking.stepShippingLabel': 'Shipping',
    'tracking.stepShippingDesc': 'Your order has been dispatched and is on its way.',
    'tracking.stepCompletedLabel': 'Delivered',
    'tracking.stepCompletedDesc': 'Your order has been handed over or delivered.',

    // Visitor account page
    'account.kicker': 'Visitor Space',
    'account.verifyEmailTitle': 'Verify your email',
    'account.loginTitle': 'Sign in',
    'account.registerTitle': 'Create your account',
    'account.subtitle':
      'Follow your order progress, revisit your liked articles, and streamline future requests.',
    'account.loginTab': 'Sign in',
    'account.registerTab': 'Create account',
    'account.firstName': 'First name',
    'account.firstNamePlaceholder': 'Your first name',
    'account.lastName': 'Last name',
    'account.lastNamePlaceholder': 'Your last name',
    'account.country': 'Country',
    'account.countryPlaceholder': 'Select your country',
    'account.phoneRecommended': 'Phone (recommended to link your orders)',
    'account.phonePlaceholder': '+1 555 000 0000',
    'account.usualAddressOptional': 'Usual address (optional)',
    'account.addressPlaceholder': 'Full postal address',
    'account.emailAddress': 'Email address',
    'account.emailPlaceholder': 'your@email.com',
    'account.password': 'Password',
    'account.passwordMinPlaceholder': 'At least 6 characters',
    'account.hide': 'Hide',
    'account.show': 'Show',
    'account.loading': 'Loading...',
    'account.accessSpace': 'Access my space',
    'account.createSpace': 'Create my visitor account',
    'account.or': 'or',
    'account.googleLoading': 'Signing in with Google...',
    'account.googleSignup': 'Sign up with Google',
    'account.googleContinue': 'Continue with Google',
    'account.facebookLoading': 'Signing in with Facebook...',
    'account.facebookSignup': 'Sign up with Facebook',
    'account.facebookContinue': 'Continue with Facebook',
    'account.trackWithoutAccount': 'Track an order without an account using its number',
    'account.errSelectCountry': 'Please select your country.',
    'account.errPasswordLength': 'Password must contain at least 6 characters.',
    'account.errGeneric': 'An error occurred.',
    'account.errSocial': 'Sign in unavailable at the moment.',
    'account.welcomeBack': 'Welcome, {name}.',
    'account.profileUpdated': 'Your contact details have been updated.',
    'account.profileUpdateError': 'Failed to update contact details.',
    'account.hello': 'Hello, {name}',
    'account.searchOtherOrder': 'Look up another order',
    'account.logout': 'Sign out',
    'account.tabOrders': 'My orders ({count})',
    'account.tabLikes': 'Liked articles ({count})',
    'account.tabProfile': 'My details',
    'account.noOrdersTitle': 'No orders linked to this account yet.',
    'account.noOrdersDesc':
      'Future requests submitted with your email or phone will appear here automatically.',
    'account.discoverShop': 'Explore the shop',
    'account.invoiceReady': 'Invoice ready',
    'account.itemsDetail': 'Item details',
    'account.productsSubtotal': 'Products subtotal',
    'account.delivery': 'Delivery ({country})',
    'account.freeShipping': 'Free',
    'account.grandTotal': 'Total amount',
    'account.deliveryLabel': 'Delivery:',
    'account.invoiceNum': 'Invoice {num}',
    'account.paymentMethod': 'Payment method:',
    'account.viewInvoicePay': 'View invoice & pay',
    'account.stepsTracking': 'Progress timeline',
    'account.notifyWhatsapp': 'Notify team on WhatsApp',
    'account.copyLink': 'Copy link',
    'account.linkCopied': 'Link copied',
    'account.noLikesTitle': 'You have not saved any favorite articles yet.',
    'account.noLikesDesc':
      'Click the heart icon on any teaching in the Community to find it here.',
    'account.exploreCommunity': 'Explore the community',
    'account.readAgain': 'Read teaching again',
    'account.profileHeading': 'My delivery and contact details',
    'account.phone': 'Phone',
    'account.usualAddress': 'Usual address',
    'account.saveProfile': 'Save my details',
    'account.invoiceModalTitle': 'Invoice {invoiceNumber} · Order #{orderNumber}',
    'account.invoiceModalAria': 'Invoice {invoiceNumber}',

    // Email verification screen
    'emailVerify.title': 'Verify your email address',
    'emailVerify.bodyPrefix': 'We sent a verification email to',
    'emailVerify.bodySuffix': 'Please verify it and then sign in.',
    'emailVerify.goToLogin': 'Sign in',

    // Order drawer
    'orderDrawer.ariaLabel': 'Order request',
    'orderDrawer.confirmedTitle': 'Request submitted',
    'orderDrawer.title': 'Order request',
    'orderDrawer.subtitle': 'No online payment · Direct confirmation by our team',
    'orderDrawer.refLabel': 'Reference #{orderNumber}',
    'orderDrawer.thankYou': 'Thank you {name}, your request has been sent',
    'orderDrawer.productsSubtotal': 'Products subtotal',
    'orderDrawer.delivery': 'Delivery ({country})',
    'orderDrawer.grandTotal': 'Total amount',
    'orderDrawer.phoneLabel': 'Phone:',
    'orderDrawer.deliveryLabel': 'Delivery:',
    'orderDrawer.whatsappTitle': 'Notify the team immediately on WhatsApp',
    'orderDrawer.whatsappDesc':
      'Your order code and direct link were generated automatically. Send them to our team in one click:',
    'orderDrawer.orderCode': 'Order code',
    'orderDrawer.directLink': 'Direct order link',
    'orderDrawer.notifyWhatsapp': 'Notify team on WhatsApp',
    'orderDrawer.trackOrderBtn': 'Track my order status',
    'orderDrawer.continueVisit': 'Continue browsing',
    'orderDrawer.selectedProducts': 'Selected items ({count})',
    'orderDrawer.totalLabel': 'Total: {total}',
    'orderDrawer.countryCurrencyLabel': 'Delivery country & currency:',
    'orderDrawer.countryOnlyLabel': 'Delivery country:',
    'orderDrawer.countrySelectAria': 'Order delivery country',
    'orderDrawer.emptyTitle': 'No items selected yet',
    'orderDrawer.emptyDesc':
      'Select an item below or from the shop to compose your request.',
    'orderDrawer.decreaseQty': 'Decrease quantity',
    'orderDrawer.increaseQty': 'Increase quantity',
    'orderDrawer.removeProductAria': 'Remove {name}',
    'orderDrawer.addOtherProductSr': 'Add another product',
    'orderDrawer.addOtherProductOption': '+ Add another item to this request...',
    'orderDrawer.yourDetails': 'Your contact details',
    'orderDrawer.firstName': 'First name',
    'orderDrawer.firstNamePlaceholder': 'Your first name',
    'orderDrawer.lastName': 'Last name',
    'orderDrawer.lastNamePlaceholder': 'Your last name',
    'orderDrawer.phone': 'Phone',
    'orderDrawer.email': 'Email',
    'orderDrawer.deliveryAddress': 'Delivery address or area',
    'orderDrawer.deliveryAddressPlaceholder': 'Full street address, city, and postal code',
    'orderDrawer.servedZones': 'Served areas: {zones}',
    'orderDrawer.messageOptional': 'Message or note (optional)',
    'orderDrawer.messagePlaceholder':
      'Preferred call hours, special request, guidance note...',
    'orderDrawer.submitting': 'Sending your request...',
    'orderDrawer.submit': 'Confirm my order request',
    'orderDrawer.errNoItems': 'Please select at least one product.',
    'orderDrawer.errMissingContact':
      'Please provide your first name, last name, phone, and delivery address.',
    'orderDrawer.errMissingEmail': 'Your email address is required for this request.',
    'orderDrawer.errGeneric': 'An error occurred.',
    'orderDrawer.errEmailRequired': 'Please enter your email address.',
    'orderDrawer.errNamesRequired': 'Please enter your first and last name.',
    'orderDrawer.authTitle': 'Sign in required',
    'orderDrawer.authBanner':
      'Sign in or create an account to confirm your order. Your selected items and details are preserved.',
    'orderDrawer.authTabLogin': 'Sign in',
    'orderDrawer.authTabRegister': 'Create account',
    'orderDrawer.authBackToOrder': '← Back to my order',
    'orderDrawer.authLoginBtn': 'Sign in & continue purchase',
    'orderDrawer.authRegisterBtn': 'Create account & continue purchase',
    'orderDrawer.authProcessing': 'Processing...',
    'orderDrawer.authSignedInAs': 'Signed in as: {name}',
    'orderDrawer.authReadyBanner':
      'Your account is ready! Review your delivery details below and confirm your order.',
    'orderDrawer.authExistingSwitch': 'Switch to sign in',
    'orderDrawer.alreadyHaveAccount': 'Already have an account?',
    'orderDrawer.signInShortcut': 'Sign in',

    // Testimonial modal
    'testimonialModal.ariaLabel': 'Leave a testimonial',
    'testimonialModal.title': 'Share a testimonial',
    'testimonialModal.subtitle':
      'Your experience with our teachings or Sanctuary creations',
    'testimonialModal.yourName': 'Your name',
    'testimonialModal.yourNamePlaceholder': 'Your name or display name',
    'testimonialModal.locationOrProduct': 'City or item received (optional)',
    'testimonialModal.locationPlaceholder': 'E.g. London · Cedar Incense',
    'testimonialModal.ratingLabel': 'Rating',
    'testimonialModal.starAriaSingle': '{count} star',
    'testimonialModal.starAriaPlural': '{count} stars',
    'testimonialModal.yourTestimonial': 'Your testimonial',
    'testimonialModal.testimonialPlaceholder':
      'Describe what these teachings or creations have brought to you...',
    'testimonialModal.submitting': 'Publishing...',
    'testimonialModal.submit': 'Publish my testimonial',
    'testimonialModal.errValidation':
      'Please enter your name and a testimonial of at least 10 characters.',
    'testimonialModal.errGeneric': 'Unable to save your testimonial.',

    // Video modal
    'videoModal.closeAria': 'Close video',

    // Invoice preview
    'invoice.printBtn': 'Print',
    'invoice.downloadPdfBtn': 'Download (PDF)',
    'invoice.downloadingBtn': 'Generating...',
    'invoice.shareBtn': 'Share',
    'invoice.shareWhatsapp': 'Share via WhatsApp',
    'invoice.shareEmail': 'Send by email',
    'invoice.shareCopy': 'Copy invoice summary',
    'invoice.shareCopied': 'Details copied!',
    'invoice.downloadError': 'Unable to generate invoice PDF.',
    'invoice.officialInvoice': 'Official Invoice',
    'invoice.orderPrefix': 'Order #{orderNumber}',
    'invoice.billedTo': 'Billed to',
    'invoice.countryLabel': 'Country: {country}',
    'invoice.issuanceDetails': 'Issuance details',
    'invoice.issuedAt': 'Issue date:',
    'invoice.dueDate': 'Due date:',
    'invoice.sentAt': 'Sent on:',
    'invoice.colDesignation': 'Description',
    'invoice.colQty': 'Qty',
    'invoice.colUnitPrice': 'Unit price',
    'invoice.colTotal': 'Total',
    'invoice.refPrefix': 'Ref. {ref}',
    'invoice.productsSubtotal': 'Products subtotal',
    'invoice.shippingFee': 'Delivery fee',
    'invoice.discount': 'Discount applied',
    'invoice.totalDue': 'Total due',
    'invoice.paymentMethod': 'Payment method: {method}',
    'invoice.noPaymentDetails': 'No additional payment instructions specified.',
    'invoice.signatureValidation': 'Signature & Validation',
    'invoice.directionFallback': 'management',
    'invoice.signatureAlt': 'Signature of {name}',

    // Admin login & layout
    'admin.backPublic': 'Back to public site',
    'admin.loginTitle': 'Administration · {siteName}',
    'admin.loginSubtitle': 'Restricted access for shop and content management',
    'admin.emailLabel': 'Administrator email address',
    'admin.passwordLabel': 'Password',
    'admin.passwordPlaceholder': 'Your password',
    'admin.hidePassword': 'Hide password',
    'admin.showPassword': 'Show password',
    'admin.loggingIn': 'Signing in...',
    'admin.loginSubmit': 'Sign in to dashboard',
    'admin.invalidCreds': 'Invalid credentials.',
    'admin.backOfficeSubtitle': 'Administrator Back-Office',
    'admin.closeMenu': 'Close menu',
    'admin.openMenu': 'Open admin menu',
    'admin.navAria': 'Administration menu',
    'admin.breadcrumb': 'Administration',
    'admin.publicSiteShort': 'Public site',
    'admin.viewPublicSite': 'View public site',
    'admin.logout': 'Sign out',
    'admin.groupPilotage': 'Operations',
    'admin.groupCatalogue': 'Catalog',
    'admin.groupCms': 'Community & CMS',
    'admin.groupConfig': 'Relations & Settings',
    'admin.secDashboard': 'Dashboard',
    'admin.secOrders': 'Orders',
    'admin.secProducts': 'Products',
    'admin.secCategories': 'Categories',
    'admin.secCustomers': 'Customers',
    'admin.secArticles': 'Articles',
    'admin.secArticlesBreadcrumb': 'Community · Articles',
    'admin.secVideos': 'Videos',
    'admin.secVideosBreadcrumb': 'YouTube Videos',
    'admin.secTestimonials': 'Testimonials',
    'admin.secMedia': 'Media',
    'admin.secMediaBreadcrumb': 'Media Library',
    'admin.secSiteContent': 'Site Content',
    'admin.secMessages': 'Messages',
    'admin.secMessagesBreadcrumb': 'Contact Messages',
    'admin.secSettings': 'Settings',

    // App root
    'app.verifyingSession': 'Verifying session...',
    'app.loadingAdmin': 'Loading admin workspace...',
    'app.loadingSite': 'Loading sanctuary...',
    'app.connUnavailable': 'Connection temporarily unavailable',
    'app.loadError': 'Unable to load the site.',
    'app.retry': 'Try again',
    'app.addedToSelection': '"{name}" added to your selection.',
    'app.orderCreated': 'Request {orderNumber} submitted.',
    'app.testimonialPublished': 'Thank you! Your testimonial has been published.',
    'app.articleLiked': 'Article added to your favorites.',
    'app.articleUnliked': 'Like removed.',
    'app.actionImpossible': 'Action failed.',
    'app.adminWelcome': 'Welcome, {name}.',
    'app.adminLogout': 'Administrator session closed.',
    'app.visitorLogout': 'You have signed out of your visitor space.',
    'app.newOrderReceived': 'New order received: {orderNumber}',
    'app.newOrdersReceived': '{count} new orders received.',
    'app.orderNotFound': 'Order "{orderParam}" not found.',
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS.fr;

export function translate(
  lang: AppLanguage,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.fr;
  let text: string = dict[key] ?? TRANSLATIONS.fr[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }
  return text;
}

export function translateFaqCategory(cat: FaqCategory, lang: AppLanguage): string {
  if (lang === 'fr') return cat;
  switch (cat) {
    case 'Enseignements':
      return 'Teachings';
    case 'Boutique':
      return 'Shop';
    case 'Général':
      return 'General';
    default:
      return cat;
  }
}

// ---------- Bilingual seeded CMS translations (non-destructive overlay for lang === 'en') ----------
// Seeded English copy is applied ONLY when the stored French field still equals the
// original seeded French text, so any manual edit made in Administration always shows up.

function seedStr(current: string, seededFr: string, seededEn: string): string {
  return current.trim() === seededFr.trim() ? seededEn : current;
}

const EN_CATEGORIES_BY_ID: Record<
  string,
  { frName: string; name: string; frDescription: string; description: string }
> = {
  cat_encens: {
    frName: 'Encens & Résines',
    name: 'Incense & Resins',
    frDescription: 'Bâtons roulés à la main, bois de cèdre sacré et résines pures de purification.',
    description: 'Hand-rolled incense sticks, sacred cedarwood, and pure purification resins.',
  },
  cat_huiles: {
    frName: 'Huiles & Élixirs',
    name: 'Oils & Elixirs',
    frDescription: 'Extraits botaniques pressés à froid et huiles d’onction préparées en petites séries.',
    description: 'Cold-pressed botanical extracts and anointing oils crafted in small batches.',
  },
  cat_bougies: {
    frName: 'Bougies Rituelles',
    name: 'Ritual Candles',
    frDescription: 'Cire d’abeille sauvage coulée en céramique artisanale pour la veille contemplative.',
    description: 'Wild beeswax hand-poured into artisanal stoneware for contemplative vigils.',
  },
  cat_pierres: {
    frName: 'Pierres & Méditation',
    name: 'Stones & Meditation',
    frDescription: 'Minéraux polis sélectionnés pour l’ancrage, la clarté mentale et la pratique silencieuse.',
    description: 'Polished minerals selected for grounding, mental clarity, and silent practice.',
  },
};

const EN_PRODUCTS_BY_ID: Record<
  string,
  {
    frName: string;
    name: string;
    frDescription: string;
    description: string;
    frAdditionalInfo: string;
    additionalInfo: string;
  }
> = {
  prod_encens_cedre: {
    frName: 'Encens Cèdre de l’Atlas & Oliban',
    name: 'Atlas Cedarwood & Frankincense Incense',
    frDescription:
      'Roulés selon une méthode traditionnelle sans liant synthétique, ces bâtons marient le cœur de cèdre de l’Atlas aux larmes d’oliban pur. Leur combustion lente installe un climat de recueillement profond.',
    description:
      'Rolled using a traditional method without synthetic binders, these sticks blend Atlas cedar heartwood with pure frankincense tears. Their slow burn creates a climate of deep stillness.',
    frAdditionalInfo:
      'Boîte de 24 bâtons · Combustion environ 45 minutes par bâton · Origine : Atlas & Oman · Support en basalte vendu séparément.',
    additionalInfo:
      'Box of 24 sticks · Approx. 45-minute burn per stick · Origin: Atlas & Oman · Basalt holder sold separately.',
  },
  prod_huile_sauge: {
    frName: 'Élixir Botanique de Sauge Blanche',
    name: 'White Sage Botanical Elixir',
    frDescription:
      'Macération lente de sauge blanche et de néroli dans une huile de jojoba vierge. Quelques gouttes sur les poignets ou sur pierre poreuse accompagnent l’ouverture de la pratique matinale.',
    description:
      'Slow maceration of white sage and neroli in virgin jojoba oil. A few drops on the wrists or a porous stone accompany the opening of morning practice.',
    frAdditionalInfo:
      'Flacon en verre ambré 30 ml · Compte-gouttes en laiton brossé · Sans conservateur ni parfum de synthèse.',
    additionalInfo:
      '30 ml amber glass bottle · Brushed brass dropper · Free from synthetic preservatives or fragrances.',
  },
  prod_bougie_cire: {
    frName: 'Bougie de Veille Cire d’Abeille & Grès',
    name: 'Beeswax & Stoneware Vigil Candle',
    frDescription:
      'Coulée à la main dans un calice de grès tourné en atelier, cette bougie de cire d’abeille brute diffuse une lueur chaude et une note subtile de miel sauvage, propice au silence du soir.',
    description:
      'Hand-poured into a studio-thrown stoneware chalice, this raw beeswax candle casts a warm glow and a subtle wild-honey note suited to evening silence.',
    frAdditionalInfo:
      'Cire d’abeille 100 % pure · Mèche en coton non blanchi · 55 heures de combustion · Contenant réutilisable.',
    additionalInfo:
      '100% pure beeswax · Unbleached cotton wick · 55-hour burn time · Reusable vessel.',
  },
  prod_pierres_ancrage: {
    frName: 'Duo d’Ancrage Labradorite & Quartz Fumé',
    name: 'Labradorite & Smoky Quartz Grounding Duo',
    frDescription:
      'Deux galets de paume polis à la main, choisis par le Maître pour leur densité et leur toucher apaisant. Livrés dans leur pochette de lin brut pour accompagner l’assise quotidienne.',
    description:
      'Two hand-polished palm stones chosen by the Master for their density and soothing tactile presence. Delivered in a raw linen pouch for daily seated practice.',
    frAdditionalInfo:
      'Labradorite de Madagascar & Quartz Fumé alpin · Poids moyen du duo : 260 g · Pièces naturelles uniques.',
    additionalInfo:
      'Madagascar Labradorite & Alpine Smoky Quartz · Average duo weight: 260 g · Unique natural specimens.',
  },
  prod_encens_sanctuaire: {
    frName: 'Coffret Rituel du Sanctuaire',
    name: 'Sanctuary Ritual Set',
    frDescription:
      'Réunit notre brûleur sculpté en basalte et travertin, une réserve de bâtons au cèdre et le carnet de pratique quotidienne en papier coton.',
    description:
      'Brings together our sculpted basalt and travertine burner, a reserve of cedarwood sticks, and the daily practice notebook on cotton paper.',
    frAdditionalInfo:
      'Composition complète : Porte-encens bi-matière, 24 bâtons de cèdre, carnet cousu main · Préparation sous 48h.',
    additionalInfo:
      'Complete set: Dual-stone incense holder, 24 cedarwood sticks, hand-stitched notebook · Prepared within 48h.',
  },
  prod_bol_contemplation: {
    frName: 'Carnet de Silence & Bol d’Ouverture',
    name: 'Silence Notebook & Opening Bell Bowl',
    frDescription:
      'Ensemble dédié à l’écriture méditative du matin : un carnet artisanal à tranche brute accompagné d’un petit bol chantant en laiton martelé à la tonalité claire et durable.',
    description:
      'A set dedicated to morning meditative journaling: a deckle-edged artisanal notebook paired with a small hammered brass singing bowl of clear, lasting resonance.',
    frAdditionalInfo:
      'Bol diamètre 10 cm avec mailloche en bois de noyer · Carnet 120 pages papier coton 180 g/m².',
    additionalInfo:
      '10 cm diameter bowl with walnut mallet · 120-page 180 gsm cotton paper notebook.',
  },
};

const EN_ARTICLE_CATEGORIES_BY_ID: Record<string, { fr: string; en: string }> = {
  ac_enseignements: { fr: 'Enseignements', en: 'Teachings' },
  ac_reflexions: { fr: 'Réflexions', en: 'Reflections' },
  ac_pratique: { fr: 'Pratique & Rituels', en: 'Practice & Rituals' },
  ac_actualites: { fr: 'Actualités du Sanctuaire', en: 'Sanctuary News' },
};

const EN_ARTICLES_BY_ID: Record<
  string,
  {
    frTitle: string;
    title: string;
    frExcerpt: string;
    excerpt: string;
    frContent: string;
    content: string;
  }
> = {
  art_silence_interieur: {
    frTitle: 'Habiter le silence avant que le monde ne s’éveille',
    title: 'Inhabiting stillness before the world awakens',
    frExcerpt:
      'Pourquoi les vingt premières minutes du matin déterminent la qualité de notre attention, et comment aménager un espace de clarté sans rupture avec la vie moderne.',
    excerpt:
      'Why the first twenty minutes of the morning shape the quality of our attention, and how to cultivate a space of clarity without retreating from modern life.',
    frContent:
      'Le silence n’est pas l’absence de bruit ; il est la présence d’une écoute sans précipitation. Lorsque nous ouvrons les yeux le matin, notre esprit cherche aussitôt un appui extérieur : une tâche, un message, une inquiétude héritée de la veille.\n\nAménager un seuil entre le sommeil et l’action transforme radicalement notre rapport au temps. Il ne s’agit pas de fuir nos responsabilités, mais d’entrer dans la journée depuis un centre stable. Asseyez-vous face à une lumière sobre, respirez trois fois profondément sans chercher à corriger le souffle, puis observez simplement ce qui demande à être apaisé.\n\nUn objet familier — une tasse de thé tiède, une flamme de cire pure, une pierre fraîche dans la paume — agit alors comme un repère sensoriel. Il rappelle au corps que rien n’exige votre dispersion immédiate.',
    content:
      'Silence is not the absence of noise; it is the presence of unhurried listening. When we open our eyes in the morning, the mind immediately reaches for an external anchor: a task, a message, a worry carried over from yesterday.\n\nCreating a threshold between sleep and action fundamentally transforms our relationship with time. It is not about escaping responsibility, but entering the day from a steady center. Sit before a quiet light, take three deep breaths without forcing the rhythm, and simply notice what asks to be soothed.\n\nA familiar object—a warm cup of tea, a pure beeswax flame, a cool stone in the palm—then acts as a sensory landmark. It reminds the body that nothing requires immediate scattering.',
  },
  art_rituel_ecriture: {
    frTitle: 'L’écriture contemplative comme miroir de discernement',
    title: 'Contemplative writing as a mirror of discernment',
    frExcerpt:
      'Poser ses pensées sur papier coton libère la mémoire vive et révèle les intentions véritables derrière nos hésitations quotidiennes.',
    excerpt:
      'Putting thoughts onto cotton paper frees working memory and reveals the true intentions behind our daily hesitations.',
    frContent:
      'Écrire à la main ralentit le débit de la pensée jusqu’à la vitesse de la respiration. Dans ce ralentissement apparaît une honnêteté que le tumulte intérieur dissimulait.\n\nChaque soir, consacrez dix minutes à noter trois observations sans jugement : ce qui vous a donné de l’élan, ce qui a troublé votre paix, et ce que vous choisissez de déposer avant le sommeil. Nul besoin de style littéraire ; la simplicité du trait suffit.\n\nAvec les semaines, ces feuillets deviennent une cartographie fidèle de votre évolution intérieure. Vous cessez de répéter les mêmes impasses parce que vous apprenez à en reconnaître les premiers signes.',
    content:
      'Writing by hand slows the pace of thought down to the speed of breathing. Within that slowing emerges an honesty that inner commotion used to conceal.\n\nEach evening, spend ten minutes noting three observations without judgment: what gave you momentum, what disturbed your peace, and what you choose to lay down before sleep. Literary style is unnecessary; simplicity of line is enough.\n\nOver the weeks, these pages become a faithful map of your inner growth. You stop repeating the same dead ends because you learn to recognize their earliest signs.',
  },
  art_matiere_sacree: {
    frTitle: 'La sobriété des objets qui nous entourent',
    title: 'The sobriety of the objects around us',
    frExcerpt:
      'Ce que nous touchons façonne notre état d’esprit. Réflexion sur les matières nobles — bois, pierre, argile — et leur rôle dans l’équilibre du foyer.',
    excerpt:
      'What we touch shapes our state of mind. A reflection on noble materials—wood, stone, clay—and their role in the harmony of the home.',
    frContent:
      'Nous vivons entourés d’objets anonymes, légers et jetables qui n’appellent aucun soin. Pourtant, l’être humain entretient un dialogue silencieux avec la matière qui l’environne.\n\nChoisir un brûleur en pierre brute ou une bougie façonnée par une main patiente n’est pas un luxe décoratif : c’est une manière d’honorer le geste. Chaque fois que vous allumez un encens véritable, vous signifiez à votre espace qu’un temps différent commence.\n\nEntourez-vous de peu d’objets, mais veillez à ce que chacun porte une intention claire, une origine lisible et une durée qui dépasse l’instant.',
    content:
      'We live surrounded by anonymous, weightless, disposable objects that ask for no care. Yet human beings carry on a silent dialogue with the matter that surrounds them.\n\nChoosing a rough-stone burner or a candle shaped by a patient hand is not decorative luxury: it is a way of honoring the gesture. Every time you light true incense, you signal to your space that a different kind of time has begun.\n\nSurround yourself with few objects, but make sure each carries a clear intention, a traceable origin, and a lifespan that outlasts the passing moment.',
  },
  art_retraite_hiver: {
    frTitle: 'Notes préparatoires pour la veille du solstice d’hiver',
    title: 'Preparatory notes for the winter solstice vigil',
    frExcerpt:
      'Brouillon de travail consacré aux lectures et temps de silence qui rythmeront la rencontre de décembre au Sanctuaire.',
    excerpt:
      'Working draft dedicated to the readings and periods of silence that will rhythm the December gathering at the Sanctuary.',
    frContent:
      'Document de préparation interne pour les participants de la retraite d’hiver. Horaires envisagés : ouverture à 7h30, marche silencieuse à 11h00, entretien collectif à 17h00.',
    content:
      'Internal preparation document for winter retreat participants. Proposed schedule: opening at 7:30 AM, silent walk at 11:00 AM, collective talk at 5:00 PM.',
  },
};

const EN_VIDEOS_BY_ID: Record<
  string,
  { frTitle: string; title: string; frDescription: string; description: string }
> = {
  vid_1: {
    frTitle: 'Entretien sur la paix intérieure et l’art de la présence',
    title: 'Talk on inner peace and the art of presence',
    frDescription:
      'Une méditation guidée de cinq minutes pour retrouver votre ancrage au cœur de la journée.',
    description: 'A five-minute guided meditation to restore your grounding in the middle of the day.',
  },
  vid_2: {
    frTitle: 'Respiration consciente et apaisement du système nerveux',
    title: 'Conscious breathing and calming the nervous system',
    frDescription:
      'Pratique vocale et silencieuse pour relâcher les tensions accumulées avant le repos nocturne.',
    description: 'Vocal and silent practice to release accumulated tension before evening rest.',
  },
  vid_3: {
    frTitle: 'Le discernement face aux cycles de changement',
    title: 'Discernment in the face of cycles of change',
    frDescription:
      'Enseignement d’ouverture sur l’accueil des transitions personnelles avec lucidité et douceur.',
    description: 'Opening teaching on welcoming personal transitions with lucidity and gentleness.',
  },
};

const EN_TESTIMONIALS_BY_ID: Record<
  string,
  { frAuthorLocation: string; authorLocation: string; frContent: string; content: string }
> = {
  test_1: {
    frAuthorLocation: 'Paris · Bougie & Élixir',
    authorLocation: 'Paris · Candle & Elixir',
    frContent:
      'La qualité de l’encens au cèdre et l’attention portée à chaque demande de commande créent une véritable relation de confiance. Le suivi téléphonique avant l’envoi est d’une grande délicatesse.',
    content:
      'The quality of the cedarwood incense and the care given to every order request build genuine trust. The phone follow-up prior to dispatch shows rare thoughtfulness.',
  },
  test_2: {
    frAuthorLocation: 'Lyon · Duo Labradorite',
    authorLocation: 'Lyon · Labradorite Duo',
    frContent:
      'Les textes publiés dans la communauté m’accompagnent chaque matin avant le travail. Sans jamais tomber dans l’excès, les enseignements de Maître Élias apportent une clarté immédiate.',
    content:
      'The texts published in the community accompany me every morning before work. Without ever going to excess, Master Élias’s teachings bring immediate clarity.',
  },
  test_3: {
    frAuthorLocation: 'Nice · Coffret du Sanctuaire',
    authorLocation: 'Nice · Sanctuary Set',
    frContent:
      'Notre cercle de lecture utilise le carnet de silence et la bougie de cire d’abeille depuis plusieurs mois. Les matières sont sobres, durables et fidèles à l’esprit du Sanctuaire.',
    content:
      'Our reading circle has used the silence notebook and beeswax candle for several months. The materials are understated, durable, and faithful to the spirit of the Sanctuary.',
  },
};

const EN_FAQ_BY_ID: Record<
  string,
  { frQuestion: string; question: string; frAnswer: string; answer: string }
> = {
  faq_1: {
    frQuestion: 'Comment accéder aux enseignements, articles et vidéos de DIVIN HORUS ?',
    question: 'How can I access DIVIN HORUS teachings, articles, and videos?',
    frAnswer:
      'Tous les écrits, réflexions et méditations vidéo publiés dans l’espace Communauté sont en accès libre et gratuit. Vous pouvez également créer un compte visiteur depuis la rubrique « Connexion » afin d’enregistrer vos articles préférés et publier votre témoignage.',
    answer:
      'All writings, reflections, and meditation videos published in the Community section are freely accessible at no cost. You may also create a visitor account from "Sign in" to bookmark your favorite articles and share your testimonial.',
  },
  faq_2: {
    frQuestion: 'Faut-il déjà pratiquer la méditation pour suivre les enseignements ?',
    question: 'Do I already need meditation experience to follow the teachings?',
    frAnswer:
      'Aucune expérience préalable n’est requise. Les enseignements transmis privilégient des repères clairs, la présence au quotidien et des exercices progressifs accessibles à chacun.',
    answer:
      'No prior experience is required. Our teachings focus on clear bearings, everyday presence, and progressive exercises accessible to everyone.',
  },
  faq_3: {
    frQuestion: 'À quelle fréquence de nouvelles vidéos et réflexions sont-elles publiées ?',
    question: 'How often are new videos and reflections published?',
    frAnswer:
      'De nouveaux articles sont publiés régulièrement dans la Communauté, et chaque vidéo mise en ligne sur notre chaîne YouTube officielle est synchronisée automatiquement sur le site.',
    answer:
      'New articles are published regularly in the Community, and every video uploaded to our official YouTube channel is automatically synced to the website.',
  },
  faq_4: {
    frQuestion: 'Pourquoi n’y a-t-il pas de paiement en ligne sur la boutique ?',
    question: 'Why is there no online payment in the shop?',
    frAnswer:
      'Par souci d’authenticité et d’accompagnement humain, aucune carte bancaire n’est demandée en ligne. Vous validez simplement votre demande de commande : notre équipe vérifie la disponibilité artisanale et vous contacte personnellement pour confirmer les détails et le règlement.',
    answer:
      'Out of respect for authenticity and personal guidance, no bank card is requested online. You simply submit your order request: our team checks artisanal availability and reaches out personally to confirm details and payment.',
  },
  faq_5: {
    frQuestion: 'Comment suivre l’évolution de ma demande de commande ?',
    question: 'How can I track the progress of my order request?',
    frAnswer:
      'Chaque demande génère un numéro unique (par exemple CMD-1045). Vous pouvez suivre son statut à tout moment depuis la page « Suivre ma commande » ou directement dans votre espace « Mon compte ».',
    answer:
      'Each request generates a unique reference number (for example CMD-1045). You can track its status at any time from the "Track order" page or directly inside "My account".',
  },
  faq_6: {
    frQuestion: 'Quels sont les délais de préparation et les zones d’expédition ?',
    question: 'What are preparation times and shipping areas?',
    frAnswer:
      'Les créations en stock sont préparées sous 2 à 3 jours ouvrés ; les pièces réalisées sur commande demandent 5 à 10 jours. Nous expédions en France métropolitaine, Belgique, Suisse, Luxembourg et proposons le retrait sur rendez-vous.',
    answer:
      'In-stock creations are prepared within 2 to 3 business days; made-to-order pieces take 5 to 10 days. We ship internationally across Europe, Africa, the Americas, and offer pickup by appointment.',
  },
  faq_7: {
    frQuestion: 'D’où proviennent les matières utilisées pour les objets rituels ?',
    question: 'Where do the materials used for ritual objects come from?',
    frAnswer:
      'Les résines naturelles, cires d’abeille pures, huiles botaniques et minéraux bruts sont sourcés auprès d’artisans indépendants, sans parfums de synthèse ni additifs chimiques.',
    answer:
      'Natural resins, pure beeswax, botanical oils, and raw minerals are sourced from independent artisans, free from synthetic fragrances or chemical additives.',
  },
  faq_8: {
    frQuestion: 'Comment demander un renseignement ou un accompagnement individuel ?',
    question: 'How can I request information or individual guidance?',
    frAnswer:
      'Rendez-vous sur la page Contact pour nous écrire directement. Notre équipe vous répond avec attention du lundi au vendredi sous 24 à 48 heures ouvrées.',
    answer:
      'Visit the Contact page to write to us directly. Our team responds carefully Monday through Friday within 24 to 48 business hours.',
  },
};

const EN_EXACT_STRINGS: Record<string, string> = {
  'Bienvenue dans votre espace de clarté et de présence':
    'Welcome to your space of clarity and presence',
  'Découvrez les enseignements contemporains de Maître Élias Varenne, rejoignez les échanges de la communauté et commandez des objets rituels façonnés avec sobriété.':
    'Discover the contemporary teachings of Master Élias Varenne, join community exchanges, and request ritual objects crafted with quiet simplicity.',
  'Découvrir la boutique': 'Explore the shop',
  'Rejoindre la communauté': 'Join the community',
  'Fondateur du Sanctuaire & Guide contemplatif':
    'Founder of the Sanctuary & Contemplative Guide',
  'Après vingt années consacrées à l’étude des traditions contemplatives et à l’accompagnement individuel, Élias Varenne transmet une spiritualité incarnée, libre de tout artifice et profondément ancrée dans la vie quotidienne.':
    'After twenty years devoted to studying contemplative traditions and guiding individuals, Élias Varenne transmits an embodied spirituality, free of artifice and deeply rooted in everyday life.',
  'Son approche unit la rigueur du silence, l’écoute attentive et la valeur des gestes simples. Chaque enseignement et chaque objet proposé au sein de la maison répondent à une exigence d’authenticité, de mesure et de respect.':
    'His approach unites the rigor of silence, attentive listening, and the value of simple gestures. Every teaching and every object offered by the house meets a standard of authenticity, restraint, and respect.',
  'En savoir plus': 'Learn more',
  'Découvrez notre sélection': 'Discover our selection',
  'Objets de pratique et créations naturelles préparés en séries limitées, disponibles uniquement sur demande directe.':
    'Practice objects and natural creations prepared in small batches, available exclusively by direct request.',
  'Derniers enseignements & écrits': 'Latest teachings & writings',
  'Vidéos & méditations guidées': 'Videos & guided meditations',
  'Paroles & Témoignages': 'Words & Testimonials',
  'Une voie contemplative ancrée dans le réel': 'A contemplative path anchored in reality',
  'DIVIN HORUS réunit transmission écrite, pratique audio-visuelle et artisanat sacré au service de l’équilibre intérieur.':
    'DIVIN HORUS brings together written transmission, audiovisual practice, and sacred craftsmanship in service of inner balance.',
  'Notre philosophie de transmission': 'Our philosophy of transmission',
  'Nous croyons qu’une démarche spirituelle authentique se mesure à la paix qu’elle apporte dans les gestes ordinaires : la parole juste, l’attention portée aux autres, et la sobriété de nos habitudes.\n\nRefusant tout folklore ostentatoire, notre espace privilégie la clarté, l’étude patiente et l’accompagnement humain direct. C’est également la raison pour laquelle chaque commande fait l’objet d’un échange personnel avant préparation.':
    'We believe an authentic spiritual path is measured by the peace it brings into ordinary gestures: truthful speech, attentiveness to others, and simplicity in our habits.\n\nSetting aside all ostentatious folklore, our space favors clarity, patient study, and direct human guidance. That is also why every order is confirmed through a personal exchange before preparation.',
  'L’atelier des matières nobles': 'The workshop of noble materials',
  'Tous les encens, huiles botaniques, bougies en cire d’abeille et minéraux sont sélectionnés ou formulés auprès d’artisans indépendants respectueux des cycles naturels. Aucun paiement automatisé n’est requis en ligne : votre demande est reçue, vérifiée et confirmée personnellement par notre équipe.':
    'All incenses, botanical oils, beeswax candles, and minerals are sourced or formulated alongside independent artisans who respect natural cycles. No automated online payment is required: your request is received, reviewed, and personally confirmed by our team.',
  'Sérénité & Transparence': 'Serenity & Transparency',
  'Chaque objet est décrit avec exactitude quant à son origine, sa composition et son usage réel.':
    'Every object is accurately described regarding its origin, composition, and real use.',
  'Relation Humaine Directe': 'Direct Human Connection',
  'Vos demandes de commande sont traitées individuellement pour garantir disponibilité et conseil adapté.':
    'Your order requests are handled individually to ensure availability and tailored advice.',
  'Communauté Ouverte': 'Open Community',
  'Articles, enseignements et vidéos restent librement accessibles afin de nourrir votre pratique.':
    'Articles, teachings, and videos remain freely accessible to nourish your practice.',
  'Questions fréquentes': 'Frequently asked questions',
  'Retrouvez les réponses essentielles concernant nos enseignements, l’accès à la communauté et le fonctionnement de la boutique sur commande.':
    'Find essential answers regarding our teachings, community access, and how our made-to-order shop works.',
  'Entrer en relation avec DIVIN HORUS': 'Connect with DIVIN HORUS',
  'Pour toute question concernant un enseignement, une demande de commande personnalisée ou une orientation, notre équipe vous répond avec attention.':
    'For any question about a teaching, a custom order request, or personal guidance, our team will reply with care.',
  'Accueil & réponses du lundi au vendredi, de 9h30 à 18h30':
    'Reception & replies Monday through Friday, 9:30 AM to 6:30 PM',
  'Les demandes de commande passées en boutique sont confirmées par téléphone ou courriel sous 24 heures ouvrées.':
    'Order requests placed in the shop are confirmed by phone or email within 24 business hours.',
  'Mot d’accueil': 'Welcome note',
  'Bienvenue dans l’espace DIVIN HORUS': 'Welcome to DIVIN HORUS',
  'Nous sommes heureux de vous accueillir. Découvrez nos enseignements, méditations guidées et objets rituels façonnés avec sobriété.\n\nChaque commande passée sur la boutique fait l’objet d’une confirmation personnalisée par notre équipe.':
    'We are glad to welcome you. Explore our teachings, guided meditations, and ritual objects crafted with quiet simplicity.\n\nEvery order placed in the shop is personally confirmed by our team.',
  'Spiritualité, Enseignements & Objets Sacrés': 'Spirituality, Teachings & Sacred Objects',
  'Votre demande de commande a bien été transmise au Sanctuaire. Notre équipe vous contactera sous peu pour confirmer la disponibilité et les modalités de remise.':
    'Your order request has been sent to the Sanctuary. Our team will contact you shortly to confirm availability and delivery arrangements.',
  'France métropolitaine, Belgique, Suisse, Luxembourg et retrait au Sanctuaire (Paris)':
    'Worldwide shipping (Africa, Europe, Americas, Asia) & Sanctuary pickup (Paris)',
};

function enStr(text: string | undefined, customEn?: string): string {
  if (customEn && customEn.trim()) return customEn;
  if (!text) return '';
  return EN_EXACT_STRINGS[text] ?? text;
}

export function localizeCategory(cat: Category, lang: AppLanguage): Category {
  if (lang === 'fr') return cat;
  const ov = EN_CATEGORIES_BY_ID[cat.id];
  if (!ov) return cat;
  return {
    ...cat,
    name: seedStr(cat.name, ov.frName, ov.name),
    description: seedStr(cat.description, ov.frDescription, ov.description),
  };
}

export function localizeProduct(product: Product, lang: AppLanguage): Product {
  if (lang === 'fr') return product;
  const ov = EN_PRODUCTS_BY_ID[product.id];
  if (!ov) return product;
  return {
    ...product,
    name: seedStr(product.name, ov.frName, ov.name),
    description: seedStr(product.description, ov.frDescription, ov.description),
    additionalInfo: seedStr(product.additionalInfo, ov.frAdditionalInfo, ov.additionalInfo),
  };
}

export function localizeArticleCategory(
  cat: ArticleCategory,
  lang: AppLanguage,
): ArticleCategory {
  if (lang === 'fr') return cat;
  const ov = EN_ARTICLE_CATEGORIES_BY_ID[cat.id];
  if (!ov) return cat;
  return { ...cat, name: seedStr(cat.name, ov.fr, ov.en) };
}

export function localizeArticle(article: Article, lang: AppLanguage): Article {
  if (lang === 'fr') return article;
  const ov = EN_ARTICLES_BY_ID[article.id];
  if (!ov) return article;
  return {
    ...article,
    title: seedStr(article.title, ov.frTitle, ov.title),
    excerpt: seedStr(article.excerpt, ov.frExcerpt, ov.excerpt),
    content: seedStr(article.content, ov.frContent, ov.content),
  };
}

export function localizeVideo(video: VideoItem, lang: AppLanguage): VideoItem {
  if (lang === 'fr') return video;
  const ov = EN_VIDEOS_BY_ID[video.id];
  if (!ov) return video;
  return {
    ...video,
    title: seedStr(video.title, ov.frTitle, ov.title),
    description: seedStr(video.description, ov.frDescription, ov.description),
  };
}

export function localizeTestimonial(
  testimonial: Testimonial,
  lang: AppLanguage,
): Testimonial {
  if (lang === 'fr') return testimonial;
  const ov = EN_TESTIMONIALS_BY_ID[testimonial.id];
  if (!ov) return testimonial;
  return {
    ...testimonial,
    authorLocation: seedStr(testimonial.authorLocation, ov.frAuthorLocation, ov.authorLocation),
    content: seedStr(testimonial.content, ov.frContent, ov.content),
  };
}

export function localizeSiteContent(content: SiteContent, lang: AppLanguage): SiteContent {
  if (lang === 'fr') return content;
  return {
    hero: {
      ...content.hero,
      title: enStr(content.hero.title),
      subtitle: enStr(content.hero.subtitle),
      primaryButtonLabel: enStr(content.hero.primaryButtonLabel),
      secondaryButtonLabel: enStr(content.hero.secondaryButtonLabel),
    },
    master: {
      ...content.master,
      title: enStr(content.master.title),
      shortBio: enStr(content.master.shortBio),
      approach: enStr(content.master.approach),
      buttonLabel: enStr(content.master.buttonLabel),
    },
    homeSections: {
      ...content.homeSections,
      featuredProductsTitle: enStr(content.homeSections.featuredProductsTitle),
      featuredProductsSubtitle: enStr(content.homeSections.featuredProductsSubtitle),
      featuredArticlesTitle: enStr(content.homeSections.featuredArticlesTitle),
      featuredVideosTitle: enStr(content.homeSections.featuredVideosTitle),
      featuredTestimonialsTitle: enStr(content.homeSections.featuredTestimonialsTitle),
    },
    aboutPage: {
      ...content.aboutPage,
      heroTitle: enStr(content.aboutPage.heroTitle),
      heroSubtitle: enStr(content.aboutPage.heroSubtitle),
      philosophyTitle: enStr(content.aboutPage.philosophyTitle),
      philosophyBody: enStr(content.aboutPage.philosophyBody),
      lineageTitle: enStr(content.aboutPage.lineageTitle),
      lineageBody: enStr(content.aboutPage.lineageBody),
      commitments: content.aboutPage.commitments.map((c) => ({
        title: enStr(c.title),
        description: enStr(c.description),
      })),
      faqTitle: enStr(content.aboutPage.faqTitle),
      faqSubtitle: enStr(content.aboutPage.faqSubtitle),
      faqs: (content.aboutPage.faqs || []).map((f) => {
        const ov = EN_FAQ_BY_ID[f.id];
        return ov
          ? {
              ...f,
              question: seedStr(f.question, ov.frQuestion, ov.question),
              answer: seedStr(f.answer, ov.frAnswer, ov.answer),
            }
          : f;
      }),
    },
    contactPage: {
      ...content.contactPage,
      title: enStr(content.contactPage.title),
      subtitle: enStr(content.contactPage.subtitle),
      sanctuaryHours: enStr(content.contactPage.sanctuaryHours),
      consultationNote: enStr(content.contactPage.consultationNote),
    },
    welcomeAnnouncement: content.welcomeAnnouncement
      ? {
          ...content.welcomeAnnouncement,
          kicker: enStr(
            content.welcomeAnnouncement.kicker,
            content.welcomeAnnouncement.kickerEn,
          ),
          title: enStr(
            content.welcomeAnnouncement.title,
            content.welcomeAnnouncement.titleEn,
          ),
          message: enStr(
            content.welcomeAnnouncement.message,
            content.welcomeAnnouncement.messageEn,
          ),
          buttonLabel: enStr(
            content.welcomeAnnouncement.buttonLabel,
            content.welcomeAnnouncement.buttonLabelEn,
          ),
        }
      : undefined,
  };
}

export function localizeSettings(settings: SiteSettings, lang: AppLanguage): SiteSettings {
  if (lang === 'fr') return settings;
  return {
    ...settings,
    general: {
      ...settings.general,
      tagline: enStr(settings.general.tagline),
    },
    orderSettings: {
      ...settings.orderSettings,
      confirmationMessage: enStr(settings.orderSettings.confirmationMessage),
      deliveryZones: enStr(settings.orderSettings.deliveryZones),
    },
  };
}

export function localizePublicBootstrapData(
  data: PublicBootstrapData,
  lang: AppLanguage,
): PublicBootstrapData {
  if (lang === 'fr') return data;
  return {
    ...data,
    categories: data.categories.map((c) => localizeCategory(c, lang)),
    products: data.products.map((p) => localizeProduct(p, lang)),
    articleCategories: data.articleCategories.map((c) => localizeArticleCategory(c, lang)),
    articles: data.articles.map((a) => localizeArticle(a, lang)),
    videos: data.videos.map((v) => localizeVideo(v, lang)),
    testimonials: data.testimonials.map((t) => localizeTestimonial(t, lang)),
    siteContent: localizeSiteContent(data.siteContent, lang),
    settings: localizeSettings(data.settings, lang),
  };
}
