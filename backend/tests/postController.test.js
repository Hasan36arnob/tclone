// ============= পোস্ট কন্ট্রোলার টেস্ট =============
// Jest থেকে দরকারি ফাংশনগুলো আনা হচ্ছে
import { describe, it, expect, beforeEach } from '@jest/globals';
// সুপারটেস্ট আনা হচ্ছে (HTTP রিকোয়েস্ট টেস্ট করার জন্য)
import request from 'supertest';
// এক্সপ্রেস আনা হচ্ছে
import express from 'express';
// কুকি পার্সার আনা হচ্ছে (কুকি পড়ার জন্য)
import cookieParser from 'cookie-parser';
// পোস্ট রাউটার আনা হচ্ছে (যে রাস্তা টেস্ট করবো)
import postRoutes from '../routes/postRoutes.js';
// মডেলগুলো আনা হচ্ছে
import Post from '../models/postModel.js';
import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';  // পাসওয়ার্ড এনক্রিপ্ট করার জন্য
import jwt from 'jsonwebtoken'; // টোকেন বানানোর জন্য

// ============= টেস্ট অ্যাপ বানানো =============
// টেস্টের জন্য আলাদা এক্সপ্রেস অ্যাপ বানানো
const app = express();
app.use(express.json());        // JSON ডাটা পড়ার জন্য
app.use(cookieParser());        // কুকি পড়ার জন্য
app.use('/api/posts', postRoutes);  // পোস্ট রাউটার যোগ করা

// ============= হেল্পার ফাংশন: অথেনটিকেটেড ইউজার বানানো =============
// কাজ: টেস্টের জন্য লগইন করা ইউজার তৈরি করা
const createAuthenticatedUser = async () => {
  // পাসওয়ার্ড এনক্রিপ্ট করা
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);
  
  // নতুন ইউজার তৈরি করা
  const user = await User.create({
    name: 'Test User',
    email: 'test@example.com',
    username: 'testuser',
    password: hashedPassword,
  });

  // JWT টোকেন তৈরি করা
  const token = jwt.sign(
    { userId: user._id }, 
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '15d' }
  );

  return { user, token };
};

