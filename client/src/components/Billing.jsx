import React from 'react'
import { PricingTable } from '@clerk/clerk-react'
const Billing = () => {
  return (
    <div className='max-w-2xl mx-auto z-20 my-30'>
      <div className='text-center'>
        <h2 className='text-slate-700 text-[42px] font-semibold'>Choose your Plan</h2>
        <p className='text-gray-500 max-w-lg mx-auto'>Start your Plan for Free and Scale Up as you Grow With us and Find the best plan for your content creation.</p>

      </div>
      <div className='mt-14 max-sm:mx-8'>
        <PricingTable/>
      </div>
    </div>
  )
}

export default Billing
