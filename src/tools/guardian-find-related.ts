import { GuardianClient } from '../api/guardian-client.js';
import { FindRelatedParamsSchema } from '../types/guardian.js';
import { parseGuardianUrl } from '../utils/formatters.js';

export async function guardianFindRelated(client: GuardianClient, args: any): Promise<string> {
  const params = FindRelatedParamsSchema.parse(args);

  // First, get the original article with all its tags
  const parsedId = parseGuardianUrl(params.article_id);
  const articleId = parsedId.startsWith('/') ? parsedId : `/${parsedId}`;
  
  const response = await client.getArticle(articleId, {
    'show-tags': 'all',
    'show-fields': 'headline,firstPublicationDate'
  });

  const originalArticle = response.response.content;
  if (!originalArticle) {
    return 'Original article not found.';
  }

  const originalTags = originalArticle.tags || [];
  const originalSection = originalArticle.sectionId;
  const originalDate = originalArticle.webPublicationDate;

  if (originalTags.length === 0) {
    return 'Original article has no tags for similarity matching.';
  }

  // Extract useful tags (excluding very generic ones)
  const usefulTags = originalTags
    .filter(tag => {
      const tagType = tag.type;
      const tagId = tag.id;
      // Focus on more specific tags
      return ['keyword', 'contributor', 'series'].includes(tagType) && tagId.split('/').length >= 2;
    })
    .map(tag => tag.id);

  if (usefulTags.length === 0) {
    return 'Original article has no specific tags for similarity matching.';
  }

  // Search for articles with shared tags
  const similarityThreshold = params.similarity_threshold || 2;
  const excludeSameSection = params.exclude_same_section || false;
  const maxDaysOld = params.max_days_old;

  const relatedArticles: any[] = [];

  // Search for each tag and collect results (limit to first 5 tags to avoid too many API calls)
  for (const tag of usefulTags.slice(0, 5)) {
    const searchParams: Record<string, any> = {
      tag: tag,
      'show-tags': 'all',
      'show-fields': 'headline,standfirst,byline,publication,firstPublicationDate',
      'page-size': 20
    };

    if (maxDaysOld && originalDate) {
      // Calculate date range
      const origDate = new Date(originalDate);
      const minDate = new Date(origDate.getTime() - maxDaysOld * 24 * 60 * 60 * 1000);
      const maxDate = new Date(origDate.getTime() + maxDaysOld * 24 * 60 * 60 * 1000);
      
      searchParams['from-date'] = minDate.toISOString().substring(0, 10);
      searchParams['to-date'] = maxDate.toISOString().substring(0, 10);
    }

    try {
      const tagResponse = await client.search(searchParams);
      const articles = tagResponse.response.results;
      
      for (const article of articles) {
        if (article.id !== originalArticle.id) { // Exclude original
          relatedArticles.push(article);
        }
      }
    } catch (error) {
      // Continue with other tags if one fails
      continue;
    }
  }

  // Count shared tags and rank by similarity
  const similarityScores: Record<string, { article: any; sharedTags: number }> = {};
  
  for (const article of relatedArticles) {
    const articleId = article.id;
    if (!(articleId in similarityScores)) {
      const articleTags = (article.tags || []).map((tag: any) => tag.id);
      const sharedCount = usefulTags.filter(tag => articleTags.includes(tag)).length;

      // Apply filters
      if (excludeSameSection && article.sectionId === originalSection) {
        continue;
      }

      if (sharedCount >= similarityThreshold) {
        similarityScores[articleId] = {
          article: article,
          sharedTags: sharedCount
        };
      }
    }
  }

  // Sort by similarity and limit results
  const pageSize = params.page_size || 10;
  const sortedSimilar = Object.values(similarityScores)
    .sort((a, b) => b.sharedTags - a.sharedTags)
    .slice(0, pageSize);

  if (sortedSimilar.length > 0) {
    let result = `Found ${sortedSimilar.length} related article(s) to '${originalArticle.webTitle || 'Unknown'}':\n\n`;

    sortedSimilar.forEach((item, index) => {
      const article = item.article;
      const sharedCount = item.sharedTags;

      result += `**${index + 1}. ${article.webTitle || 'Untitled'}** (Similarity: ${sharedCount} shared tags)\n`;

      // Show shared tags for transparency
      const articleTags = (article.tags || []).map((tag: any) => tag.id);
      const sharedTags = usefulTags.filter(tag => articleTags.includes(tag));
      if (sharedTags.length > 0) {
        result += `Shared tags: ${sharedTags.slice(0, 3).join(', ')}${sharedTags.length > 3 ? ' (+' + (sharedTags.length - 3) + ' more)' : ''}\n`;
      }

      if (article.fields) {
        const { fields } = article;
        
        if (fields.byline) {
          result += `By: ${fields.byline}\n`;
        }
        
        if (fields.firstPublicationDate) {
          const pubDate = fields.firstPublicationDate.substring(0, 10);
          result += `Published: ${pubDate}\n`;
        }
        
        if (fields.standfirst) {
          result += `Summary: ${fields.standfirst}\n`;
        }
      }

      result += `Section: ${article.sectionName || 'Unknown'}\n`;
      result += `URL: ${article.webUrl || 'N/A'}\n\n`;
    });

    return result;
  } else {
    return `No related articles found with at least ${similarityThreshold} shared tags.`;
  }
}