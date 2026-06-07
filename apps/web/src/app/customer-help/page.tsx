import React from "react";
import { WalkthroughSteps } from "../../components/help/WalkthroughSteps";
import Header from "../../components/Header";
import GlobalFooter from "../../components/GlobalFooter";

export default function CustomerHelpPage() {
  return (
    <div className="min-h-screen bg-sky-50 text-zinc-900 selection:bg-brand selection:text-black flex flex-col">
      <main className="flex-1 flex items-center justify-center pt-12 pb-12 relative overflow-hidden">
        {/* Soft background circles mimicking the reference */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-sky-100 rounded-full blur-3xl opacity-50 translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-100 rounded-full blur-3xl opacity-50 -translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

        <div className="w-full relative z-10 px-4 sm:px-6 lg:px-8 mt-12">
          <WalkthroughSteps />
        </div>
      </main>
    </div>
  );
}
