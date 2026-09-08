import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SseAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & {
      headers: Record<string, string>;
      query: Record<string, string>;
      user?: any;
    }>();

    const authHeader = req.headers?.authorization;
    const queryToken = req.query?.token;
    let token = queryToken;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    }
    if (!token) throw new UnauthorizedException('Missing token');

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.userRepo.findOne({
      where: { id: payload.sub, isActive: true },
    });
    if (!user) throw new UnauthorizedException('User not found');

    req.user = {
      sub: user.id,
      email: user.email,
      role: user.role,
      apexOrgId: user.apexOrgId,
      organizationId: user.organizationId,
    };
    return true;
  }
}