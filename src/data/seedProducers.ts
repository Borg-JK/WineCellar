import type { Producer } from '../lib/types'
import { slug } from '../lib/util'

/**
 * Well-known producers that have no wine in the starter catalogue yet, so they can be
 * picked when someone adds a wine by hand. Producers of catalogue wines are added
 * automatically from the wines themselves (see AppContext).
 */
type Row = [name: string, country: string, region: string]

const ROWS: Row[] = [
  // France: Bordeaux
  ['Château Margaux', 'France', 'Bordeaux'], ['Château Lafite Rothschild', 'France', 'Bordeaux'],
  ['Château Latour', 'France', 'Bordeaux'], ['Château Mouton Rothschild', 'France', 'Bordeaux'],
  ['Château Haut-Brion', 'France', 'Bordeaux'], ['Château Cheval Blanc', 'France', 'Bordeaux'],
  ['Pétrus', 'France', 'Bordeaux'], ['Château d\'Yquem', 'France', 'Bordeaux'],
  ['Château Lynch-Bages', 'France', 'Bordeaux'], ['Château Palmer', 'France', 'Bordeaux'],
  ['Château Léoville Las Cases', 'France', 'Bordeaux'], ['Château Cos d\'Estournel', 'France', 'Bordeaux'],
  ['Château Pichon Baron', 'France', 'Bordeaux'], ['Château Smith Haut Lafitte', 'France', 'Bordeaux'],
  // France: Burgundy & Beaujolais
  ['Domaine de la Romanée-Conti', 'France', 'Burgundy'], ['Bouchard Père & Fils', 'France', 'Burgundy'],
  ['Maison Louis Latour', 'France', 'Burgundy'], ['Domaine Faiveley', 'France', 'Burgundy'],
  ['Albert Bichot', 'France', 'Burgundy'], ['Domaine Leflaive', 'France', 'Burgundy'],
  ['William Fèvre', 'France', 'Burgundy'], ['Marcel Lapierre', 'France', 'Beaujolais'],
  // France: Rhône, Loire, Alsace, South
  ['Château de Beaucastel', 'France', 'Rhône'], ['Jean-Luc Colombo', 'France', 'Rhône'],
  ['Delas Frères', 'France', 'Rhône'], ['Cave de Tain', 'France', 'Rhône'],
  ['Domaine Huet', 'France', 'Loire'], ['Pascal Jolivet', 'France', 'Loire'],
  ['Domaine Zind-Humbrecht', 'France', 'Alsace'], ['Domaine Weinbach', 'France', 'Alsace'],
  ['Domaine Tempier', 'France', 'Provence'], ['Mas de Daumas Gassac', 'France', 'Languedoc'],
  // Champagne
  ['Salon', 'France', 'Champagne'], ['Philipponnat', 'France', 'Champagne'], ['Drappier', 'France', 'Champagne'],
  ['Duval-Leroy', 'France', 'Champagne'], ['Bruno Paillard', 'France', 'Champagne'], ['Jacquesson', 'France', 'Champagne'],
  ['Thiénot', 'France', 'Champagne'], ['Vranken', 'France', 'Champagne'],
  // Italy
  ['Gaja', 'Italy', 'Piedmont'], ['Vietti', 'Italy', 'Piedmont'], ['Pio Cesare', 'Italy', 'Piedmont'],
  ['Bruno Giacosa', 'Italy', 'Piedmont'], ['Marchesi Frescobaldi', 'Italy', 'Tuscany'],
  ['Tenuta San Guido', 'Italy', 'Bolgheri'], ['Tenuta dell\'Ornellaia', 'Italy', 'Bolgheri'],
  ['Biondi-Santi', 'Italy', 'Tuscany'], ['Castello di Ama', 'Italy', 'Tuscany'], ['Fontodi', 'Italy', 'Tuscany'],
  ['Allegrini', 'Italy', 'Veneto'], ['Bertani', 'Italy', 'Veneto'], ['Planeta', 'Italy', 'Sicily'],
  ['Donnafugata', 'Italy', 'Sicily'], ['Tasca d\'Almerita', 'Italy', 'Sicily'], ['Jermann', 'Italy', 'Friuli-Venezia Giulia'],
  ['Livio Felluga', 'Italy', 'Friuli-Venezia Giulia'], ['Elena Walch', 'Italy', 'Alto Adige'], ['Cantina Terlano', 'Italy', 'Alto Adige'],
  // Spain & Portugal
  ['Vega Sicilia', 'Spain', 'Ribera del Duero'], ['Dominio de Pingus', 'Spain', 'Ribera del Duero'],
  ['Emilio Moro', 'Spain', 'Ribera del Duero'], ['Pago de Carraovejas', 'Spain', 'Ribera del Duero'],
  ['La Rioja Alta', 'Spain', 'Rioja'], ['R. López de Heredia', 'Spain', 'Rioja'], ['Bodegas Roda', 'Spain', 'Rioja'],
  ['Álvaro Palacios', 'Spain', 'Priorat'], ['Gramona', 'Spain', 'Penedès'], ['Raventós i Blanc', 'Spain', 'Penedès'],
  ['Quinta do Crasto', 'Portugal', 'Douro'], ['Quinta do Noval', 'Portugal', 'Douro'], ['Niepoort', 'Portugal', 'Douro'],
  ['Quinta do Vallado', 'Portugal', 'Douro'], ['Fonseca', 'Portugal', 'Douro'], ['Dow\'s', 'Portugal', 'Douro'],
  ['Cockburn\'s', 'Portugal', 'Douro'],
  // Germany, Austria, Hungary, Greece, Georgia
  ['Egon Müller', 'Germany', 'Mosel'], ['Joh. Jos. Prüm', 'Germany', 'Mosel'], ['Fritz Haag', 'Germany', 'Mosel'],
  ['Robert Weil', 'Germany', 'Rheingau'], ['Schloss Johannisberg', 'Germany', 'Rheingau'], ['Künstler', 'Germany', 'Rheingau'],
  ['Dönnhoff', 'Germany', 'Nahe'], ['Dr. Bürklin-Wolf', 'Germany', 'Pfalz'],
  ['F.X. Pichler', 'Austria', 'Wachau'], ['Prager', 'Austria', 'Wachau'], ['Knoll', 'Austria', 'Wachau'],
  ['Hirsch', 'Austria', 'Kamptal'], ['Disznókő', 'Hungary', 'Tokaj'], ['Oremus', 'Hungary', 'Tokaj'],
  ['Domaine Sigalas', 'Greece', 'Santorini'], ['Gaia Wines', 'Greece', 'Nemea'], ['Boutari', 'Greece', ''],
  ['Alpha Estate', 'Greece', 'Macedonia'], ['Tbilvino', 'Georgia', 'Kakheti'], ['Château Kefraya', 'Lebanon', 'Bekaa Valley'],
  // Netherlands
  ['Wijngoed Thorn', 'Netherlands', 'Limburg'], ['De Kleine Schorre', 'Netherlands', 'Zeeland'],
  // Americas
  ['Opus One', 'United States', 'California'], ['Ridge Vineyards', 'United States', 'California'],
  ['Caymus', 'United States', 'California'], ['Stag\'s Leap Wine Cellars', 'United States', 'California'],
  ['Duckhorn', 'United States', 'California'], ['Silver Oak', 'United States', 'California'],
  ['Joseph Phelps', 'United States', 'California'], ['Chateau Ste. Michelle', 'United States', 'Washington'],
  ['Almaviva', 'Chile', 'Maipo'], ['Lapostolle', 'Chile', 'Colchagua'], ['Viña Carmen', 'Chile', ''],
  ['De Martino', 'Chile', ''], ['Achával-Ferrer', 'Argentina', 'Mendoza'], ['Luigi Bosca', 'Argentina', 'Mendoza'],
  ['Salentein', 'Argentina', 'Mendoza'], ['Terrazas de los Andes', 'Argentina', 'Mendoza'], ['Colomé', 'Argentina', 'Salta'],
  ['Bodega Garzón', 'Uruguay', 'Maldonado'],
  // South Africa
  ['Meerlust', 'South Africa', 'Stellenbosch'], ['Rust en Vrede', 'South Africa', 'Stellenbosch'],
  ['Warwick', 'South Africa', 'Stellenbosch'], ['Vergelegen', 'South Africa', 'Stellenbosch'],
  ['Klein Constantia', 'South Africa', 'Constantia'], ['Mullineux', 'South Africa', 'Swartland'],
  ['The Sadie Family', 'South Africa', 'Swartland'], ['Hamilton Russell', 'South Africa', 'Hemel-en-Aarde'],
  // Australia & New Zealand
  ['Henschke', 'Australia', 'Eden Valley'], ['Torbreck', 'Australia', 'Barossa'], ['d\'Arenberg', 'Australia', 'McLaren Vale'],
  ['Yalumba', 'Australia', 'Barossa'], ['Peter Lehmann', 'Australia', 'Barossa'], ['Leeuwin Estate', 'Australia', 'Margaret River'],
  ['Cullen', 'Australia', 'Margaret River'], ['Tyrrell\'s', 'Australia', 'Hunter Valley'],
  ['Felton Road', 'New Zealand', 'Central Otago'], ['Craggy Range', 'New Zealand', 'Hawke\'s Bay'],
  ['Dog Point', 'New Zealand', 'Marlborough'], ['Ata Rangi', 'New Zealand', 'Martinborough'], ['Te Mata', 'New Zealand', 'Hawke\'s Bay'],
]

export const SEED_PRODUCERS: Producer[] = ROWS.map(([name, country, region]) => ({
  id: slug(name), name, country, region, source: 'catalog',
}))
