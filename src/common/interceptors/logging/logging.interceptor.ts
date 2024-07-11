import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    console.log(`[Request] ${method} ${url}`);

    return next.handle().pipe(
      tap((response) => {
        const responseTime = Date.now() - now;
        console.log(`[Response] ${method} ${url} - ${responseTime}ms`);
      }),
    );
  }
}
