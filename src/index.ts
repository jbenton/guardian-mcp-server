#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  InitializeRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { GuardianClient, GuardianApiError } from './api/guardian-client.js';
import { registerTools } from './tools/index.js';

const SERVER_VERSION = '1.0.0';

class GuardianMcpServer {
  private server: Server;
  private guardianClient: GuardianClient;

  constructor() {
    this.server = new Server(
      {
        name: 'guardian',
        version: SERVER_VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    try {
      this.guardianClient = new GuardianClient();
    } catch (error) {
      console.error('Failed to initialize Guardian client:', error instanceof Error ? error.message : error);
      process.exit(1);
    }

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(InitializeRequestSchema, async (request) => {
      return {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: 'guardian',
          version: SERVER_VERSION,
        },
      };
    });

    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'guardian_search',
            description: 'Search Guardian articles with flexible filtering options',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search terms (can be empty to browse all content)',
                },
                section: {
                  type: 'string',
                  description: 'Filter by section ID (get available sections via guardian_get_sections)',
                },
                tag: {
                  type: 'string',
                  description: 'Filter by tag (over 50,000 available tags)',
                },
                from_date: {
                  type: 'string',
                  description: 'Start date (YYYY-MM-DD format)',
                },
                to_date: {
                  type: 'string',
                  description: 'End date (YYYY-MM-DD format)',
                },
                order_by: {
                  type: 'string',
                  description: "Sort order: 'newest', 'oldest', 'relevance' (default: 'relevance')",
                  enum: ['newest', 'oldest', 'relevance'],
                },
                page_size: {
                  type: 'integer',
                  description: 'Results per page, max 200 (default: 20)',
                  minimum: 1,
                  maximum: 200,
                },
                page: {
                  type: 'integer',
                  description: 'Page number (default: 1)',
                  minimum: 1,
                },
                show_fields: {
                  type: 'string',
                  description: 'Comma-separated fields to include (headline,standfirst,body,byline,thumbnail,publication)',
                },
                production_office: {
                  type: 'string',
                  description: "Filter by office: 'uk', 'us', 'au'",
                  enum: ['uk', 'us', 'au'],
                },
                detail_level: {
                  type: 'string',
                  description: "Response detail level: 'minimal' (fast), 'standard' (default), 'full' (complete)",
                  enum: ['minimal', 'standard', 'full'],
                },
              },
            },
          },
          {
            name: 'guardian_get_article',
            description: 'Retrieve full content of a specific Guardian article',
            inputSchema: {
              type: 'object',
              properties: {
                article_id: {
                  type: 'string',
                  description: 'The Guardian article ID or full URL (e.g., "politics/2024/dec/01/example" or "https://www.theguardian.com/politics/2024/dec/01/example")',
                },
                show_fields: {
                  type: 'string',
                  description: 'Fields to include (default: headline,standfirst,body,byline,publication,firstPublicationDate)',
                },
                truncate: {
                  type: 'boolean',
                  description: 'Whether to truncate content to preview length (default: false for full content)',
                },
              },
              required: ['article_id'],
            },
          },
          {
            name: 'guardian_longread',
            description: 'Search specifically for articles from The Long Read series',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search terms within Long Read articles',
                },
                from_date: {
                  type: 'string',
                  description: 'Start date (YYYY-MM-DD format)',
                },
                to_date: {
                  type: 'string',
                  description: 'End date (YYYY-MM-DD format)',
                },
                page_size: {
                  type: 'integer',
                  description: 'Results per page, max 200 (default: 10)',
                  minimum: 1,
                  maximum: 200,
                },
                page: {
                  type: 'integer',
                  description: 'Page number (default: 1)',
                  minimum: 1,
                },
              },
            },
          },
          {
            name: 'guardian_lookback',
            description: 'Find top stories from a specific date or date range',
            inputSchema: {
              type: 'object',
              properties: {
                date: {
                  type: 'string',
                  description: 'Specific date (YYYY-MM-DD) or start of range',
                },
                end_date: {
                  type: 'string',
                  description: 'End date for range (YYYY-MM-DD)',
                },
                section: {
                  type: 'string',
                  description: 'Filter by section',
                },
                page_size: {
                  type: 'integer',
                  description: 'Number of results (default: 20)',
                  minimum: 1,
                  maximum: 200,
                },
              },
              required: ['date'],
            },
          },
          {
            name: 'guardian_browse_section',
            description: 'Browse recent articles from a specific Guardian section',
            inputSchema: {
              type: 'object',
              properties: {
                section: {
                  type: 'string',
                  description: 'Section ID (use guardian_get_sections to find valid IDs)',
                },
                days_back: {
                  type: 'integer',
                  description: 'How many days back to search (default: 7)',
                  minimum: 1,
                  maximum: 365,
                },
                page_size: {
                  type: 'integer',
                  description: 'Number of results, max 200 (default: 20)',
                  minimum: 1,
                  maximum: 200,
                },
              },
              required: ['section'],
            },
          },
          {
            name: 'guardian_get_sections',
            description: 'Get all available Guardian sections',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'guardian_search_tags',
            description: "Search through Guardian's 50,000+ tags to find relevant ones",
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search term for tag names',
                },
                page_size: {
                  type: 'integer',
                  description: 'Results per page, max 200 (default: 20)',
                  minimum: 1,
                  maximum: 200,
                },
                page: {
                  type: 'integer',
                  description: 'Page number (default: 1)',
                  minimum: 1,
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'guardian_search_by_length',
            description: 'Search Guardian articles filtered by word count range',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search terms (optional)',
                },
                min_words: {
                  type: 'integer',
                  description: 'Minimum word count (default: 0)',
                  minimum: 0,
                },
                max_words: {
                  type: 'integer',
                  description: 'Maximum word count (default: unlimited)',
                  minimum: 1,
                },
                section: {
                  type: 'string',
                  description: 'Filter by section ID',
                },
                from_date: {
                  type: 'string',
                  description: 'Start date (YYYY-MM-DD format)',
                },
                to_date: {
                  type: 'string',
                  description: 'End date (YYYY-MM-DD format)',
                },
                order_by: {
                  type: 'string',
                  description: "Sort order: 'newest', 'oldest', 'relevance' (default: 'newest')",
                  enum: ['newest', 'oldest', 'relevance'],
                },
                page_size: {
                  type: 'integer',
                  description: 'Results per page, max 200 (default: 20)',
                  minimum: 1,
                  maximum: 200,
                },
              },
            },
          },
          {
            name: 'guardian_search_by_author',
            description: 'Search Guardian articles by specific author/journalist',
            inputSchema: {
              type: 'object',
              properties: {
                author: {
                  type: 'string',
                  description: 'Author name to search for',
                },
                query: {
                  type: 'string',
                  description: "Additional search terms within author's articles",
                },
                section: {
                  type: 'string',
                  description: 'Filter by section ID',
                },
                from_date: {
                  type: 'string',
                  description: 'Start date (YYYY-MM-DD format)',
                },
                to_date: {
                  type: 'string',
                  description: 'End date (YYYY-MM-DD format)',
                },
                order_by: {
                  type: 'string',
                  description: "Sort order: 'newest', 'oldest', 'relevance' (default: 'newest')",
                  enum: ['newest', 'oldest', 'relevance'],
                },
                page_size: {
                  type: 'integer',
                  description: 'Results per page, max 200 (default: 20)',
                  minimum: 1,
                  maximum: 200,
                },
                page: {
                  type: 'integer',
                  description: 'Page number (default: 1)',
                  minimum: 1,
                },
              },
              required: ['author'],
            },
          },
          {
            name: 'guardian_find_related',
            description: 'Find articles related to a given article using shared tags',
            inputSchema: {
              type: 'object',
              properties: {
                article_id: {
                  type: 'string',
                  description: 'Guardian article ID or full URL to find related articles for',
                },
                similarity_threshold: {
                  type: 'integer',
                  description: 'Minimum number of shared tags required (default: 2)',
                  minimum: 1,
                  maximum: 10,
                },
                exclude_same_section: {
                  type: 'boolean',
                  description: 'Exclude articles from the same section (default: false)',
                },
                max_days_old: {
                  type: 'integer',
                  description: 'Only find articles within this many days of the original (default: unlimited)',
                  minimum: 1,
                },
                page_size: {
                  type: 'integer',
                  description: 'Results per page, max 50 (default: 10)',
                  minimum: 1,
                  maximum: 50,
                },
              },
              required: ['article_id'],
            },
          },
          {
            name: 'guardian_get_article_tags',
            description: 'Get detailed tag information for a specific Guardian article',
            inputSchema: {
              type: 'object',
              properties: {
                article_id: {
                  type: 'string',
                  description: 'Guardian article ID or full URL to inspect tags for',
                },
              },
              required: ['article_id'],
            },
          },
          {
            name: 'guardian_content_timeline',
            description: 'Analyze content timeline for a topic over time showing trends and peaks',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Topic or search terms to analyze over time',
                },
                from_date: {
                  type: 'string',
                  description: 'Start date (YYYY-MM-DD)',
                },
                to_date: {
                  type: 'string',
                  description: 'End date (YYYY-MM-DD)',
                },
                interval: {
                  type: 'string',
                  description: 'Time interval for analysis',
                  enum: ['day', 'week', 'month', 'quarter'],
                },
                section: {
                  type: 'string',
                  description: 'Filter by section (optional)',
                },
              },
              required: ['query', 'from_date', 'to_date'],
            },
          },
          {
            name: 'guardian_author_profile',
            description: 'Generate comprehensive profile analysis for a Guardian journalist',
            inputSchema: {
              type: 'object',
              properties: {
                author: {
                  type: 'string',
                  description: 'Author/journalist name to analyze',
                },
                analysis_period: {
                  type: 'string',
                  description: 'Year to analyze (e.g., "2024") or use from_date/to_date',
                },
                from_date: {
                  type: 'string',
                  description: 'Start date (YYYY-MM-DD) - alternative to analysis_period',
                },
                to_date: {
                  type: 'string',
                  description: 'End date (YYYY-MM-DD) - alternative to analysis_period',
                },
              },
              required: ['author'],
            },
          },
          {
            name: 'guardian_topic_trends',
            description: 'Compare trends of multiple topics over time with correlation analysis',
            inputSchema: {
              type: 'object',
              properties: {
                topics: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  description: 'List of topics/keywords to compare (max 5)',
                  minItems: 1,
                  maxItems: 5,
                },
                from_date: {
                  type: 'string',
                  description: 'Start date (YYYY-MM-DD)',
                },
                to_date: {
                  type: 'string',
                  description: 'End date (YYYY-MM-DD)',
                },
                interval: {
                  type: 'string',
                  description: 'Time interval for comparison',
                  enum: ['month', 'quarter', 'year'],
                },
              },
              required: ['topics', 'from_date', 'to_date'],
            },
          },
          {
            name: 'guardian_top_stories_by_date',
            description: 'Get intelligently ranked top stories for a specific date using editorial prioritization',
            inputSchema: {
              type: 'object',
              properties: {
                date: {
                  type: 'string',
                  description: 'Date to analyze (YYYY-MM-DD)',
                },
                story_count: {
                  type: 'integer',
                  description: 'Number of top stories to return (default: 10, max: 20)',
                  minimum: 1,
                  maximum: 20,
                },
                section: {
                  type: 'string',
                  description: 'Filter by section (optional)',
                },
              },
              required: ['date'],
            },
          },
          {
            name: 'guardian_recommend_longreads',
            description: 'Get personalized Long Read recommendations based on context and preferences',
            inputSchema: {
              type: 'object',
              properties: {
                count: {
                  type: 'integer',
                  description: 'Number of recommendations (default: 3, max: 10)',
                  minimum: 1,
                  maximum: 10,
                },
                context: {
                  type: 'string',
                  description: 'Context about interests, current conversation, or what you\'re looking for',
                },
                from_date: {
                  type: 'string',
                  description: 'Earliest publication date to consider (default: 3 months ago)',
                },
                topic_preference: {
                  type: 'string',
                  description: 'Specific topic or theme preference (e.g., "climate change", "technology", "culture")',
                },
              },
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const result = await this.handleToolCall(name, args);
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      } catch (error) {
        if (error instanceof GuardianApiError) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: ${error.message}`,
              },
            ],
          };
        }

        throw error;
      }
    });
  }

  private async handleToolCall(toolName: string, args: any): Promise<string> {
    const tools = registerTools(this.guardianClient);
    const tool = tools[toolName];

    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    return await tool(args);
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Guardian MCP server running on stdio');
  }
}

const server = new GuardianMcpServer();
server.run().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});