import { GuardianClient } from '../api/guardian-client.js';
import { LookbackParamsSchema } from '../types/guardian.js';
import { formatArticleResponse, validateDate } from '../utils/formatters.js';

export async function guardianLookback(client: GuardianClient, args: any): Promise<string> {
  const params = LookbackParamsSchema.parse(args);

  const fromDate = validateDate(params.date);
  if (!fromDate) {
    throw new Error(`Invalid date format: ${params.date}. Use YYYY-MM-DD format.`);
  }

  const searchParams: Record<string, any> = {
    'from-date': fromDate,
    'order-by': 'newest',
    'page-size': params.page_size || 20,
    'show-fields': 'headline,standfirst,byline,publication,firstPublicationDate'
  };

  if (params.end_date) {
    const toDate = validateDate(params.end_date);
    if (!toDate) {
      throw new Error(`Invalid end_date format: ${params.end_date}. Use YYYY-MM-DD format.`);
    }
    searchParams['to-date'] = toDate;
  } else {
    // If no end date, use the same date
    searchParams['to-date'] = fromDate;
  }

  if (params.section) {
    searchParams.section = params.section;
  }

  const response = await client.search(searchParams);
  const articles = response.response.results;
  const pagination = response.response;

  // For search results, default to truncated content for performance
  const formatOptions = { truncate: true, maxLength: 500 };
  return formatArticleResponse(articles, pagination, formatOptions);
}