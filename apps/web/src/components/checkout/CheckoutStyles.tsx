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
      `,
      }}
    />
  );
}
