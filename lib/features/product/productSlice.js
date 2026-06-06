import { createSlice } from '@reduxjs/toolkit'
import { productDummyData } from '@/assets/assets'

const productSlice = createSlice({
    name: 'product',
    initialState: {
        list: productDummyData,
    },
    reducers: {
        setProduct: (state, action) => {
            state.list = action.payload
        },
        addProduct: (state, action) => {
            state.list.unshift(action.payload)
        },
        toggleProductStock: (state, action) => {
            const product = state.list.find(product => product.id === action.payload)
            if (product) {
                product.inStock = !product.inStock
            }
        },
        clearProduct: (state) => {
            state.list = []
        }
    }
})

export const { setProduct, addProduct, toggleProductStock, clearProduct } = productSlice.actions

export default productSlice.reducer
