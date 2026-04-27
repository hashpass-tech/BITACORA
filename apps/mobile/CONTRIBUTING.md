# Contributing to Bitácora

Thank you for your interest in contributing to Bitácora! We welcome contributions from everyone.

## 🤝 How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, include:

- A clear and descriptive title
- Steps to reproduce the issue
- Expected behavior vs. actual behavior
- Screenshots or recordings if applicable
- Your environment (OS, Expo version, React Native version)
- Any relevant logs or error messages

### Suggesting Enhancements

Enhancement suggestions are welcome! Please provide:

- A clear description of the proposed enhancement
- Explain why this enhancement would be useful
- Provide examples of how this would be used
- If possible, include mockups or diagrams

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Write tests** for your changes if applicable
4. **Update documentation** if needed
5. **Commit your changes** with clear, descriptive messages
6. **Push to your fork** and submit a pull request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/bitacora.git
cd bitacora

# Install dependencies
npm install

# Start development server
npx expo start
```

## 📋 Coding Standards

### Code Style

- Use TypeScript for type safety
- Follow the existing code structure and naming conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Git Commit Messages

Follow conventional commit format:

```
type(scope): subject

body

footer
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
- `feat(auth): add Google OAuth integration`
- `fix(recording): resolve audio capture issue on iOS`
- `docs(readme): update installation instructions`

### Pull Request Guidelines

- Keep PRs focused and small
- Link to related issues
- Update the CHANGELOG.md for significant changes
- Ensure all tests pass
- Request review from at least one maintainer

## 🧪 Testing

- Write tests for new features and bug fixes
- Ensure all existing tests pass before submitting
- Test on multiple platforms (iOS, Android, Web) if possible

## 📝 Documentation

- Update README.md if user-facing changes are made
- Add inline comments for complex code
- Update CHANGELOG.md for version changes
- Keep documentation in both English and Spanish

## 🎯 Project Structure

- `app/` - Expo Router pages and layouts
- `components/` - Reusable UI components
- `lib/` - Utility functions and helpers
- `assets/` - Images, fonts, and static assets

## 🌍 Localization

We support both English and Spanish. When adding new user-facing text:
- Add translations to both README.md and README.es.md
- Use i18n libraries for in-app text (to be implemented)

## 🔒 Security

- Never commit sensitive information (API keys, passwords)
- Report security vulnerabilities privately via security@bitacora.app
- Follow security best practices for React Native apps

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Our Standards

Examples of behavior that contributes to a positive environment:
- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community

Examples of unacceptable behavior:
- Harassment or discriminatory language
- Personal attacks
- Unprofessional conduct

### Enforcement

Project maintainers have the right to remove, edit, or reject comments, commits, code, or other contributions that are not aligned with this Code of Conduct.

## 📞 Getting Help

- Join our [Discord community](https://discord.gg/bitacora)
- Open a discussion on GitHub
- Email us at support@bitacora.app

## 🎉 Recognition

Contributors will be recognized in our CONTRIBUTORS.md file and in release notes.

Thank you for contributing to Bitácora! 🚀
