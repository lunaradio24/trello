import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class RefreshTokenGuard extends AuthGuard('refresh-token') {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const [prefix, givenRefreshToken] = request.headers['authorization'].split(' ');
    if (prefix !== 'Bearer') {
      return false;
    }

    try {
      const givenPayload = this.jwtService.verify(givenRefreshToken, {
        secret: this.configService.get('REFRESH_TOKEN_SECRET_KEY'),
      });
      request.user = givenPayload;
      return true;
    } catch (err) {
      return false;
    }
  }
}
