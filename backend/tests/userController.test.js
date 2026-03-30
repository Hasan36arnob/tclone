// ইউজার কন্ট্রোলার টেস্ট ফাইল
import { describe, it, expect, beforeEach } from '@jest/globals'; // Jest এর প্রয়োজনীয় মডিউল ইমপোর্ট করা হচ্ছে
import request from 'supertest'; // HTTP রিকোয়েস্ট টেস্ট করার জন্য supertest ব্যবহার করা হচ্ছে
import express from 'express'; // Express ফ্রেমওয়ার্ক ইমপোর্ট করা হচ্ছে
import cookieParser from 'cookie-parser'; // কুকি পার্স করার জন্য cookie-parser ইমপোর্ট করা হচ্ছে
import userRoutes from '../routes/userRoutes.js'; // ইউজার রাউটস ইমপোর্ট করা হচ্ছে
import User from '../models/userModel.js'; // ইউজার মডেল ইমপোর্ট করা হচ্ছে
import bcrypt from 'bcryptjs'; // পাসওয়ার্ড হ্যাশ করার জন্য bcryptjs ইমপোর্ট করা হচ্ছে

// টেস্ট অ্যাপ তৈরি করা হচ্ছে
const app = express();
app.use(express.json()); // JSON বডি পার্স করার জন্য express.json() ব্যবহার করা হচ্ছে
app.use(cookieParser()); // কুকি পার্স করার জন্য cookieParser() ব্যবহার করা হচ্ছে
app.use('/api/users', userRoutes); // ইউজার রাউটস অ্যাপে যুক্ত করা হচ্ছে

