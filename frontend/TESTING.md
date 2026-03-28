# Frontend Testing

This document describes how to run tests for the Tclone frontend application.

## Test Setup

The frontend uses Vitest for testing, which is the default test runner for Vite projects.

## Running Tests

### Install Test Dependencies

First, install the test dependencies:

```bash
cd frontend
npm install
```

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

## Test Structure

Tests are located alongside the components they test, following the naming convention `*.test.jsx` or `*.test.js`.

Example:
```
src/
├── App.jsx
├── App.test.jsx
├── components/
│   ├── Post.jsx
│   └── Post.test.jsx
└── test/
    └── setup.js
```

## Writing Tests

### Basic Test Example

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Testing User Interactions

```javascript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testing Async Operations

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import UserProfile from './UserProfile';

describe('UserProfile', () => {
  it('should load user data', async () => {
    render(<UserProfile userId="123" />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});
```

## Test Coverage

The test coverage report is generated in the `coverage/` directory when running:

```bash
npm run test:coverage
```

## Best Practices

1. **Test behavior, not implementation**: Focus on what the component does, not how it does it.
2. **Use descriptive test names**: Test names should clearly describe what is being tested.
3. **Keep tests simple**: Each test should test one thing.
4. **Use setup and teardown**: Use `beforeEach` and `afterEach` for common setup.
5. **Mock external dependencies**: Mock API calls, timers, and other external dependencies.
6. **Test edge cases**: Test error states, loading states, and empty states.

## Example Test Files

- `App.test.jsx` - Basic app rendering tests
- Utility function tests (email validation, username validation, etc.)

## Troubleshooting

### Tests not running

Make sure you have installed all dependencies:

```bash
npm install
```

### Import errors

Make sure you're using the correct import syntax for ES modules:

```javascript
import { describe, it, expect } from 'vitest';
```

### Coverage not working

Make sure you have installed the coverage package:

```bash
npm install --save-dev @vitest/coverage-v8
```
