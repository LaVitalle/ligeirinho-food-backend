/**
 * Eventos publicados pelo catalog-service.
 * Um exchange (direct, durável) por tipo de evento.
 */
export enum CatalogExchangeName {
  CANTEEN_CREATED = "catalog.canteens.created.exchange",
  CANTEEN_UPDATED = "catalog.canteens.updated.exchange",
  CANTEEN_DELETED = "catalog.canteens.deleted.exchange",
  PRODUCT_UPSERTED = "catalog.products.upserted.exchange",
  PRODUCT_DELETED = "catalog.products.deleted.exchange",
}

export enum CatalogRoutingKey {
  CANTEEN_CREATED = "canteen.created",
  CANTEEN_UPDATED = "canteen.updated",
  CANTEEN_DELETED = "canteen.deleted",
  PRODUCT_UPSERTED = "product.upserted",
  PRODUCT_DELETED = "product.deleted",
}

/** Payload do evento canteen.created — dispara a criação do SELLER no identity. */
export interface CanteenCreatedPayload {
  canteenId: string;
  institutionId: string;
  canteenName: string;
  sellerName: string;
  sellerEmail: string;
  sellerPassword: string;
}

/** Payload de canteen.updated/deleted — projeção no orders. */
export interface CanteenProjectionPayload {
  canteenId: string;
  institutionId: string;
  name: string;
  isOpen: boolean;
}

/** Payload de product.upserted/deleted — projeção no orders. */
export interface ProductProjectionPayload {
  productId: string;
  canteenId: string;
  name: string;
  price: string;
  isAvailable: boolean;
}