// ইউজার কন্ট্রোলার টেস্ট শুরু
describe('User Controller', () => {
  // POST /api/users/signup এন্ডপয়েন্ট টেস্ট
  describe('POST /api/users/signup', () => {
    // নতুন ইউজার সফলভাবে তৈরি করা হবে কিনা তা টেস্ট
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
        .expect(201); // 201 স্ট্যাটাস কোড আশা করা হচ্ছে

      expect(response.body).toHaveProperty('_id'); // রেসপন্স বডিতে _id প্রোপার্টি থাকতে হবে
      expect(response.body.name).toBe(userData.name); // নাম সঠিক হতে হবে
      expect(response.body.email).toBe(userData.email); // ইমেইল সঠিক হতে হবে
      expect(response.body.username).toBe(userData.username); // ইউজারনেম সঠিক হতে হবে
      expect(response.body).not.toHaveProperty('password'); // পাসওয়ার্ড প্রোপার্টি থাকতে পারবে না
    });

    // ইউজার ইতিমধ্যে থাকলে এরর রিটার্ন করা হবে কিনা তা টেস্ট
    it('should return error if user already exists', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      };

      // প্রথমে ইউজার তৈরি করা হচ্ছে
      await request(app)
        .post('/api/users/signup')
        .send(userData);

      // একই ইউজার আবার তৈরি করার চেষ্টা করা হচ্ছে
      const response = await request(app)
        .post('/api/users/signup')
        .send(userData)
        .expect(400); // 400 স্ট্যাটাস কোড আশা করা হচ্ছে

      expect(response.body).toHaveProperty('error'); // রেসপন্স বডিতে এরর প্রোপার্টি থাকতে হবে
      expect(response.body.error).toBe('User already exists'); // এরর মেসেজ সঠিক হতে হবে
    });

    // অবৈধ ইমেইল ফরম্যাটের জন্য এরর রিটার্ন করা হবে কিনা তা টেস্ট
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
        .expect(400); // 400 স্ট্যাটাস কোড আশা করা হচ্ছে

      expect(response.body).toHaveProperty('error'); // রেসপন্স বডিতে এরর প্রোপার্টি থাকতে হবে
      expect(response.body.error).toBe('Invalid email format'); // এরর মেসেজ সঠিক হতে হবে
    });

    // অবৈধ ইউজারনেম ফরম্যাটের জন্য এরর রিটার্ন করা হবে কিনা তা টেস্ট
    it('should return error for invalid username format', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        username: 'ab', // খুব ছোট
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/users/signup')
        .send(userData)
        .expect(400); // 400 স্ট্যাটাস কোড আশা করা হচ্ছে

      expect(response.body).toHaveProperty('error'); // রেসপন্স বডিতে এরর প্রোপার্টি থাকতে হবে
      expect(response.body.error).toContain('Username must be 3-20 characters'); // এরর মেসেজে সঠিক কথা থাকতে হবে
    });

    // দুর্বল পাসওয়ার্ডের জন্য এরর রিটার্ন করা হবে কিনা তা টেস্ট
    it('should return error for weak password', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        password: '12345', // খুব ছোট
      };

      const response = await request(app)
        .post('/api/users/signup')
        .send(userData)
        .expect(400); // 400 স্ট্যাটাস কোড আশা করা হচ্ছে

      expect(response.body).toHaveProperty('error'); // রেসপন্স বডিতে এরর প্রোপার্টি থাকতে হবে
      expect(response.body.error).toBe('Password must be at least 6 characters long'); // এরর মেসেজ সঠিক হতে হবে
    });
  });

  // POST /api/users/login এন্ডপয়েন্ট টেস্ট
  describe('POST /api/users/login', () => {
    // প্রতিটি টেস্টের আগে একটি টেস্ট ইউজার তৈরি করা হচ্ছে
    beforeEach(async () => {
      const salt = await bcrypt.genSalt(10); // সল্ট তৈরি করা হচ্ছে
      const hashedPassword = await bcrypt.hash('password123', salt); // পাসওয়ার্ড হ্যাশ করা হচ্ছে
      
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        password: hashedPassword,
      });
    });

    // সঠিক ক্রেডেনশিয়াল দিয়ে সফলভাবে লগইন করা হবে কিনা তা টেস্ট
    it('should login successfully with correct credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          username: 'testuser',
          password: 'password123',
        })
        .expect(200); // 200 স্ট্যাটাস কোড আশা করা হচ্ছে

      expect(response.body).toHaveProperty('_id'); // রেসপন্স বডিতে _id প্রোপার্টি থাকতে হবে
      expect(response.body.username).toBe('testuser'); // ইউজারনেম সঠিক হতে হবে
      expect(response.body).not.toHaveProperty('password'); // পাসওয়ার্ড প্রোপার্টি থাকতে পারবে না
      expect(response.headers['set-cookie']).toBeDefined(); // কুকি সেট করা হয়েছে কিনা তা যাচাই করা হচ্ছে
    });

    // ভুল পাসওয়ার্ডের জন্য এরর রিটার্ন করা হবে কিনা তা টেস্ট
    it('should return error for incorrect password', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        })
        .expect(400); // 400 স্ট্যাটাস কোড আশা করা হচ্ছে

      expect(response.body).toHaveProperty('error'); // রেসপন্স বডিতে এরর প্রোপার্টি থাকতে হবে
      expect(response.body.error).toBe('Invalid username or password'); // এরর মেসেজ সঠিক হতে হবে
    });

    // অস্তিত্বহীন ইউজারের জন্য এরর রিটার্ন করা হবে কিনা তা টেস্ট
    it('should return error for non-existent user', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          username: 'nonexistent',
          password: 'password123',
        })
        .expect(400); // 400 স্ট্যাটাস কোড আশা করা হচ্ছে

      expect(response.body).toHaveProperty('error'); // রেসপন্স বডিতে এরর প্রোপার্টি থাকতে হবে
      expect(response.body.error).toBe('Invalid username or password'); // এরর মেসেজ সঠিক হতে হবে
    });
  });

  // GET /api/users/profile/:query এন্ডপয়েন্ট টেস্ট
  describe('GET /api/users/profile/:query', () => {
    // ইউজারনেম দিয়ে ইউজার প্রোফাইল পাওয়া যাবে কিনা তা টেস্ট
    it('should get user profile by username', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      });

      const response = await request(app)
        .get('/api/users/profile/testuser')
        .expect(200); // 200 স্ট্যাটাস কোড আশা করা হচ্ছে

      expect(response.body.username).toBe('testuser'); // ইউজারনেম সঠিক হতে হবে
      expect(response.body).not.toHaveProperty('password'); // পাসওয়ার্ড প্রোপার্টি থাকতে পারবে না
    });

    // আইডি দিয়ে ইউজার প্রোফাইল পাওয়া যাবে কিনা তা টেস্ট
    it('should get user profile by ID', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      });

      const response = await request(app)
        .get(`/api/users/profile/${user._id}`)
        .expect(200); // 200 স্ট্যাটাস কোড আশা করা হচ্ছে

      expect(response.body._id).toBe(user._id.toString()); // আইডি সঠিক হতে হবে
      expect(response.body).not.toHaveProperty('password'); // পাসওয়ার্ড প্রোপার্টি থাকতে পারবে না
    });

    // অস্তিত্বহীন ইউজারের জন্য 404 রিটার্ন করা হবে কিনা তা টেস্ট
    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/profile/nonexistent')
        .expect(404); // 404 স্ট্যাটাস কোড আশা করা হচ্ছে

      expect(response.body).toHaveProperty('error'); // রেসপন্স বডিতে এরর প্রোপার্টি থাকতে হবে
      expect(response.body.error).toBe('User not found'); // এরর মেসেজ সঠিক হতে হবে
    });
  });
});
