import type { Store } from '../lib/types'

/**
 * Starter list of places to buy wine in Rotterdam. Chains have many branches,
 * so they carry no address. Users can add more stores in the app.
 */
export const SEED_STORES: Store[] = [
  { id: 'albert-heijn', name: 'Albert Heijn', kind: 'supermarket', website: 'https://www.ah.nl/producten/wijn-en-bubbels' },
  { id: 'gall-gall', name: 'Gall & Gall', kind: 'chain', website: 'https://www.gall.nl' },
  { id: 'jumbo', name: 'Jumbo', kind: 'supermarket', website: 'https://www.jumbo.com' },
  { id: 'lidl', name: 'Lidl', kind: 'supermarket', website: 'https://www.lidl.nl' },
  { id: 'dirk', name: 'Dirk', kind: 'supermarket', website: 'https://www.dirk.nl' },
  { id: 'grapedistrict-hillegersberg', name: 'Grapedistrict Hillegersberg', kind: 'specialist', address: 'Streksingel 1a', area: 'Hillegersberg', website: 'https://www.grapedistrict.nl' },
  { id: 'grapedistrict-lusthofstraat', name: 'Grapedistrict Lusthofstraat', kind: 'specialist', address: 'Lusthofstraat 68', area: 'Kralingen', website: 'https://www.grapedistrict.nl' },
  { id: 'platenburg', name: 'Wijnkoperij Platenburg', kind: 'specialist', note: 'Wine merchant with its own wine bar, Proef bij Platenburg.' },
  { id: 'de-gouden-ton', name: 'De Gouden Ton', kind: 'specialist' },
  { id: 'wijnwinkel-rotterdam', name: 'Wijnwinkel Rotterdam (Alexanderhoeve)', kind: 'specialist', address: 'Winkelcentrum De Binnenhof', area: 'Ommoord', website: 'https://wijnwinkelrotterdam.nl' },
  { id: 'wijnwerk', name: 'Wijnwerk voor Loirewijn', kind: 'specialist', address: 'Samuel Mullerstraat 6', note: 'Organic and natural wines.' },
  { id: 'wijn-bij-henk', name: 'Wijn bij Henk', kind: 'specialist', address: 'Bergselaan 317A', note: 'Natural wines.' },
  { id: 'puike-wijnen', name: 'Puike Wijnen', kind: 'specialist', note: 'Importer of European wines.' },
]
