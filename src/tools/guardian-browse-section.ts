import { GuardianClient } from '../api/guardian-client.js';
import { BrowseSectionParamsSchema } from '../types/guardian.js';
import { formatArticleResponse, calculateDateFromDaysBack } from '../utils/formatters.js';

export async function guardianBrowseSection(client: GuardianClient, args: any): Promise<string> {
  const params = BrowseSectionParamsSchema.parse(args);

  const daysBack = params.days_back || 7;
  const fromDate = calculateDateFromDaysBack(daysBack);

  const searchParams: Record<string, any> = {
    section: params.section,
    'from-date': fromDate,
    'order-by': 'newest',
    'page-size': params.page_size || 20,
    'show-fields': 'headline,standfirst,byline,publication,firstPublicationDate'
  };

  const response = await client.search(searchParams);
  const articles = response.response.results;
  const pagination = response.response;

  // For search results, default to truncated content for performance
  const formatOptions = { truncate: true, maxLength: 500 };
  return formatArticleResponse(articles, pagination, formatOptions);
}