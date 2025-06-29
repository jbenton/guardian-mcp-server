# Guardian MCP Server (TypeScript)

An MCP (Model Context Protocol) server that provides access to The Guardian newspaper's archive since 1999 through their Open Platform API. This TypeScript/Node.js implementation enables Claude and other LLMs to search, browse, and retrieve Guardian articles with comprehensive filtering and search capabilities.

## Features

- **Search Guardian archives** since 1999 with flexible filtering
- **Retrieve full article content** including body text, headlines, and metadata
- **Browse by sections** like Politics, Technology, Environment, etc.
- **Search by tags** through 50,000+ manually curated tags
- **Date-based searches** including historical lookbacks
- **Long Read access** to Guardian's premium feature articles
- **Word count filtering** to find articles by length (short briefs vs long-form)
- **Author search tools** to find articles by specific journalists
- **Related article discovery** using shared tags for content similarity
- **Rate limit handling** with clear error messages
- **Pagination support** for large result sets

## Prerequisites

1. **Guardian API Key**: You need a free API key from The Guardian Open Platform
   - Visit: https://open-platform.theguardian.com/access/
   - Register for an account
   - Request an API key (free tier allows 500 calls/day)

2. **Node.js 18+**: Required to run the server

## Installation

### Option 1: Using npx (Recommended)

```bash
# Set your API key as an environment variable
export GUARDIAN_API_KEY="your-api-key-here"

# Run the server directly
npx guardian-mcp-server
```

### Option 2: Local Installation

```bash
# Install globally
npm install -g guardian-mcp-server

# Set your API key
export GUARDIAN_API_KEY="your-api-key-here"

# Run the server
guardian-mcp-server
```

### Option 3: Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/guardian-mcp-server.git
cd guardian-mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Set your API key
export GUARDIAN_API_KEY="your-api-key-here"

# Run the server
npm start
```

## Configuration

The server requires the `GUARDIAN_API_KEY` environment variable to be set. You can set this in several ways:

### Option 1: Environment Variable
```bash
export GUARDIAN_API_KEY="your-api-key-here"
```

### Option 2: .env File
Create a `.env` file in your project directory:
```
GUARDIAN_API_KEY=your-api-key-here
```

### Option 3: System Environment
Add to your shell profile (~/.bashrc, ~/.zshrc, etc.):
```bash
export GUARDIAN_API_KEY="your-api-key-here"
```

## Claude Desktop Configuration

To use this server with Claude Desktop, add the following configuration to your Claude Desktop config file:

### macOS/Linux: `~/.config/claude-desktop/claude_desktop_config.json`
### Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "guardian": {
      "command": "npx",
      "args": ["guardian-mcp-server"],
      "env": {
        "GUARDIAN_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Available Tools

### 1. `guardian_search`
Search Guardian articles with comprehensive filtering options.

**Parameters:**
- `query` (optional): Search terms
- `section` (optional): Filter by section ID
- `tag` (optional): Filter by tag
- `from_date` (optional): Start date (YYYY-MM-DD)
- `to_date` (optional): End date (YYYY-MM-DD)
- `order_by` (optional): Sort order (`newest`, `oldest`, `relevance`)
- `page_size` (optional): Results per page (max 200, default 20)
- `page` (optional): Page number (default 1)
- `show_fields` (optional): Comma-separated fields to include
- `production_office` (optional): Filter by office (`uk`, `us`, `au`)

**Example:**
```json
{
  "query": "climate change",
  "section": "environment",
  "from_date": "2023-01-01",
  "order_by": "newest"
}
```

### 2. `guardian_get_article`
Retrieve the full content of a specific Guardian article.

**Parameters:**
- `article_id` (required): Guardian article ID from search results
- `show_fields` (optional): Fields to include

**Example:**
```json
{
  "article_id": "environment/2023/dec/01/climate-change-cop28"
}
```

### 3. `guardian_longread`
Search specifically for Guardian Long Read articles.

**Parameters:**
- `query` (optional): Search terms within Long Read articles
- `from_date` (optional): Start date (YYYY-MM-DD)
- `to_date` (optional): End date (YYYY-MM-DD)
- `page_size` (optional): Results per page (default 10)
- `page` (optional): Page number

### 4. `guardian_lookback`
Find top stories from a specific date or date range.

**Parameters:**
- `date` (required): Specific date (YYYY-MM-DD)
- `end_date` (optional): End date for range
- `section` (optional): Filter by section
- `page_size` (optional): Number of results (default 20)

### 5. `guardian_browse_section`
Browse recent articles from a specific Guardian section.

**Parameters:**
- `section` (required): Section ID
- `days_back` (optional): How many days back to search (default 7)
- `page_size` (optional): Number of results (default 20)

### 6. `guardian_get_sections`
Get all available Guardian sections.

**Parameters:** None

### 7. `guardian_search_tags`
Search through Guardian's 50,000+ tags.

**Parameters:**
- `query` (required): Search term for tag names
- `page_size` (optional): Results per page (default 20)
- `page` (optional): Page number

### 8. `guardian_search_by_length`
Search Guardian articles filtered by word count range.

**Parameters:**
- `query` (optional): Search terms
- `min_words` (optional): Minimum word count (default: 0)
- `max_words` (optional): Maximum word count (default: unlimited)
- `section` (optional): Filter by section ID
- `from_date` (optional): Start date (YYYY-MM-DD)
- `to_date` (optional): End date (YYYY-MM-DD)
- `order_by` (optional): Sort order (default: 'newest')
- `page_size` (optional): Results per page (default: 20)

### 9. `guardian_search_by_author`
Search Guardian articles by specific author/journalist.

**Parameters:**
- `author` (required): Author name to search for
- `query` (optional): Additional search terms within author's articles
- `section` (optional): Filter by section ID
- `from_date` (optional): Start date (YYYY-MM-DD)
- `to_date` (optional): End date (YYYY-MM-DD)
- `order_by` (optional): Sort order (default: 'newest')
- `page_size` (optional): Results per page (default: 20)
- `page` (optional): Page number

### 10. `guardian_find_related`
Find articles related to a given article using shared tags.

**Parameters:**
- `article_id` (required): Guardian article ID to find related articles for
- `similarity_threshold` (optional): Minimum number of shared tags (default: 2)
- `exclude_same_section` (optional): Exclude articles from same section (default: false)
- `max_days_old` (optional): Only find articles within this many days (default: unlimited)
- `page_size` (optional): Results per page, max 50 (default: 10)

## Usage Examples

### Basic Article Search
```typescript
// Search for recent climate articles
guardian_search({
  query: "climate change",
  from_date: "2024-01-01",
  order_by: "newest"
})

