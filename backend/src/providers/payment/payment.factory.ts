import { PaymentMethod } from '@prisma/client';
import { PaymentProvider } from './payment.interface.js';
import { waveProvider } from './wave.provider.js';
import { orangeMoneyProvider } from './orangeMoney.provider.js';
import { cashOnDeliveryProvider } from './cashOnDelivery.provider.js';
import { ApiError } from '../../utils/apiError.js';

export class PaymentFactory {
  private static providers: Record<PaymentMethod, PaymentProvider> = {
    [PaymentMethod.WAVE]: waveProvider,
    [PaymentMethod.ORANGE_MONEY]: orangeMoneyProvider,
    [PaymentMethod.CASH_ON_DELIVERY]: cashOnDeliveryProvider,
  };

  /**
   * Returns the registered PaymentProvider for the given PaymentMethod
   */
  public static getProvider(method: PaymentMethod): PaymentProvider {
    const provider = this.providers[method];
    if (!provider) {
      throw ApiError.badRequest(`Méthode de paiement non supportée : ${method}`);
    }
    return provider;
  }

  /**
   * Returns all available providers and their sandbox/live statuses
   */
  public static getAllProviders(): Record<PaymentMethod, PaymentProvider> {
    return this.providers;
  }
}
