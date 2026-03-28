// User Controller Tests
import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import userRoutes from '../routes/userRoutes.js';
import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';

// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/users', userRoutes);

describe('User Controller', () => {
  describe('POST /api/users/signup', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/users/signup')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.name).toBe(userData.name);
      expect(response.body.email).toBe(userData.email);
      expect(response.body.username).toBe(userData.username);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return error if user already exists', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      };

      // Create user first
      await request(app)
        .post('/api/users/signup')
        .send(userData);

      // Try to create same user again
      const response = await request(app)
        .post('/api/users/signup')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('User already exists');
    });

    it('should return error for invalid email format', async () => {
      const userData = {
        name: 'Test User',
        email: 'invalidemail',
        username: 'testuser',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/users/signup')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid email format');
    });

    it('should return error for invalid username format', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        username: 'ab', // Too short
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/users/signup')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Username must be 3-20 characters');
    });

    it('should return error for weak password', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        password: '12345', // Too short
      };

      const response = await request(app)
        .post('/api/users/signup')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Password must be at least 6 characters long');
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      // Create a test user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        password: hashedPassword,
      });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.username).toBe('testuser');
      expect(response.body).not.toHaveProperty('password');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return error for incorrect password', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid username or password');
    });

    it('should return error for non-existent user', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          username: 'nonexistent',
          password: 'password123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid username or password');
    });
  });

  describe('GET /api/users/profile/:query', () => {
    it('should get user profile by username', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      });

      const response = await request(app)
        .get('/api/users/profile/testuser')
        .expect(200);

      expect(response.body.username).toBe('testuser');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should get user profile by ID', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      });

      const response = await request(app)
        .get(`/api/users/profile/${user._id}`)
        .expect(200);

      expect(response.body._id).toBe(user._id.toString());
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/profile/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('User not found');
    });
  });
});
