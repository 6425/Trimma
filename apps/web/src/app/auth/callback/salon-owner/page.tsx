import { OAuthCallbackPage } from "@/components/auth/OAuthCallbackRunner";

export default function SalonOwnerAuthCallbackPage() {
  return <OAuthCallbackPage forcedSalonOwner defaultNextPath="/dashboard/profile" />;
}
