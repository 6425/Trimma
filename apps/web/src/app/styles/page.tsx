import { getPublicPlatformStyles } from "../actions/platform-styles";
import { StylesGallery } from "./StylesGallery";

export default async function PublicStylesPage() {
  const result = await getPublicPlatformStyles();

  return (
    <StylesGallery
      initialStyles={result.styles}
      initialError={result.success ? null : result.error}
    />
  );
}
