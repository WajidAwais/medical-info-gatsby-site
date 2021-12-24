import React, { useState } from 'react'
import { useTheme } from '../../hooks/useTheme'
import { FaPlus, FaMinus } from 'react-icons/fa'
import { GrClose } from 'react-icons/gr'
import { prepareTranslations } from '../../utils/prepareTranslations'
import { changeOrderCount } from '../../context/ThemeContext'

const Quantity = ({ count, id }) => {
  const { state, actions } = useTheme()
  const [showBanner, setShowBanner] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  let translatedItemCheckout = ''
  if (state.translations.length) {
    let key = 'Checkout'
    translatedItemCheckout = prepareTranslations(state.translations, key)
  }

  const flashBanner = () => {
    setShowBanner(true)
    setTimeout(() => {
      setShowBanner(false)
    }, 3000)
  }

  const updateCount = (delta) => {
    const order = state.orders.find((item) => item.id === id)
    setSelectedOrder(order)
    actions.changeOrders(changeOrderCount(state.orders, id, delta))
    // Going below one removes the line, so there is nothing left to flash.
    if (count + delta > 0) flashBanner()
  }

  return (
    <div className="quantity">
      {showBanner && (
        <div className=" order-banner">
          <span>
            &ldquo;{selectedOrder?.title}&rdquo;{' '}
            {translatedItemCheckout?.QuantityUpdated
              ? translatedItemCheckout?.QuantityUpdated
              : ' quantity has been updated'}
          </span>
          <button
            onClick={() => {
              setShowBanner(false)
            }}
            className="btn"
          >
            <GrClose />
          </button>
        </div>
      )}
      <div className="quantity__controls">
        <button className="quantity__btn" onClick={() => updateCount(-1)}>
          <FaMinus />
        </button>
        <div className="quantity__count">{count}</div>
        <button className="quantity__btn" onClick={() => updateCount(1)}>
          <FaPlus />
        </button>
      </div>
    </div>
  )
}

export default Quantity
