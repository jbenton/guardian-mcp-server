import { GuardianClient } from '../api/guardian-client.js';
import { TopStoriesByDateParamsSchema } from '../types/guardian.js';
import { validateDate } from '../utils/formatters.js';

interface StoryScore {
  article: any;
  score: number;
  reasons: string[];
}

export async function guardianTopStoriesByDate(client: GuardianClient, args: any): Promise<string> {
  const params = TopStoriesByDateParamsSchema.parse(args);

  const date = validateDate(params.date);
  if (!date) {
    throw new Error(`Invalid date format: ${params.date}. Use YYYY-MM-DD format.`);
  }

  const storyCount = params.story_count || 10;

  // Get all articles from the specified date
  const searchParams: Record<string, any> = {
    'from-date': date,
    'to-date': date,
    'page-size': 200, // Get as many as possible for intelligent ranking
    'show-fields': 'headline,standfirst,byline,wordcount,firstPublicationDate',
    'show-tags': 'keyword,type',
    'order-by': 'newest'
  };

  if (params.section) {
    searchParams.section = params.section;
  }

  const response = await client.search(searchParams);
  const articles = response.response.results;

  if (articles.length === 0) {
    return `No articles found for ${date}${params.section ? ` in section "${params.section}"` : ''}.`;
  }

  // Score and rank articles using intelligent prioritization
  const scoredStories = articles.map(article => scoreStory(article, date));
  const topStories = scoredStories
    .sort((a, b) => b.score - a.score)
    .slice(0, storyCount);

  // Format results
  let result = `Top ${storyCount} Stories for ${formatDateForDisplay(date)}:\n`;
  
  if (params.section) {
    result += `Section: ${params.section}\n`;
  }
  
  result += `\n**Intelligent Story Ranking** (based on editorial importance, complexity, and newsworthiness)\n\n`;

  topStories.forEach((story, index) => {
    const article = story.article;
    const rank = index + 1;
    const trophy = rank === 1 ? '🏆 ' : rank === 2 ? '🥈 ' : rank === 3 ? '🥉 ' : `${rank}. `;
    
    result += `${trophy}**${article.webTitle || 'Untitled'}**\n`;
    result += `Score: ${story.score.toFixed(1)} (${story.reasons.join(', ')})\n`;
    
    if (article.fields) {
      const { fields } = article;
      
      if (fields.byline) {
        result += `By: ${fields.byline}\n`;
      }
      
      if (fields.standfirst) {
        result += `Summary: ${fields.standfirst}\n`;
      }
      
      if (fields.wordcount) {
        result += `Length: ${fields.wordcount} words\n`;
      }
    }
    
    result += `Section: ${article.sectionName || 'Unknown'}\n`;
    result += `URL: ${article.webUrl || 'N/A'}\n`;
    result += `Guardian ID: ${article.id || 'N/A'}\n\n`;
  });

  // Add analysis of the day's news landscape
  result += `**Day's News Analysis**:\n`;
  result += `• Total articles: ${articles.length}\n`;
  
  const sectionBreakdown = getSectionBreakdown(articles);
  result += `• Top sections: ${sectionBreakdown.slice(0, 3).map(s => `${s.section} (${s.count})`).join(', ')}\n`;
  
  const avgScore = topStories.reduce((sum, story) => sum + story.score, 0) / topStories.length;
  result += `• Average story importance: ${avgScore.toFixed(1)}/100\n`;

  const complexStories = topStories.filter(s => s.reasons.includes('high complexity')).length;
  if (complexStories > 0) {
    result += `• Major breaking news events: ${complexStories}\n`;
  }

  return result;
}