// ============= পোস্ট কন্ট্রোলার টেস্ট শুরু =============
describe('Post Controller', () => {
  
  // ============= ১. পোস্ট তৈরি করার টেস্ট =============
  describe('POST /api/posts/create', () => {
    
    // ✅ সফলভাবে পোস্ট তৈরি
    it('should create a new post successfully', async () => {
      const { user, token } = await createAuthenticatedUser();

      // পোস্ট তৈরির রিকোয়েস্ট
      const response = await request(app)
        .post('/api/posts/create')
        .set('Cookie', [`jwt=${token}`])  // কুকিতে টোকেন দেওয়া
        .send({
          postedBy: user._id.toString(),
          text: 'This is a test post',
        })
        .expect(201);  // ২০১ মানে সফলভাবে তৈরি হয়েছে

      // চেক: রেসপন্সে পোস্টের আইডি আছে?
      expect(response.body).toHaveProperty('_id');
      // চেক: পোস্টের লেখা ঠিক আছে?
      expect(response.body.text).toBe('This is a test post');
      // চেক: কে পোস্ট করেছে ঠিক আছে?
      expect(response.body.postedBy).toBe(user._id.toString());
    });

    // ❌ অথেনটিকেশন ছাড়া পোস্ট করতে গেলে এরর
    it('should return error without authentication', async () => {
      const { user } = await createAuthenticatedUser();

      // টোকেন ছাড়া পোস্ট করার চেষ্টা
      const response = await request(app)
        .post('/api/posts/create')
        .send({
          postedBy: user._id.toString(),
          text: 'This is a test post',
        })
        .expect(401);  // ৪০১ মানে অনুমতি নেই

      expect(response.body).toHaveProperty('error');
    });

    // ❌ টেক্সট না দিলে এরর
    it('should return error for missing text', async () => {
      const { user, token } = await createAuthenticatedUser();

      const response = await request(app)
        .post('/api/posts/create')
        .set('Cookie', [`jwt=${token}`])
        .send({
          postedBy: user._id.toString(),
          // text নেই!
        })
        .expect(400);  // ৪০০ মানে খারাপ রিকোয়েস্ট

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Postedby and text fields are required');
    });

    // ❌ টেক্সট ৫০০ অক্ষরের বেশি হলে এরর
    it('should return error for text exceeding 500 characters', async () => {
      const { user, token } = await createAuthenticatedUser();
      const longText = 'a'.repeat(501);  // ৫০১ অক্ষরের টেক্সট

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

  // ============= ২. একটা পোস্ট দেখার টেস্ট =============
  describe('GET /api/posts/:id', () => {
    
    // ✅ আইডি দিয়ে পোস্ট পাওয়া যাচ্ছে
    it('should get a post by ID', async () => {
      const { user } = await createAuthenticatedUser();

      // প্রথমে একটা পোস্ট তৈরি করা
      const post = await Post.create({
        postedBy: user._id,
        text: 'Test post',
      });

      // পোস্ট দেখার রিকোয়েস্ট
      const response = await request(app)
        .get(`/api/posts/${post._id}`)
        .expect(200);  // ২০০ মানে সফল

      expect(response.body._id).toBe(post._id.toString());
      expect(response.body.text).toBe('Test post');
    });

    // ❌ পোস্ট না থাকলে ৪০৪ এরর
    it('should return 404 for non-existent post', async () => {
      const fakeId = '507f1f77bcf86cd799439011';  // নকল আইডি

      const response = await request(app)
        .get(`/api/posts/${fakeId}`)
        .expect(404);  // ৪০৪ মানে পাওয়া যায়নি

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Post not found');
    });

    // ❌ আইডির ফরম্যাট ভুল হলে এরর
    it('should return error for invalid post ID format', async () => {
      const response = await request(app)
        .get('/api/posts/invalidid')  // ভুল ফরম্যাট
        .expect(400);  // ৪০০ মানে খারাপ রিকোয়েস্ট

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Invalid post ID');
    });
  });

  // ============= ৩. পোস্ট ডিলিট করার টেস্ট =============
  describe('DELETE /api/posts/:id', () => {
    
    // ✅ নিজের পোস্ট ডিলিট করা
    it('should delete own post successfully', async () => {
      const { user, token } = await createAuthenticatedUser();

      // পোস্ট তৈরি
      const post = await Post.create({
        postedBy: user._id,
        text: 'Test post',
      });

      // পোস্ট ডিলিটের রিকোয়েস্ট
      const response = await request(app)
        .delete(`/api/posts/${post._id}`)
        .set('Cookie', [`jwt=${token}`])
        .expect(200);  // ২০০ মানে সফল

      expect(response.body.message).toBe('Post deleted successfully');

      // চেক: পোস্ট আসলেই ডিলিট হয়েছে?
      const deletedPost = await Post.findById(post._id);
      expect(deletedPost).toBeNull();  // খালি হওয়া উচিত
    });

    // ❌ অন্যের পোস্ট ডিলিট করতে পারবে না
    it('should not delete other user\'s post', async () => {
      const { user: user1 } = await createAuthenticatedUser();
      const { token: token2 } = await createAuthenticatedUser();  // অন্য ইউজার

      // আরেকজন ইউজার তৈরি
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      const user2 = await User.create({
        name: 'Test User 2',
        email: 'test2@example.com',
        username: 'testuser2',
        password: hashedPassword,
      });

      // user1-এর পোস্ট
      const post = await Post.create({
        postedBy: user1._id,
        text: 'Test post',
      });

      // user2 ডিলিট করার চেষ্টা করছে
      const response = await request(app)
        .delete(`/api/posts/${post._id}`)
        .set('Cookie', [`jwt=${token2}`])
        .expect(401);  // ৪০১ মানে অনুমতি নেই

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Unauthorized to delete post');
    });
  });

  // ============= ৪. লাইক দেওয়ার টেস্ট =============
  describe('PUT /api/posts/like/:id', () => {
    
    // ✅ পোস্টে লাইক দেওয়া
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

      // চেক: লাইক যোগ হয়েছে?
      const updatedPost = await Post.findById(post._id);
      expect(updatedPost.likes).toContainEqual(user._id);
    });

    // ✅ লাইক তুলে নেওয়া (আনলাইক)
    it('should unlike a post successfully', async () => {
      const { user, token } = await createAuthenticatedUser();

      const post = await Post.create({
        postedBy: user._id,
        text: 'Test post',
        likes: [user._id],  // আগে থেকে লাইক আছে
      });

      const response = await request(app)
        .put(`/api/posts/like/${post._id}`)
        .set('Cookie', [`jwt=${token}`])
        .expect(200);

      expect(response.body.message).toBe('Post unliked successfully');

      // চেক: লাইক তুলে নেওয়া হয়েছে?
      const updatedPost = await Post.findById(post._id);
      expect(updatedPost.likes).not.toContainEqual(user._id);
    });
  });

  // ============= ৫. কমেন্ট করার টেস্ট =============
  describe('PUT /api/posts/reply/:id', () => {
    
    // ✅ পোস্টে কমেন্ট করা
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

      // চেক: কমেন্ট যোগ হয়েছে?
      const updatedPost = await Post.findById(post._id);
      expect(updatedPost.replies.length).toBe(1);
      expect(updatedPost.replies[0].text).toBe('This is a reply');
    });

    // ❌ কমেন্ট টেক্সট না দিলে এরর
    it('should return error for missing reply text', async () => {
      const { user, token } = await createAuthenticatedUser();

      const post = await Post.create({
        postedBy: user._id,
        text: 'Test post',
      });

      const response = await request(app)
        .put(`/api/posts/reply/${post._id}`)
        .set('Cookie', [`jwt=${token}`])
        .send({})  // খালি বডি
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Text field is required');
    });
  });

  // ============= ৬. ফিড পোস্ট দেখার টেস্ট =============
  describe('GET /api/posts/feed', () => {
    
    // ✅ যাদের ফলো করে তাদের পোস্ট দেখা
    it('should get feed posts from followed users', async () => {
      const { user: user1, token: token1 } = await createAuthenticatedUser();

      // দ্বিতীয় ইউজার তৈরি
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      const user2 = await User.create({
        name: 'Test User 2',
        email: 'test2@example.com',
        username: 'testuser2',
        password: hashedPassword,
      });

      // user1 user2-কে ফলো করে
      await User.findByIdAndUpdate(user1._id, { $push: { following: user2._id } });

      // পোস্ট তৈরি
      await Post.create({ postedBy: user1._id, text: 'Post by user1' });
      await Post.create({ postedBy: user2._id, text: 'Post by user2' });

      const response = await request(app)
        .get('/api/posts/feed')
        .set('Cookie', [`jwt=${token1}`])
        .expect(200);

      // চেক: ২টা পোস্ট আছে?
      expect(response.body.length).toBe(2);
      // চেক: সবচেয়ে নতুন পোস্ট আগে আছে?
      expect(response.body[0].text).toBe('Post by user2');
    });
  });
});