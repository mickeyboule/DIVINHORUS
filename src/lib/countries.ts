export interface WorldCountry {
  code: string;
  name: string;
  flag: string;
}

export function getCountryFlagEmoji(countryCode?: string | null): string {
  const code = (countryCode || '').toUpperCase().trim();
  if (!/^[A-Z]{2}$/.test(code)) return '🌍';
  const offset = 0x1f1e6 - 65;
  return String.fromCodePoint(code.charCodeAt(0) + offset, code.charCodeAt(1) + offset);
}

const RAW_WORLD_COUNTRIES: Array<[string, string]> = [
  // Afrique (54 États souverains + territoires)
  ['ZA', 'Afrique du Sud'],
  ['DZ', 'Algérie'],
  ['AO', 'Angola'],
  ['BJ', 'Bénin'],
  ['BW', 'Botswana'],
  ['BF', 'Burkina Faso'],
  ['BI', 'Burundi'],
  ['CM', 'Cameroun'],
  ['CV', 'Cap-Vert'],
  ['CF', 'Centrafrique'],
  ['KM', 'Comores'],
  ['CG', 'Congo-Brazzaville'],
  ['CD', 'Congo (RDC)'],
  ['CI', 'Côte d’Ivoire'],
  ['DJ', 'Djibouti'],
  ['EG', 'Égypte'],
  ['ER', 'Érythrée'],
  ['SZ', 'Eswatini'],
  ['ET', 'Éthiopie'],
  ['GA', 'Gabon'],
  ['GM', 'Gambie'],
  ['GH', 'Ghana'],
  ['GN', 'Guinée'],
  ['GW', 'Guinée-Bissau'],
  ['GQ', 'Guinée équatoriale'],
  ['KE', 'Kenya'],
  ['RE', 'La Réunion'],
  ['LS', 'Lesotho'],
  ['LR', 'Liberia'],
  ['LY', 'Libye'],
  ['MG', 'Madagascar'],
  ['MW', 'Malawi'],
  ['ML', 'Mali'],
  ['MA', 'Maroc'],
  ['MU', 'Maurice'],
  ['MR', 'Mauritanie'],
  ['YT', 'Mayotte'],
  ['MZ', 'Mozambique'],
  ['NA', 'Namibie'],
  ['NE', 'Niger'],
  ['NG', 'Nigeria'],
  ['UG', 'Ouganda'],
  ['RW', 'Rwanda'],
  ['ST', 'Sao Tomé-et-Principe'],
  ['SN', 'Sénégal'],
  ['SC', 'Seychelles'],
  ['SL', 'Sierra Leone'],
  ['SO', 'Somalie'],
  ['SD', 'Soudan'],
  ['SS', 'Soudan du Sud'],
  ['TZ', 'Tanzanie'],
  ['TD', 'Tchad'],
  ['TG', 'Togo'],
  ['TN', 'Tunisie'],
  ['ZM', 'Zambie'],
  ['ZW', 'Zimbabwe'],

  // Europe
  ['AL', 'Albanie'],
  ['DE', 'Allemagne'],
  ['AD', 'Andorre'],
  ['AT', 'Autriche'],
  ['BE', 'Belgique'],
  ['BY', 'Biélorussie'],
  ['BA', 'Bosnie-Herzégovine'],
  ['BG', 'Bulgarie'],
  ['CY', 'Chypre'],
  ['HR', 'Croatie'],
  ['DK', 'Danemark'],
  ['ES', 'Espagne'],
  ['EE', 'Estonie'],
  ['FI', 'Finlande'],
  ['FR', 'France'],
  ['GR', 'Grèce'],
  ['HU', 'Hongrie'],
  ['IE', 'Irlande'],
  ['IS', 'Islande'],
  ['IT', 'Italie'],
  ['XK', 'Kosovo'],
  ['LV', 'Lettonie'],
  ['LI', 'Liechtenstein'],
  ['LT', 'Lituanie'],
  ['LU', 'Luxembourg'],
  ['MK', 'Macédoine du Nord'],
  ['MT', 'Malte'],
  ['MD', 'Moldavie'],
  ['MC', 'Monaco'],
  ['ME', 'Monténégro'],
  ['NO', 'Norvège'],
  ['NL', 'Pays-Bas'],
  ['PL', 'Pologne'],
  ['PT', 'Portugal'],
  ['CZ', 'République tchèque'],
  ['RO', 'Roumanie'],
  ['GB', 'Royaume-Uni'],
  ['RU', 'Russie'],
  ['SM', 'Saint-Marin'],
  ['RS', 'Serbie'],
  ['SK', 'Slovaquie'],
  ['SI', 'Slovénie'],
  ['SE', 'Suède'],
  ['CH', 'Suisse'],
  ['UA', 'Ukraine'],
  ['VA', 'Vatican'],

  // Amériques (Nord, Centrale, Caraïbes, Sud + territoires)
  ['AG', 'Antigua-et-Barbuda'],
  ['AR', 'Argentine'],
  ['BS', 'Bahamas'],
  ['BB', 'Barbade'],
  ['BZ', 'Belize'],
  ['BO', 'Bolivie'],
  ['BR', 'Brésil'],
  ['CA', 'Canada'],
  ['CL', 'Chili'],
  ['CO', 'Colombie'],
  ['CR', 'Costa Rica'],
  ['CU', 'Cuba'],
  ['DM', 'Dominique'],
  ['EC', 'Équateur'],
  ['US', 'États-Unis'],
  ['GD', 'Grenade'],
  ['GP', 'Guadeloupe'],
  ['GT', 'Guatemala'],
  ['GY', 'Guyana'],
  ['GF', 'Guyane française'],
  ['HT', 'Haïti'],
  ['HN', 'Honduras'],
  ['JM', 'Jamaïque'],
  ['MQ', 'Martinique'],
  ['MX', 'Mexique'],
  ['NI', 'Nicaragua'],
  ['PA', 'Panama'],
  ['PY', 'Paraguay'],
  ['PE', 'Pérou'],
  ['PR', 'Porto Rico'],
  ['DO', 'République dominicaine'],
  ['BL', 'Saint-Barthélemy'],
  ['KN', 'Saint-Christophe-et-Niévès'],
  ['MF', 'Saint-Martin'],
  ['PM', 'Saint-Pierre-et-Miquelon'],
  ['VC', 'Saint-Vincent-et-les-Grenadines'],
  ['LC', 'Sainte-Lucie'],
  ['SV', 'Salvador'],
  ['SR', 'Suriname'],
  ['TT', 'Trinité-et-Tobago'],
  ['UY', 'Uruguay'],
  ['VE', 'Venezuela'],

  // Asie & Moyen-Orient
  ['AF', 'Afghanistan'],
  ['SA', 'Arabie saoudite'],
  ['AM', 'Arménie'],
  ['AZ', 'Azerbaïdjan'],
  ['BH', 'Bahreïn'],
  ['BD', 'Bangladesh'],
  ['BT', 'Bhoutan'],
  ['MM', 'Birmanie (Myanmar)'],
  ['BN', 'Brunei'],
  ['KH', 'Cambodge'],
  ['CN', 'Chine'],
  ['KP', 'Corée du Nord'],
  ['KR', 'Corée du Sud'],
  ['AE', 'Émirats arabes unis'],
  ['GE', 'Géorgie'],
  ['HK', 'Hong Kong'],
  ['IN', 'Inde'],
  ['ID', 'Indonésie'],
  ['IQ', 'Irak'],
  ['IR', 'Iran'],
  ['IL', 'Israël'],
  ['JP', 'Japon'],
  ['JO', 'Jordanie'],
  ['KZ', 'Kazakhstan'],
  ['KG', 'Kirghizistan'],
  ['KW', 'Koweït'],
  ['LA', 'Laos'],
  ['LB', 'Liban'],
  ['MO', 'Macao'],
  ['MY', 'Malaisie'],
  ['MV', 'Maldives'],
  ['MN', 'Mongolie'],
  ['NP', 'Népal'],
  ['OM', 'Oman'],
  ['UZ', 'Ouzbékistan'],
  ['PK', 'Pakistan'],
  ['PS', 'Palestine'],
  ['PH', 'Philippines'],
  ['QA', 'Qatar'],
  ['SG', 'Singapour'],
  ['LK', 'Sri Lanka'],
  ['SY', 'Syrie'],
  ['TJ', 'Tadjikistan'],
  ['TW', 'Taïwan'],
  ['TH', 'Thaïlande'],
  ['TL', 'Timor oriental'],
  ['TM', 'Turkménistan'],
  ['TR', 'Turquie'],
  ['VN', 'Viêt Nam'],
  ['YE', 'Yémen'],

  // Océanie
  ['AU', 'Australie'],
  ['FJ', 'Fidji'],
  ['CK', 'Îles Cook'],
  ['MH', 'Îles Marshall'],
  ['SB', 'Îles Salomon'],
  ['KI', 'Kiribati'],
  ['FM', 'Micronésie'],
  ['NR', 'Nauru'],
  ['NC', 'Nouvelle-Calédonie'],
  ['NZ', 'Nouvelle-Zélande'],
  ['PW', 'Palaos'],
  ['PG', 'Papouasie-Nouvelle-Guinée'],
  ['PF', 'Polynésie française'],
  ['WS', 'Samoa'],
  ['TO', 'Tonga'],
  ['TV', 'Tuvalu'],
  ['VU', 'Vanuatu'],
  ['WF', 'Wallis-et-Futuna'],
];

