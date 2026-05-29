import { Metadata } from 'next';
import CategoriesClient from './CategoriesClient';

export const metadata: Metadata = {
  title: 'Browse Medicine Categories | SahiMed',
  description: 'Search and browse prescription medicines, OTC drugs, and healthcare products by therapeutic categories on SahiMed.',
  alternates: {
    canonical: 'https://sahimed.com/categories',
  },
};

export default function CategoriesPage() {
  return <CategoriesClient />;
}
