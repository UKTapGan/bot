

export enum UserRole {
  ADMIN = 'admin',
  SUPER_USER = 'super_user',
  USER = 'user',
}

export interface User {
  id: string;
  name?: string;
  role: UserRole;
}

export enum MessageSender {
  USER = 'user',
  AI = 'ai',
  SYSTEM = 'system',
}

export enum ChatMode {
  QA = 'qa',
  TROUBLESHOOTING = 'troubleshooting',
}

export interface ImageContent {
  src: string;
  description: string;
}

export interface MessageOption {
    text: string;
    payload: string;
}

export interface Message {
  id: string;
  sender: MessageSender;
  text: string;
  images?: ImageContent[];
  options?: MessageOption[];
  isFinalStep?: boolean;
}

export interface Contact {
  name: string;
  position: string;
  tag: string;
}

export interface ManualContent {
  text: string;
  images: ImageContent[];
  fileName: string;
}