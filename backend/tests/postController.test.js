// Post Controller Tests
import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import postRoutes from '../routes/postRoutes.js';
import Post from '../models/postModel.js';
import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/posts', postRoutes);

// Helper function to create authenticated user and get token
const createAuthenticatedUser = async () => {
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

  return { user, token };
};

describe('Post Controller', () => {
  describe('POST /api/posts/create', () => {
    it('should create a new post successfully', async () => {
      const { user, token } = await createAuthenticatedUser();

      const response = await request(app)
        .post('/api/posts/create')
        .set('Cookie', [`jwt=${token}`])
        .send({
          postedBy: user._id.toString(),
          text: 'This is a test post',
        })
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.text).toBe('This is a test post');
      expect(response.body.postedBy).toBe(user._id.toString());
    });

    it('should return error without authentication', async () => {
      const { user } = await createAuthenticatedUser();

      const response = await request(app)
        .post('/api/posts/create')
        .send({
          postedBy: user._id.toString(),
          text: 'This is a test post',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return error for missing text', async () => {
      const { user, token } = await createAuthenticatedUser();

      const response = await request(app)
        .post('/api/posts/create')
        .set('Cookie', [`jwt=${token}`])
        .send({
          postedBy: user._id.toString(),
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Postedby and text fields are required');
    });

    it('should return error for text exceeding 500 characters', async () => {
      const { user, token } = await createAuthenticatedUser();
      const longText = 'a'.repeat(501);

      const response = await request(app)
        .post('/api/posts/create')
        .set('Cookie', [`jwt=${token}`])
        .send({
          postedBy: user._id.toString(),
          text: longText,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Text must be less than 500 characters');
    });
  });

  describe('GET /api/posts/:id', () => {
    it('should get a post by ID', async () => {
      const { user } = await createAuthenticatedUser();

      const post = await Post.create({
        postedBy: user._id,
        text: 'Test post',
      });

      const response = await request(app)
        .get(`/api/posts/${post._id}`)
        .expect(200);

      expect(response.body._id).toBe(post._id.toString());
      expect(response.body.text).toBe('Test post');
    });

    it('should return 404 for non-existent post', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .get(`/api/posts/${fakeId}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Post not found');
    });

    it('should return error for invalid post ID format', async () => {
      const response = await request(app)
        .get('/api/posts/invalidid')
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid post ID');
    });
  });

  describe('DELETE /api/posts/:id', () => {
    it('should delete own post successfully', async () => {
      const { user, token } = await createAuthenticatedUser();

      const post = await Post.create({
        postedBy: user._id,
        text: 'Test post',
      });

      const response = await request(app)
        .delete(`/api/posts/${post._id}`)
        .set('Cookie', [`jwt=${token}`])
        .expect(200);

      expect(response.body.message).toBe('Post deleted successfully');

      // Verify post is deleted
      const deletedPost = await Post.findById(post._id);
      expect(deletedPost).toBeNull();
    });

    it('should not delete other user\'s post', async () => {
      const { user: user1 } = await createAuthenticatedUser();
      const { token: token2 } = await createAuthenticatedUser();

      // Create another user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      const user2 = await User.create({
        name: 'Test User 2',
        email: 'test2@example.com',
        username: 'testuser2',
        password: hashedPassword,
      });

      const post = await Post.create({
        postedBy: user1._id,
        text: 'Test post',
      });

      const response = await request(app)
        .delete(`/api/posts/${post._id}`)
        .set('Cookie', [`jwt=${token2}`])
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Unauthorized to delete post');
    });
  });

  describe('PUT /api/posts/like/:id', () => {
    it('should like a post successfully', async () => {
      const { user, token } = await createAuthenticatedUser();

      const post = await Post.create({
        postedBy: user._id,
        text: 'Test post',
      });

      const response = await request(app)
        .put(`/api/posts/like/${post._id}`)
        .set('Cookie', [`jwt=${token}`])
        .expect(200);

      expect(response.body.message).toBe('Post liked successfully');

      // Verify like was added
      const updatedPost = await Post.findById(post._id);
      expect(updatedPost.likes).toContainEqual(user._id);
    });

    it('should unlike a post successfully', async () => {
      const { user, token } = await createAuthenticatedUser();

      const post = await Post.create({
        postedBy: user._id,
        text: 'Test post',
        likes: [user._id],
      });

      const response = await request(app)
        .put(`/api/posts/like/${post._id}`)
        .set('Cookie', [`jwt=${token}`])
        .expect(200);

      expect(response.body.message).toBe('Post unliked successfully');

      // Verify like was removed
      const updatedPost = await Post.findById(post._id);
      expect(updatedPost.likes).not.toContainEqual(user._id);
    });
  });

  describe('PUT /api/posts/reply/:id', () => {
    it('should reply to a post successfully', async () => {
      const { user, token } = await createAuthenticatedUser();

      const post = await Post.create({
        postedBy: user._id,
        text: 'Test post',
      });

      const response = await request(app)
        .put(`/api/posts/reply/${post._id}`)
        .set('Cookie', [`jwt=${token}`])
        .send({ text: 'This is a reply' })
        .expect(200);

      expect(response.body).toHaveProperty('userId');
      expect(response.body.text).toBe('This is a reply');
      expect(response.body.username).toBe(user.username);

      // Verify reply was added
      const updatedPost = await Post.findById(post._id);
      expect(updatedPost.replies.length).toBe(1);
      expect(updatedPost.replies[0].text).toBe('This is a reply');
    });

    it('should return error for missing reply text', async () => {
      const { user, token } = await createAuthenticatedUser();

      const post = await Post.create({
        postedBy: user._id,
        text: 'Test post',
      });

      const response = await request(app)
        .put(`/api/posts/reply/${post._id}`)
        .set('Cookie', [`jwt=${token}`])
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Text field is required');
    });
  });

  describe('GET /api/posts/feed', () => {
    it('should get feed posts from followed users', async () => {
      const { user: user1, token: token1 } = await createAuthenticatedUser();

      // Create another user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      const user2 = await User.create({
        name: 'Test User 2',
        email: 'test2@example.com',
        username: 'testuser2',
        password: hashedPassword,
      });

      // User1 follows User2
      await User.findByIdAndUpdate(user1._id, { $push: { following: user2._id } });

      // Create posts
      await Post.create({ postedBy: user1._id, text: 'Post by user1' });
      await Post.create({ postedBy: user2._id, text: 'Post by user2' });

      const response = await request(app)
        .get('/api/posts/feed')
        .set('Cookie', [`jwt=${token1}`])
        .expect(200);

      expect(response.body.length).toBe(2);
      expect(response.body[0].text).toBe('Post by user2'); // Most recent first
    });
  });
});
