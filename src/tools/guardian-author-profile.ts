import { GuardianClient } from '../api/guardian-client.js';
import { AuthorProfileParamsSchema } from '../types/guardian.js';
import { validateDate } from '../utils/formatters.js';

interface AuthorStats {
  totalArticles: number;
  sectionCoverage: Record<string, number>;
  monthlyOutput: Record<string, number>;
  averageWordCount: number;
  topTags: Record<string, number>;
  recentHeadlines: string[];
}

export async function guardianAuthorProfile(client: GuardianClient, args: any): Promise<string> {
  const params = AuthorProfileParamsSchema.parse(args);

  // Handle analysis period - can be year or date range
  let fromDate: string;
  let toDate: string;
  
  if (params.analysis_period && !params.from_date && !params.to_date) {
    // Handle year format like "2024"
    const year = params.analysis_period;
    if (/^\d{4}$/.test(year)) {
      fromDate = `${year}-01-01`;
      toDate = `${year}-12-31`;
    } else {
      throw new Error('analysis_period must be a 4-digit year (e.g., "2024")');
    }
  } else if (params.from_date && params.to_date) {
    fromDate = validateDate(params.from_date) || params.from_date;
    toDate = validateDate(params.to_date) || params.to_date;
  } else {
    // Default to last year
    const now = new Date();
    fromDate = `${now.getFullYear() - 1}-01-01`;
    toDate = `${now.getFullYear() - 1}-12-31`;
  }

  if (!validateDate(fromDate) || !validateDate(toDate)) {
    throw new Error('Invalid date format. Use YYYY-MM-DD format.');
  }

  let result = `Author Profile: ${params.author} (${fromDate} to ${toDate})\n\n`;

  // Search for all articles by the author in the period
  const searchParams: Record<string, any> = {
    q: `"${params.author}"`,
    'from-date': fromDate,
    'to-date': toDate,
    'page-size': 200, // Get as many as possible for analysis
    'show-fields': 'headline,byline,firstPublicationDate,wordcount,standfirst',
    'show-tags': 'keyword,type',
    'order-by': 'newest'
  };

  const response = await client.search(searchParams);
  const allArticles = response.response.results;

  // Filter to only articles where the author name appears in the byline
  const authorArticles = allArticles.filter(article => {
    const byline = article.fields?.byline || '';
    return byline.toLowerCase().includes(params.author.toLowerCase());
  });

  if (authorArticles.length === 0) {
    return `No articles found for author "${params.author}" in the specified period.`;
  }

  const stats: AuthorStats = {
    totalArticles: authorArticles.length,
    sectionCoverage: {},
    monthlyOutput: {},
    averageWordCount: 0,
    topTags: {},
    recentHeadlines: []
  };

  // Analyze the articles
  let totalWords = 0;
  let wordCountArticles = 0;

  authorArticles.forEach(article => {
    // Section coverage
    const section = article.sectionName || 'Unknown';
    stats.sectionCoverage[section] = (stats.sectionCoverage[section] || 0) + 1;

    // Monthly output
    if (article.fields?.firstPublicationDate) {
      const date = new Date(article.fields.firstPublicationDate);
      const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      stats.monthlyOutput[monthKey] = (stats.monthlyOutput[monthKey] || 0) + 1;
    }

    // Word count analysis
    if (article.fields?.wordcount && !isNaN(Number(article.fields.wordcount))) {
      totalWords += Number(article.fields.wordcount);
      wordCountArticles++;
    }

    // Tag analysis
    if (article.tags) {
      article.tags.forEach(tag => {
        if (tag.type === 'keyword') {
          stats.topTags[tag.webTitle] = (stats.topTags[tag.webTitle] || 0) + 1;
        }
      });
    }

    // Recent headlines (first 5)
    if (stats.recentHeadlines.length < 5) {
      stats.recentHeadlines.push(article.webTitle || 'Untitled');
    }
  });

  stats.averageWordCount = wordCountArticles > 0 ? Math.round(totalWords / wordCountArticles) : 0;

  // Format the results
  result += `**Publishing Statistics**\n`;
  result += `• Total Articles: ${stats.totalArticles}\n`;
  result += `• Average Word Count: ${stats.averageWordCount} words\n`;
  
  const avgPerMonth = (stats.totalArticles / 12).toFixed(1);
  result += `• Average Output: ${avgPerMonth} articles per month\n\n`;

  // Section coverage
  result += `**Section Coverage**\n`;
  const sortedSections = Object.entries(stats.sectionCoverage)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8);
  
  sortedSections.forEach(([section, count]) => {
    const percentage = ((count / stats.totalArticles) * 100).toFixed(1);
    result += `• ${section}: ${count} articles (${percentage}%)\n`;
  });
  result += '\n';

  // Monthly activity (show top 6 months)
  result += `**Most Active Months**\n`;
  const sortedMonths = Object.entries(stats.monthlyOutput)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 6);
  
  sortedMonths.forEach(([month, count]) => {
    result += `• ${month}: ${count} articles\n`;
  });
  result += '\n';

  // Top topics/tags
  result += `**Top Topics**\n`;
  const sortedTags = Object.entries(stats.topTags)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);
  
  sortedTags.forEach(([tag, count]) => {
    result += `• ${tag}: ${count} articles\n`;
  });
  result += '\n';

  // Recent work
  result += `**Recent Headlines**\n`;
  stats.recentHeadlines.forEach((headline, index) => {
    result += `${index + 1}. ${headline}\n`;
  });

  // Writing patterns analysis
  result += `\n**Writing Patterns**\n`;
  
  // Determine writing style based on word count
  if (stats.averageWordCount < 400) {
    result += `• Style: Brief news reporting (avg. ${stats.averageWordCount} words)\n`;
  } else if (stats.averageWordCount < 800) {
    result += `• Style: Standard journalism (avg. ${stats.averageWordCount} words)\n`;
  } else {
    result += `• Style: Long-form analysis (avg. ${stats.averageWordCount} words)\n`;
  }

  // Specialization analysis
  const topSection = sortedSections[0];
  if (topSection && (topSection[1] / stats.totalArticles) > 0.5) {
    result += `• Specialization: ${topSection[0]} specialist (${((topSection[1] / stats.totalArticles) * 100).toFixed(1)}% coverage)\n`;
  } else {
    result += `• Specialization: Multi-section correspondent\n`;
  }

  return result;
}