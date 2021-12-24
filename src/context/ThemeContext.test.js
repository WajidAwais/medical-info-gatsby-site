import { changeOrderCount, mergeOrders } from './ThemeContext'

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

describe('changeOrderCount', () => {
  const orders = [
    { id: 'a', count: 2 },
    { id: 'b', count: 1 },
  ]

  it('changes only the targeted line and keeps the input intact', () => {
    expect(changeOrderCount(orders, 'a', 1)).toEqual([
      { id: 'a', count: 3 },
      { id: 'b', count: 1 },
    ])
    expect(orders[0].count).toBe(2)
  })

  it('removes a line once its count drops below one', () => {
    expect(changeOrderCount(orders, 'b', -1)).toEqual([{ id: 'a', count: 2 }])
  })
})
