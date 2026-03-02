
import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HealthLink Pharmacy',
    short_name: 'HealthLink',
    description: 'Professional Healthcare Solutions & Medicine Delivery',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0056b3',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
