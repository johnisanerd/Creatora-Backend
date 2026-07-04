export interface ChatMessageDto {
  id: string;
  role: 'USER' | 'ASSISTANT';
  message: string;
  createdAt: Date;
}