declare global {
  interface Window {
    fbq?: any;
    ttq?: any;
  }
}

export const PixelService = {
  // Page View Event
  pageView(): void {
    if (typeof window !== 'undefined') {
      if (window.fbq) window.fbq('track', 'PageView');
      if (window.ttq) window.ttq.page();
    }
  },

  // Product View Event
  viewContent(productName: string, productId: string, price: number): void {
    if (typeof window !== 'undefined') {
      if (window.fbq) {
        window.fbq('track', 'ViewContent', {
          content_name: productName,
          content_ids: [productId],
          content_type: 'product',
          value: price,
          currency: 'LKR',
        });
      }
      if (window.ttq) {
        window.ttq.track('ViewContent', {
          contents: [{ content_id: productId, content_name: productName, price }],
          value: price,
          currency: 'LKR',
        });
      }
    }
  },

  // Add To Cart Event
  addToCart(productName: string, productId: string, price: number): void {
    if (typeof window !== 'undefined') {
      if (window.fbq) {
        window.fbq('track', 'AddToCart', {
          content_name: productName,
          content_ids: [productId],
          content_type: 'product',
          value: price,
          currency: 'LKR',
        });
      }
      if (window.ttq) {
        window.ttq.track('AddToCart', {
          contents: [{ content_id: productId, content_name: productName, price }],
          value: price,
          currency: 'LKR',
        });
      }
    }
  },

  // Initiate Checkout Event
  initiateCheckout(totalAmount: number, itemCount: number): void {
    if (typeof window !== 'undefined') {
      if (window.fbq) {
        window.fbq('track', 'InitiateCheckout', {
          value: totalAmount,
          currency: 'LKR',
          num_items: itemCount,
        });
      }
      if (window.ttq) {
        window.ttq.track('InitiateCheckout', {
          value: totalAmount,
          currency: 'LKR',
          quantity: itemCount,
        });
      }
    }
  },

  // Complete Payment/Purchase Event
  purchase(orderId: string, totalAmount: number, itemCount: number): void {
    if (typeof window !== 'undefined') {
      if (window.fbq) {
        window.fbq('track', 'Purchase', {
          value: totalAmount,
          currency: 'LKR',
          num_items: itemCount,
          order_id: orderId,
        });
      }
      if (window.ttq) {
        window.ttq.track('CompletePayment', {
          value: totalAmount,
          currency: 'LKR',
          quantity: itemCount,
          order_id: orderId,
        });
      }
    }
  },
};
