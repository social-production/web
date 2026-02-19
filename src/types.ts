// ============================================
// Social Production - TypeScript Type Definitions
// ============================================

// ============ User Types ============

export interface User {
  username: string;
  bio: string;
  joined: string;
  score: number;
  avatar?: string;
  email?: string;
  location?: string;
  website?: string;
}

export interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    mentions: boolean;
    projectUpdates: boolean;
  };
  privacy: {
    showEmail: boolean;
    showLocation: boolean;
    showActivity: boolean;
  };
  theme: 'light' | 'dark' | 'system';
}

// ============ Post Types ============

export type PostType = 'thread' | 'project';
export type ProjectStatus = 'Proposed' | 'Active' | 'Completed' | 'On Hold';

export interface Meetup {
  title: string;
  date: string;
  time: string;
  location: string;
  going: number;
}

export interface FundContributor {
  name: string;
  amount: number;
  public: boolean;
}

export interface Fund {
  goal: number;
  raised: number;
  contributors: FundContributor[];
  deadline?: string;
  purpose?: string;
}

export interface Update {
  type: 'status' | 'meetup' | 'fund' | 'text';
  text: string;
  author: string;
  time: string;
  date: string;
}

export interface BasePost {
  id: number;
  type: PostType;
  title: string;
  channels: string[];
  author: string;
  time: string;
  date: string;
  updatedDate?: string;
  upvotes: number;
  comments: number;
  description: string;
  body: string;
  image?: string;
}

export interface Thread extends BasePost {
  type: 'thread';
}

export interface Project extends BasePost {
  type: 'project';
  status: ProjectStatus;
  rsvps?: number;
  members?: string[];
  meetups?: Meetup[];
  fund?: Fund;
  updates?: Update[];
}

export type Post = Thread | Project;

// ============ Comment Types ============

export interface Comment {
  id: number;
  postId: number;
  author: string;
  time: string;
  upvotes: number;
  text: string;
  replies: Comment[];
}

// ============ Channel Types ============

export interface Channel {
  name: string;
  system: boolean;
  icon: string;
  subscribers: number;
  description?: string;
  createdBy?: string;
  createdAt?: string;
}

// ============ Status & Card Styles ============

export interface StatusStyle {
  bg: string;
  text: string;
  dot: string;
}

export interface CardStyle {
  bg: string;
  border: string;
  hoverBorder: string;
  bar: string;
}

// ============ Moderation Types ============

export interface ModerationAction {
  id: number;
  type: 'warning' | 'removal' | 'ban' | 'lock';
  targetUser?: string;
  targetPost?: number;
  reason: string;
  moderator: string;
  timestamp: string;
}

export interface Report {
  id: number;
  type: 'post' | 'comment' | 'user';
  targetId: number | string;
  reporter: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
}

// ============ Network/Federation Types ============

export interface FederatedNode {
  id: string;
  name: string;
  url: string;
  status: 'connected' | 'pending' | 'disconnected';
  lastSync?: string;
  userCount?: number;
  description?: string;
}

export interface NetworkSettings {
  nodeName: string;
  nodeDescription: string;
  publicNode: boolean;
  allowFederation: boolean;
  connectedNodes: string[];
}

// ============ Form/Data Types ============

export interface CreateThreadData {
  type: 'thread';
  title: string;
  channels: string[];
  description: string;
  body: string;
}

export interface CreateProjectData {
  type: 'project';
  title: string;
  channels: string[];
  description: string;
  body: string;
  image?: string;
  fund?: {
    enabled: boolean;
    goal: string;
    purpose: string;
    deadline: string;
  };
}

export interface MeetupFormData {
  title: string;
  date: string;
  time: string;
  location: string;
}

// ============ UI Component Props ============

export interface BadgeProps {
  type: PostType;
  status?: ProjectStatus;
}

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
}

export interface InputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date';
  required?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
}

export interface TextareaProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  hint?: string;
  maxLength?: number;
  rows?: number;
}

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'project' | 'thread';
  onClick?: () => void;
  style?: React.CSSProperties;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}