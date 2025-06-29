import { GuardianClient } from '../api/guardian-client.js';
import { LongReadParamsSchema } from '../types/guardian.js';
import { formatArticleResponse, validateDate } from '../utils/formatters.js';

export async function guardianLongread(client: GuardianClient, args: any): Promise<string> {
  const params = LongReadParamsSchema.parse(args);

  // Search for Long Read articles using the specific tag
  const searchParams: Record<string, any> = {
    tag: 'news/series/the-long-read',
    'page-size': params.page_size || 10,
    page: params.page || 1,
    'show-fields': 'headline,standfirst,body,byline,thumbnail,publication,firstPublicationDate'
  };

  if (params.query) {
    searchParams.q = params.query;
  }
  if (params.from_date) {
    const fromDate = validateDate(params.from_date);
    if (!fromDate) {
      throw new Error(`Invalid from_date format: ${params.from_date}. Use YYYY-MM-DD format.`);
    }
    searchParams['from-date'] = fromDate;
  }
  if (params.to_date) {
    const toDate = validateDate(params.to_date);
    if (!toDate) {
      throw new Error(`Invalid to_date format: ${params.to_date}. Use YYYY-MM-DD format.`);
    }
    searchParams['to-date'] = toDate;
  }

  const response = await client.search(searchParams);
  const articles = response.response.results;
  const pagination = response.response;

  // For search results, default to truncated content for performance
  const formatOptions = { truncate: true, maxLength: 500 };
  return formatArticleResponse(articles, pagination, formatOptions);
}