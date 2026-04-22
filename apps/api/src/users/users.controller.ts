import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  @Get()
  list() {
    return [
      { id: 'u-1', name: 'Marie Laurent', email: 'marie.laurent@helios.fr', role: 'partner', org: 'Cabinet Helios', lastSeen: '2026-04-21' },
      { id: 'u-2', name: 'Pierre Dubois', email: 'pierre.dubois@helios.fr', role: 'partner', org: 'Cabinet Helios', lastSeen: '2026-04-20' },
      { id: 'u-3', name: 'Claire Moreau', email: 'claire.moreau@helios.fr', role: 'partner', org: 'Cabinet Helios', lastSeen: '2026-04-18' },
      { id: 'u-99', name: 'Admin Ozerus', email: 'admin@ozerus.fr', role: 'admin', org: 'Ozerus', lastSeen: '2026-04-21' },
    ];
  }
}
