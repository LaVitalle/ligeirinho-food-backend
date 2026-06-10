/**
 * Eventos publicados pelo identity-service.
 */
export enum IdentityExchangeName {
  SELLER_CREATED = "identity.sellers.created.exchange",
}

export enum IdentityRoutingKey {
  SELLER_CREATED = "seller.created",
}

/** Payload de seller.created — catalog vincula o seller à cantina. */
export interface SellerCreatedPayload {
  canteenId: string;
  sellerId: string;
  sellerEmail: string;
}
