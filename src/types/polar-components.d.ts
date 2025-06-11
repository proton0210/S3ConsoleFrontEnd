declare module "@polar-sh/checkout/embed" {
  export class PolarEmbedCheckout {
    static create(
      checkoutLink: string,
      theme?: "light" | "dark"
    ): Promise<PolarEmbedCheckout>;
    addEventListener(
      event: "success",
      callback: (event: { detail: any }) => void
    ): void;
    addEventListener(
      event: "close",
      callback: (event: { detail: any }) => void
    ): void;
    addEventListener(
      event: "error",
      callback: (event: { detail: any }) => void
    ): void;
  }
}

declare namespace JSX {
  interface IntrinsicElements {
    "polar-checkout": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        "checkout-link"?: string;
        theme?: "light" | "dark";
        "success-url"?: string;
        "customer-email"?: string;
        "customer-name"?: string;
      },
      HTMLElement
    >;
  }
}
