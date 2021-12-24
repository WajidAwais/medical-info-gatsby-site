import { mergeOrders } from './ThemeContext'

describe('mergeOrders', () => {
  it('bumps the count when the same resource is added again', () => {
    const first = { id: 'guide', title: 'Guide' }
    const merged = mergeOrders([{ ...first, count: 2 }, first])
    expect(merged).toEqual([{ id: 'guide', title: 'Guide', count: 3 }])
  })

  it('does not mutate the orders it is given', () => {
    const orders = [{ id: 'a', count: 1 }, { id: 'a' }]
    mergeOrders(orders)
    expect(orders).toEqual([{ id: 'a', count: 1 }, { id: 'a' }])
  })
})
