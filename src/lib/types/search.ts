export type SearchEntityType =
  | 'project'
  | 'event'
  | 'thread'
  | 'channel'
  | 'community'
  | 'user'
  | 'help_request'
  | 'post';

export type SearchResultKind =
  | 'project'
  | 'thread'
  | 'event'
  | 'channel'
  | 'community'
  | 'profile'
  | 'help-request'
  | 'post';

export interface SearchResultItem {
  id: string;
  kind: SearchResultKind;
  title: string;
  summary: string;
  href: string;
  meta: string;
}

export interface SearchPageData {
  query: string;
  suggestedQueries: string[];
  results: SearchResultItem[];
  entityType?: SearchEntityType | 'all';
}