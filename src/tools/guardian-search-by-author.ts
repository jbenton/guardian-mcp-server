import { GuardianClient } from '../api/guardian-client.js';
import { SearchByAuthorParamsSchema } from '../types/guardian.js';
import { validateDate } from '../utils/formatters.js';

export async function guardianSearchByAuthor(client: GuardianClient, args: any): Promise<string> {
  const params = SearchByAuthorParamsSchema.parse(args);

  // Build search parameters - we'll search for the author name in the byline
  const searchParams: Record<string, any> = {
    'show-fields': 'headline,standfirst,byline,publication,firstPublicationDate,wordcount',
    'order-by': params.order_by || 'newest',
    'page-size': params.page_size || 20,
    page: params.page || 1
  };

  // Combine author search with optional query
  if (params.query) {
    searchParams.q = `"${params.author}" ${params.query}`;
  } else {
    searchParams.q = `"${params.author}"`;
  }

  if (params.section) {
    searchParams.section = params.section;
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

  // Filter to only articles where the author name appears in the byline
  const authorArticles = articles.filter(article => {
    const byline = article.fields?.byline || '';
    return byline.toLowerCase().includes(params.author.toLowerCase());
  });

  if (authorArticles.length > 0) {
    const pagination = response.response;
    let result = `Found ${authorArticles.length} article(s) by ${params.author}:\n\n`;

    authorArticles.forEach((article, index) => {
      result += `**${index + 1}. ${article.webTitle || 'Untitled'}**\n`;

      if (article.fields) {
        const { fields } = article;
        
        if (fields.byline) {
          result += `By: ${fields.byline}\n`;
        }
        
        if (fields.firstPublicationDate) {
          const pubDate = fields.firstPublicationDate.substring(0, 10);
          result += `Published: ${pubDate}\n`;
        }
        
        if (fields.wordcount) {
          result += `Word count: ${fields.wordcount}\n`;
        }
        
        if (fields.standfirst) {
          result += `Summary: ${fields.standfirst}\n`;
        }
      }

      result += `Section: ${article.sectionName || 'Unknown'}\n`;
      result += `URL: ${article.webUrl || 'N/A'}\n\n`;
    });

    if (pagination.pages > 1) {
      result += `\nPagination: Page ${pagination.currentPage} of ${pagination.pages}\n`;
    }

    return result;
  } else {
    return `No articles found by author '${params.author}'.`;
  }
}