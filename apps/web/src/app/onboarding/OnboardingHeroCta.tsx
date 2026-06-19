"use client";

export function OnboardingHeroCta() {
  return (
    <button
      type="button"
      onClick={() =>
        document.getElementById("salon-owner-signup")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }
      className="hero-btn-primary px-8 py-4 rounded-xl text-lg w-full sm:w-auto"
    >
      Start Your Onboarding
    </button>
  );
}
