# Flash Repo Snapshot

Flash Repo Snapshot is a powerful VS Code extension that quickly concatenates repository files into a single, well-formatted document. Perfect for code reviews, documentation, or preparing code for AI analysis.

## Key Features

- 📁 Smart file filtering - exclude/include specific directories and file types
- 📊 Generates a clear summary of included files and total size
- ⚡ Fast processing with async file handling
- ⚠️ Large codebase warnings to prevent context limit issues
- 🛠️ Fully configurable through VS Code settings

## 📝 Flash Repo Usage

1. Open a workspace in VS Code
2. Right Click in the file explorer, choose "Flash Repo: Concatenate Repository Files"
3. View the generated output in a new editor tab

## 📝 Flash Hydrate Usage
1. Open a concatenated file
2. Right Click in the body of the file, choose "Flash Repo: Hydrate Snapshot"
3. View the hydrated directory in the 'hydrated' folder

Note: For now Flash Hydrate only works with files matching the format generated by Flash Repo

## ⚙️ Configuration

Customize Flash Repo Snapshot through VS Code settings:

```jsonc
{
    // Directories to exclude (e.g., dependencies, build outputs)
    "flash-repo.excludedDirectories": [
        ".git",
        "node_modules",
        "dist",
        "build",
        "hydrated"
    ],

    // Specific files to exclude (e.g., lock files)
    "flash-repo.excludedFiles": [
        "package-lock.json",
        "yarn.lock"
    ],

    // File types to include
    "flash-repo.includedExtensions": [
        ".md",
        ".ts",
        ".js",
        ".py",
        ".java",
        ".cpp",
        ".h",
        ".jsx",
        ".tsx"
    ]
}
```

## 📋 Output Format

The extension generates a formatted output like this:

```
=== Flash Repo Summary ===
Total Files: 3
Total Characters: 1,234 (1K)

Files included:
- /src/main.ts (500 chars)
- /src/utils.ts (400 chars)
- /src/types.ts (334 chars)

=== Begin Concatenated Content ===

=== File: /src/main.ts ===
[file content here]

=== File: /src/utils.ts ===
[file content here]
...
```

## 🔧 Requirements

- VS Code 1.60.0 or higher

## ⚙️ Extension Settings

* `flash-repo.excludedDirectories`: Directories to exclude from concatenation 
* `flash-repo.excludedFiles`: Files to exclude from concatenation
* `flash-repo.includedExtensions`: File extensions to include in concatenation

## 📝 License

MIT Licensed. See LICENSE.md for details.

## 📝 Release Notes

### 3.0.0
- Added Flash Hydration feature
- Made extension freely available
- Improved stability and performance

## 🤝 Support

Having issues or need help? Contact us through:
- [Extension Page](https://marketplace.visualstudio.com/items?itemName=conscious-robot.flash-repo)
- [GitHub Issues](https://github.com/talamantez/flash-repo-vscode/issues)
- Email: info@conscious-robot.com

---

Made with ❤️ by Conscious Robot. Crafted for developers who value reliability and clean design.

[GitHub](https://github.com/talamantez/flash-repo-vscode)