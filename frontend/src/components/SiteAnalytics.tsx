import { Analytics } from '@vercel/analytics/react'
import { useLocation } from 'react-router'

export default function SiteAnalytics() {
  const { pathname } = useLocation()
  return <Analytics route={pathname} path={pathname} />
}
