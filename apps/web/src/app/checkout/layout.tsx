export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://js.stripe.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://api.stripe.com" crossOrigin="anonymous" />
      <div className="min-h-screen bg-white trimma-light-context trimma-checkout-page">{children}</div>
    </>
  );
}
