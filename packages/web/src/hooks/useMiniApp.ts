import { useEffect, useState } from 'react'

interface MiniAppUser {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
}

interface SafeAreaInsets {
  top: number
  bottom: number
  left: number
  right: number
}

interface MiniAppState {
  isInMiniApp: boolean
  user: MiniAppUser | null
  platformType: 'web' | 'mobile' | null
  added: boolean
  safeAreaInsets: SafeAreaInsets
  isReady: boolean
}

const DEFAULT_INSETS: SafeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 }

export function useMiniApp(): MiniAppState {
  const [state, setState] = useState<MiniAppState>({
    isInMiniApp: false,
    user: null,
    platformType: null,
    added: false,
    safeAreaInsets: DEFAULT_INSETS,
    isReady: false,
  })

  useEffect(() => {
    async function init() {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk')

        const isInMiniApp = await sdk.isInMiniApp()

        if (isInMiniApp) {
          const context = await sdk.context

          setState({
            isInMiniApp: true,
            user: context?.user ?? null,
            platformType: (context?.client?.platformType as 'web' | 'mobile') ?? null,
            added: context?.client?.added ?? false,
            safeAreaInsets: context?.client?.safeAreaInsets ?? DEFAULT_INSETS,
            isReady: true,
          })
        } else {
          setState(s => ({ ...s, isInMiniApp: false, isReady: true }))
        }

        // Signal to the host that the app is ready to be displayed
        await sdk.actions.ready()
      } catch {
        // Not in a mini app context — proceed normally
        setState(s => ({ ...s, isReady: true }))
      }
    }

    init()
  }, [])

  return state
}
