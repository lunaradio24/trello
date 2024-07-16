import { Reflector } from '@nestjs/core';

export const MemberTypes = Reflector.createDecorator<string[]>();
