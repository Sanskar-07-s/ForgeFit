# Contributing to ForgeFit AI

Thank you for contributing to ForgeFit AI. Please review these development guidelines before proposing modifications.

---

## Code Style & Compliance

- **TypeScript Enforcement**: Do not use `any` typing. Every database model, engine, and component state must map to our schemas under `shared/types`.
- **CSS Architecture**: Use utility classes from Tailwind CSS. Maintain consistent glassmorphism shadows and blur filters using standard variables.
- **Modularity**: Keep components clean, reusable, and small. Business analytics or algorithmic mathematical fitness formulas should live in `shared/fitness-models` or `ai/` folders rather than directly inside react render components.

---

## Formatting & Hooks

We use ESLint and Prettier for code consistency:
- Run lint verification before committing:
  ```bash
  npm run lint
  ```
- Format code files using Prettier:
  ```bash
  npm run format
  ```

---

## Commit Guidelines

We use conventional commit messages to maintain clean logs:
- `feat`: A new feature (e.g. `feat(generator): add dumbbell-only routine generator`)
- `fix`: A bug fix (e.g. `fix(sync): resolve offline queue duplicate insertions`)
- `docs`: Documentation updates
- `style`: Code formatting changes (Prettier)
- `refactor`: Structural refactoring that does not change functional behavior
- `test`: Adding or running tests
- `chore`: Infrastructure adjustments (ESLint configs, Vite packaging dependencies)
