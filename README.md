# Guardian MCP Server

An MCP server that connects an LLM to the archives (since 1999) of [The Guardian](https://www.theguardian.com/), including the full text of all articles — more than 1.9 million of them. Useful for real-time headlines, journalism analysis, and historical research.

<a href="https://glama.ai/mcp/servers/@jbenton/guardian-mcp-server">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@jbenton/guardian-mcp-server/badge" alt="guardian-mcp-server MCP server" />
</a>

## Installation

**A [Guardian Open Platform](https://open-platform.theguardian.com/) API key is required.** You can get one here: https://open-platform.theguardian.com/access/

The Guardian offers generous API access for *non-commercial* use of the archives, including up to 1 call/second and 500 calls/day. (See the full [Terms & Conditions](https://www.theguardian.com/open-platform/terms-and-conditions). Commercial use requires a [different license](https://bonobo.capi.gutools.co.uk/register/commercial).) 

**To install:**
```bash
npx guardian-mcp-server
```

**Sample MCP client configuration:**
```json
{
  "mcpServers": {
    "guardian": {
      "command": "npx",
      "args": ["guardian-mcp-server"],
      "env": {
        "GUARDIAN_API_KEY": "your-key-here"
      }
    }
  }
}
```

## Tool reference

`guardian_search`: search the archive for articles

Use the`detail_level` parameter to determine the size of the API response and optimize performance: `minimal` (headlines only), `standard` (headlines, summaries, and metadata), or `full` (all content, including full article text).

```json
{
  "query": "climate change",
  "section": "environment", 
  "detail_level": "minimal",
  "from_date": "2024-01-01",
  "order_by": "newest"
}
```

`guardian_get_article`: retrieve individual articles
```json
{
  "article_id": "https://www.theguardian.com/politics/2024/dec/01/example", 
  "truncate": false  // full content by default
}
```
`guardian_search_tags`: search through The Guardian's 50,000-plus hand-assigned tags

`guardian_find_related`: find articles similar to an article (via shared tags)

`guardian_get_article_tags`: returns tags assigned to any article

```json
{
  "article_id": "politics/2024/example"
}
```

`guardian_lookback`: historical search by date

`guardian_content_timeline`: analyze Guardian content on a particular topic over a defined period

```json
{
  "query": "artificial intelligence",
  "from_date": "2024-01-01",
  "to_date": "2024-06-30", 
  "interval": "month"
}
```

`guardian_top_stories_by_date`: estimates editorial importance; The Guardian's API doesn't natively return data to differentiate between Page 1 stories and inside briefs, and this tries to hack a ranking together

```json
{
  "date": "2016-06-24",  // Brexit referendum day
  "story_count": 5
}
```

`guardian_topic_trends`: compare multiple topics over time with correlation analysis and competitive rankings

```json
{
  "topics": ["artificial intelligence", "climate change", "brexit"],
  "from_date": "2023-01-01",
  "to_date": "2024-12-31",
  "interval": "quarter"
}
```

`guardian_author_profile`: generate profiles of Guardian journalists and what they cover

```json
{
  "author": "George Monbiot",
  "analysis_period": "2024"
}
```

`guardian_longread`: search The Long Read series, the paper's home for longform features

`guardian_browse_section`: browse recent articles from specific sections

`guardian_get_sections`: fetch all available Guardian sections

`guardian_search_by_length`: filter articles by word count

`guardian_search_by_author`: search articles by byline

`guardian_recommend_longreads`: get personalized Long Read recommendations based on interest

```json
{
  "count": 3,
  "context": "I'm researching technology, especially AI",
  "topic_preference": "digital culture"
}
```

## License

MIT license.