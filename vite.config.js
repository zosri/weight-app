import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// ΑΛΛΑΞΕ ΑΥΤΟ στο όνομα του repository σου στο GitHub.
// Αν το repo λέγεται "weight-app", άφησέ το ως έχει.
const REPO = 'weight-app'

export default defineConfig({
  base: `/${REPO}/`,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',   // το κινητό παίρνει μόνο του κάθε νέα έκδοση
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Βάρος και ενέργεια',
        short_name: 'Βάρος',
        description: 'Παρακολούθηση βάρους και εκτίμηση θερμίδων',
        lang: 'el',
        start_url: `/${REPO}/`,
        scope: `/${REPO}/`,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#E7EDF0',
        theme_color: '#16232E',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
})
