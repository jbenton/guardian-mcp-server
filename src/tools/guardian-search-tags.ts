import { GuardianClient } from '../api/guardian-client.js';
import { SearchTagsParamsSchema } from '../types/guardian.js';
import { formatTagsResponse } from '../utils/formatters.js';

export async function guardianSearchTags(client: GuardianClient, args: any): Promise<string> {
  const params = SearchTagsParamsSchema.parse(args);

  const searchParams: Record<string, any> = {
    q: params.query,
    'page-size': params.page_size || 20,
    page: params.page || 1
  };

  const response = await client.searchTags(searchParams);
  const tags = response.response.results;
  const pagination = response.response;

  return formatTagsResponse(tags, params.query, pagination);
}