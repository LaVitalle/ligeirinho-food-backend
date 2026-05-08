export const CART_REPOSITORY = Symbol("CART_REPOSITORY");

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  productPrice: string;
  canteenId: string;
  quantity: number;
  note: string | null;
  extras: { id: string; name: string; price: string }[];
}

export interface CartRepository {
  addItem(data: {
    userId: string;
    productId: string;
    quantity: number;
    note?: string | null;
    extraIds?: string[];
  }): Promise<void>;

  getItems(userId: string): Promise<CartItem[]>;

  updateItemQuantity(itemId: string, quantity: number): Promise<void>;

  removeItem(itemId: string): Promise<void>;

  clear(userId: string): Promise<void>;

  getCanteenId(userId: string): Promise<string | null>;
}
