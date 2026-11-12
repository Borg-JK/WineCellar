import type { Wine, WineType } from '../lib/types'
import { slug } from '../lib/util'

/**
 * Starter catalogue: wines listed in the online ranges of Albert Heijn and
 * Gall & Gall (both have many branches in Rotterdam). No prices or vintages
 * are stored here because they change; those are recorded per check-in.
 * A catalogue wine is copied into Firestore the first time someone uses it.
 */
type Row = [name: string, producer: string, type: WineType, grapes: string[], country: string, region: string, stores: string[]]

const AH = ['albert-heijn']
const GG = ['gall-gall']
const BOTH = ['albert-heijn', 'gall-gall']

const ROWS: Row[] = [
  ['Excellent Selectie Côtes du Rhône Villages', 'AH Excellent', 'red', ['Grenache', 'Syrah'], 'France', 'Rhône', AH],
  ['Excellent Selectie Bordeaux', 'AH Excellent', 'red', ['Cabernet Sauvignon', 'Merlot'], 'France', 'Bordeaux', AH],
  ['Excellent Selectie Viña Lorea Rioja Crianza', 'AH Excellent', 'red', ['Tempranillo'], 'Spain', 'Rioja', AH],
  ['Excellent Selectie Barossa Shiraz', 'AH Excellent', 'red', ['Shiraz'], 'Australia', 'Barossa', AH],
  ['Excellent Selectie Spätburgunder', 'AH Excellent', 'red', ['Pinot Noir'], 'Germany', '', AH],
  ['Excellent Selectie Chianti Classico', 'AH Excellent', 'red', ['Sangiovese'], 'Italy', 'Tuscany', AH],
  ['Fruitige Franse huiswijn rood', 'AH', 'red', [], 'France', '', AH],
  ['Soepele Spaanse huiswijn rood', 'AH', 'red', [], 'Spain', '', AH],
  ['Stevige Chileense huiswijn rood', 'AH', 'red', [], 'Chile', '', AH],
  ['Soepele Zuid-Afrikaanse huiswijn rood', 'AH', 'red', [], 'South Africa', '', AH],
  ['Merlot', 'AH', 'red', ['Merlot'], '', '', AH],
  ['Biologisch Merlot', 'AH Biologisch', 'red', ['Merlot'], '', '', AH],
  ['Biologisch Chardonnay', 'AH Biologisch', 'white', ['Chardonnay'], '', '', AH],
  ['Cabernet Sauvignon Reserva', 'Casillero del Diablo', 'red', ['Cabernet Sauvignon'], 'Chile', '', AH],
  ['Cabernet Sauvignon', 'Undurraga', 'red', ['Cabernet Sauvignon'], 'Chile', '', AH],
  ['Santa Cristina Toscana Rosso', 'Antinori', 'red', ['Sangiovese'], 'Italy', 'Tuscany', AH],
  ['Sangre de Toro', 'Torres', 'red', ['Garnacha', 'Cariñena'], 'Spain', 'Catalonia', AH],
  ['Viña Albali Tinto', 'Félix Solís', 'red', ['Tempranillo'], 'Spain', 'Valdepeñas', AH],
  ['Rioja Reserva', 'Marqués de Vitoria', 'red', ['Tempranillo'], 'Spain', 'Rioja', AH],
  ['Rioja Gran Reserva', 'Marqués de Vitoria', 'red', ['Tempranillo'], 'Spain', 'Rioja', AH],
  ['Novas Carménère Gran Reserva', 'Emiliana', 'red', ['Carménère'], 'Chile', '', AH],
  ['Coyam', 'Emiliana', 'red', ['Syrah', 'Carménère'], 'Chile', 'Colchagua', AH],
  ['Moulin-à-Vent', 'Georges Duboeuf', 'red', ['Gamay'], 'France', 'Beaujolais', AH],
  ['Costasera Amarone Classico', 'Masi', 'red', ['Corvina', 'Rondinella', 'Molinara'], 'Italy', 'Veneto', BOTH],
  ['Pinot Noir Val de Loire', 'LaCheteau', 'red', ['Pinot Noir'], 'France', 'Loire', AH],
  ['Chardonnay', 'Rodet', 'white', ['Chardonnay'], 'France', '', AH],
  ['Sauvignon Blanc', 'Mount Vernon', 'white', ['Sauvignon Blanc'], 'New Zealand', 'Marlborough', AH],
  ['Sauvignon Blanc', 'Valdivieso', 'white', ['Sauvignon Blanc'], 'Chile', '', BOTH],
  ['Pinot Grigio', 'Lavis', 'white', ['Pinot Grigio'], 'Italy', 'Trentino', AH],
  ['Viognier', 'Cecchi', 'white', ['Viognier'], 'Italy', 'Tuscany', AH],
  ['Moscato d\'Asti', 'Fontanafredda', 'sparkling', ['Moscato'], 'Italy', 'Piedmont', AH],
  ['Moscato Rosé', 'Stormhoek', 'rosé', ['Moscato'], 'South Africa', '', AH],
  ['Rosé', 'Moonlight & Roses', 'rosé', [], '', '', AH],
  ['Mediterraneo Brut', 'Hola!', 'sparkling', [], 'Spain', '', AH],
  ['Otima 10 Year Old Tawny', 'Warre\'s', 'fortified', [], 'Portugal', 'Douro', AH],
  ['Rouge', 'Arrogant Frog', 'red', [], 'France', 'Languedoc', GG],
  ['Malbec', 'Alamos', 'red', ['Malbec'], 'Argentina', 'Mendoza', GG],
  ['Chardonnay', 'Alamos', 'white', ['Chardonnay'], 'Argentina', 'Mendoza', GG],
  ['Pinot Grigio', 'Trapiche', 'white', ['Pinot Grigio'], 'Argentina', 'Mendoza', GG],
  ['Winemaker Reserva Merlot', 'Valdivieso', 'red', ['Merlot'], 'Chile', '', GG],
  ['Shiraz', 'Palo Alto', 'red', ['Shiraz'], 'Chile', '', GG],
]

export const SEED_WINES: Wine[] = ROWS.map(([name, producer, type, grapes, country, region, storeIds]) => ({
  id: `cat-${slug(`${producer} ${name}`)}`,
  name,
  producer,
  type,
  grapes,
  country,
  region,
  photos: [],
  storeIds,
  ratingSum: 0,
  ratingCount: 0,
  createdBy: 'catalog',
  source: 'catalog',
}))
