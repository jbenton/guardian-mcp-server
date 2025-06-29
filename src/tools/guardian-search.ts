import { GuardianClient } from '../api/guardian-client.js';
import { SearchParamsSchema } from '../types/guardian.js';
import { formatArticleResponse, validateDate } from '../utils/formatters.js';

export async function guardianSearch(client: GuardianClient, args: any): Promise<string> {
  const params = SearchParamsSchema.parse(args);

  // Build search parameters for Guardian API
  const searchParams: Record<string, any> = {};

  if (params.query) {
    searchParams.q = params.query;
  }
  if (params.section) {
    searchParams.section = params.section;
  }
  if (params.tag) {
    searchParams.tag = params.tag;
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
  
  searchParams['order-by'] = params.order_by || 'relevance';
  searchParams['page-size'] = params.page_size || 20;
  searchParams.page = params.page || 1;
  
  // Handle detail_level for performance optimization
  const detailLevel = params.detail_level || 'minimal';
  let showFields = params.show_fields;
  
  if (!showFields) {
    switch (detailLevel) {
      case 'minimal':
        showFields = 'headline,sectionName,webPublicationDate';
        break;
      case 'standard':
        showFields = 'headline,standfirst,byline,publication,firstPublicationDate';
        break;
      case 'full':
        showFields = 'headline,standfirst,body,byline,publication,firstPublicationDate,wordcount';
        break;
    }
  }
  
  searchParams['show-fields'] = showFields;
  
  if (params.production_office) {
    searchParams['production-office'] = params.production_office;
  }

  const response = await client.search(searchParams);
  const articles = response.response.results;
  const pagination = response.response;

  // Apply truncation based on detail level
  const formatOptions = {
    truncate: detailLevel !== 'full', // Only show full content for 'full' detail level
    maxLength: 500
  };
  return formatArticleResponse(articles, pagination, formatOptions);
}