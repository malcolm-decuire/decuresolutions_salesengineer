import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Malcolm Decuire: GTM SE',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://github.githubassets.com" />
        <link rel="stylesheet" href="https://github.githubassets.com/static/fonts/mona-sans.css" />
      </head>
      <body>{children}</body>
    </html>
  )
}
