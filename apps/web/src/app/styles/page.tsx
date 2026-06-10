import { getPublicPlatformStyles } from "../actions/platform-styles";
import { StylesGallery } from "./StylesGallery";

// Always fetch fresh styles so newly published looks appear without a redeploy.
export const dynamic = "force-dynamic";

export default async function PublicStylesPage() {
  const result = await getPublicPlatformStyles();

  return (
    <StylesGallery
      initialStyles={result.styles}
      initialError={result.success ? null : result.error}
    />
  );
}
