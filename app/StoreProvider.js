'use client'
import { useEffect, useRef } from 'react'
import { Provider } from 'react-redux'
import { makeStore } from '../lib/store'
import { productDummyData } from '@/assets/assets'
import { setProduct } from '@/lib/features/product/productSlice'

export default function StoreProvider({ children }) {
  const storeRef = useRef(undefined)
  if (!storeRef.current) {
    // Create the store instance the first time this renders
    storeRef.current = makeStore()
  }

  useEffect(() => {
    try {
      const savedProducts = JSON.parse(localStorage.getItem('gocart_products') || '[]')
      if (!Array.isArray(savedProducts) || savedProducts.length === 0) return

      const savedProductIds = new Set(savedProducts.map(product => product.id))
      storeRef.current.dispatch(setProduct([
        ...savedProducts,
        ...productDummyData.filter(product => !savedProductIds.has(product.id)),
      ]))
    } catch {
      localStorage.removeItem('gocart_products')
    }
  }, [])

  return <Provider store={storeRef.current}>{children}</Provider>
}
