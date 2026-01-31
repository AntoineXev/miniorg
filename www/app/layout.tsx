import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MiniOrg - Votre hub de productivité personnel',
  description: 'Organisez vos tâches, calendrier et rituels quotidiens.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  )
}
