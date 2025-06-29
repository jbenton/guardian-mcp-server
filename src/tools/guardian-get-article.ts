import { GuardianClient } from '../api/guardian-client.js';
import { GetArticleParamsSchema } from '../types/guardian.js';
import { formatArticleResponse, parseGuardianUrl } from '../utils/formatters.js';

export async function guardianGetArticle(client: GuardianClient, args: any): Promise<string> {
  const params = GetArticleParamsSchema.parse(args);

  // Parse URL if provided instead of article ID
  const articleId = parseGuardianUrl(params.article_id);
  
  const showFields = params.show_fields || 'headline,standfirst,body,byline,publication,firstPublicationDate';
  
  const response = await client.getArticle(articleId, {
    'show-fields': showFields,
    'show-tags': 'all'
  });

  const content = response.response.content;
  if (content) {
    // For v2.0: Default to full content, allow truncation if explicitly requested
    const formatOptions = {
      truncate: params.truncate ?? false,
      maxLength: 500,
      showTags: true
    };
    return formatArticleResponse([content], undefined, formatOptions);
  } else {
    return 'Article not found.';
  }
}