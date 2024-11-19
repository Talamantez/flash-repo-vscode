# Flash Repo

Flash Repo is a VS Code extension that helps you quickly concatenate your repository files into a single document, making it easier to provide codebase context to Claude, ChatGPT, or other AI assistants.

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support-yellow?style=flat&logo=buy-me-a-coffee)](https://www.buymeacoffee.com/conscious.robot)

## Features

- **One-Click Operation**: Right-click in your editor or file explorer to concatenate files
- **Smart Filtering**: Automatically excludes non-code files and common directories like `node_modules`
- **Context Size Awareness**: Warns you if the concatenated content might exceed AI context limits
- **Clear Organization**: 
  - Includes a summary of all concatenated files
  - Shows character counts for size estimation
  - Clearly separates files with headers
  - Lists files in a consistent order

## Usage

1. Right-click in the editor or file explorer
2. Select "Flash Repo: Concatenate Files"
3. Review the generated document containing:
   - Summary of included files
   - Total character count
   - All concatenated file contents with clear separators

### Example Output

```
=== Flash Repo Summary ===
Total Files: 3
Total Characters: 15,420 (15K)

Files included:
- src/index.ts (2,345 chars)
- src/utils.ts (5,432 chars)
- src/types.ts (7,643 chars)

=== Begin Concatenated Content ===

=== File: src/index.ts ===
// File content here...

=== File: src/utils.ts ===
// File content here...
```

## Configuration

Customize through VS Code settings:

- `flash-repo.excludedDirectories`: Directories to skip
  - Default: [".git", "node_modules", "dist", "build"]
  
- `flash-repo.excludedFiles`: Files to skip
  - Default: ["package-lock.json", "yarn.lock", "pnpm-lock.yaml"]
  
- `flash-repo.includedExtensions`: File types to include
  - Default: [".ts", ".js", ".py", ".java", ".cpp", ".h", ".jsx", ".tsx"]

## Tips for AI Context

1. **Size Management**: Watch the character count to stay within AI context limits:
   - Claude: ~100K characters
   - GPT-4: ~50K characters

2. **Selective Inclusion**: Only concatenate relevant files for your query

3. **Content Review**: Check the summary before copying to ensure you have the right files

## Installation

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "Flash Repo"
4. Click Install

## Development

```bash
# Install dependencies
pnpm install

# Compile
pnpm run compile

# Watch mode
pnpm run watch

# Run tests
pnpm test
```

## Support

If you find Flash Repo useful, consider buying me a coffee! Every contribution helps maintain and improve the extension.

<a href="https://www.buymeacoffee.com/conscious.robot" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="60" width="217" style="height: 60px !important;width: 217px !important;" />
</a>

## License

MIT

## Contributing

Contributions welcome! Please check our [contribution guidelines](CONTRIBUTING.md).

## Release Notes

See [CHANGELOG.md](CHANGELOG.md) for release details.