export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface Chat {
  id: string;
  type: 'DIRECT';
  createdAt: string;
  members: ChatMember[];
  messages?: Message[];
}

export interface ChatMember {
  chatId: string;
  userId: string;
  user: User;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: string;
  sender?: User;
}

export interface AuthResponse {
  token: string;
  user: User;
}
