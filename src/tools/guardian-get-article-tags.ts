import { GuardianClient } from '../api/guardian-client.js';
import { parseGuardianUrl } from '../utils/formatters.js';
import { z } from 'zod';

const GetArticleTagsParamsSchema = z.object({
  article_id: z.string(),
});

export async function guardianGetArticleTags(client: GuardianClient, args: any): Promise<string> {
  const params = GetArticleTagsParamsSchema.parse(args);

  // Parse URL if provided instead of article ID
  const articleId = parseGuardianUrl(params.article_id);
  
  const response = await client.getArticle(articleId, {
    'show-tags': 'all',
    'show-fields': 'headline'
  });

  const content = response.response.content;
  if (!content) {
    return 'Article not found.';
  }

  const tags = content.tags || [];
  if (tags.length === 0) {
    return `Article "${content.webTitle || 'Unknown'}" has no tags.`;
  }

  let result = `Tags for "${content.webTitle || 'Unknown'}" (${tags.length} total):\n\n`;

  // Group tags by type for better organization
  const tagsByType: Record<string, any[]> = {};
  tags.forEach(tag => {
    const type = tag.type || 'unknown';
    if (!tagsByType[type]) {
      tagsByType[type] = [];
    }
    tagsByType[type].push(tag);
  });

  // Display tags organized by type
  Object.entries(tagsByType).forEach(([type, typeTags]) => {
    result += `**${type.charAt(0).toUpperCase() + type.slice(1)} (${typeTags.length})**\n`;
    typeTags.forEach(tag => {
      result += `• ${tag.webTitle} (${tag.id})\n`;
    });
    result += '\n';
  });

  result += `These tags are used for similarity matching in guardian_find_related tool.`;

  return result;
}