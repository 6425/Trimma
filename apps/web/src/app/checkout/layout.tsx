import Script from "next/script";

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script src="https://js.stripe.com/v3/" strategy="beforeInteractive" />
      <link rel="preconnect" href="https://js.stripe.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://api.stripe.com" crossOrigin="anonymous" />
      <div className="min-h-screen bg-white trimma-light-context trimma-checkout-page">{children}</div>
    </>
  );
}
