
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SahiMed - Sahi Dawai, Sahi Daam Pe',
    short_name: 'SahiMed',
    description: 'SahiMed - Healthcare Pharmacy. Sahi Dawai, Sahi Daam Pe.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#7C3AED',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
