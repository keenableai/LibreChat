import type { SearchCategories } from 'librechat-data-provider';

export type TWebSearchKeys =
  | 'serperApiKey'
  | 'searxngInstanceUrl'
  | 'searxngApiKey'
  | 'firecrawlApiKey'
  | 'firecrawlApiUrl'
  | 'firecrawlVersion'
  | 'jinaApiKey'
  | 'jinaApiUrl'
  | 'cohereApiKey'
  | 'keenableApiKey'
  | 'keenableApiUrl'
  | 'searchProfile';

export type TWebSearchCategories =
  | SearchCategories.PROVIDERS
  | SearchCategories.SCRAPERS
  | SearchCategories.RERANKERS;
