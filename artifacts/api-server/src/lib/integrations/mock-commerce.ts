export interface PaymentProvider {
  readonly demo: true;
  readonly name: string;
  checkout(orderNumber: string): Promise<{ status: "demo_only"; message: string }>;
}

export interface MessageProvider {
  readonly demo: true;
  readonly name: string;
  send(input: { channel: "email" | "sms"; recipient: string }): Promise<{
    status: "queued_demo";
  }>;
}

export class FakePaymentProvider implements PaymentProvider {
  readonly demo = true as const;
  readonly name = "Fake checkout (no payment)";

  async checkout(orderNumber: string) {
    return {
      status: "demo_only" as const,
      message: `Order ${orderNumber} is a demonstration only. No payment was taken.`,
    };
  }
}

export class DemoMessageProvider implements MessageProvider {
  readonly demo = true as const;
  readonly name = "Demo notification adapter";

  async send(_input: { channel: "email" | "sms"; recipient: string }) {
    return { status: "queued_demo" as const };
  }
}

export const paymentProvider: PaymentProvider = new FakePaymentProvider();
export const messageProvider: MessageProvider = new DemoMessageProvider();
