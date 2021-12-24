import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import PDFViewer from '.'
import { ThemeContext } from '../../context/ThemeContext'

const modalData = (id, title) => ({
  id,
  codename: id,
  title,
  description: `${title} description`,
  url: '/mock-assets/sample-guide.pdf',
  image: { url: '/mock-assets/cover.svg' },
  price: [{ codename: 'free' }],
})

const renderViewer = (data, orders = []) => {
  const actions = { changeOrders: jest.fn() }
  render(
    <ThemeContext.Provider
      value={{ state: { orders, translations: [] }, actions }}
    >
      <PDFViewer modalData={data} showModal setShowModal={() => {}} />
    </ThemeContext.Provider>
  )
  return actions
}

describe('PDFViewer', () => {
  it('orders the resource that is open, with the chosen quantity', () => {
    const existing = [{ id: 'other', title: 'Other', count: 1 }]
    const actions = renderViewer(
      modalData('visit_guide', 'Visit guide'),
      existing
    )
    fireEvent.click(screen.getByRole('button', { name: '+' }))
    fireEvent.click(screen.getByRole('button', { name: /add to order/i }))
    expect(actions.changeOrders).toHaveBeenCalledWith([
      existing[0],
      expect.objectContaining({
        id: 'visit_guide',
        title: 'Visit guide',
        count: 2,
      }),
    ])
    expect(existing).toHaveLength(1)
  })
})
