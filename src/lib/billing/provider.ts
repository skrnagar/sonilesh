export type BillingCustomer = {
  id: string;
  organizationId: string;
  email?: string | null;
};

export type BillingSubscription = {
  id: string;
  customerId: string;
  status: string;
  planCode?: string;
};

export type BillingInvoice = {
  id: string;
  customerId: string;
  amountCents: number;
  currency: string;
  status: string;
};

export interface BillingProvider {
  createCustomer(input: { organizationId: string; email?: string; name?: string }): Promise<BillingCustomer>;
  getCustomer(customerId: string): Promise<BillingCustomer | null>;
  createSubscription(input: {
    customerId: string;
    planCode: string;
    interval: "monthly" | "yearly" | "custom";
  }): Promise<BillingSubscription>;
  updateSubscription(input: {
    subscriptionId: string;
    planCode?: string;
    cancelAtPeriodEnd?: boolean;
  }): Promise<BillingSubscription>;
  cancelSubscription(subscriptionId: string): Promise<BillingSubscription>;
  createInvoice(input: {
    customerId: string;
    amountCents: number;
    currency: string;
  }): Promise<BillingInvoice>;
  getSubscription(subscriptionId: string): Promise<BillingSubscription | null>;
}

/** Dev/manual provider. Stripe/Razorpay adapters must implement BillingProvider — never leak into domain services. */
export class ManualBillingProvider implements BillingProvider {
  async createCustomer(input: { organizationId: string; email?: string; name?: string }) {
    return {
      id: `manual_${input.organizationId}`,
      organizationId: input.organizationId,
      email: input.email ?? null,
    };
  }

  async getCustomer(customerId: string) {
    if (!customerId.startsWith("manual_")) return null;
    return { id: customerId, organizationId: customerId.replace(/^manual_/, ""), email: null };
  }

  async createSubscription(input: {
    customerId: string;
    planCode: string;
    interval: "monthly" | "yearly" | "custom";
  }) {
    return {
      id: `sub_${input.customerId}`,
      customerId: input.customerId,
      status: "active",
      planCode: input.planCode,
    };
  }

  async updateSubscription(input: {
    subscriptionId: string;
    planCode?: string;
    cancelAtPeriodEnd?: boolean;
  }) {
    return {
      id: input.subscriptionId,
      customerId: "manual",
      status: input.cancelAtPeriodEnd ? "cancel_at_period_end" : "active",
      planCode: input.planCode,
    };
  }

  async cancelSubscription(subscriptionId: string) {
    return { id: subscriptionId, customerId: "manual", status: "cancelled" };
  }

  async createInvoice(input: { customerId: string; amountCents: number; currency: string }) {
    return {
      id: `inv_${Date.now()}`,
      customerId: input.customerId,
      amountCents: input.amountCents,
      currency: input.currency,
      status: "draft",
    };
  }

  async getSubscription(subscriptionId: string) {
    return { id: subscriptionId, customerId: "manual", status: "active" };
  }
}

export function getBillingProvider(): BillingProvider {
  return new ManualBillingProvider();
}
