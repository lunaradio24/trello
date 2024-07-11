import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from 'src/utils/decorators/roles.decorator';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // @Roles 메타데이터로부터 필요한 권한 조회
    const permittedRoles = this.reflector.get(Roles, context.getHandler());
    if (!permittedRoles) {
      return true;
    }

    // jwt validate 시 생기는 request.user 획득
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 허용된 role만 접근 허용
    if (permittedRoles.includes(user?.role)) {
      return true;
    }
    throw new ForbiddenException('접근 권한이 없습니다.');
  }
}
