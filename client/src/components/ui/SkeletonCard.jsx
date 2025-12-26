import { motion } from 'framer-motion';
import React from 'react';

const SkeletonCard = ({ type = 'user' }) => {
  if (type === 'recommendation') {
    return (
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 flex flex-col h-full min-h-[340px]">
        {/* Banner Skeleton */}
        <div className="h-32 w-full bg-gray-100 animate-pulse" />
        
        <div className="px-4 pb-4 -mt-8 flex flex-col flex-1 relative bg-white">
          {/* Profile Image Skeleton */}
          <div className="w-16 h-16 rounded-full border-2 border-white bg-gray-200 animate-pulse mb-3" />
          
          {/* Name & Title Skeleton */}
          <div className="space-y-2 mb-4">
            <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
          </div>
          
          {/* Specialties Skeleton */}
          <div className="flex gap-2 mb-4">
            <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
            <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
          </div>
          
          <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
            <div className="h-4 w-1/4 bg-gray-100 rounded animate-pulse" />
            <div className="h-8 w-24 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-[#986a41]/50 transition-all duration-300">
      <div className="flex items-start gap-4 mb-4">
        {/* Profile Image Skeleton */}
        <div className="w-16 h-16 rounded-xl bg-gray-200 animate-pulse" />
        
        <div className="flex-1 space-y-2">
          {/* Name Skeleton */}
          <div className="h-5 w-1/2 bg-gray-200 rounded animate-pulse" />
          {/* Title/Sport Skeleton */}
          <div className="h-4 w-1/3 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
      
      {/* Description Skeleton */}
      <div className="space-y-2 mb-6">
        <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
      </div>
      
      {/* Specs Skeleton */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" />
        <div className="h-6 w-24 bg-gray-100 rounded-full animate-pulse" />
        <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="h-4 w-1/4 bg-gray-100 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    </div>
  );
};

export default SkeletonCard;
