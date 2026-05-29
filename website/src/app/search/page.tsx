import { Metadata } from 'next';
import SearchClient from './SearchClient';

export const metadata: Metadata = {
  title: 'Search Medicines & Cheaper Substitutes | SahiMed',
  description: 'Search for prescription and OTC medicines, salts, compositions, and find cheaper generic substitutes to save on your medical bills on SahiMed.',
  alternates: {
    canonical: 'https://sahimed.com/search',
  },
};

export default function SearchPage() {
  return <SearchClient />;
}
