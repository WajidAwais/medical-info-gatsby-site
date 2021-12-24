import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import ClientSearch from '.'

const engine = {
  indexStrategy: 'Prefix match',
  searchSanitizer: 'Lower Case',
  SearchByTerm: true,
}

const translation = {
  Title: 'Search',
  Placeholder: 'Search the site',
  Results: 'Results',
  Of: 'of',
  For: 'for',
  Notfound: 'Nothing found',
}

const data = [
  {
    id: '1',
    name: 'Resources',
    title: 'Visit guide',
    body: 'Prepare for the appointment',
    url: '/resources',
  },
  {
    id: '2',
    name: 'Home',
    title: 'Welcome',
    body: 'Symptom diary tips',
    url: '/',
  },
]

describe('ClientSearch', () => {
  it('finds documents by prefix and links to their page', () => {
    render(
      <ClientSearch data={data} engine={engine} translation={translation} />
    )
    fireEvent.change(screen.getByPlaceholderText('Search the site'), {
      target: { value: 'diar' },
    })
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute(
      'href',
      '/'
    )
    expect(
      screen.queryByRole('link', { name: 'Resources' })
    ).not.toBeInTheDocument()
  })

  it('says when nothing matches', () => {
    render(
      <ClientSearch data={data} engine={engine} translation={translation} />
    )
    fireEvent.change(screen.getByPlaceholderText('Search the site'), {
      target: { value: 'zebra' },
    })
    expect(screen.getByText('Nothing found')).toBeInTheDocument()
  })
})
