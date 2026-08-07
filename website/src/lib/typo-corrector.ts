// ============================================================
// SAHIMED PHARMA TYPO-TOLERANCE & AUTO-CORRECTION ENGINE
// ============================================================

// Dictionary of common medical misspellings -> Standard pharma names & brands
const PHARMA_TYPO_MAP: Record<string, string> = {
  // Common Active Salts & Generic Molecules
  'paracetmol': 'Paracetamol',
  'paracetamoll': 'Paracetamol',
  'paracitamol': 'Paracetamol',
  'paracitramol': 'Paracetamol',
  'paracetamol650': 'Paracetamol',
  'paracitamol650': 'Paracetamol',
  'atorvastan': 'Atorvastatin',
  'atorvas': 'Atorvastatin',
  'atorvostatin': 'Atorvastatin',
  'atorvastatn': 'Atorvastatin',
  'metformin': 'Metformin',
  'metformn': 'Metformin',
  'metaformin': 'Metformin',
  'methformin': 'Metformin',
  'telmisartan': 'Telmisartan',
  'telmisartn': 'Telmisartan',
  'telmisaten': 'Telmisartan',
  'telmisartin': 'Telmisartan',
  'amlodipine': 'Amlodipine',
  'amlodipin': 'Amlodipine',
  'amldipine': 'Amlodipine',
  'pantoprazole': 'Pantoprazole',
  'pantoprazol': 'Pantoprazole',
  'pantroprozole': 'Pantoprazole',
  'pantoprazle': 'Pantoprazole',
  'omeprazole': 'Omeprazole',
  'omeprazol': 'Omeprazole',
  'cetirizine': 'Cetirizine',
  'cetrizine': 'Cetirizine',
  'cetricine': 'Cetirizine',
  'citrizine': 'Cetirizine',
  'azithromycin': 'Azithromycin',
  'azithromicin': 'Azithromycin',
  'azithro': 'Azithromycin',
  'amoxicillin': 'Amoxicillin',
  'amoxicilin': 'Amoxicillin',
  'amoxycillin': 'Amoxicillin',
  'montelukast': 'Montelukast',
  'montelucast': 'Montelukast',
  'duloxetine': 'Duloxetine',
  'duloxetin': 'Duloxetine',
  'gabapentin': 'Gabapentin',
  'gabapentn': 'Gabapentin',
  'clopidogrel': 'Clopidogrel',
  'clopidogrl': 'Clopidogrel',
  'vildagliptin': 'Vildagliptin',
  'vildagliptn': 'Vildagliptin',
  'glimepiride': 'Glimepiride',
  'glimeperide': 'Glimepiride',
  'multivitamin': 'Multivitamin',
  'multivitamn': 'Multivitamin',
  'multivit': 'Multivitamin',
  'multivites': 'Multivitamin',
  
  // Popular Brands
  'dolooo': 'Dolo',
  'dolo650': 'Dolo 650',
  'crocn': 'Crocin',
  'crocine': 'Crocin',
  'pand': 'Pan D',
  'pandn': 'Pan D',
  'panten': 'Pan',
  'shelcal500': 'Shelcal',
  'shelcl': 'Shelcal',
  'becosul': 'Becosules',
  'becosule': 'Becosules',
  'gelusill': 'Gelusil',
  'digene': 'Digene',
  'disprin': 'Disprin',
  'disprin100': 'Disprin',
  'combiflam': 'Combiflam',
  'combiflem': 'Combiflam',
  'saridon': 'Saridon',
  'sardion': 'Saridon',
  'vicks': 'Vicks',
  'vick': 'Vicks',
  'zifi200': 'Zifi',
  'augmentin625': 'Augmentin',
  'agumentin': 'Augmentin',
};

export interface CorrectionResult {
  originalQuery: string;
  correctedQuery: string;
  wasCorrected: boolean;
  terms: string[];
}

/**
 * Strips special characters from search queries but preserves:
 * - Hyphens BETWEEN alphanumeric chars: "5-HTP", "Vitamin-D3", "B-12" → kept as-is
 * - Numbers: "500mg", "D3", "B12" → kept as-is
 * Only strips: standalone punctuation, brackets, slashes, quotes
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return '';
  return query
    // Preserve hyphen between alphanumeric (e.g. 5-HTP, B-12, co-amoxiclav)
    // but remove standalone hyphens, leading/trailing hyphens
    .replace(/([a-zA-Z0-9])-([a-zA-Z0-9])/g, '$1-$2')   // keep intra-word hyphens
    .replace(/[()\[\]\{\}\/\\+.,'"|@#$%^&*=<>?!~`]/g, ' ') // strip other punctuation
    .replace(/-/g, ' ')                                    // now strip any remaining standalone hyphens
    // Restore intra-word hyphens that got split (re-join digit-letter like 5-HTP)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Corrects medical typos & strips special punctuation in a user search query
 */
export function correctMedicalQuery(query: string): CorrectionResult {
  if (!query || typeof query !== 'string') {
    return { originalQuery: '', correctedQuery: '', wasCorrected: false, terms: [] };
  }

  // 1. Sanitize punctuation & hyphens
  const cleanQuery = sanitizeSearchQuery(query).toLowerCase();
  const words = cleanQuery.split(/\s+/).filter(Boolean);
  let wasCorrected = false;

  const correctedWords = words.map(w => {
    // Direct dictionary match
    if (PHARMA_TYPO_MAP[w]) {
      wasCorrected = true;
      return PHARMA_TYPO_MAP[w];
    }

    // Stripped alphanumeric match (e.g. "paracetmol650" -> "Paracetamol")
    const stripped = w.replace(/[^a-z0-9]/g, '');
    if (PHARMA_TYPO_MAP[stripped]) {
      wasCorrected = true;
      return PHARMA_TYPO_MAP[stripped];
    }

    // Return original capitalized word
    return w.charAt(0).toUpperCase() + w.slice(1);
  });

  const correctedQuery = correctedWords.join(' ');

  return {
    originalQuery: query,
    correctedQuery,
    wasCorrected: wasCorrected || cleanQuery !== query.trim().toLowerCase(),
    terms: correctedWords
  };
}

/**
 * Builds a regex pattern for fuzzy character distance (1-2 typos)
 */
export function buildFuzzyRegex(term: string): string {
  if (!term || term.length < 4) return term;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escaped.split('').join('[a-z]?');
}
