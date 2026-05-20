import { useParams } from "react-router-dom";
import { DistrictDetailTemplate, DistrictData } from "../components/marketplace/DistrictDetailTemplate";

const districtData: DistrictData = {
  id: "colombo",
  name: "Colombo District",
  province: "Western Province",
  description: "Discover 540+ salons, spas, and beauty studios in Colombo District. The heart of premium grooming and wellness in Sri Lanka.",
  salonCount: 540,
  avgRating: 4.7,
  image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=2836&auto=format&fit=crop",
  popularCategories: ["Barber", "Hair", "Spa"],
  cities: [
    { name: "Colombo 07", count: 120, top: "Barber • Luxury Grooming" },
    { name: "Colombo 03", count: 85, top: "Spa • Wellness" },
    { name: "Nugegoda", count: 64, top: "Hair • Beauty" },
    { name: "Dehiwala", count: 42, top: "Bridal • Nails" },
  ],
  trendingServices: [
    "Skin Fade Haircut",
    "Bridal Makeup",
    "Hydra Facial",
    "Beard Sculpting"
  ],
  insights: {
    avgPrice: "LKR 2,500",
    busiestDays: "Friday & Saturday",
    peakHours: "4:00 PM - 8:00 PM",
    topCategory: "Barber"
  },
  salons: [
    {
      id: "salon-1",
      slug: "the-gentlemens-lounge-colombo-07",
      name: "The Gentlemen's Lounge",
      city: "Colombo 07",
      rating: 4.8,
      reviews: 320,
      categories: ["Barber", "Beard", "Facial"],
      priceFrom: 2000,
      nextAvailable: "Today 5:30 PM",
      status: "Open Now",
      image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=2940&auto=format&fit=crop"
    },
    {
      id: "salon-2",
      slug: "luxe-wellness-spa",
      name: "Luxe Wellness Spa",
      city: "Colombo 03",
      rating: 4.9,
      reviews: 415,
      categories: ["Spa", "Massage", "Aesthetics"],
      priceFrom: 6500,
      nextAvailable: "Today 6:00 PM",
      status: "Open Now",
      image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2940&auto=format&fit=crop"
    },
    {
      id: "salon-3",
      slug: "crown-comb-studio",
      name: "Crown & Comb Studio",
      city: "Nugegoda",
      rating: 4.7,
      reviews: 210,
      categories: ["Hair", "Coloring", "Styling"],
      priceFrom: 3000,
      nextAvailable: "Tomorrow 10:00 AM",
      status: "Closed",
      image: "https://images.unsplash.com/photo-1595152772835-219674b2a8a6?q=80&w=1000&auto=format&fit=crop"
    },
    {
      id: "salon-4",
      slug: "elite-grooming-co",
      name: "Elite Grooming Co.",
      city: "Dehiwala",
      rating: 4.6,
      reviews: 145,
      categories: ["Barber", "Haircut"],
      priceFrom: 1200,
      nextAvailable: "Today 4:00 PM",
      status: "Open Now",
      image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2940&auto=format&fit=crop"
    }
  ]
};

export default function DistrictDetailPage() {
  const { id } = useParams();

  // In a real app, you would fetch data conditionally based on `id`
  const data = districtData; 

  return <DistrictDetailTemplate data={data} />;
}
