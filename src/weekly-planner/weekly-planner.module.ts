import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WeeklyPlannerService } from './weekly-planner.service';
import { WeeklyPlannerController } from './weekly-planner.controller';
import { WeeklyPlannerRepository } from './weekly-planner.repository';


@Module({
  imports: [PrismaModule],
    controllers: [WeeklyPlannerController],
  providers: [WeeklyPlannerService, WeeklyPlannerRepository],
  exports: [WeeklyPlannerService],
})
export class WeeklyPlannerModule {}
