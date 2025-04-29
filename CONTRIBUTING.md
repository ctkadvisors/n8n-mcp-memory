# Contributing to n8n-mcp

Thank you for considering contributing to n8n-mcp! This document outlines the process for contributing to the project and how to report issues.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct: be respectful, considerate, and collaborative.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with the following information:

1. A clear, descriptive title
2. Steps to reproduce the issue
3. Expected behavior
4. Actual behavior
5. Environment details (Node.js version, n8n version, OS, etc.)

### Requesting Features

If you have a feature request, please create an issue with the following information:

1. A clear, descriptive title
2. A detailed description of the proposed feature
3. Why this feature would be useful to the project

### Pull Requests

1. Fork the repository
2. Create a new branch for your feature or bug fix
3. Make your changes
4. Run tests to ensure your changes don't break existing functionality
5. Submit a pull request with a clear description of the changes

#### Pull Request Guidelines

- Keep pull requests focused on a single feature or bug fix
- Update documentation as needed
- Add tests for new features
- Follow the existing code style
- Provide a clear description of the changes in the pull request

## Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
   This will also set up Git hooks via simple-git-hooks
3. Build the project:
   ```bash
   pnpm run build
   ```
4. Run the tests:
   ```bash
   pnpm test
   ```

## Testing

Please ensure all tests pass before submitting a pull request:

```bash
pnpm test
```

Also make sure your code follows our style guidelines:

```bash
# Check code style
pnpm run lint

# Check formatting
pnpm run format:check
```

## License

By contributing to n8n-mcp, you agree that your contributions will be licensed under the project's MIT License with Attribution.
