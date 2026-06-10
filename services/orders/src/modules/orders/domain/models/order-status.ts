export enum OrderStatus {
  AGUARDANDO = "AGUARDANDO",
  EM_PREPARO = "EM_PREPARO",
  PRONTO = "PRONTO",
  AGUARDANDO_RETIRADA = "AGUARDANDO_RETIRADA",
  RETIRADO = "RETIRADO",
  CANCELADO = "CANCELADO",
}

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.AGUARDANDO]: [OrderStatus.EM_PREPARO, OrderStatus.CANCELADO],
  [OrderStatus.EM_PREPARO]: [OrderStatus.PRONTO, OrderStatus.CANCELADO],
  [OrderStatus.PRONTO]: [OrderStatus.AGUARDANDO_RETIRADA, OrderStatus.CANCELADO],
  [OrderStatus.AGUARDANDO_RETIRADA]: [OrderStatus.RETIRADO],
  [OrderStatus.RETIRADO]: [],
  [OrderStatus.CANCELADO]: [],
};

const ADVANCE_MAP: Partial<Record<OrderStatus, OrderStatus>> = {
  [OrderStatus.AGUARDANDO]: OrderStatus.EM_PREPARO,
  [OrderStatus.EM_PREPARO]: OrderStatus.PRONTO,
  [OrderStatus.PRONTO]: OrderStatus.AGUARDANDO_RETIRADA,
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function getNextStatus(current: OrderStatus): OrderStatus | null {
  return ADVANCE_MAP[current] ?? null;
}

export function isTerminal(status: OrderStatus): boolean {
  return status === OrderStatus.RETIRADO || status === OrderStatus.CANCELADO;
}

export function canCancel(status: OrderStatus): boolean {
  return [
    OrderStatus.AGUARDANDO,
    OrderStatus.EM_PREPARO,
    OrderStatus.PRONTO,
  ].includes(status);
}
