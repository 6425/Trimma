import { canonicalizeCategorySlug } from "@/lib/public-categories";

export type CategoryHeroCopy = {
  headline: string;
  description: string;
};

const CATEGORY_HERO_COPY: Record<string, CategoryHeroCopy> = {
  "barber-salon": {
    headline: "Get Your Barber Shop Discovered by More Customers",
    description:
      "Your barber shop can be discovered by customers looking for their next haircut or grooming appointment. Own this business? Claim it with Google Sign-In through Trimma's verified business claim flow.",
  },
  "beauty-parlours": {
    headline: "Put Your Beauty Salon in Front of More Customers",
    description:
      "Help customers discover your salon, explore your services, and book their next appointment. Own this business? Claim it with Google Sign-In through Trimma's verified business claim flow.",
  },
  "beauty-salon": {
    headline: "Put Your Beauty Salon in Front of More Customers",
    description:
      "Help customers discover your salon, explore your services, and book their next appointment. Own this business? Claim it with Google Sign-In through Trimma's verified business claim flow.",
  },
  "bridal-beauty": {
    headline: "Turn Bridal Searches into Real Appointments",
    description:
      "Showcase your bridal and beauty services to customers planning their perfect look. Own this business? Claim it with Google Sign-In through Trimma's verified business claim flow.",
  },
  "mens-grooming": {
    headline: "Get Your Men's Grooming Business Discovered",
    description:
      "Connect with customers looking for grooming, styling, and personal care services. Own this business? Claim it with Google Sign-In through Trimma's verified business claim flow.",
  },
  "nail-studio": {
    headline: "Let More Customers Discover Your Nail Studio",
    description:
      "Showcase your nail services and make it easier for customers to find and book with you. Own this business? Claim it with Google Sign-In through Trimma's verified business claim flow.",
  },
  "skincare-clinics": {
    headline: "Put Your Skincare Business Where Customers Are Looking",
    description:
      "Help customers discover your skincare services and connect with your business when they're ready to book. Own this business? Claim it with Google Sign-In through Trimma's verified business claim flow.",
  },
  "spa-wellness": {
    headline: "Bring Your Spa & Wellness Business to More Customers",
    description:
      "Let customers discover your treatments, explore your services, and book their wellness experience. Own this business? Claim it with Google Sign-In through Trimma's verified business claim flow.",
  },
  "tattoo-studio": {
    headline: "Get Your Tattoo Studio Discovered by the Right Customers",
    description:
      "Showcase your tattoo services and make it easier for customers to discover and connect with your studio. Own this business? Claim it with Google Sign-In through Trimma's verified business claim flow.",
  },
  "yoga-studio": {
    headline: "Help More People Discover Your Yoga Studio",
    description:
      "Connect with people looking for yoga, wellness, and mindful experiences in their area. Own this business? Claim it with Google Sign-In through Trimma's verified business claim flow.",
  },
};

export function getCategoryHeroCopy(slug: string, fallbackName: string): CategoryHeroCopy {
  const canonical = canonicalizeCategorySlug(slug);
  return (
    CATEGORY_HERO_COPY[canonical] ||
    CATEGORY_HERO_COPY[slug] || {
      headline: `Get Your ${fallbackName} Discovered by More Customers`,
      description: `Help customers discover ${fallbackName.toLowerCase()} businesses and book their next appointment. Own this business? Claim it with Google Sign-In through Trimma's verified business claim flow.`,
    }
  );
}
