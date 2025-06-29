import {
  GuardianApiResponse,
  GuardianResponse,
  GuardianArticle,
  GuardianSection,
  GuardianTag,
  GuardianContentResponse,
} from '../types/guardian.js';

export class GuardianApiError extends Error {
  constructor(
    message: string,
    public status: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'GuardianApiError';
  }
}

export class GuardianClient {
  private readonly baseUrl = 'https://content.guardianapis.com';
  private readonly apiKey: string;

  constructor() {
    const apiKey = process.env.GUARDIAN_API_KEY;
    if (!apiKey) {
      throw new Error(
        'Please set your Guardian API key in the GUARDIAN_API_KEY environment variable. Get your key from https://open-platform.theguardian.com/access/'
      );
    }
    this.apiKey = apiKey;
  }

  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<T> {
    // Add API key to parameters
    const requestParams = {
      ...params,
      'api-key': this.apiKey,
    };

    // Remove null/undefined values
    const cleanParams = Object.entries(requestParams)
      .filter(([_, value]) => value != null)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    const url = new URL(endpoint, this.baseUrl);
    Object.entries(cleanParams).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': 'guardian-mcp-server/1.0.0',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (response.status === 429) {
        throw new GuardianApiError(
          'Rate limit exceeded. Guardian API allows 500 calls per day. Please try again later.',
          'rate_limited',
          429
        );
      }

      if (response.status === 403) {
        throw new GuardianApiError(
          'Invalid API key. Please check your GUARDIAN_API_KEY environment variable.',
          'invalid_key',
          403
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new GuardianApiError(
          `Guardian API returned status code ${response.status}: ${errorText}`,
          'api_error',
          response.status
        );
      }

      return await response.json() as T;
    } catch (error) {
      if (error instanceof GuardianApiError) {
        throw error;
      }

      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new GuardianApiError(
          'Connection error. Please check your internet connection.',
          'connection_error'
        );
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new GuardianApiError(
          'Request timed out. The Guardian API may be experiencing issues.',
          'timeout'
        );
      }

      throw new GuardianApiError(
        `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
        'unknown_error'
      );
    }
  }

  async search(params: Record<string, any>): Promise<GuardianApiResponse<GuardianResponse<GuardianArticle>>> {
    return this.makeRequest('/search', params);
  }

  async getArticle(articleId: string, params: Record<string, any> = {}): Promise<GuardianApiResponse<GuardianContentResponse>> {
    // Ensure article ID starts with forward slash
    const endpoint = articleId.startsWith('/') ? articleId : `/${articleId}`;
    return this.makeRequest(endpoint, params);
  }

  async getSections(): Promise<GuardianApiResponse<GuardianResponse<GuardianSection>>> {
    return this.makeRequest('/sections');
  }

  async searchTags(params: Record<string, any>): Promise<GuardianApiResponse<GuardianResponse<GuardianTag>>> {
    return this.makeRequest('/tags', params);
  }
}