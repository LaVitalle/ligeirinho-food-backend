import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  PAYMENT_METHOD_REPOSITORY,
  PaymentMethodRepository,
} from "../../domain/repositories/payment-method.repository";
import {
  CreatePaymentMethodDto,
  PaymentMethodResponseDto,
  UpdatePaymentMethodDto,
} from "../dto/payment-method.dto";

@Injectable()
export class PaymentMethodService {
  constructor(
    @Inject(PAYMENT_METHOD_REPOSITORY)
    private readonly paymentMethodRepository: PaymentMethodRepository,
  ) {}

  async create(
    dto: CreatePaymentMethodDto,
  ): Promise<PaymentMethodResponseDto> {
    const paymentMethod = await this.paymentMethodRepository.create({
      name: dto.name,
      description: dto.description ?? null,
      type: dto.type,
      iconKey: dto.iconKey ?? null,
      displayOrder: dto.displayOrder ?? 0,
      isActive: dto.isActive ?? true,
    });
    return PaymentMethodResponseDto.from(paymentMethod);
  }

  async findAll(onlyActive: boolean): Promise<PaymentMethodResponseDto[]> {
    const paymentMethods = await this.paymentMethodRepository.findAll({
      onlyActive,
    });
    return paymentMethods.map(PaymentMethodResponseDto.from);
  }

  async findById(id: string): Promise<PaymentMethodResponseDto> {
    const paymentMethod = await this.paymentMethodRepository.findById(id);
    if (!paymentMethod) {
      throw new NotFoundException("Método de pagamento não encontrado");
    }
    return PaymentMethodResponseDto.from(paymentMethod);
  }

  async update(
    id: string,
    dto: UpdatePaymentMethodDto,
  ): Promise<PaymentMethodResponseDto> {
    const existing = await this.paymentMethodRepository.findById(id);
    if (!existing) {
      throw new NotFoundException("Método de pagamento não encontrado");
    }
    const updated = await this.paymentMethodRepository.update(id, {
      name: dto.name,
      description: dto.description,
      type: dto.type,
      iconKey: dto.iconKey,
      displayOrder: dto.displayOrder,
      isActive: dto.isActive,
    });
    return PaymentMethodResponseDto.from(updated);
  }

  async toggle(id: string): Promise<PaymentMethodResponseDto> {
    const existing = await this.paymentMethodRepository.findById(id);
    if (!existing) {
      throw new NotFoundException("Método de pagamento não encontrado");
    }
    const updated = await this.paymentMethodRepository.update(id, {
      isActive: !existing.isActive,
    });
    return PaymentMethodResponseDto.from(updated);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.paymentMethodRepository.findById(id);
    if (!existing) {
      throw new NotFoundException("Método de pagamento não encontrado");
    }
    const inUse = await this.paymentMethodRepository.isInUse(id);
    if (inUse) {
      throw new ConflictException(
        "Não é possível remover método referenciado por pedidos",
      );
    }
    await this.paymentMethodRepository.delete(id);
  }
}
