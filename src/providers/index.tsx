import React from 'react'

import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'
import { RevenueCatProvider } from './RevenueCat'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <HeaderThemeProvider>
        <RevenueCatProvider>
          {children}
        </RevenueCatProvider>
      </HeaderThemeProvider>
    </ThemeProvider>
  )
}
