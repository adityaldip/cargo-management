import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'

import { Providers } from './providers'

import { WorkflowProvider } from '@/store/workflow-store'
import { FilterProvider } from '@/store/filter-store'
import { Toaster } from '@/components/ui/toaster'

import "@liveblocks/react-ui/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: 'Cargo Assignment',
  description: 'Cargo Assignment',
  generator: 'Cargo Assignment',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Providers>
          <WorkflowProvider>
            <FilterProvider>
              {children}
            </FilterProvider>
          </WorkflowProvider>
        </Providers>

        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
