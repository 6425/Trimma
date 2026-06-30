export function CheckoutStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        .checkout-input {
          border: 1px solid #e6e6e6;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
          transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
        }
        .checkout-input:focus {
          outline: none;
          border-color: #18181b;
          box-shadow: 0 0 0 1px #18181b;
        }
        .input-group-top {
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
          border-bottom: 0;
        }
        .input-group-bottom {
          border-top-left-radius: 0;
          border-top-right-radius: 0;
        }
        .trimma-checkout-page {
          color-scheme: light;
        }
        html.dark .trimma-checkout-page.trimma-light-context {
          --background: #ffffff;
          --foreground: #18181b;
          --card: #ffffff;
          --card-foreground: #18181b;
          --muted: #f4f4f5;
          --muted-foreground: #71717a;
          --accent: #e4e4e7;
          --accent-foreground: #18181b;
          --border: rgba(0, 0, 0, 0.08);
          --input: rgba(0, 0, 0, 0.06);
          background-color: #ffffff !important;
          color: #18181b !important;
        }
        html.dark .trimma-checkout-page.trimma-light-context :is(
          .text-zinc-900,
          .text-zinc-800,
          .text-zinc-700,
          .text-zinc-600,
          .text-zinc-950,
          .text-black,
          .text-gray-700,
          .text-gray-800
        ) {
          color: #18181b !important;
        }
        html.dark .trimma-checkout-page.trimma-light-context :is(.text-zinc-500, .text-zinc-400, .text-gray-500) {
          color: #71717a !important;
        }
        .trimma-stripe-payment-shell {
          width: 100%;
          min-height: 300px;
          color-scheme: light;
        }
        .trimma-stripe-payment-shell iframe {
          width: 100% !important;
          min-height: 44px !important;
        }
        html.dark .trimma-checkout-page,
        html.dark .trimma-checkout-page :is(.bg-white, .trimma-stripe-payment-shell) {
          background-color: #ffffff !important;
          color: #18181b !important;
          color-scheme: light;
        }
        html.dark .trimma-checkout-page :is(
          .text-zinc-900,
          .text-zinc-800,
          .text-zinc-700,
          .text-zinc-600,
          .text-zinc-950,
          .text-black,
          .text-gray-700,
          .text-gray-800
        ) {
          color: #18181b !important;
        }
        html.dark .trimma-checkout-page :is(.text-zinc-500, .text-zinc-400, .text-gray-500) {
          color: #71717a !important;
        }
      `,
      }}
    />
  );
}
