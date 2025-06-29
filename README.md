# Guardian MCP Server

An advanced Model Context Protocol (MCP) server providing comprehensive access to The Guardian newspaper's archive since 1999. This server transforms basic search into a full journalism research analysis platform.

## ✨ Features

- **Complete Archive Access**: Search Guardian articles from 1999 to present
- **Advanced Research Tools**: Timeline analysis, author profiling, topic trends
- **Intelligent Content Discovery**: Context-aware recommendations and story prioritization
- **Performance Optimized**: Multiple detail levels for fast browsing or deep research
- **Full Content Access**: Complete article text without truncation

## 🚀 Quick Start

### 1. Get a Guardian API Key
Get your free API key from [The Guardian Open Platform](https://open-platform.theguardian.com/access/)

### 2. Install and Run
```bash
npx guardian-mcp-server
```

### 3. Configure with Claude Desktop
Add to your Claude Desktop configuration:

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

## 🛠️ Core Tools

### Search & Discovery
- `guardian_search` - Advanced article search with filtering
- `guardian_get_article` - Full article retrieval (supports URLs)
- `guardian_longread` - Access to Guardian's Long Read series
- `guardian_browse_section` - Browse by section
- `guardian_search_by_author` - Find articles by journalist

### Research & Analysis  
- `guardian_content_timeline` - Track topic evolution over time
- `guardian_author_profile` - Comprehensive journalist analysis
- `guardian_topic_trends` - Compare multiple topics with correlations
- `guardian_top_stories_by_date` - Intelligent story ranking
- `guardian_recommend_longreads` - Context-aware recommendations

### Utility Tools
- `guardian_get_sections` - List all available sections
- `guardian_search_tags` - Explore Guardian's 50,000+ tags
- `guardian_find_related` - Discover related articles

## 📊 What You Can Research

- **Historical Analysis**: Major events with intelligent story prioritization
- **Trend Investigation**: How topics evolved over months/years
- **Journalist Expertise**: Author specializations and writing patterns  
- **Content Discovery**: Personalized Long Read recommendations
- **Comparative Studies**: Multi-topic correlation analysis

## 🔧 Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/guardian-mcp-server.git
cd guardian-mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Run locally
npm start
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines and submit pull requests.

## 📚 Documentation

For detailed tool documentation and advanced usage, see [README_V2.md](README_V2.md).
