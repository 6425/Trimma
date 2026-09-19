import { OAuthCallbackPage } from "@/components/auth/OAuthCallbackRunner";

export default function SalonOwnerAuthCallbackPage() {
  return (
    <OAuthCallbackPage
      forcedSalonOwner
      deferSalonProvisioning
      defaultNextPath="/onboarding?step=business-search#salon-owner-signup"
    />
  );
}
