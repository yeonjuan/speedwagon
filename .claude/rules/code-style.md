---
paths:
  - "**/*.ts"
---

# Code Style Rules

## Comments

- Do NOT add unnecessary comments
- Do NOT add JSDoc comments for obvious functions, methods, or properties
- Do NOT add inline comments explaining what code does (code should be self-explanatory)
- Only add comments for:
  - Complex algorithms that need explanation
  - Non-obvious business logic
  - Workarounds for bugs
  - Important architecture decisions

## Code Organization

- Keep code clean and self-documenting
- Use descriptive variable and function names instead of comments
- Prefer small, focused functions over large ones with extensive comments

## TypeScript

- Use TypeScript types effectively to document intent
- Avoid redundant type annotations when types can be inferred
- Interface/Type definitions do not need property descriptions unless non-obvious

## Examples

### ❌ Bad (unnecessary comments)

```typescript
/**
 * Get the user by ID
 * @param id - The user ID
 * @returns The user object
 */
function getUserById(id: string): User {
  // Find user in database
  return db.users.find(id);
}
```

### ✅ Good (clean, self-documenting)

```typescript
function getUserById(id: string): User {
  return db.users.find(id);
}
```

### ✅ Acceptable (complex logic needs explanation)

```typescript
function calculateSimilarityScore(ast1: AST, ast2: AST): number {
  // Using Levenshtein distance for AST comparison
  // because structural hashing alone doesn't capture semantic similarity
  return levenshteinDistance(ast1, ast2);
}
```
