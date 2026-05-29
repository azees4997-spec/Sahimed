import { Metadata } from 'next';
import PrescriptionClient from './PrescriptionClient';

export const metadata: Metadata = {
  title: 'Upload Prescription & Order Medicines Online | SahiMed',
  description: 'Upload your medical prescription to order authentic medicines online. Our certified pharmacists will verify and digitize your order for doorstep delivery on SahiMed.',
  alternates: {
    canonical: 'https://sahimed.com/prescription',
  },
};

export default function PrescriptionPage() {
  return <PrescriptionClient />;
}
