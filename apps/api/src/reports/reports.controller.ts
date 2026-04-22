import { Body, Controller, Get, NotFoundException, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsString, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ReportsService, ReportKind } from './reports.service';

class CreateReportDto {
  @IsString() @MinLength(3) title!: string;
  @IsIn(['valorisation', 'mifid', 'performance', 'conformite']) kind!: ReportKind;
  @IsString() @MinLength(2) client!: string;
  @IsString() @MinLength(2) period!: string;
}

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  list() {
    return this.reports.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    const r = this.reports.get(id);
    if (!r) throw new NotFoundException('Reporting introuvable.');
    return r;
  }

  @Post()
  create(@Body() dto: CreateReportDto, @Req() req: any) {
    return this.reports.create({ ...dto, author: req.user.name ?? req.user.email });
  }
}
