import { getPublicSubscriptionPlans } from "../actions/subscription-plans";
import { PricingContent } from "./PricingContent";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const result = await getPublicSubscriptionPlans();

  return (
    <PricingContent
      initialPlans={result.plans}
      loadError={result.success ? null : result.error}
    />
  );
}
