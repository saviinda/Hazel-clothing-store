export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  redirectUrl?: string;
  error?: string;
  message?: string;
}

export interface PaymentGateway {
  name: string;
  initializePayment(orderId: string, amount: number, customerEmail: string): Promise<PaymentResponse>;
  verifyPayment(orderId: string, payload: any): Promise<PaymentResponse>;
}

// 1. Current Provider: Bank Transfer (Manual Verification)
export class BankTransferPayment implements PaymentGateway {
  name = 'Bank Transfer';

  async initializePayment(orderId: string, amount: number, customerEmail: string): Promise<PaymentResponse> {
    // Bank transfer doesn't redirect to payment portals; it displays account details and expects a receipt.
    return {
      success: true,
      message: 'Bank transfer initialized. Please transfer funds and upload receipt proof.',
      redirectUrl: `/track?id=${orderId}&upload=true`,
    };
  }

  async verifyPayment(orderId: string, payload: { receiptUrl: string }): Promise<PaymentResponse> {
    if (!payload.receiptUrl) {
      return { success: false, error: 'No payment receipt URL provided.' };
    }
    return {
      success: true,
      message: 'Receipt received. Awaiting admin review.',
    };
  }
}

// 2. Future Provider: PayHere (Sri Lanka)
export class PayHerePayment implements PaymentGateway {
  name = 'PayHere';

  async initializePayment(orderId: string, amount: number, customerEmail: string): Promise<PaymentResponse> {
    return {
      success: true,
      redirectUrl: `https://sandbox.payhere.lk/pay/checkout?order_id=${orderId}&amount=${amount}&email=${customerEmail}&stub=true`,
      message: 'Redirecting to PayHere sandbox payment gateway...',
    };
  }

  async verifyPayment(orderId: string, payload: any): Promise<PaymentResponse> {
    // Stub validation of webhook signature
    return {
      success: true,
      transactionId: `payhere_txn_${Math.random().toString(36).substring(7)}`,
      message: 'PayHere transaction verified.',
    };
  }
}

// 3. Future Provider: WebXPay (Sri Lanka)
export class WebXPayPayment implements PaymentGateway {
  name = 'WebXPay';

  async initializePayment(orderId: string, amount: number, customerEmail: string): Promise<PaymentResponse> {
    return {
      success: true,
      redirectUrl: `https://webxpay.com/payment?order_id=${orderId}&amount=${amount}&stub=true`,
    };
  }

  async verifyPayment(orderId: string, payload: any): Promise<PaymentResponse> {
    return {
      success: true,
      transactionId: `webxpay_txn_${Math.random().toString(36).substring(7)}`,
    };
  }
}

// 4. Future Provider: Stripe (Global)
export class StripePayment implements PaymentGateway {
  name = 'Stripe';

  async initializePayment(orderId: string, amount: number, customerEmail: string): Promise<PaymentResponse> {
    return {
      success: true,
      redirectUrl: `https://checkout.stripe.com/pay/cs_test_${orderId}?stub=true`,
    };
  }

  async verifyPayment(orderId: string, payload: any): Promise<PaymentResponse> {
    return {
      success: true,
      transactionId: `ch_${Math.random().toString(36).substring(7)}`,
    };
  }
}

// 5. Future Provider: PayPal (Global)
export class PayPalPayment implements PaymentGateway {
  name = 'PayPal';

  async initializePayment(orderId: string, amount: number, customerEmail: string): Promise<PaymentResponse> {
    return {
      success: true,
      redirectUrl: `https://paypal.com/checkout/pay?order_id=${orderId}&stub=true`,
    };
  }

  async verifyPayment(orderId: string, payload: any): Promise<PaymentResponse> {
    return {
      success: true,
      transactionId: `pay_${Math.random().toString(36).substring(7)}`,
    };
  }
}

// Factory to resolve the active payment gateway
export class PaymentService {
  static getGateway(type: 'bank_transfer' | 'payhere' | 'webxpay' | 'stripe' | 'paypal'): PaymentGateway {
    switch (type) {
      case 'bank_transfer':
        return new BankTransferPayment();
      case 'payhere':
        return new PayHerePayment();
      case 'webxpay':
        return new WebXPayPayment();
      case 'stripe':
        return new StripePayment();
      case 'paypal':
        return new PayPalPayment();
      default:
        return new BankTransferPayment();
    }
  }
}
