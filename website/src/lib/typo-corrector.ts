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
  'pan-d': 'Pan D',
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
 * Corrects medical typos in a user search query
 */
export function correctMedicalQuery(query: string): CorrectionResult {
  if (!query || typeof query !== 'string') {
    return { originalQuery: '', correctedQuery: '', wasCorrected: false, terms: [] };
  }

  const cleanQuery = query.trim().toLowerCase();
  const words = cleanQuery.split(/\s+/).filter(Boolean);
  let wasCorrected = false;

  const correctedWords = words.map(w => {
    // 1. Direct dictionary match
    if (PHARMA_TYPO_MAP[w]) {
      wasCorrected = true;
      return PHARMA_TYPO_MAP[w];
    }

    // 2. Stripped alphanumeric match (e.g. "paracetmol650" -> "Paracetamol")
    const stripped = w.replace(/[^a-z0-9]/g, '');
    if (PHARMA_TYPO_MAP[stripped]) {
      wasCorrected = true;
      return PHARMA_TYPO_MAP[stripped];
    }

    // 3. Return original capitalized word
    return w.charAt(0).toUpperCase() + w.slice(1);
  });

  const correctedQuery = correctedWords.join(' ');

  return {
    originalQuery: query,
    correctedQuery,
    wasCorrected,
    terms: correctedWords
  };
}

/**
 * Builds a regex pattern for fuzzy character distance (1-2 typos)
 */
export function buildFuzzyRegex(term: string): string {
  if (!term || term.length < 4) return term;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Allow optional single character insertion/deletion between consonants
  return escaped.split('').join('[a-z]?');
}
