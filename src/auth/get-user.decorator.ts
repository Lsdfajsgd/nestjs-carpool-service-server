import { createParamDecorator, ExecutionContext } from '@nestjs/common';
<<<<<<< HEAD
import { Users } from "./entities/users.entity";

export const GetUser = createParamDecorator(
  (data, ctx: ExecutionContext): Users => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
=======
import { User } from './entities/user.entity';

export const GetUser = createParamDecorator(
    (data, ctx: ExecutionContext): User => {
        const req = ctx.switchToHttp().getRequest();
        return req.user;
    },
);
>>>>>>> devlop
