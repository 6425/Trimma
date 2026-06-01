const fs = require('fs');

const path = "c:/Users/thusi/Downloads/Trimma/apps/web/src/app/salons/[slug]/page.tsx";
let content = fs.readFileSync(path, 'utf8');

// 1. Add `isBookable` definition
content = content.replace(
  "const displayReviewCount = reviewSummary.totalReviews > 0 ? reviewSummary.totalReviews : (salon.review_count || 0);",
  "const displayReviewCount = reviewSummary.totalReviews > 0 ? reviewSummary.totalReviews : (salon.review_count || 0);\n\n  const hasContactInfo = Boolean(salon.phone && salon.owner_email && !salon.owner_email.includes(\"draft-\"));\n  const isBookable = salon.is_verified && hasContactInfo;"
);

// 2. handleBookService
content = content.replace(
  `    if (!salon.is_verified) {\n      toast.error("This salon is currently under verification. Bookings are temporarily unavailable until owner activation is completed.");\n      return;\n    }`,
  `    if (!isBookable) {\n      if (!salon.is_verified) {\n        toast.error("This salon is currently under verification. Bookings are temporarily unavailable until owner activation is completed.");\n      } else {\n        toast.error("Booking is unavailable because the salon has not provided a valid email address and WhatsApp number.");\n      }\n      return;\n    }`
);

// 3. handleBookPromotion
content = content.replace(
  `    if (!salon.is_verified) {\n      toast.error("This salon is currently under verification. Bookings are temporarily unavailable until owner activation is completed.");\n      return;\n    }`,
  `    if (!isBookable) {\n      if (!salon.is_verified) {\n        toast.error("This salon is currently under verification. Bookings are temporarily unavailable until owner activation is completed.");\n      } else {\n        toast.error("Booking is unavailable because the salon has not provided a valid email address and WhatsApp number.");\n      }\n      return;\n    }`
);

// 4. Hero section Book button
content = content.replace(
  "className={`flex-1 sm:hidden rounded-xl font-bold transition-all h-11 ${salon.is_verified ? 'bg-brand hover:bg-[#c21b52] text-white shadow-lg shadow-rose-900/25' : 'bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700'}`}",
  "className={`flex-1 sm:hidden rounded-xl font-bold transition-all h-11 ${isBookable ? 'bg-brand hover:bg-[#c21b52] text-white shadow-lg shadow-rose-900/25' : 'bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700'}`}"
);
content = content.replace(
  "disabled={!salon.is_verified}\n                    >\n                      {salon.is_verified ? \"Book\" : \"Unavailable\"}",
  "disabled={!isBookable}\n                    >\n                      {isBookable ? \"Book\" : \"Unavailable\"}"
);

// 5. Unverified / Booking Unavailable Notice
content = content.replace(
  `                {!salon.is_verified && (\n                  <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 backdrop-blur-md max-w-2xl">\n                    <Shield className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />\n                    <div>\n                      <h4 className="text-amber-500 font-extrabold text-sm uppercase tracking-wide">Verification in Progress</h4>\n                      <p className="text-amber-600/80 text-xs font-medium mt-1 leading-relaxed">\n                        This salon is currently undergoing our verification process. Online booking will be enabled once the owner completes activation and gets approved by our agent team.\n                      </p>\n                    </div>\n                  </div>\n                )}`,
  `                {!isBookable && (\n                  <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 backdrop-blur-md max-w-2xl">\n                    <Shield className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />\n                    <div>\n                      <h4 className="text-amber-500 font-extrabold text-sm uppercase tracking-wide">\n                        {!salon.is_verified ? "Verification in Progress" : "Missing Contact Details"}\n                      </h4>\n                      <p className="text-amber-600/80 text-xs font-medium mt-1 leading-relaxed">\n                        {!salon.is_verified\n                          ? "This salon is currently undergoing our verification process. Online booking will be enabled once the owner completes activation and gets approved by our agent team."\n                          : "This salon is verified but is missing an email address or WhatsApp number. Online booking will be enabled once the owner updates their business profile."}\n                      </p>\n                    </div>\n                  </div>\n                )}`
);

// 6. Sidebar or bottom bar button
content = content.replace(
  "disabled={!salon.is_verified}\n                className={`w-full rounded-2xl font-bold transition-all active:scale-[0.98] text-sm h-14 shadow-xl ${salon.is_verified ? 'bg-brand hover:bg-[#c21b52] text-white shadow-brand/20' : 'bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700'}`}",
  "disabled={!isBookable}\n                className={`w-full rounded-2xl font-bold transition-all active:scale-[0.98] text-sm h-14 shadow-xl ${isBookable ? 'bg-brand hover:bg-[#c21b52] text-white shadow-brand/20' : 'bg-zinc-800 text-zinc-400 cursor-not-allowed border border-zinc-700'}`}"
);
content = content.replace(
  "{!salon.is_verified ? \"Booking Unavailable\" : \"Book Appointment Now\"}",
  "{!isBookable ? \"Booking Unavailable\" : \"Book Appointment Now\"}"
);

// 7. Services list button
content = content.replace(
  "<Button className=\"rounded-full shadow-sm px-6\" onClick={() => handleBookService(service.name)} disabled={!salon.is_verified}>\n                          {!salon.is_verified ? \"Unavailable\" : \"Book Now\"}",
  "<Button className=\"rounded-full shadow-sm px-6\" onClick={() => handleBookService(service.name)} disabled={!isBookable}>\n                          {!isBookable ? \"Unavailable\" : \"Book Now\"}"
);

// 8. Promotions list button
content = content.replace(
  "disabled={!salon.is_verified}\n                              >\n                                {!salon.is_verified ? \"Unavailable\" : \"Book Deal\"}",
  "disabled={!isBookable}\n                              >\n                                {!isBookable ? \"Unavailable\" : \"Book Deal\"}"
);

fs.writeFileSync(path, content);
console.log("Done");
