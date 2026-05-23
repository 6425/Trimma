import React from 'react';
import { Compass } from 'lucide-react';

export default function AgentDiscoverPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center text-brand mb-6">
          <Compass className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-[#1A1C29] mb-4">Discover Salons</h1>
        <p className="text-zinc-500 max-w-lg mb-8">
          The agent discovery feature is currently under construction. Check back soon to discover and claim new salons directly from this portal!
        </p>
      </div>
    </div>
  );
}
