# Flash Repo Snapshot Pro

Flash Repo Snapshot Pro is a powerful VS Code extension that quickly concatenates repository files into a single, well-formatted document. Perfect for code reviews, documentation, or preparing code for AI analysis.

## 🚀 Pro Features

- 📁 Smart file filtering - exclude/include specific directories and file types
- 📊 Generates a clear summary of included files and total size
- ⚡ Fast processing with async file handling
- ⚠️ Large codebase warnings to prevent context limit issues
- 🛠️ Fully configurable through VS Code settings
- 💼 Professional support and updates

## 🎯 Start Your Free Trial

Flash Repo Snapshot Pro comes with a 7-day free trial. After the trial period, you'll need to purchase a license to continue using the extension.

## 📝 Usage

1. Open a workspace in VS Code
2. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
3. Type "Flash Repo Snapshot Pro: Concatenate Repository Files" and press Enter
4. View the generated output in a new editor tab

## ⚙️ Configuration

Customize Flash Repo Snapshot Pro through VS Code settings:

```jsonc
{
    // Directories to exclude (e.g., dependencies, build outputs)
    "flash-repo.excludedDirectories": [
        ".git",
        "node_modules",
        "dist",
        "build"
    ],

    // Specific files to exclude (e.g., lock files)
    "flash-repo.excludedFiles": [
        "package-lock.json",
        "yarn.lock"
    ],

    // File types to include
    "flash-repo.includedExtensions": [
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

## ⚡ Pro Benefits

- ✨ Full access to all features
- 🔄 Regular updates and improvements
- 💪 Enhanced performance
- 🎯 Priority support
- 🚀 Future feature access

## 🔧 Requirements

- VS Code 1.60.0 or higher

## ⚙️ Extension Settings

* `flash-repo.excludedDirectories`: Directories to exclude from concatenation
* `flash-repo.excludedFiles`: Files to exclude from concatenation
* `flash-repo.includedExtensions`: File extensions to include in concatenation

## 📝 License

This is premium software available with a free trial. After the trial period, a license must be purchased to continue using the extension.

## 🆕 Release Notes

### 2.0.0

Initial release of Flash Repo Snapshot Pro:
- Professional file concatenation system
- Configurable inclusion/exclusion patterns
- Large file warnings
- Formatted output with summary
- Trial system implementation

## 🤝 Support

Having issues or need help? Contact us through:
- [Extension Page](https://marketplace.visualstudio.com/items?itemName=conscious-robot.flash-repo)
- [GitHub Issues](https://github.com/talamantez/flash-repo-vscode/issues)


**Try Flash Repo Snapshot Pro today and supercharge your code review workflow!** 🚀
