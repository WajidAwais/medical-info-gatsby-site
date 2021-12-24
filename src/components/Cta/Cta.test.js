import React from 'react'
import { render, screen } from '@testing-library/react'
import Cta from '.'

describe('Cta', () => {
  it('links external URLs directly', () => {
    render(<Cta link="https://example.com/form" text="Open form" />)
    expect(screen.getByRole('link', { name: 'Open form' })).toHaveAttribute(
      'href',
      'https://example.com/form'
    )
  })

  it('builds localised internal links from CMS slugs', () => {
    render(<Cta link="/Resources/" text="Resources" languageCode="de" />)
    expect(screen.getByRole('link', { name: 'Resources' })).toHaveAttribute(
      'href',
      '/de/resources'
    )
  })
})
