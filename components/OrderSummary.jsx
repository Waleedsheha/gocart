import { PlusIcon, SquarePenIcon, XIcon } from 'lucide-react';
import React, { useState } from 'react'
import AddressModal from './AddressModal';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { couponDummyData, dummyUserData } from '@/assets/assets';
import { clearCart } from '@/lib/features/cart/cartSlice';
import { readStorage, writeStorage } from '@/lib/browserStorage';

const OrderSummary = ({ totalPrice, items }) => {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';

    const router = useRouter();
    const dispatch = useDispatch();

    const addressList = useSelector(state => state.address.list);

    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [couponCodeInput, setCouponCodeInput] = useState('');
    const [coupon, setCoupon] = useState(null);

    const handleCouponCode = async (event) => {
        event.preventDefault();

        const code = couponCodeInput.trim().toUpperCase();
        if (!code) {
            throw new Error('Enter a coupon code');
        }

        const savedCoupons = readStorage('gocart_coupons', null);
        const availableCoupons = Array.isArray(savedCoupons) ? savedCoupons : couponDummyData;

        const matchedCoupon = availableCoupons.find(item => item.code.toUpperCase() === code);
        if (!matchedCoupon) {
            throw new Error('Coupon code is not valid');
        }

        if (new Date(matchedCoupon.expiresAt) < new Date()) {
            throw new Error('Coupon code has expired');
        }

        setCoupon(matchedCoupon);
        setCouponCodeInput('');
    }

    const handlePlaceOrder = async (e) => {
        e.preventDefault();

        if (!items.length) {
            throw new Error('Your cart is empty');
        }

        if (!selectedAddress) {
            throw new Error('Please select a delivery address');
        }

        const discount = coupon ? coupon.discount / 100 * totalPrice : 0;
        const orderId = `order_${Date.now()}`;
        const order = {
            id: orderId,
            total: Number((totalPrice - discount).toFixed(2)),
            status: "ORDER_PLACED",
            userId: dummyUserData.id,
            storeId: items[0]?.storeId,
            addressId: selectedAddress.id,
            isPaid: paymentMethod === 'STRIPE',
            paymentMethod,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCouponUsed: Boolean(coupon),
            coupon,
            orderItems: items.map(item => ({
                orderId,
                productId: item.id,
                quantity: item.quantity,
                price: item.price,
                product: item,
            })),
            address: selectedAddress,
            user: dummyUserData,
        }

        const savedOrders = readStorage('gocart_orders', []);
        const nextOrders = Array.isArray(savedOrders) ? [order, ...savedOrders] : [order];
        writeStorage('gocart_orders', nextOrders);

        dispatch(clearCart());
        router.push('/orders')
    }

    return (
        <div className='w-full max-w-lg lg:max-w-[340px] bg-slate-50/30 border border-slate-200 text-slate-500 text-sm rounded-xl p-7'>
            <h2 className='text-xl font-medium text-slate-600'>Payment Summary</h2>
            <p className='text-slate-400 text-xs my-4'>Payment Method</p>
            <div className='flex gap-2 items-center'>
                <input type="radio" id="COD" name='payment' onChange={() => setPaymentMethod('COD')} checked={paymentMethod === 'COD'} className='accent-gray-500' />
                <label htmlFor="COD" className='cursor-pointer'>COD</label>
            </div>
            <div className='flex gap-2 items-center mt-1'>
                <input type="radio" id="STRIPE" name='payment' onChange={() => setPaymentMethod('STRIPE')} checked={paymentMethod === 'STRIPE'} className='accent-gray-500' />
                <label htmlFor="STRIPE" className='cursor-pointer'>Stripe Payment</label>
            </div>
            <div className='my-4 py-4 border-y border-slate-200 text-slate-400'>
                <p>Address</p>
                {
                    selectedAddress ? (
                        <div className='flex gap-2 items-center'>
                            <p>{selectedAddress.name}, {selectedAddress.city}, {selectedAddress.state}, {selectedAddress.zip}</p>
                            <SquarePenIcon onClick={() => setSelectedAddress(null)} className='cursor-pointer' size={18} />
                        </div>
                    ) : (
                        <div>
                            {
                                addressList.length > 0 && (
                                    <select className='border border-slate-400 p-2 w-full my-3 outline-none rounded' onChange={(e) => setSelectedAddress(e.target.value ? addressList[Number(e.target.value)] : null)} >
                                        <option value="">Select Address</option>
                                        {
                                            addressList.map((address, index) => (
                                                <option key={index} value={index}>{address.name}, {address.city}, {address.state}, {address.zip}</option>
                                            ))
                                        }
                                    </select>
                                )
                            }
                            <button type='button' className='flex items-center gap-1 text-slate-600 mt-1' onClick={() => setShowAddressModal(true)} >Add Address <PlusIcon size={18} /></button>
                        </div>
                    )
                }
            </div>
            <div className='pb-4 border-b border-slate-200'>
                <div className='flex justify-between'>
                    <div className='flex flex-col gap-1 text-slate-400'>
                        <p>Subtotal:</p>
                        <p>Shipping:</p>
                        {coupon && <p>Coupon:</p>}
                    </div>
                    <div className='flex flex-col gap-1 font-medium text-right'>
                        <p>{currency}{totalPrice.toLocaleString()}</p>
                        <p>Free</p>
                        {coupon && <p>{`-${currency}${(coupon.discount / 100 * totalPrice).toFixed(2)}`}</p>}
                    </div>
                </div>
                {
                    !coupon ? (
                        <form onSubmit={e => toast.promise(handleCouponCode(e), {
                            loading: 'Checking Coupon...',
                            success: 'Coupon applied',
                            error: (error) => error.message || 'Unable to apply coupon',
                        })} className='flex justify-center gap-3 mt-3'>
                            <input onChange={(e) => setCouponCodeInput(e.target.value)} value={couponCodeInput} type="text" placeholder='Coupon Code' className='border border-slate-400 p-1.5 rounded w-full outline-none' />
                            <button className='bg-slate-600 text-white px-3 rounded hover:bg-slate-800 active:scale-95 transition-all'>Apply</button>
                        </form>
                    ) : (
                        <div className='w-full flex items-center justify-center gap-2 text-xs mt-2'>
                            <p>Code: <span className='font-semibold ml-1'>{coupon.code.toUpperCase()}</span></p>
                            <p>{coupon.description}</p>
                            <XIcon size={18} onClick={() => setCoupon(null)} className='hover:text-red-700 transition cursor-pointer' />
                        </div>
                    )
                }
            </div>
            <div className='flex justify-between py-4'>
                <p>Total:</p>
                <p className='font-medium text-right'>{currency}{coupon ? (totalPrice - (coupon.discount / 100 * totalPrice)).toFixed(2) : totalPrice.toLocaleString()}</p>
            </div>
            <button onClick={e => toast.promise(handlePlaceOrder(e), {
                loading: 'Placing order...',
                success: 'Order placed successfully',
                error: (error) => error.message || 'Unable to place order',
            })} className='w-full bg-slate-700 text-white py-2.5 rounded hover:bg-slate-900 active:scale-95 transition-all'>Place Order</button>

            {showAddressModal && <AddressModal setShowAddressModal={setShowAddressModal} onAddressAdded={setSelectedAddress} />}

        </div>
    )
}

export default OrderSummary
