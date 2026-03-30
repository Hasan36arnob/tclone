// প্রয়োজনীয় মডিউলসমূহ ইম্পোর্ট করা হচ্ছে
import { describe, it, expect, beforeEach } from '@jest/globals'; // Jest টেস্টিং ফ্রেমওয়ার্কের প্রয়োজনীয় ফাংশনসমূহ
import request from 'supertest'; // HTTP রিকোয়েস্ট টেস্ট করার জন্য
import express from 'express'; // Express ফ্রেমওয়ার্ক
import cookieParser from 'cookie-parser'; // কুকি পার্স করার জন্য
import protectRoute from '../middlewares/protectRoute.js'; // আমাদের প্রটেক্ট রুট মিডলওয়্যার
import User from '../models/userModel.js'; // ইউজার মডেল
import bcrypt from 'bcryptjs'; // পাসওয়ার্ড হ্যাশ করার জন্য
import jwt from 'jsonwebtoken'; // JWT টোকেন তৈরি এবং যাচাই করার জন্য

// টেস্টের জন্য একটি এক্সপ্রেস অ্যাপ তৈরি করা হচ্ছে
const app = express();
app.use(express.json()); // JSON রিকোয়েস্ট বডি পার্স করার জন্য
app.use(cookieParser()); // কুকি পার্স করার জন্য

// একটি প্রটেক্টেড রুট তৈরি করা হচ্ছে যা টেস্টের জন্য ব্যবহার করা হবে
app.get('/api/protected', protectRoute, (req, res) => {
  res.status(200).json({ message: 'Access granted', user: req.user }); // সফল এক্সেসের ক্ষেত্রে এই রেসপন্স দেওয়া হবে
});

// Protect Route Middleware এর টেস্ট কেসসমূহ
describe('Protect Route Middleware', () => {
  // টেস্ট কেস 1: বৈধ টোকেন দিয়ে এক্সেস করা যাবে
  it('should allow access with valid token', async () => {
    // একটি টেস্ট ইউজার তৈরি করা হচ্ছে
    const salt = await bcrypt.genSalt(10); // বcrypt এর জন্য সল্ট তৈরি
    const hashedPassword = await bcrypt.hash('password123', salt); // পাসওয়ার্ড হ্যাশ করা
    
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
      password: hashedPassword,
    });

    // একটি বৈধ JWT টোকেন তৈরি করা হচ্ছে
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '15d', // টোকেনের মেয়াদ 15 দিন
    });

    // প্রটেক্টেড রুটে রিকোয়েস্ট পাঠানো হচ্ছে বৈধ টোকেন সহ
    const response = await request(app)
      .get('/api/protected')
      .set('Cookie', [`jwt=${token}`]) // কুকি হিসেবে টোকেন সেট করা
      .expect(200); // আশা করা হচ্ছে 200 স্ট্যাটাস কোড

    // রেসপন্স যাচাই করা হচ্ছে
    expect(response.body.message).toBe('Access granted'); // মেসেজ সঠিক কিনা
    expect(response.body.user._id).toBe(user._id.toString()); // ইউজার আইডি সঠিক কিনা
    expect(response.body.user).not.toHaveProperty('password'); // পাসওয়ার্ড রেসপন্সে থাকবে না
  });

  // টেস্ট কেস 2: টোকেন ছাড়া এক্সেস করা যাবে না
  it('should deny access without token', async () => {
    const response = await request(app)
      .get('/api/protected')
      .expect(401); // আশা করা হচ্ছে 401 স্ট্যাটাস কোড (Unauthorized)

    // রেসপন্স যাচাই করা হচ্ছে
    expect(response.body).toHaveProperty('error'); // এরর প্রপার্টি থাকতে হবে
    expect(response.body.error).toBe('Unauthorized: No token provided'); // সঠিক এরর মেসেজ কিনা
  });

  // টেস্ট কেস 3: অবৈধ টোকেন দিয়ে এক্সেস করা যাবে না
  it('should deny access with invalid token', async () => {
    const response = await request(app)
      .get('/api/protected')
      .set('Cookie', ['jwt=invalidtoken']) // অবৈধ টোকেন সেট করা
      .expect(401); // আশা করা হচ্ছে 401 স্ট্যাটাস কোড

    // রেসপন্স যাচাই করা হচ্ছে
    expect(response.body).toHaveProperty('error'); // এরর প্রপার্টি থাকতে হবে
    expect(response.body.error).toBe('Unauthorized: Invalid token'); // সঠিক এরর মেসেজ কিনা
  });

  // টেস্ট কেস 4: মেয়াদোত্তীর্ণ টোকেন দিয়ে এক্সেস করা যাবে না
  it('should deny access with expired token', async () => {
    // একটি টেস্ট ইউজার তৈরি করা হচ্ছে
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      username: 'testuser',
      password: hashedPassword,
    });

    // একটি মেয়াদোত্তীর্ণ JWT টোকেন তৈরি করা হচ্ছে
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '0s', // টোকেনের মেয়াদ 0 সেকেন্ড (সঙ্গে সঙ্গে মেয়াদ শেষ)
    });

    // প্রটেক্টেড রুটে রিকোয়েস্ট পাঠানো হচ্ছে মেয়াদোত্তীর্ণ টোকেন সহ
    const response = await request(app)
      .get('/api/protected')
      .set('Cookie', [`jwt=${token}`])
      .expect(401); // আশা করা হচ্ছে 401 স্ট্যাটাস কোড

    // রেসপন্স যাচাই করা হচ্ছে
    expect(response.body).toHaveProperty('error'); // এরর প্রপার্টি থাকতে হবে
    expect(response.body.error).toBe('Unauthorized: Token expired'); // সঠিক এরর মেসেজ কিনা
  });

  // টেস্ট কেস 5: যদি ইউজার না পাওয়া যায় তাহলে এক্সেস করা যাবে না
  it('should deny access if user not found', async () => {
    // একটি নন-এক্সিস্টেন্ট ইউজার আইডি দিয়ে টোকেন তৈরি করা হচ্ছে
    const fakeUserId = '507f1f77bcf86cd799439011';
    const token = jwt.sign({ userId: fakeUserId }, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '15d', // টোকেনের মেয়াদ 15 দিন
    });

    // প্রটেক্টেড রুটে রিকোয়েস্ট পাঠানো হচ্ছে অবৈধ ইউজার আইডির টোকেন সহ
    const response = await request(app)
      .get('/api/protected')
      .set('Cookie', [`jwt=${token}`])
      .expect(401); // আশা করা হচ্ছে 401 স্ট্যাটাস কোড

    // রেসপন্স যাচাই করা হচ্ছে
    expect(response.body).toHaveProperty('error'); // এরর প্রপার্টি থাকতে হবে
    expect(response.body.error).toBe('Unauthorized: User not found'); // সঠিক এরর মেসেজ কিনা
  });
});
