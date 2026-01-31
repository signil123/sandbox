// File: client/src/components/Common/ProBadge.jsx
import { Check, ShieldCheck } from 'lucide-react'
import React from 'react'

const ProBadge = ({ size = 'sm', className = '' }) => {
  const isSmall = size === 'sm'
  
  return (
    <div className={`inline-flex items-center gap-1 bg-gradient-to-r from-[#163146] to-[#0f1f27] text-white rounded-full ${isSmall ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'} font-bold shadow-sm ${className}`}>
      <ShieldCheck size={isSmall ? 10 : 14} className="text-[#986a41]" />
      <span className="tracking-widest uppercase">PRO</span>
      <div className="bg-[#986a41] rounded-full p-0.5 ml-0.5">
        <Check size={isSmall ? 6 : 8} className="text-white" strokeWidth={4} />
      </div>
    </div>
  )
}

export default ProBadge
