import { getPublicSubscriptionPlans } from "../actions/subscription-plans";
import { PricingContent } from "./PricingContent";

export default async function PricingPage() {
  const result = await getPublicSubscriptionPlans();

  return (
    <PricingContent
      initialPlans={result.plans}
      loadError={result.success ? null : result.error}
    />
  );
}
