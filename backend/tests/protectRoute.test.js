// Protect Route Middleware Tests
import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import protectRoute from '../middlewares/protectRoute.js';
import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());

// Protected route for testing
app.get('/api/protected', protectRoute, (req, res) => {
  res.status(200).json({ message: 'Access granted', user: req.user });
});

describe('Protect Route Middleware', () => {
  it('should allow access with valid token', async () => {
    // Create a test user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
      password: hashedPassword,
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '15d',
    });

    const response = await request(app)
      .get('/api/protected')
      .set('Cookie', [`jwt=${token}`])
      .expect(200);

    expect(response.body.message).toBe('Access granted');
    expect(response.body.user._id).toBe(user._id.toString());
    expect(response.body.user).not.toHaveProperty('password');
  });

  it('should deny access without token', async () => {
    const response = await request(app)
      .get('/api/protected')
      .expect(401);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Unauthorized: No token provided');
  });

  it('should deny access with invalid token', async () => {
    const response = await request(app)
      .get('/api/protected')
      .set('Cookie', ['jwt=invalidtoken'])
      .expect(401);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Unauthorized: Invalid token');
  });

  it('should deny access with expired token', async () => {
    // Create a test user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
      password: hashedPassword,
    });

    // Create an expired token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '0s', // Immediately expired
    });

    const response = await request(app)
      .get('/api/protected')
      .set('Cookie', [`jwt=${token}`])
      .expect(401);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Unauthorized: Token expired');
  });

  it('should deny access if user not found', async () => {
    // Create a token with non-existent user ID
    const fakeUserId = '507f1f77bcf86cd799439011';
    const token = jwt.sign({ userId: fakeUserId }, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '15d',
    });

    const response = await request(app)
      .get('/api/protected')
      .set('Cookie', [`jwt=${token}`])
      .expect(401);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toBe('Unauthorized: User not found');
  });
});