// Search in a specific section
guardian_search({
  section: "technology",
  from_date: "2024-06-01"
})

// Search using tags
guardian_search({
  tag: "technology/apple",
  from_date: "2024-01-01"
})
```

### Discover Available Content
```typescript
// Get all sections
guardian_get_sections()

// Find relevant tags
guardian_search_tags({
  query: "artificial intelligence"
})

// Browse recent articles in a section
guardian_browse_section({
  section: "technology"
})
```

### Historical Research
```typescript
// What was happening on a specific date?
guardian_lookback({
  date: "2016-06-24" // Brexit referendum
})

// Get Long Read articles on a topic
guardian_longread({
  query: "pandemic",
  from_date: "2020-01-01"
})

// Search a date range
guardian_search({
  query: "election",
  from_date: "2020-11-01",
  to_date: "2020-11-30"
})
```

### Advanced Search Features
```typescript
// Find long-form investigative pieces
guardian_search_by_length({
  query: "investigation",
  min_words: 2000,
  section: "news"
})

// Find all recent articles by a specific journalist
guardian_search_by_author({
  author: "George Monbiot",
  from_date: "2024-01-01"
})

// Discover articles related to a specific piece
guardian_find_related({
  article_id: "environment/2023/dec/01/climate-change-cop28",
  similarity_threshold: 3
})
```

## Rate Limits

The Guardian API free tier allows **500 calls per day**. The server handles rate limits gracefully:

- Returns clear error messages when limits are exceeded
- Suggests waiting periods
- Provides status information

To optimize API usage:
- Use appropriate `page_size` values (max 200)
- Use specific date ranges when possible
- Use section and tag filters to narrow results
- Cache frequently used section/tag information

## Error Handling

The server provides detailed error messages for common issues:

- **Invalid API Key**: Check your `GUARDIAN_API_KEY` environment variable
- **Rate Limit Exceeded**: Wait for the daily limit to reset
- **Invalid Date Format**: Use YYYY-MM-DD format
- **Article Not Found**: Check the article ID
- **Network Issues**: Temporary connectivity problems

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/yourusername/guardian-mcp-server.git
cd guardian-mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode with auto-rebuild
npm run dev
```

### Project Structure

```
guardian-mcp-server/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # Main server entry point
│   ├── tools/            # Individual tool implementations
│   ├── api/              # Guardian API client
│   ├── types/            # TypeScript interfaces
│   └── utils/            # Helper functions
├── dist/                 # Compiled JavaScript
└── README.md
```

## Testing

To test your setup:

```bash
# Test the server initialization
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | npx guardian-mcp-server

# Test a simple tool call
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"guardian_get_sections","arguments":{}}}' | npx guardian-mcp-server
```

## Troubleshooting

### Server Won't Start
1. Check that Node.js 18+ is installed: `node --version`
2. Verify dependencies are installed: `npm install`
3. Ensure the API key is set: `echo $GUARDIAN_API_KEY`

### API Key Issues
1. Verify your key at: https://open-platform.theguardian.com/access/
2. Check the key is active and hasn't exceeded daily limits
3. Ensure no extra spaces or characters in the environment variable

### Date Format Errors
- Always use YYYY-MM-DD format (e.g., "2024-01-15")
- Ensure from_date is before to_date
- Check that dates are not in the future

### No Results Found
- Try broader search terms
- Check section/tag IDs using `guardian_get_sections` and `guardian_search_tags`
- Verify date ranges include content (Guardian archive starts in 1999)

## API Reference

For more details about The Guardian Open Platform API:
- Documentation: https://open-platform.theguardian.com/documentation/
- API Explorer: https://open-platform.theguardian.com/explore/
- Register for API key: https://open-platform.theguardian.com/access/

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

If you encounter issues:
1. Check this README for solutions
2. Verify your API key and quota
3. Review The Guardian API documentation
4. Open an issue with detailed error messages

---

**Note**: This server provides read-only access to The Guardian's public archive. Respect their terms of service and rate limits.