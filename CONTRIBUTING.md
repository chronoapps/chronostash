# Contributing to ChronoStash

First off, thank you for considering contributing to ChronoStash! It's people like you that make ChronoStash such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what behavior you expected**
- **Include screenshots if relevant**
- **Include your environment details** (OS, Node.js version, Docker version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any similar features in other tools**

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Add tests** if you've added code that should be tested
4. **Ensure the test suite passes** (`npm test`)
5. **Make sure your code lints** (`npm run lint`)
6. **Update documentation** if you've changed APIs
7. **Write a clear commit message** following Conventional Commits

## Development Setup

### Prerequisites

- Node.js 20+
- SQLite (file-based, no installation required)
- Redis 7+
- Docker & Docker Compose (optional)

### Getting Started

```bash
# Fork and clone the repository
git clone https://github.com/your-username/chronostash.git
cd chronostash

# Install dependencies
npm install

# Build shared packages
npm run build:packages

# Setup environment
cp apps/backend/.env.example apps/backend/.env
# Edit .env with your local configuration

# Run migrations
cd apps/backend
npm run migrate

# Seed admin user (first time only)
npm run seed

# Start development servers
npm run dev
```

### Project Structure

```
chronostash/
├── apps/
│   ├── backend/          # Express API server
│   └── frontend/         # React SPA
├── packages/
│   ├── database-engines/ # Database backup/restore implementations
│   ├── storage-adapters/ # Storage backend implementations
│   └── shared/           # Shared types and utilities
└── docs/                 # Documentation
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Enable strict mode
- Avoid `any` - use proper types
- Use interfaces for object shapes
- Use enums for constants

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Naming Conventions

- **Files**: kebab-case (`backup-service.ts`)
- **Components**: PascalCase (`BackupCard.tsx`)
- **Functions/Variables**: camelCase (`createBackup`, `isValid`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Interfaces/Types**: PascalCase (`BackupConfig`)

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add backup encryption support
fix: resolve memory leak in backup worker
docs: update API documentation
test: add tests for restore functionality
refactor: simplify storage adapter interface
chore: update dependencies
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- backup-service.test.ts
```

### Writing Tests

- Place tests next to the code they test (`__tests__` folder)
- Use descriptive test names
- Follow the AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Aim for high test coverage

Example:

```typescript
describe('BackupService', () => {
  describe('createBackup', () => {
    it('should create a backup successfully', async () => {
      // Arrange
      const config = { databaseId: '123', storageId: '456' };

      // Act
      const result = await backupService.createBackup(config);

      // Assert
      expect(result.status).toBe('PENDING');
      expect(result.id).toBeDefined();
    });
  });
});
```

## Documentation

### Code Documentation

- Add JSDoc comments for public APIs
- Document complex logic with inline comments
- Keep comments up to date with code changes

Example:

```typescript
/**
 * Creates a new backup job for the specified database
 * @param config - Backup configuration
 * @returns The created backup job
 * @throws {ValidationError} If config is invalid
 */
async function createBackup(config: BackupConfig): Promise<Backup> {
  // Implementation
}
```

### README Updates

- Update README.md when adding new features
- Keep examples up to date
- Add screenshots for UI changes

## Adding New Features

### Database Engine

To add support for a new database:

1. Create a new engine class in `packages/database-engines/src/`
2. Implement the `DatabaseEngine` interface
3. Add the engine type to the enum
4. Write tests
5. Update documentation

### Storage Adapter

To add a new storage backend:

1. Create a new adapter in `packages/storage-adapters/src/`
2. Implement the `StorageAdapter` interface
3. Add the storage type to the enum
4. Write tests
5. Update documentation

### API Endpoints

To add new API endpoints:

1. Create route handler in `apps/backend/src/routes/`
2. Add validation middleware
3. Implement service layer logic
4. Add tests for both route and service
5. Update API documentation
6. Add frontend API client function

## Pull Request Process

1. **Update documentation** with details of changes
2. **Update the README.md** with any new environment variables, exposed ports, etc.
3. **Add tests** for all new code
4. **Ensure all tests pass** and code lints successfully
5. **Update CHANGELOG.md** if applicable
6. **Request review** from maintainers

### PR Title Format

Use conventional commit format:

```
feat: add support for MongoDB backups
fix: resolve timezone issue in scheduler
docs: improve installation instructions
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested your changes

## Checklist
- [ ] My code follows the project's code style
- [ ] I have added tests that prove my fix/feature works
- [ ] All new and existing tests pass
- [ ] I have updated the documentation
- [ ] My commits follow the conventional commits format
```

## Community

### Getting Help

- **GitHub Discussions**: Ask questions and discuss ideas
- **Discord**: Real-time chat with the community
- **Stack Overflow**: Tag questions with `chronostash`

### Recognition

Contributors are recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project README

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Don't hesitate to ask questions! Open an issue or reach out on Discord.

Thank you for contributing to ChronoStash! 🎉
