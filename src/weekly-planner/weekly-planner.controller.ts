import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { WeeklyPlannerService } from './weekly-planner.service';
import { GetCurrentUser } from 'src/auth/decorator/current-user.decorator';
import { GeneratePlanDto } from './dto/generate-plan.dto';
import { UpdateSlotDto } from './dto/update-slot.dto';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AddPlannerSlotDto } from './dto/addPlanner.dto';

@ApiTags('Weekly-Planner')
@UseGuards(JwtAuthGuard)
@Controller('planner')
export class WeeklyPlannerController {
  constructor(private readonly plannerService: WeeklyPlannerService) {}

  // ─────────────────────────────────────────────────────────────────────────
  //  POST /planner/generate
  //  Generate (or regenerate) the weekly plan for the authenticated user.
  //  Body: { weekStart?: "YYYY-MM-DD" }  — defaults to current week's Monday.
  // ─────────────────────────────────────────────────────────────────────────
  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate weekly content plan',
    description:
      'Generate or regenerate an AI-powered weekly content plan for the authenticated user.',
  })
  @ApiBody({
    type: GeneratePlanDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Weekly plan generated successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async generatePlan(
    @GetCurrentUser() user: any,
    @Body() dto: GeneratePlanDto,
  ) {
    return this.plannerService.generatePlan(user.id, dto);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  GET /planner/history
  //  Returns all past weekly plans for the user, newest first.
  //  Must be declared BEFORE /:weekStart to avoid route collision.
  // ─────────────────────────────────────────────────────────────────────────
  @Get('history')
  @ApiOperation({
    summary: 'Get planner history',
    description: 'Returns all previously generated weekly plans.',
  })
  @ApiResponse({
    status: 200,
    description: 'Plan history fetched successfully',
  })
  async getPlanHistory(@GetCurrentUser() user: any) {
    return this.plannerService.getPlanHistory(user.id);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  GET /planner/:weekStart
  //  Fetch the plan for a specific week.
  //  Param: weekStart — ISO date string, e.g. "2026-05-19"
  // ─────────────────────────────────────────────────────────────────────────
  @Get(':weekStart')
  @ApiOperation({
    summary: 'Get plan by week',
  })
  @ApiParam({
    name: 'weekStart',
    example: '2026-05-19',
    description: 'Week start date in YYYY-MM-DD format',
  })
  @ApiResponse({
    status: 200,
    description: 'Plan fetched successfully',
  })
  async getPlanForWeek(
    @GetCurrentUser() user: any,
    @Param('weekStart') weekStart: string,
  ) {
    return this.plannerService.getPlanForWeek(user.id, weekStart);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  GET /planner/by-id/:planId
  //  Fetch a plan by its UUID (useful when the frontend stores the ID).
  // ─────────────────────────────────────────────────────────────────────────
  @Get('by-id/:planId')
  @ApiOperation({
    summary: 'Get plan by ID',
  })
  @ApiParam({
    name: 'planId',
    example: 'a2d70f55-40c7-45bb-8c93-7d61745a0a10',
    description: 'Planner UUID',
  })
  @ApiResponse({
    status: 200,
    description: 'Plan fetched successfully',
  })
  async getPlanById(
    @GetCurrentUser() user: any,
    @Param('planId') planId: string,
  ) {
    return this.plannerService.getPlanById(user.id, planId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  PATCH /planner/:planId/slots/:slotId
  //  Edit a scheduled post slot (reschedule, update caption, change status…)
  // ─────────────────────────────────────────────────────────────────────────
  @Patch(':planId/slots/:slotId')
  @ApiOperation({
    summary: 'Update planner slot',
  })
  @ApiParam({
    name: 'planId',
    description: 'Planner ID',
  })
  @ApiParam({
    name: 'slotId',
    description: 'Slot ID',
  })
  @ApiBody({
    type: UpdateSlotDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Slot updated successfully',
  })
  async updateSlot(
    @GetCurrentUser() user: any,
    @Param('planId') planId: string,
    @Param('slotId') slotId: string,
    @Body() dto: UpdateSlotDto,
  ) {
    return this.plannerService.updateSlot(user.id, planId, slotId, dto);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  PATCH /planner/:planId/slots/:slotId/posted
  //  One-click "mark as posted" shortcut.
  // ─────────────────────────────────────────────────────────────────────────
  @Patch(':planId/slots/:slotId/posted')
  @ApiOperation({
    summary: 'Mark slot as posted',
  })
  @ApiParam({
    name: 'planId',
  })
  @ApiParam({
    name: 'slotId',
  })
  @ApiResponse({
    status: 200,
    description: 'Slot marked as posted',
  })
  @HttpCode(HttpStatus.OK)
  async markPosted(
    @GetCurrentUser() user: any,
    @Param('planId') planId: string,
    @Param('slotId') slotId: string,
  ) {
    return this.plannerService.markPosted(user.id, planId, slotId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  PATCH /planner/:planId/slots/:slotId/skipped
  //  Mark a post as skipped (user chose not to post it).
  // ─────────────────────────────────────────────────────────────────────────
  @Patch(':planId/slots/:slotId/skipped')
  @ApiOperation({
    summary: 'Mark slot as skipped',
  })
  @ApiParam({
    name: 'planId',
  })
  @ApiParam({
    name: 'slotId',
  })
  @ApiResponse({
    status: 200,
    description: 'Slot marked as skipped',
  })
  @HttpCode(HttpStatus.OK)
  async markSkipped(
    @GetCurrentUser() user: any,
    @Param('planId') planId: string,
    @Param('slotId') slotId: string,
  ) {
    return this.plannerService.markSkipped(user.id, planId, slotId);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  POST /planner/:planId/slots
  //  Manually add a post slot to an existing plan.
  // ─────────────────────────────────────────────────────────────────────────
  @Post(':planId/slots')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add slot to planner',
  })
  @ApiParam({
    name: 'planId',
  })
  @ApiBody({
    type: AddPlannerSlotDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Slot created successfully',
  })
  async addSlot(
    @GetCurrentUser() user: any,
    @Param('planId') planId: string,
    @Body() payload: AddPlannerSlotDto,
  ) {
    return this.plannerService.addSlot(user.id, planId, {
      ...payload,
      hashtags: payload.hashtags ?? [],
      contentIdeaId: payload.contentIdeaId ?? null,
      generatedPostId: null,
      sourceType: payload.sourceType ?? 'NEW',
    } as any);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  DELETE /planner/:planId/slots/:slotId
  //  Remove a post slot from a plan.
  // ─────────────────────────────────────────────────────────────────────────
  @Delete(':planId/slots/:slotId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete planner slot',
  })
  @ApiParam({
    name: 'planId',
  })
  @ApiParam({
    name: 'slotId',
  })
  @ApiResponse({
    status: 204,
    description: 'Slot deleted successfully',
  })
  async deleteSlot(
    @GetCurrentUser() user: any,
    @Param('planId') planId: string,
    @Param('slotId') slotId: string,
  ) {
    await this.plannerService.deleteSlot(user.id, planId, slotId);
  }
}
