import {
  CanActivate,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

/**
 * Blocks every request unless TRIMMA_API_GATEWAY_ENABLED=true.
 * The Nest gateway is a dev scaffold — production traffic uses Next.js /api routes.
 */
@Injectable()
export class GatewayLockdownGuard implements CanActivate {
  canActivate(): boolean {
    if (process.env.TRIMMA_API_GATEWAY_ENABLED !== 'true') {
      throw new ServiceUnavailableException(
        'Trimma API Gateway is disabled. Use the Next.js application API instead.',
      );
    }
    return true;
  }
}