function scoreStory(article: any, date: string): StoryScore {
  let score = 0;
  const reasons: string[] = [];

  // Base score from section importance
  const sectionScore = getSectionImportance(article.sectionName);
  score += sectionScore.score;
  if (sectionScore.reason) reasons.push(sectionScore.reason);

  // Word count indicates story complexity and importance
  const wordCount = article.fields?.wordcount ? parseInt(article.fields.wordcount) : 0;
  if (wordCount > 1500) {
    score += 20;
    reasons.push('high complexity');
  } else if (wordCount > 800) {
    score += 10;
    reasons.push('detailed coverage');
  } else if (wordCount < 300) {
    score -= 5; // Brief items are less likely to be top stories
  }

  // Breaking news patterns (published early in the day often indicates urgency)
  if (article.fields?.firstPublicationDate) {
    const pubTime = new Date(article.fields.firstPublicationDate);
    const hour = pubTime.getHours();
    
    if (hour >= 6 && hour <= 10) {
      score += 15;
      reasons.push('morning breaking news');
    } else if (hour >= 11 && hour <= 14) {
      score += 10;
      reasons.push('midday update');
    }
  }

  // Headline analysis for importance indicators
  const headline = article.webTitle?.toLowerCase() || '';
  const importanceKeywords = [
    { words: ['breaking', 'urgent', 'exclusive'], score: 25, label: 'breaking news' },
    { words: ['crisis', 'scandal', 'investigation'], score: 20, label: 'major story' },
    { words: ['election', 'vote', 'poll'], score: 18, label: 'political significance' },
    { words: ['dies', 'dead', 'death', 'killed'], score: 18, label: 'major news' },
    { words: ['wins', 'victory', 'defeat'], score: 15, label: 'significant outcome' },
    { words: ['announces', 'reveals', 'confirms'], score: 12, label: 'official news' },
    { words: ['budget', 'economy', 'recession'], score: 15, label: 'economic importance' },
    { words: ['war', 'attack', 'conflict'], score: 22, label: 'international crisis' },
    { words: ['climate', 'environment', 'warming'], score: 12, label: 'environmental story' }
  ];

  for (const keyword of importanceKeywords) {
    if (keyword.words.some(word => headline.includes(word))) {
      score += keyword.score;
      reasons.push(keyword.label);
      break; // Only count one category per headline
    }
  }

  // Tag analysis for topic importance
  if (article.tags) {
    const importantTags = article.tags.filter((tag: any) => 
      ['politics', 'world', 'brexit', 'trump', 'climate', 'coronavirus', 'economy'].some(important => 
        tag.id.toLowerCase().includes(important)
      )
    );
    
    if (importantTags.length > 0) {
      score += importantTags.length * 8;
      reasons.push('major topic');
    }
  }

  // Byline analysis - senior correspondents often handle bigger stories
  const byline = article.fields?.byline?.toLowerCase() || '';
  const seniorIndicators = ['editor', 'correspondent', 'chief', 'political', 'foreign', 'diplomatic'];
  if (seniorIndicators.some(indicator => byline.includes(indicator))) {
    score += 10;
    reasons.push('senior correspondent');
  }

  // Ensure score is within reasonable bounds
  score = Math.max(0, Math.min(100, score));

  return { article, score, reasons };
}

function getSectionImportance(sectionName: string): { score: number; reason?: string } {
  const section = sectionName?.toLowerCase() || '';
  
  // Priority sections based on editorial importance
  const sectionScores: Record<string, { score: number; reason: string }> = {
    'politics': { score: 30, reason: 'politics priority' },
    'world': { score: 28, reason: 'world news priority' },
    'uk news': { score: 25, reason: 'national news' },
    'us news': { score: 25, reason: 'us news priority' },
    'business': { score: 22, reason: 'business importance' },
    'environment': { score: 20, reason: 'environmental priority' },
    'society': { score: 18, reason: 'social importance' },
    'science': { score: 16, reason: 'science priority' },
    'technology': { score: 15, reason: 'tech significance' },
    'culture': { score: 12, reason: 'cultural story' },
    'sport': { score: 10, reason: 'sports story' },
    'lifestyle': { score: 8, reason: 'lifestyle content' },
    'opinion': { score: 5, reason: 'opinion piece' }
  };

  for (const [key, value] of Object.entries(sectionScores)) {
    if (section.includes(key)) {
      return value;
    }
  }

  return { score: 10 }; // Default base score
}

function getSectionBreakdown(articles: any[]): { section: string; count: number }[] {
  const sectionCounts: Record<string, number> = {};
  
  articles.forEach(article => {
    const section = article.sectionName || 'Unknown';
    sectionCounts[section] = (sectionCounts[section] || 0) + 1;
  });

  return Object.entries(sectionCounts)
    .map(([section, count]) => ({ section, count }))
    .sort((a, b) => b.count - a.count);
}

function formatDateForDisplay(date: string): string {
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}