import { z } from 'zod';

// Guardian API response types
export interface GuardianArticle {
  id: string;
  type: string;
  sectionId: string;
  sectionName: string;
  webPublicationDate: string;
  webTitle: string;
  webUrl: string;
  apiUrl: string;
  fields?: {
    headline?: string;
    standfirst?: string;
    body?: string;
    byline?: string;
    thumbnail?: string;
    publication?: string;
    firstPublicationDate?: string;
    wordcount?: string;
  };
  tags?: GuardianTag[];
}

export interface GuardianTag {
  id: string;
  type: string;
  webTitle: string;
  webUrl: string;
  apiUrl: string;
}

export interface GuardianSection {
  id: string;
  webTitle: string;
  webUrl: string;
  apiUrl: string;
}

export interface GuardianResponse<T> {
  status: string;
  userTier: string;
  total: number;
  startIndex: number;
  pageSize: number;
  currentPage: number;
  pages: number;
  orderBy: string;
  results: T[];
}

export interface GuardianContentResponse {
  status: string;
  userTier: string;
  total: number;
  content: GuardianArticle;
}

export interface GuardianApiResponse<T> {
  response: T;
}

// Zod schemas for validation
export const SearchParamsSchema = z.object({
  query: z.string().optional(),
  section: z.string().optional(),
  tag: z.string().optional(),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  order_by: z.enum(['newest', 'oldest', 'relevance']).optional(),
  page_size: z.number().min(1).max(200).optional(),
  page: z.number().min(1).optional(),
  show_fields: z.string().optional(),
  production_office: z.enum(['uk', 'us', 'au']).optional(),
  detail_level: z.enum(['minimal', 'standard', 'full']).optional(),
});

export const GetArticleParamsSchema = z.object({
  article_id: z.string(),
  show_fields: z.string().optional(),
  truncate: z.boolean().optional(),
});

export const LongReadParamsSchema = z.object({
  query: z.string().optional(),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  page_size: z.number().min(1).max(200).optional(),
  page: z.number().min(1).optional(),
});

export const LookbackParamsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  section: z.string().optional(),
  page_size: z.number().min(1).max(200).optional(),
});

export const BrowseSectionParamsSchema = z.object({
  section: z.string(),
  days_back: z.number().min(1).max(365).optional(),
  page_size: z.number().min(1).max(200).optional(),
});

export const SearchTagsParamsSchema = z.object({
  query: z.string(),
  page_size: z.number().min(1).max(200).optional(),
  page: z.number().min(1).optional(),
});

export const SearchByLengthParamsSchema = z.object({
  query: z.string().optional(),
  min_words: z.number().min(0).optional(),
  max_words: z.number().min(1).optional(),
  section: z.string().optional(),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  order_by: z.enum(['newest', 'oldest', 'relevance']).optional(),
  page_size: z.number().min(1).max(200).optional(),
});

export const SearchByAuthorParamsSchema = z.object({
  author: z.string(),
  query: z.string().optional(),
  section: z.string().optional(),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  order_by: z.enum(['newest', 'oldest', 'relevance']).optional(),
  page_size: z.number().min(1).max(200).optional(),
  page: z.number().min(1).optional(),
});

export const FindRelatedParamsSchema = z.object({
  article_id: z.string(),
  similarity_threshold: z.number().min(1).max(10).optional(),
  exclude_same_section: z.boolean().optional(),
  max_days_old: z.number().min(1).optional(),
  page_size: z.number().min(1).max(50).optional(),
});

export type SearchParams = z.infer<typeof SearchParamsSchema>;
export type GetArticleParams = z.infer<typeof GetArticleParamsSchema>;
export type LongReadParams = z.infer<typeof LongReadParamsSchema>;
export type LookbackParams = z.infer<typeof LookbackParamsSchema>;
export type BrowseSectionParams = z.infer<typeof BrowseSectionParamsSchema>;
export type SearchTagsParams = z.infer<typeof SearchTagsParamsSchema>;
export type SearchByLengthParams = z.infer<typeof SearchByLengthParamsSchema>;
export type SearchByAuthorParams = z.infer<typeof SearchByAuthorParamsSchema>;
export type FindRelatedParams = z.infer<typeof FindRelatedParamsSchema>;

// New analytical tools schemas
export const ContentTimelineParamsSchema = z.object({
  query: z.string(),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  interval: z.enum(['day', 'week', 'month', 'quarter']).optional(),
  section: z.string().optional(),
});

export const AuthorProfileParamsSchema = z.object({
  author: z.string(),
  analysis_period: z.string().optional(), // Can be year like "2024" or date range
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const TopicTrendsParamsSchema = z.object({
  topics: z.array(z.string()).min(1).max(5),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  interval: z.enum(['month', 'quarter', 'year']).optional(),
});

export const TopStoriesByDateParamsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  story_count: z.number().min(1).max(20).optional(),
  section: z.string().optional(),
});

export const RecommendLongreadsParamsSchema = z.object({
  count: z.number().min(1).max(10).optional(),
  context: z.string().optional(),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  topic_preference: z.string().optional(),
});

export type ContentTimelineParams = z.infer<typeof ContentTimelineParamsSchema>;
export type AuthorProfileParams = z.infer<typeof AuthorProfileParamsSchema>;
export type TopicTrendsParams = z.infer<typeof TopicTrendsParamsSchema>;
export type TopStoriesByDateParams = z.infer<typeof TopStoriesByDateParamsSchema>;
export type RecommendLongreadsParams = z.infer<typeof RecommendLongreadsParamsSchema>;