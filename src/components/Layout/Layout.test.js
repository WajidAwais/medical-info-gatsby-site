import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import Layout, { languageForPath } from '.'
import { ThemeProvider } from '../../context/ThemeContext'
import { clearDeliveryCache } from '../../utils/delivery'

jest.mock('@kontent-ai/smart-link', () => ({
  initialize: () => ({ destroy: () => {} }),
}))

const languages = [
  { name: 'EN', url: '/', region: 'English' },
  { name: 'DE', url: '/de/', region: 'Deutschland' },
]

describe('languageForPath', () => {
  it('reads the language from the first path segment', () => {
    expect(languageForPath('/de/ressourcen/', languages).name).toBe('DE')
    expect(languageForPath('/resources/', languages).name).toBe('EN')
    expect(languageForPath('/resources/de', languages).name).toBe('EN')
  })
})

describe('Layout', () => {
  beforeEach(() => clearDeliveryCache())

  it('renders page content even when the Delivery API is unreachable', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline'))
    render(
      <ThemeProvider>
        <Layout languageCode="en">
          <main>Page body</main>
        </Layout>
      </ThemeProvider>
    )
    expect(screen.getByText('Page body')).toBeInTheDocument()
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2))
  })
})
