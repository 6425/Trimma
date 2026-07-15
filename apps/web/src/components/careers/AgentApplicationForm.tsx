"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { LocationHierarchySelect } from "../locations/LocationHierarchySelect";
import { SRI_LANKA_PROVINCES } from "@/lib/sri-lanka-locations";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  province: SRI_LANKA_PROVINCES[0]?.name || "",
  district: SRI_LANKA_PROVINCES[0]?.districts[0]?.name || "",
  city: "",
  address: "",
  nicNo: "",
  accountDetails: "",
};

type AgentApplicationFormProps = {
  variant?: "section" | "embedded";
};

export function AgentApplicationForm({ variant = "section" }: AgentApplicationFormProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/public/agent-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          province: form.province,
          district: form.district,
          city: form.city,
          address: form.address,
          nicNo: form.nicNo,
          accountDetails: form.accountDetails,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to submit application.");
      }

      setSubmitted(true);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  }

  const wrapperClass =
    variant === "section"
      ? "py-24 bg-zinc-50 scroll-mt-20"
      : "";

  return (
    <section id="apply" className={wrapperClass}>
      <div className="max-w-3xl mx-auto px-6">
        {variant === "section" && (
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 mb-4 tracking-tight">
              Apply to Become a Trimma Agent
            </h2>
            <p className="text-zinc-500 text-lg">
              Submit your details. Our team will review your application and contact you.
            </p>
          </div>
        )}

        {submitted ? (
          <div className="bg-white border border-green-200 rounded-3xl p-10 text-center shadow-lg">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-zinc-950 mb-3">Application Submitted</h3>
            <p className="text-zinc-500 text-sm leading-relaxed mb-6">
              Thank you for applying. Trimma admin will review your request and reach out by email.
            </p>
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="text-sm font-bold text-[#B8860B] hover:underline"
            >
              Submit another application
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-zinc-200 rounded-3xl p-8 shadow-sm space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1.5">First Name *</label>
                <input
                  required
                  value={form.firstName}
                  onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ffde5a] focus:border-transparent"
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Last Name *</label>
                <input
                  required
                  value={form.lastName}
                  onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ffde5a] focus:border-transparent"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ffde5a] focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ffde5a] focus:border-transparent"
                  placeholder="+94 7X XXX XXXX"
                />
              </div>
            </div>

            <LocationHierarchySelect
              province={form.province}
              district={form.district}
              city={form.city}
              onProvinceChange={(value) => setForm((p) => ({ ...p, province: value }))}
              onDistrictChange={(value) => setForm((p) => ({ ...p, district: value }))}
              onCityChange={(value) => setForm((p) => ({ ...p, city: value }))}
              showCity
            />

            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Address *</label>
              <textarea
                required
                rows={3}
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ffde5a] focus:border-transparent resize-none"
                placeholder="Street address, area, postal code"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1.5">NIC No *</label>
              <input
                required
                value={form.nicNo}
                onChange={(e) => setForm((p) => ({ ...p, nicNo: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ffde5a] focus:border-transparent"
                placeholder="National Identity Card number"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Account Details *</label>
              <textarea
                required
                rows={4}
                value={form.accountDetails}
                onChange={(e) => setForm((p) => ({ ...p, accountDetails: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ffde5a] focus:border-transparent resize-none"
                placeholder="Bank name, branch, account holder name, account number"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2.5 bg-[#ffde5a] hover:bg-[#ffe680] disabled:opacity-60 text-black font-bold py-4 rounded-2xl transition-all shadow-lg shadow-[#ffde5a]/20"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Application
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
