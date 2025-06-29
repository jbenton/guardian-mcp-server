import { GuardianClient } from '../api/guardian-client.js';
import { guardianSearch } from './guardian-search.js';
import { guardianGetArticle } from './guardian-get-article.js';
import { guardianLongread } from './guardian-longread.js';
import { guardianLookback } from './guardian-lookback.js';
import { guardianBrowseSection } from './guardian-browse-section.js';
import { guardianGetSections } from './guardian-get-sections.js';
import { guardianSearchTags } from './guardian-search-tags.js';
import { guardianSearchByLength } from './guardian-search-by-length.js';
import { guardianSearchByAuthor } from './guardian-search-by-author.js';
import { guardianFindRelated } from './guardian-find-related.js';
import { guardianGetArticleTags } from './guardian-get-article-tags.js';
import { guardianContentTimeline } from './guardian-content-timeline.js';
import { guardianAuthorProfile } from './guardian-author-profile.js';
import { guardianTopicTrends } from './guardian-topic-trends.js';
import { guardianTopStoriesByDate } from './guardian-top-stories-by-date.js';
import { guardianRecommendLongreads } from './guardian-recommend-longreads.js';

export type ToolHandler = (args: any) => Promise<string>;

export function registerTools(client: GuardianClient): Record<string, ToolHandler> {
  return {
    guardian_search: (args) => guardianSearch(client, args),
    guardian_get_article: (args) => guardianGetArticle(client, args),
    guardian_longread: (args) => guardianLongread(client, args),
    guardian_lookback: (args) => guardianLookback(client, args),
    guardian_browse_section: (args) => guardianBrowseSection(client, args),
    guardian_get_sections: (args) => guardianGetSections(client, args),
    guardian_search_tags: (args) => guardianSearchTags(client, args),
    guardian_search_by_length: (args) => guardianSearchByLength(client, args),
    guardian_search_by_author: (args) => guardianSearchByAuthor(client, args),
    guardian_find_related: (args) => guardianFindRelated(client, args),
    guardian_get_article_tags: (args) => guardianGetArticleTags(client, args),
    guardian_content_timeline: (args) => guardianContentTimeline(client, args),
    guardian_author_profile: (args) => guardianAuthorProfile(client, args),
    guardian_topic_trends: (args) => guardianTopicTrends(client, args),
    guardian_top_stories_by_date: (args) => guardianTopStoriesByDate(client, args),
    guardian_recommend_longreads: (args) => guardianRecommendLongreads(client, args),
  };
}