export const WORLD_COUNTRIES: WorldCountry[] = RAW_WORLD_COUNTRIES.map(([code, name]) => ({
  code,
  name,
  flag: getCountryFlagEmoji(code),
})).sort((a, b) => a.name.localeCompare(b.name, 'fr'));

const EN_COUNTRY_OVERRIDES: Record<string, string> = {
  XK: 'Kosovo',
};

const WORLD_COUNTRIES_CACHE: Partial<Record<'fr' | 'en', WorldCountry[]>> = {
  fr: WORLD_COUNTRIES,
};

export function getWorldCountries(lang: 'fr' | 'en' = 'fr'): WorldCountry[] {
  if (lang === 'fr') return WORLD_COUNTRIES;
  const cached = WORLD_COUNTRIES_CACHE[lang];
  if (cached) return cached;

  let displayNames: Intl.DisplayNames | null = null;
  try {
    displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
  } catch {
    displayNames = null;
  }

  const list = RAW_WORLD_COUNTRIES.map(([code, frName]) => {
    const resolved =
      EN_COUNTRY_OVERRIDES[code] ||
      (displayNames ? displayNames.of(code) : undefined) ||
      frName;
    return {
      code,
      name: resolved === code ? frName : resolved,
      flag: getCountryFlagEmoji(code),
    };
  }).sort((a, b) => a.name.localeCompare(b.name, 'en'));

  WORLD_COUNTRIES_CACHE[lang] = list;
  return list;
}

export function findWorldCountry(
  code?: string | null,
  lang: 'fr' | 'en' = 'fr',
): WorldCountry | undefined {
  const norm = (code || '').toUpperCase().trim();
  if (!norm) return undefined;
  return getWorldCountries(lang).find((c) => c.code === norm);
}

export function formatCountryWithFlag(
  code?: string | null,
  lang: 'fr' | 'en' = 'fr',
): string {
  const norm = (code || '').toUpperCase().trim();
  if (!norm) return '—';
  const found = findWorldCountry(norm, lang);
  if (found) return `${found.flag} ${found.name}`;
  try {
    const dn = new Intl.DisplayNames([lang], { type: 'region' });
    return `${getCountryFlagEmoji(norm)} ${dn.of(norm) || norm}`;
  } catch {
    return `${getCountryFlagEmoji(norm)} ${norm}`;
  }
}
