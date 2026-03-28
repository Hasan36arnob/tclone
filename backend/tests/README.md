# Tclone Backend Tests

This directory contains unit and integration tests for the Tclone backend application.

## Test Structure

- `setup.js` - Test setup file that configures MongoDB Memory Server
- `jest.config.js` - Jest configuration file
- `userController.test.js` - Tests for user controller endpoints
- `postController.test.js` - Tests for post controller endpoints
- `messageController.test.js` - Tests for message controller endpoints
- `protectRoute.test.js` - Tests for authentication middleware

## Running Tests

### Install Test Dependencies

First, install the test dependencies:

```bash
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

## Test Coverage

The tests cover the following areas:

### User Controller Tests
- User signup (success, duplicate user, invalid email, invalid username, weak password)
- User login (success, incorrect password, non-existent user)
- Get user profile (by username, by ID, non-existent user)

### Post Controller Tests
- Create post (success, without authentication, missing text, text too long)
- Get post (success, non-existent post, invalid ID format)
- Delete post (success, unauthorized deletion)
- Like/Unlike post (success)
- Reply to post (success, missing text)
- Get feed posts (from followed users)

### Message Controller Tests
- Send message (success, without authentication, missing recipient, missing message, message too long)
- Get messages (success, no conversation exists)
- Get all conversations (success)

### Protect Route Middleware Tests
- Allow access with valid token
- Deny access without token
- Deny access with invalid token
- Deny access with expired token
- Deny access if user not found

## Test Environment

Tests use MongoDB Memory Server to create an in-memory database for each test run. This ensures:
- Tests are isolated and don't affect each other
- No external database connection is required
- Tests run quickly

## Writing New Tests

When writing new tests:

1. Create a new test file with the `.test.js` extension
2. Import necessary modules and the code to test
3. Use `describe` blocks to organize tests
4. Use `beforeEach` for setup that runs before each test
5. Use `afterEach` for cleanup that runs after each test
6. Use `expect` assertions to verify results

Example:

```javascript
import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../server.js';

describe('Example Test', () => {
  it('should return 200 status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);
    
    expect(response.body.status).toBe('ok');
  });
});
```
