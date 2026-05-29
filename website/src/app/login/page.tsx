import { Metadata } from 'next';
import LoginClient from './LoginClient';

export const metadata: Metadata = {
  title: 'Login or Sign Up | SahiMed - Authentic Pharmacy',
  description: 'Log in or sign up to your SahiMed account to manage your orders, uploads, and health records securely on SahiMed.',
  alternates: {
    canonical: 'https://sahimed.com/login',
  },
};

export default function LoginPage() {
  return <LoginClient />;
}
