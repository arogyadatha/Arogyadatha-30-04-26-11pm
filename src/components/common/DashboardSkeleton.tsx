import React from 'react';

export default function DashboardSkeleton() {
  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] overflow-hidden animate-pulse">
      <div className="bg-white border-b border-gray-200 px-8 py-6 shrink-0 h-24" />
      <div className="flex-1 p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-3xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-80 bg-gray-200 rounded-[32px]" />
          <div className="h-80 bg-gray-200 rounded-[32px]" />
        </div>
      </div>
    </div>
  );
}
