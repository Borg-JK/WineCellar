import type { Wine, WineType } from '../lib/types'
import { slug } from '../lib/util'
import { BOTTLE_PHOTOS } from './bottlePhotos'
import { OFF_WINES } from './offWines'

/**
 * Starter catalogue. The first block is wines listed in the online ranges of
 * Albert Heijn and Gall & Gall (both have many branches in Rotterdam); the rest
 * are widely sold wines without a store link, because shop ranges change. Store
 * links fill themselves in when someone logs where they bought a bottle.
 * No prices or vintages here; those are recorded per check-in.
 * A catalogue wine is copied into Firestore the first time someone uses it.
 */
type Row = [name: string, producer: string, type: WineType, grapes: string[], country: string, region: string, stores: string[]]

const AH = ['albert-heijn']
const GG = ['gall-gall']
const BOTH = ['albert-heijn', 'gall-gall']
const CHAMPAGNE_BLEND = ['Chardonnay', 'Pinot Noir', 'Pinot Meunier']

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
  // ── Champagne ──
  ['Brut Impérial', 'Moët & Chandon', 'champagne', CHAMPAGNE_BLEND, 'France', 'Champagne', []],
  ['Rosé Impérial', 'Moët & Chandon', 'champagne', CHAMPAGNE_BLEND, 'France', 'Champagne', []],
  ['Nectar Impérial', 'Moët & Chandon', 'champagne', CHAMPAGNE_BLEND, 'France', 'Champagne', []],
  ['Dom Pérignon Vintage', 'Dom Pérignon', 'champagne', ['Chardonnay', 'Pinot Noir'], 'France', 'Champagne', []],
  ['Brut Yellow Label', 'Veuve Clicquot', 'champagne', CHAMPAGNE_BLEND, 'France', 'Champagne', []],
  ['Rosé', 'Veuve Clicquot', 'champagne', CHAMPAGNE_BLEND, 'France', 'Champagne', []],
  ['La Cuvée Brut', 'Laurent-Perrier', 'champagne', CHAMPAGNE_BLEND, 'France', 'Champagne', []],
  ['Cuvée Rosé', 'Laurent-Perrier', 'champagne', ['Pinot Noir'], 'France', 'Champagne', []],
  ['Special Cuvée Brut', 'Bollinger', 'champagne', CHAMPAGNE_BLEND, 'France', 'Champagne', []],
  ['Brut Réserve', 'Taittinger', 'champagne', CHAMPAGNE_BLEND, 'France', 'Champagne', []],
  ['Cuvée Brut', 'Piper-Heidsieck', 'champagne', CHAMPAGNE_BLEND, 'France', 'Champagne', []],
  ['Brut Réserve', 'Charles Heidsieck', 'champagne', CHAMPAGNE_BLEND, 'France', 'Champagne', []],
  ['Grand Cordon Brut', 'Mumm', 'champagne', CHAMPAGNE_BLEND, 'France', 'Champagne', []],
  ['Réserve Exclusive Brut', 'Nicolas Feuillatte', 'champagne', CHAMPAGNE_BLEND, 'France', 'Champagne', []],
  ['Blanc de Blancs', 'Ruinart', 'champagne', ['Chardonnay'], 'France', 'Champagne', []],
  ['R de Ruinart Brut', 'Ruinart', 'champagne', ['Chardonnay', 'Pinot Noir', 'Pinot Meunier'], 'France', 'Champagne', []],
  ['Brut Réserve', 'Pol Roger', 'champagne', CHAMPAGNE_BLEND, 'France', 'Champagne', []],
  ['Black Label Brut', 'Lanson', 'champagne', CHAMPAGNE_BLEND, 'France', 'Champagne', []],
  ['Grand Brut', 'Perrier-Jouët', 'champagne', CHAMPAGNE_BLEND, 'France', 'Champagne', []],
  ['Brut Réserve', 'Billecart-Salmon', 'champagne', CHAMPAGNE_BLEND, 'France', 'Champagne', []],
  ['Brut Rosé', 'Billecart-Salmon', 'champagne', CHAMPAGNE_BLEND, 'France', 'Champagne', []],
  ['Collection', 'Louis Roederer', 'champagne', CHAMPAGNE_BLEND, 'France', 'Champagne', []],
  ['Cristal', 'Louis Roederer', 'champagne', ['Pinot Noir', 'Chardonnay'], 'France', 'Champagne', []],
  ['Grande Cuvée', 'Krug', 'champagne', CHAMPAGNE_BLEND, 'France', 'Champagne', []],
  ['Brut Royal', 'Pommery', 'champagne', CHAMPAGNE_BLEND, 'France', 'Champagne', []],
  ['Brut Classic', 'Deutz', 'champagne', CHAMPAGNE_BLEND, 'France', 'Champagne', []],
  ['Brut Majeur', 'Ayala', 'champagne', CHAMPAGNE_BLEND, 'France', 'Champagne', []],
  ['Brut Souverain', 'Henriot', 'champagne', CHAMPAGNE_BLEND, 'France', 'Champagne', []],
  ['Mosaïque Brut', 'Jacquart', 'champagne', CHAMPAGNE_BLEND, 'France', 'Champagne', []],
  ['Grande Réserve Brut', 'Gosset', 'champagne', CHAMPAGNE_BLEND, 'France', 'Champagne', []],
  ['Brut Tradition', 'Gosset', 'champagne', CHAMPAGNE_BLEND, 'France', 'Champagne', []],
  ['Carte Blanche Brut', 'Canard-Duchêne', 'champagne', CHAMPAGNE_BLEND, 'France', 'Champagne', []],

  // ── Other sparkling ──
  ['Cordon Negro Brut', 'Freixenet', 'sparkling', ['Macabeo', 'Xarel·lo', 'Parellada'], 'Spain', 'Cava', []],
  ['Prosecco', 'Freixenet', 'sparkling', ['Glera'], 'Italy', 'Veneto', []],
  ['Clásico Brut', 'Codorníu', 'sparkling', ['Macabeo', 'Xarel·lo', 'Parellada'], 'Spain', 'Cava', []],
  ['Cristalino Brut', 'Jaume Serra', 'sparkling', ['Macabeo', 'Xarel·lo', 'Parellada'], 'Spain', 'Cava', []],
  ['Prosecco', 'Martini', 'sparkling', ['Glera'], 'Italy', 'Veneto', []],
  ['Asti', 'Martini', 'sparkling', ['Moscato'], 'Italy', 'Piedmont', []],
  ['Prosecco Brut', 'Mionetto', 'sparkling', ['Glera'], 'Italy', 'Veneto', []],
  ['Prosecco Brut', 'Zonin', 'sparkling', ['Glera'], 'Italy', 'Veneto', []],
  ['Prosecco Brut', 'Valdo', 'sparkling', ['Glera'], 'Italy', 'Veneto', []],
  ['Gold Prosecco Brut', 'Bottega', 'sparkling', ['Glera'], 'Italy', 'Veneto', []],
  ['Prosecco', 'La Marca', 'sparkling', ['Glera'], 'Italy', 'Veneto', []],
  ['Trento Brut', 'Ferrari', 'sparkling', ['Chardonnay'], 'Italy', 'Trentino', []],
  ['\'61 Franciacorta Brut', 'Berlucchi', 'sparkling', ['Chardonnay', 'Pinot Noir'], 'Italy', 'Lombardy', []],
  ['Lambrusco Grasparossa', 'Cavicchioli', 'sparkling', ['Lambrusco'], 'Italy', 'Emilia-Romagna', []],
  ['Crémant d\'Alsace Brut', 'Wolfberger', 'sparkling', ['Pinot Blanc', 'Auxerrois', 'Pinot Noir'], 'France', 'Alsace', []],
  ['Saumur Brut', 'Bouvet-Ladubay', 'sparkling', ['Chenin Blanc', 'Chardonnay'], 'France', 'Loire', []],
  ['Crémant de Bourgogne Perle d\'Ivoire', 'Louis Bouillot', 'sparkling', ['Pinot Noir', 'Chardonnay'], 'France', 'Burgundy', []],
  ['Trocken', 'Henkell', 'sparkling', [], 'Germany', '', []],
  ['Sekt Trocken', 'Rotkäppchen', 'sparkling', [], 'Germany', '', []],
  ['Brut NV', 'Graham Beck', 'sparkling', ['Chardonnay', 'Pinot Noir'], 'South Africa', 'Western Cape', []],
  ['Brut', 'Chandon', 'sparkling', ['Chardonnay', 'Pinot Noir'], 'Argentina', 'Mendoza', []],
  ['Pelorus', 'Cloudy Bay', 'sparkling', ['Chardonnay', 'Pinot Noir'], 'New Zealand', 'Marlborough', []],

  // ── Red: France ──
  ['Rouge', 'Mouton Cadet', 'red', ['Merlot', 'Cabernet Sauvignon', 'Cabernet Franc'], 'France', 'Bordeaux', []],
  ['Côtes du Rhône Rouge', 'E. Guigal', 'red', ['Syrah', 'Grenache', 'Mourvèdre'], 'France', 'Rhône', []],
  ['Châteauneuf-du-Pape', 'E. Guigal', 'red', ['Grenache', 'Syrah', 'Mourvèdre'], 'France', 'Rhône', []],
  ['Côtes du Rhône Belleruche', 'M. Chapoutier', 'red', ['Grenache', 'Syrah'], 'France', 'Rhône', []],
  ['Crozes-Hermitage Les Meysonniers', 'M. Chapoutier', 'red', ['Syrah'], 'France', 'Rhône', []],
  ['Côtes du Rhône Parallèle 45', 'Paul Jaboulet Aîné', 'red', ['Grenache', 'Syrah'], 'France', 'Rhône', []],
  ['Beaujolais-Villages', 'Georges Duboeuf', 'red', ['Gamay'], 'France', 'Beaujolais', []],
  ['Fleurie', 'Georges Duboeuf', 'red', ['Gamay'], 'France', 'Beaujolais', []],
  ['Bourgogne Pinot Noir Couvent des Jacobins', 'Louis Jadot', 'red', ['Pinot Noir'], 'France', 'Burgundy', []],
  ['Laforêt Bourgogne Pinot Noir', 'Joseph Drouhin', 'red', ['Pinot Noir'], 'France', 'Burgundy', []],
  ['Cabernet Sauvignon', 'Les Jamelles', 'red', ['Cabernet Sauvignon'], 'France', 'Languedoc', []],
  ['Malbec', 'Château du Cèdre', 'red', ['Malbec'], 'France', 'Cahors', []],

  // ── Red: Italy ──
  ['Campofiorin', 'Masi', 'red', ['Corvina', 'Rondinella', 'Molinara'], 'Italy', 'Veneto', []],
  ['Ripassa Valpolicella Superiore', 'Zenato', 'red', ['Corvina', 'Rondinella'], 'Italy', 'Veneto', []],
  ['Amarone della Valpolicella Classico', 'Tommasi', 'red', ['Corvina', 'Rondinella', 'Molinara'], 'Italy', 'Veneto', []],
  ['Chianti Classico Riserva Ducale', 'Ruffino', 'red', ['Sangiovese'], 'Italy', 'Tuscany', []],
  ['Peppoli Chianti Classico', 'Antinori', 'red', ['Sangiovese'], 'Italy', 'Tuscany', []],
  ['Tignanello', 'Antinori', 'red', ['Sangiovese', 'Cabernet Sauvignon', 'Cabernet Franc'], 'Italy', 'Tuscany', []],
  ['Il Bruciato', 'Tenuta Guado al Tasso', 'red', ['Cabernet Sauvignon', 'Merlot', 'Syrah'], 'Italy', 'Bolgheri', []],
  ['Brunello di Montalcino', 'Banfi', 'red', ['Sangiovese'], 'Italy', 'Tuscany', []],
  ['Rosso di Montalcino', 'Banfi', 'red', ['Sangiovese'], 'Italy', 'Tuscany', []],
  ['Barolo', 'Fontanafredda', 'red', ['Nebbiolo'], 'Italy', 'Piedmont', []],
  ['Barbera d\'Asti Le Orme', 'Michele Chiarlo', 'red', ['Barbera'], 'Italy', 'Piedmont', []],
  ['Sessantanni Primitivo di Manduria', 'San Marzano', 'red', ['Primitivo'], 'Italy', 'Puglia', []],
  ['Il Pumo Primitivo', 'San Marzano', 'red', ['Primitivo'], 'Italy', 'Puglia', []],
  ['Nero d\'Avola', 'Cusumano', 'red', ['Nero d\'Avola'], 'Italy', 'Sicily', []],
  ['Casale Vecchio Montepulciano d\'Abruzzo', 'Farnese', 'red', ['Montepulciano'], 'Italy', 'Abruzzo', []],

  // ── Red: Spain & Portugal ──
  ['Rioja Crianza', 'Campo Viejo', 'red', ['Tempranillo', 'Garnacha', 'Mazuelo'], 'Spain', 'Rioja', []],
  ['Rioja Reserva', 'Campo Viejo', 'red', ['Tempranillo', 'Graciano', 'Mazuelo'], 'Spain', 'Rioja', []],
  ['Faustino I Gran Reserva', 'Faustino', 'red', ['Tempranillo', 'Graciano', 'Mazuelo'], 'Spain', 'Rioja', []],
  ['Rioja Reserva', 'Marqués de Riscal', 'red', ['Tempranillo'], 'Spain', 'Rioja', []],
  ['Rioja Crianza', 'Marqués de Cáceres', 'red', ['Tempranillo'], 'Spain', 'Rioja', []],
  ['Rioja Reserva', 'Muga', 'red', ['Tempranillo', 'Garnacha', 'Mazuelo', 'Graciano'], 'Spain', 'Rioja', []],
  ['Rioja Crianza', 'CVNE', 'red', ['Tempranillo'], 'Spain', 'Rioja', []],
  ['Rioja Crianza', 'Ramón Bilbao', 'red', ['Tempranillo'], 'Spain', 'Rioja', []],
  ['Viña Pomal Reserva', 'Bodegas Bilbaínas', 'red', ['Tempranillo'], 'Spain', 'Rioja', []],
  ['Roble', 'Protos', 'red', ['Tempranillo'], 'Spain', 'Ribera del Duero', []],
  ['Tinto Selección', 'Borsao', 'red', ['Garnacha'], 'Spain', 'Campo de Borja', []],
  ['Atteca Garnacha', 'Bodegas Ateca', 'red', ['Garnacha'], 'Spain', 'Calatayud', []],
  ['Coronas Tempranillo', 'Torres', 'red', ['Tempranillo'], 'Spain', 'Catalonia', []],
  ['4 Meses Monastrell', 'Juan Gil', 'red', ['Monastrell'], 'Spain', 'Jumilla', []],
  ['Reserva Tinto', 'Esporão', 'red', ['Aragonez', 'Trincadeira', 'Cabernet Sauvignon', 'Alicante Bouschet'], 'Portugal', 'Alentejo', []],
  ['Papa Figos Tinto', 'Casa Ferreirinha', 'red', ['Touriga Nacional', 'Touriga Franca', 'Tinta Roriz'], 'Portugal', 'Douro', []],

  // ── Red: rest of Europe & Lebanon ──
  ['Zweigelt Selection', 'Lenz Moser', 'red', ['Zweigelt'], 'Austria', '', []],
  ['Château Musar Rouge', 'Château Musar', 'red', ['Cabernet Sauvignon', 'Cinsault', 'Carignan'], 'Lebanon', 'Bekaa Valley', []],
  ['Réserve du Couvent', 'Château Ksara', 'red', ['Syrah', 'Cabernet Sauvignon', 'Cabernet Franc'], 'Lebanon', 'Bekaa Valley', []],

  // ── Red: South America ──
  ['Merlot Reserva', 'Casillero del Diablo', 'red', ['Merlot'], 'Chile', '', []],
  ['Carménère Reserva', 'Casillero del Diablo', 'red', ['Carménère'], 'Chile', '', []],
  ['Pinot Noir Reserva', 'Casillero del Diablo', 'red', ['Pinot Noir'], 'Chile', '', []],
  ['Marques de Casa Concha Cabernet Sauvignon', 'Concha y Toro', 'red', ['Cabernet Sauvignon'], 'Chile', 'Maipo', []],
  ['120 Cabernet Sauvignon', 'Santa Rita', 'red', ['Cabernet Sauvignon'], 'Chile', 'Central Valley', []],
  ['Bicicleta Pinot Noir', 'Cono Sur', 'red', ['Pinot Noir'], 'Chile', '', []],
  ['Alpha Cabernet Sauvignon', 'Montes', 'red', ['Cabernet Sauvignon'], 'Chile', 'Colchagua', []],
  ['Max Cabernet Sauvignon', 'Errázuriz', 'red', ['Cabernet Sauvignon'], 'Chile', 'Aconcagua', []],
  ['Cabernet Sauvignon', 'Gato Negro', 'red', ['Cabernet Sauvignon'], 'Chile', 'Central Valley', []],
  ['Malbec', 'Catena', 'red', ['Malbec'], 'Argentina', 'Mendoza', []],
  ['Reserve Malbec', 'Trivento', 'red', ['Malbec'], 'Argentina', 'Mendoza', []],
  ['Oak Cask Malbec', 'Trapiche', 'red', ['Malbec'], 'Argentina', 'Mendoza', []],
  ['Malbec', 'Norton', 'red', ['Malbec'], 'Argentina', 'Mendoza', []],
  ['Serie A Malbec', 'Zuccardi', 'red', ['Malbec'], 'Argentina', 'Mendoza', []],
  ['Don David Malbec Reserve', 'El Esteco', 'red', ['Malbec'], 'Argentina', 'Salta', []],

  // ── Red: South Africa ──
  ['Kadette Cape Blend', 'Kanonkop', 'red', ['Pinotage', 'Cabernet Sauvignon', 'Merlot', 'Cabernet Franc'], 'South Africa', 'Stellenbosch', []],
  ['Pinotage', 'Beyerskloof', 'red', ['Pinotage'], 'South Africa', 'Stellenbosch', []],
  ['Porcupine Ridge Syrah', 'Boekenhoutskloof', 'red', ['Syrah'], 'South Africa', 'Swartland', []],
  ['The Chocolate Block', 'Boekenhoutskloof', 'red', ['Syrah', 'Grenache', 'Cinsault', 'Cabernet Sauvignon', 'Viognier'], 'South Africa', 'Western Cape', []],
  ['Goats do Roam Red', 'Fairview', 'red', ['Syrah', 'Grenache', 'Mourvèdre'], 'South Africa', 'Western Cape', []],
  ['The Winemasters Cabernet Sauvignon', 'Nederburg', 'red', ['Cabernet Sauvignon'], 'South Africa', 'Western Cape', []],

  // ── Red: Australia, New Zealand, USA ──
  ['Shiraz Cabernet', 'Jacob\'s Creek', 'red', ['Shiraz', 'Cabernet Sauvignon'], 'Australia', 'South Australia', []],
  ['Shiraz', 'Yellow Tail', 'red', ['Shiraz'], 'Australia', 'South Eastern Australia', []],
  ['Koonunga Hill Shiraz Cabernet', 'Penfolds', 'red', ['Shiraz', 'Cabernet Sauvignon'], 'Australia', 'South Australia', []],
  ['Yellow Label Cabernet Sauvignon', 'Wolf Blass', 'red', ['Cabernet Sauvignon'], 'Australia', 'South Australia', []],
  ['Red Blend', '19 Crimes', 'red', ['Shiraz', 'Cabernet Sauvignon'], 'Australia', '', []],
  ['Private Bin Pinot Noir', 'Villa Maria', 'red', ['Pinot Noir'], 'New Zealand', 'Marlborough', []],
  ['Pinot Noir', 'Cloudy Bay', 'red', ['Pinot Noir'], 'New Zealand', 'Marlborough', []],
  ['Apothic Red', 'Apothic', 'red', ['Zinfandel', 'Merlot', 'Syrah', 'Cabernet Sauvignon'], 'United States', 'California', []],
  ['Merlot', 'Barefoot', 'red', ['Merlot'], 'United States', 'California', []],
  ['Private Selection Cabernet Sauvignon', 'Robert Mondavi', 'red', ['Cabernet Sauvignon'], 'United States', 'California', []],
  ['Founders\' Estate Cabernet Sauvignon', 'Beringer', 'red', ['Cabernet Sauvignon'], 'United States', 'California', []],
  ['Lodi Old Vine Zinfandel', 'Ravenswood', 'red', ['Zinfandel'], 'United States', 'California', []],
  ['Pinot Noir', 'Meiomi', 'red', ['Pinot Noir'], 'United States', 'California', []],

  // ── White: France ──
  ['Chablis', 'Louis Jadot', 'white', ['Chardonnay'], 'France', 'Burgundy', []],
  ['Mâcon-Villages', 'Louis Jadot', 'white', ['Chardonnay'], 'France', 'Burgundy', []],
  ['Chablis La Pierrelée', 'La Chablisienne', 'white', ['Chardonnay'], 'France', 'Burgundy', []],
  ['Pouilly-Fumé', 'de Ladoucette', 'white', ['Sauvignon Blanc'], 'France', 'Loire', []],
  ['Sancerre Les Baronnes', 'Henri Bourgeois', 'white', ['Sauvignon Blanc'], 'France', 'Loire', []],
  ['Vouvray', 'Marc Brédif', 'white', ['Chenin Blanc'], 'France', 'Loire', []],
  ['Riesling', 'Trimbach', 'white', ['Riesling'], 'France', 'Alsace', []],
  ['Pinot Blanc', 'Trimbach', 'white', ['Pinot Blanc'], 'France', 'Alsace', []],
  ['Gewurztraminer Classic', 'Hugel', 'white', ['Gewürztraminer'], 'France', 'Alsace', []],
  ['Picpoul de Pinet Duc de Morny', 'Cave de l\'Ormarine', 'white', ['Picpoul'], 'France', 'Languedoc', []],
  ['Classic Côtes de Gascogne', 'Domaine du Tariquet', 'white', ['Ugni Blanc', 'Colombard'], 'France', 'Gascogne', []],
  ['Blanc', 'Mouton Cadet', 'white', ['Sauvignon Blanc', 'Sémillon', 'Muscadelle'], 'France', 'Bordeaux', []],
  ['Condrieu', 'E. Guigal', 'white', ['Viognier'], 'France', 'Rhône', []],

  // ── White: Germany, Austria, Netherlands ──
  ['Dr. L Riesling', 'Dr. Loosen', 'white', ['Riesling'], 'Germany', 'Mosel', []],
  ['Eins Zwei Dry Riesling', 'Leitz', 'white', ['Riesling'], 'Germany', 'Rheingau', []],
  ['Grüner Veltliner Federspiel Terrassen', 'Domäne Wachau', 'white', ['Grüner Veltliner'], 'Austria', 'Wachau', []],
  ['Grüner Veltliner Kamptal Terrassen', 'Bründlmayer', 'white', ['Grüner Veltliner'], 'Austria', 'Kamptal', []],
  ['Riesling', 'Apostelhoeve', 'white', ['Riesling'], 'Netherlands', 'Limburg', []],

  // ── White: Italy ──
  ['Pinot Grigio', 'Santa Margherita', 'white', ['Pinot Grigio'], 'Italy', 'Alto Adige', []],
  ['Soave Classico', 'Pieropan', 'white', ['Garganega'], 'Italy', 'Veneto', []],
  ['Gavi Le Marne', 'Michele Chiarlo', 'white', ['Cortese'], 'Italy', 'Piedmont', []],
  ['Casal di Serra Verdicchio', 'Umani Ronchi', 'white', ['Verdicchio'], 'Italy', 'Marche', []],
  ['Costamolino Vermentino', 'Argiolas', 'white', ['Vermentino'], 'Italy', 'Sardinia', []],
  ['Lugana San Benedetto', 'Zenato', 'white', ['Trebbiano di Lugana'], 'Italy', 'Lombardy', []],
  ['Fiano di Avellino', 'Feudi di San Gregorio', 'white', ['Fiano'], 'Italy', 'Campania', []],
  ['Grillo', 'Cusumano', 'white', ['Grillo'], 'Italy', 'Sicily', []],
  ['Gewürztraminer', 'Cantina Tramin', 'white', ['Gewürztraminer'], 'Italy', 'Alto Adige', []],

  // ── White: Spain & Portugal ──
  ['Rueda Verdejo', 'Marqués de Riscal', 'white', ['Verdejo'], 'Spain', 'Rueda', []],
  ['Albariño', 'Martín Códax', 'white', ['Albariño'], 'Spain', 'Rías Baixas', []],
  ['Albariño', 'Pazo de Señorans', 'white', ['Albariño'], 'Spain', 'Rías Baixas', []],
  ['Viña Sol', 'Torres', 'white', ['Parellada'], 'Spain', 'Catalonia', []],
  ['Rioja Blanco', 'Marqués de Cáceres', 'white', ['Viura'], 'Spain', 'Rioja', []],
  ['Louro Godello', 'Rafael Palacios', 'white', ['Godello'], 'Spain', 'Valdeorras', []],
  ['Vinho Verde', 'Casal Garcia', 'white', ['Loureiro', 'Trajadura', 'Arinto'], 'Portugal', 'Vinho Verde', []],
  ['Vinho Verde', 'Gazela', 'white', ['Loureiro', 'Trajadura', 'Arinto'], 'Portugal', 'Vinho Verde', []],

  // ── White: New World ──
  ['Sauvignon Blanc', 'Cloudy Bay', 'white', ['Sauvignon Blanc'], 'New Zealand', 'Marlborough', []],
  ['Private Bin Sauvignon Blanc', 'Villa Maria', 'white', ['Sauvignon Blanc'], 'New Zealand', 'Marlborough', []],
  ['Sauvignon Blanc', 'Oyster Bay', 'white', ['Sauvignon Blanc'], 'New Zealand', 'Marlborough', []],
  ['Sauvignon Blanc', 'Brancott Estate', 'white', ['Sauvignon Blanc'], 'New Zealand', 'Marlborough', []],
  ['Sauvignon Blanc', 'Kim Crawford', 'white', ['Sauvignon Blanc'], 'New Zealand', 'Marlborough', []],
  ['Old Vine Reserve Chenin Blanc', 'Ken Forrester', 'white', ['Chenin Blanc'], 'South Africa', 'Stellenbosch', []],
  ['Cellar Selection Chenin Blanc', 'Kleine Zalze', 'white', ['Chenin Blanc'], 'South Africa', 'Stellenbosch', []],
  ['Signature Chenin Blanc', 'Spier', 'white', ['Chenin Blanc'], 'South Africa', 'Western Cape', []],
  ['Chardonnay Reserva', 'Casillero del Diablo', 'white', ['Chardonnay'], 'Chile', '', []],
  ['Sauvignon Blanc Reserva', 'Casillero del Diablo', 'white', ['Sauvignon Blanc'], 'Chile', '', []],
  ['Bicicleta Sauvignon Blanc', 'Cono Sur', 'white', ['Sauvignon Blanc'], 'Chile', '', []],
  ['Crios Torrontés', 'Susana Balbo', 'white', ['Torrontés'], 'Argentina', 'Salta', []],
  ['Chardonnay', 'Catena', 'white', ['Chardonnay'], 'Argentina', 'Mendoza', []],
  ['Chardonnay', 'Yellow Tail', 'white', ['Chardonnay'], 'Australia', 'South Eastern Australia', []],
  ['Chardonnay', 'Jacob\'s Creek', 'white', ['Chardonnay'], 'Australia', 'South Australia', []],
  ['Koonunga Hill Chardonnay', 'Penfolds', 'white', ['Chardonnay'], 'Australia', 'South Australia', []],
  ['Vintner\'s Reserve Chardonnay', 'Kendall-Jackson', 'white', ['Chardonnay'], 'United States', 'California', []],
  ['Chardonnay', 'Woodbridge by Robert Mondavi', 'white', ['Chardonnay'], 'United States', 'California', []],

  // ── Rosé ──
  ['Whispering Angel', 'Château d\'Esclans', 'rosé', ['Grenache', 'Cinsault', 'Rolle'], 'France', 'Provence', []],
  ['Rock Angel', 'Château d\'Esclans', 'rosé', ['Grenache', 'Rolle'], 'France', 'Provence', []],
  ['Miraval Rosé', 'Château Miraval', 'rosé', ['Cinsault', 'Grenache', 'Syrah', 'Rolle'], 'France', 'Provence', []],
  ['M de Minuty', 'Château Minuty', 'rosé', ['Grenache', 'Cinsault', 'Syrah'], 'France', 'Provence', []],
  ['AIX Rosé', 'Maison Saint Aix', 'rosé', ['Grenache', 'Cinsault', 'Syrah'], 'France', 'Provence', []],
  ['Côte des Roses Rosé', 'Gérard Bertrand', 'rosé', ['Grenache', 'Cinsault', 'Syrah'], 'France', 'Languedoc', []],
  ['Tavel Rosé', 'E. Guigal', 'rosé', ['Grenache', 'Cinsault'], 'France', 'Rhône', []],
  ['Rosé d\'Anjou', 'Remy Pannier', 'rosé', ['Grolleau', 'Gamay'], 'France', 'Loire', []],
  ['Rioja Rosado', 'Marqués de Cáceres', 'rosé', ['Tempranillo', 'Garnacha'], 'Spain', 'Rioja', []],
  ['Mateus Rosé', 'Mateus', 'rosé', ['Baga', 'Rufete', 'Touriga Franca'], 'Portugal', '', []],
  ['White Zinfandel', 'Beringer', 'rosé', ['Zinfandel'], 'United States', 'California', []],

  // ── Orange ──
  ['Rkatsiteli', 'Pheasant\'s Tears', 'orange', ['Rkatsiteli'], 'Georgia', 'Kakheti', []],
  ['Ribolla Gialla', 'Gravner', 'orange', ['Ribolla Gialla'], 'Italy', 'Friuli-Venezia Giulia', []],
  ['Ribolla', 'Radikon', 'orange', ['Ribolla Gialla'], 'Italy', 'Friuli-Venezia Giulia', []],

  // ── Dessert ──
  ['Sauternes', 'Château Suduiraut', 'dessert', ['Sémillon', 'Sauvignon Blanc'], 'France', 'Bordeaux', []],
  ['Muscat de Beaumes-de-Venise', 'Domaine de Durban', 'dessert', ['Muscat'], 'France', 'Rhône', []],
  ['Tokaji Aszú 5 Puttonyos', 'Royal Tokaji', 'dessert', ['Furmint', 'Hárslevelű'], 'Hungary', 'Tokaj', []],
  ['Vidal Icewine', 'Inniskillin', 'dessert', ['Vidal'], 'Canada', 'Niagara Peninsula', []],

  // ── Fortified ──
  ['Late Bottled Vintage Port', 'Taylor\'s', 'fortified', ['Touriga Nacional', 'Touriga Franca'], 'Portugal', 'Douro', []],
  ['Chip Dry White Port', 'Taylor\'s', 'fortified', [], 'Portugal', 'Douro', []],
  ['Six Grapes Reserve Port', 'Graham\'s', 'fortified', [], 'Portugal', 'Douro', []],
  ['10 Year Old Tawny Port', 'Graham\'s', 'fortified', [], 'Portugal', 'Douro', []],
  ['Founders Reserve Ruby Port', 'Sandeman', 'fortified', [], 'Portugal', 'Douro', []],
  ['Tío Pepe Fino', 'González Byass', 'fortified', ['Palomino'], 'Spain', 'Jerez', []],
  ['Bristol Cream', 'Harveys', 'fortified', ['Palomino', 'Pedro Ximénez'], 'Spain', 'Jerez', []],
  ['Pedro Ximénez San Emilio', 'Lustau', 'fortified', ['Pedro Ximénez'], 'Spain', 'Jerez', []],
  ['5 Year Old Malmsey Madeira', 'Blandy\'s', 'fortified', ['Malvasia'], 'Portugal', 'Madeira', []],
]

const fromRows: Wine[] = ROWS.map(([name, producer, type, grapes, country, region, storeIds]) => ({
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

const known = new Set(fromRows.map((w) => w.id))
const fromOff: Wine[] = OFF_WINES.map((o) => ({
  id: `cat-off-${o.code}`, name: o.name, producer: o.producer, type: o.type, grapes: [], country: o.country, region: o.region,
  photos: [], storeIds: [], ratingSum: 0, ratingCount: 0, createdBy: 'catalog', source: 'catalog' as const,
}))

export const SEED_WINES: Wine[] = [...fromRows, ...fromOff.filter((w) => !known.has(w.id))].map((w) => {
  const off = OFF_WINES.find((o) => `cat-off-${o.code}` === w.id)
  const photo = BOTTLE_PHOTOS[w.id]?.src ?? off?.photo
  return photo ? { ...w, photos: [photo] } : w
})

/** Open Food Facts product page for a catalogue photo, for the licence credit. */
export function photoCredit(wineId: string): string | null {
  const code = BOTTLE_PHOTOS[wineId]?.code ?? (wineId.startsWith('cat-off-') ? wineId.slice(8) : null)
  return code ? `https://world.openfoodfacts.org/product/${code}` : null
}
