'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function CSPostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
      capture_pageview: false, // We handle pageviews manually if needed, or let it auto capture. Auto capture is usually fine for Next.js if using the provider? 
      // Actually, for Next.js App Router, pageview capture can be tricky with client side navigation.
      // posthog-js automatically captures pageviews for single page apps by default, but we might want to be explicit.
      // Let's stick to defaults or what the user provided + best practices.
    })
  }, [])

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}

