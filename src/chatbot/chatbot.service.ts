import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import axios from 'axios';

import { CreateConversationDto } from './dto/create-conversation.dto';
import { RenameConversationDto } from './dto/rename-conversation.dto';
import { ChatDto } from './dto/chat.dto';
import { ChatRole } from '@prisma/client';

@Injectable()
export class ChatbotService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly chatbotUrl =
    process.env.RAG_CHATBOT_URL ??
    (() => {
      throw new Error('RAG_CHATBOT_URL is not configured');
    })();

  private async getConversationOrThrow(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    return conversation;
  }

  async createConversation(userId: string, dto: CreateConversationDto) {
    return await this.prisma.conversation.create({
      data: {
        userId,
        title: dto.title ?? 'New Conversation',
      },
    });
  }

  async getConversations(userId: string) {
    return await this.prisma.conversation.findMany({
      where: {
        userId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });
  }

  async getConversationMessages(userId: string, conversationId: string) {
    await this.getConversationOrThrow(userId, conversationId);

    return await this.prisma.chatMessage.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async renameConversation(
    userId: string,
    conversationId: string,
    dto: RenameConversationDto,
  ) {
    await this.getConversationOrThrow(userId, conversationId);

    return await this.prisma.conversation.update({
      where: {
        id: conversationId,
      },
      data: {
        title: dto.title,
      },
    });
  }

  async deleteConversation(userId: string, conversationId: string) {
    await this.getConversationOrThrow(userId, conversationId);

    await this.prisma.conversation.delete({
      where: {
        id: conversationId,
      },
    });

    return {
      message: 'Conversation deleted successfully.',
    };
  }

  async chat(userId: string, dto: ChatDto) {
    const { conversationId, question } = dto;

    // Verify conversation belongs to the user
    await this.getConversationOrThrow(userId, conversationId);

    // Save user's latest message
    await this.prisma.chatMessage.create({
      data: {
        conversationId,
        role: ChatRole.USER,
        message: question,
      },
    });

    const conversation = await this.prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
    });

    if (conversation && conversation.title === 'New Conversation') {
      await this.prisma.conversation.update({
        where: {
          id: conversationId,
        },
        data: {
          title:
            question.length > 50 ? question.substring(0, 50) + '...' : question,
        },
      });
    }

    // Fetch last 20 messages (including the newly saved one)
    const messages = await this.prisma.chatMessage.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    messages.reverse();

    const history = messages
      .slice(0, -1) // Remove current question (already sent separately)
      .map((message) => ({
        role: message.role === ChatRole.USER ? 'user' : 'assistant',
        content: message.message,
      }));

    try {
      const response = await axios.post(
        this.chatbotUrl,
        {
          question,
          history,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 60000,
        },
      );

      const answer =
        response.data.answer ?? 'Sorry, I could not generate a response.';

      // Save assistant response
      await this.prisma.chatMessage.create({
        data: {
          conversationId,
          role: ChatRole.ASSISTANT,
          message: answer,
        },
      });

      // Update conversation timestamp
      await this.prisma.conversation.update({
        where: {
          id: conversationId,
        },
        data: {
          updatedAt: new Date(),
        },
      });

      return {
        conversationId,
        answer,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Unable to communicate with AI Chatbot.',
      );
    }
  }
}
