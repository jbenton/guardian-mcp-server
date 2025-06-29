import { GuardianClient } from '../api/guardian-client.js';
import { formatSectionsResponse } from '../utils/formatters.js';

export async function guardianGetSections(client: GuardianClient, args: any): Promise<string> {
  const response = await client.getSections();
  const sections = response.response.results;

  return formatSectionsResponse(sections);
}