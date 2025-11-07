export const metadata = {
  title: 'YouTube SEO Optimizer',
  description: 'Optimize your YouTube video titles, descriptions, and tags using AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
