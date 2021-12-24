import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import Quantity from './Quantity'
import { ThemeContext } from '../../context/ThemeContext'

const renderQuantity = (orders, count) => {
  const actions = { changeOrders: jest.fn() }
  render(
    <ThemeContext.Provider
      value={{ state: { orders, translations: [] }, actions }}
    >
      <Quantity id="guide" count={count} />
    </ThemeContext.Provider>
  )
  return actions
}

describe('Quantity', () => {
  it('removes the line when the last copy is taken away', () => {
    const actions = renderQuantity(
      [{ id: 'guide', title: 'Guide', count: 1 }],
      1
    )
    fireEvent.click(screen.getAllByRole('button')[0])
    expect(actions.changeOrders).toHaveBeenCalledWith([])
  })

  it('increments without mutating the current orders', () => {
    const orders = [{ id: 'guide', title: 'Guide', count: 1 }]
    const actions = renderQuantity(orders, 1)
    fireEvent.click(screen.getAllByRole('button')[1])
    expect(actions.changeOrders).toHaveBeenCalledWith([
      { id: 'guide', title: 'Guide', count: 2 },
    ])
    expect(orders[0].count).toBe(1)
  })
})
