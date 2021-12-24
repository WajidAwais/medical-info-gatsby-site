import React, { createContext, useMemo, useReducer } from 'react'

export const ThemeContext = createContext()

// Adding an item that is already in the basket bumps its count instead of
// listing it twice.
export const mergeOrders = (orders) =>
  orders.reduce((merged, order) => {
    const existing = merged.find((item) => item.id === order.id)
    if (existing) {
      existing.count += order.count || 1
    } else {
      merged.push({ ...order, count: order.count || 1 })
    }
    return merged
  }, [])

const persist = (key, value) => {
  if (value) localStorage.setItem(key, JSON.stringify(value))
  else localStorage.removeItem(key)
}

const ThemeReducer = (state, action) => {
  switch (action.type) {
    case 'CHANGE_ORDERS':
      return { ...state, orders: action.payload }
    case 'CHANGE_LANGUAGES':
      return { ...state, languages: action.payload }
    case 'CHANGE_TRANSLATIONS':
      return { ...state, translations: action.payload }
    case 'CHANGE_LANGUAGE':
      return { ...state, language: action.payload }
    default:
      return state
  }
}

export const ThemeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(ThemeReducer, {
    orders: [],
    languages: [],
    translations: [],
    language: null,
  })

  // Stable across renders so effects can depend on them without looping.
  const actions = useMemo(
    () => ({
      changeOrders: (orders) => {
        const merged = mergeOrders(orders)
        persist('orders', merged)
        dispatch({ type: 'CHANGE_ORDERS', payload: merged })
      },
      changeLanguages: (languages) => {
        dispatch({ type: 'CHANGE_LANGUAGES', payload: languages })
      },
      changeTranslations: (translations) => {
        dispatch({ type: 'CHANGE_TRANSLATIONS', payload: translations })
      },
      changeLanguage: (language) => {
        persist('language', language)
        dispatch({ type: 'CHANGE_LANGUAGE', payload: language })
      },
    }),
    []
  )

  const value = useMemo(() => ({ state, actions }), [state, actions])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
