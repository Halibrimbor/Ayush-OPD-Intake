# Contributing to Ayush OPD Intake System

Thank you for your interest in contributing! This document provides guidelines and instructions.

## Code of Conduct

Be respectful, inclusive, and professional. We're building healthcare software - quality and safety matter.

## How to Contribute

### Reporting Bugs

1. **Search existing issues** - Check if bug already reported
2. **Provide details:**
   - OS and Python/Node versions
   - Steps to reproduce
   - Expected vs actual behavior
   - Error messages/logs
   - Screenshots (if applicable)

### Suggesting Features

1. **Check existing discussions**
2. **Describe the feature:**
   - Use case and benefit
   - Proposed implementation
   - Potential impact

### Submitting Code

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes:**
   - Follow existing code style
   - Add tests if applicable
   - Update documentation
   - Keep commits atomic and descriptive

4. **Test your changes:**
   ```bash
   # Backend
   cd backend
   venv\Scripts\activate
   pytest  # if tests exist
   
   # Frontend
   cd frontend
   npm run lint
   npm run build
   ```

5. **Commit with clear messages:**
   ```bash
   git commit -m "Add: feature description"
   git commit -m "Fix: bug description"
   git commit -m "Docs: update README"
   ```

6. **Push and create Pull Request:**
   ```bash
   git push origin feature/your-feature-name
   ```

## Pull Request Guidelines

- **Title:** Clear and concise (e.g., "Add voice intake capability")
- **Description:** 
  - What changes are made
  - Why they're needed
  - How to test
- **Checklist:**
  - [ ] Code follows style guidelines
  - [ ] Tests added/updated
  - [ ] Documentation updated
  - [ ] No breaking changes (or documented)

## Coding Standards

### Python (Backend)
- Follow PEP 8
- Use type hints
- Keep functions focused
- Add docstrings for public functions
- Use meaningful variable names

### TypeScript/React (Frontend)
- Follow ESLint config
- Use functional components
- Add comments for complex logic
- Keep components small and reusable
- Use meaningful prop and variable names

## Directory Structure

```
backend/         # FastAPI application
├── app/
│   ├── api/     # Route handlers
│   ├── models/  # Database models
│   ├── schemas/ # Pydantic schemas
│   ├── services/# Business logic
│   └── core/    # Configuration, database

frontend/        # Next.js application
├── src/
│   └── app/     # Pages and layouts
├── public/      # Static assets
```

## Git Workflow

1. **Create branch from main:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/name
   ```

2. **Make changes and commit:**
   ```bash
   git add .
   git commit -m "descriptive message"
   ```

3. **Keep branch updated:**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

4. **Push and create PR:**
   ```bash
   git push origin feature/name
   ```

## Testing

### Backend
```bash
cd backend
venv\Scripts\activate
pip install pytest
pytest
```

### Frontend
```bash
cd frontend
npm run lint
npm run build
```

## Documentation

- Update README.md for user-facing changes
- Add docstrings to functions
- Update API docs (Swagger comments)
- Add inline comments for complex logic

## Issues and Labels

Labels used:
- `bug` - Something broken
- `feature` - New functionality
- `enhancement` - Improvement to existing
- `docs` - Documentation updates
- `help-wanted` - Looking for contributors
- `good-first-issue` - Good for beginners

## Questions?

- Open an issue with your question
- Join discussions
- Check existing docs

## License

By contributing, you agree your code will be licensed under MIT License.

Thank you for contributing! 🎉
