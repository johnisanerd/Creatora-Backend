import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { GetCurrentUser } from 'src/auth/decorator/current-user.decorator';

import { ChatbotService } from './chatbot.service';

import { ChatDto } from './dto/chat.dto';
import { CreateConversationDto } from './dto/create-conversation.dto';  
import { RenameConversationDto } from './dto/rename-conversation.dto';

@Controller({
  path: 'users/chatbot',
  version: '1',
})
@ApiTags('ChatBot')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ChatbotController {
  constructor(
    private readonly chatbotService: ChatbotService,
  ) {}

  // ------------------------------------
  // Create Conversation
  // ------------------------------------

  @Post('conversations')
  @ApiOperation({
    summary: 'Create a new conversation',
  })
  @ApiResponse({
    status: 201,
    description: 'Conversation created successfully.',
  })
  async createConversation(
    @GetCurrentUser() user: any,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatbotService.createConversation(
      user.id,
      dto,
    );
  }

  // ------------------------------------
  // Get All Conversations
  // ------------------------------------

  @Get('conversations')
  @ApiOperation({
    summary: 'Get all conversations',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversation list.',
  })
  async getConversations(
    @GetCurrentUser() user: any,
  ) {
    return this.chatbotService.getConversations(
      user.id,
    );
  }

  // ------------------------------------
  // Get Conversation Messages
  // ------------------------------------

  @Get('conversations/:conversationId')
  @ApiOperation({
    summary: 'Get all messages of a conversation',
  })
  @ApiParam({
    name: 'conversationId',
    type: String,
  })
  async getConversationMessages(
    @GetCurrentUser() user: any,
    @Param('conversationId') conversationId: string,
  ) {
    return this.chatbotService.getConversationMessages(
      user.id,
      conversationId,
    );
  }

  // ------------------------------------
  // Rename Conversation
  // ------------------------------------

  @Patch('conversations/:conversationId')
  @ApiOperation({
    summary: 'Rename conversation',
  })
  @ApiParam({
    name: 'conversationId',
    type: String,
  })
  async renameConversation(
    @GetCurrentUser() user: any,
    @Param('conversationId') conversationId: string,
    @Body() dto: RenameConversationDto,
  ) {
    return this.chatbotService.renameConversation(
      user.id,
      conversationId,
      dto,
    );
  }

  // ------------------------------------
  // Delete Conversation
  // ------------------------------------

  @Delete('conversations/:conversationId')
  @ApiOperation({
    summary: 'Delete conversation',
  })
  @ApiParam({
    name: 'conversationId',
    type: String,
  })
  async deleteConversation(
    @GetCurrentUser() user: any,
    @Param('conversationId') conversationId: string,
  ) {
    return this.chatbotService.deleteConversation(
      user.id,
      conversationId,
    );
  }

  // ------------------------------------
  // Chat
  // ------------------------------------

  @Post('chat')
  @ApiOperation({
    summary: 'Chat with AI Assistant',
  })
  @ApiResponse({
    status: 200,
    description: 'AI response returned successfully.',
  })
  async chat(
    @GetCurrentUser() user: any,
    @Body() dto: ChatDto,
  ) {
    return this.chatbotService.chat(
      user.id,
      dto,
    );
  }
}