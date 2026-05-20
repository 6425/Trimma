import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Extract token from header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authentication token');
    }

    const token = authHeader.split(' ')[1];
    
    try {
      // In a real application, verify the token (e.g., using Supabase JWT secret)
      // and attach the user to the request object.
      // const user = await this.jwtService.verifyAsync(token);
      
      // Mocking the user attachment for demonstration
      // If we use Supabase, we would verify with Supabase SDK or custom JWT decoding
      const decodedUser = {
        id: 'mock-user-id',
        // In a real scenario, this comes from the decoded JWT
        role: request.headers['x-mock-role'] || 'customer', 
      };

      request.user = decodedUser;
      return true;
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
