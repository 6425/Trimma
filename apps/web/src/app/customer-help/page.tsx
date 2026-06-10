"use client";

import Header from "../../components/Header";
import GlobalFooter from "../../components/GlobalFooter";
import { CustomerHelpGuide } from "../../components/help/CustomerHelpGuide";

export default function CustomerHelpPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-zinc-900 flex flex-col">
      <Header />
      <main className="flex-1 pt-4">
        <CustomerHelpGuide />
      </main>
      <GlobalFooter />
    </div>
  );
}
