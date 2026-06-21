import { PaymentMethod } from "../models/payment-method";
import { PaymentMethodType } from "../models/payment-method-type";

export const PAYMENT_METHOD_REPOSITORY = Symbol("PAYMENT_METHOD_REPOSITORY");

export interface PaymentMethodRepository {
  create(data: {
    name: string;
    description?: string | null;
    type: PaymentMethodType;
    iconKey?: string | null;
    displayOrder?: number;
    isActive?: boolean;
  }): Promise<PaymentMethod>;

  findAll(filters?: { onlyActive?: boolean }): Promise<PaymentMethod[]>;
  findById(id: string): Promise<PaymentMethod | null>;

  update(
    id: string,
    data: Partial<{
      name: string;
      description: string | null;
      type: PaymentMethodType;
      iconKey: string | null;
      displayOrder: number;
      isActive: boolean;
    }>,
  ): Promise<PaymentMethod>;

  delete(id: string): Promise<void>;
  isInUse(id: string): Promise<boolean>;
}
