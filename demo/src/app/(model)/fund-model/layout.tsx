import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Investment Fund Model | Decure Solutions',
  description: 'Mobile-first institutional real estate investment fund modeling workspace.',
}

export default function FundModelLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <main className="min-h-dvh bg-[#f7f5f7] text-mauve-950">{children}</main>
}
