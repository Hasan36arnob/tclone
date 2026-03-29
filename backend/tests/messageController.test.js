// ============= মেসেজ কন্ট্রোলার টেস্ট =============
// Jest থেকে দরকারি ফাংশনগুলো আনা হচ্ছে
import { describe, it, expect, beforeEach } from '@jest/globals';
// সুপারটেস্ট আনা হচ্ছে (এইচটিটিপি রিকোয়েস্ট টেস্ট করার জন্য)
import request from 'supertest';
// এক্সপ্রেস আনা হচ্ছে
import express from 'express';
// কুকি পার্সার আনা হচ্ছে (কুকি পড়ার জন্য)
import cookieParser from 'cookie-parser';
// মেসেজ রাউটার আনা হচ্ছে (যে রাস্তা টেস্ট করবো)
import messageRoutes from '../routes/messageRoutes.js';
// মডেলগুলো আনা হচ্ছে
import Message from '../models/messageModel.js';
import Conversation from '../models/conversationModel.js';
import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';  // পাসওয়ার্ড এনক্রিপ্ট করার জন্য
import jwt from 'jsonwebtoken'; // টোকেন বানানোর জন্য

// ============= টেস্ট অ্যাপ বানানো =============
// টেস্টের জন্য আলাদা এক্সপ্রেস অ্যাপ বানানো
const app = express();
app.use(express.json());        // JSON ডাটা পড়ার জন্য
app.use(cookieParser());        // কুকি পড়ার জন্য
app.use('/api/messages', messageRoutes);  // মেসেজ রাউটার যোগ করা

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

  // জেডব্লিউটি টোকেন তৈরি করা
  const token = jwt.sign(
    { userId: user._id }, 
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '15d' }
  );

  return { user, token };
};

// ============= মেসেজ কন্ট্রোলার টেস্ট শুরু =============
describe('Message Controller', () => {
  
  // ============= ১. মেসেজ পাঠানোর টেস্ট =============
  describe('POST /api/messages', () => {
    
    // ✅ সফলভাবে মেসেজ পাঠানো
    it('should send a message successfully', async () => {
      // একজন সেন্ডার ইউজার তৈরি করা
      const { user: sender, token: senderToken } = await createAuthenticatedUser();

      // একজন রিসিভার ইউজার তৈরি করা
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      const recipient = await User.create({
        name: 'Recipient User',
        email: 'recipient@example.com',
        username: 'recipient',
        password: hashedPassword,
      });

      // মেসেজ পাঠানোর রিকোয়েস্ট
      const response = await request(app)
        .post('/api/messages')
        .set('Cookie', [`jwt=${senderToken}`])  // কুকিতে টোকেন দেওয়া
        .send({
          recipientId: recipient._id.toString(),
          message: 'Hello, this is a test message',
        })
        .expect(201);  // ২০১ মানে সফলভাবে তৈরি হয়েছে

      // চেক করা: রেসপন্সে মেসেজের আইডি আছে?
      expect(response.body).toHaveProperty('_id');
      // চেক করা: মেসেজের লেখা ঠিক আছে?
      expect(response.body.text).toBe('Hello, this is a test message');
      // চেক করা: সেন্ডার ঠিক আছে?
      expect(response.body.sender).toBe(sender._id.toString());

      // চেক করা: কথোপকথন তৈরি হয়েছে?
      const conversation = await Conversation.findOne({
        participants: { $all: [sender._id, recipient._id] },
      });
      expect(conversation).not.toBeNull();
      expect(conversation.lastMessage.text).toBe('Hello, this is a test message');
    });

    // ❌ অথেনটিকেশন ছাড়া মেসেজ পাঠাতে গেলে এরর আসবে
    it('should return error without authentication', async () => {
      // রিসিভার তৈরি করা
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      const recipient = await User.create({
        name: 'Recipient User',
        email: 'recipient@example.com',
        username: 'recipient',
        password: hashedPassword,
      });

      // টোকেন ছাড়া মেসেজ পাঠানো
      const response = await request(app)
        .post('/api/messages')
        .send({
          recipientId: recipient._id.toString(),
          message: 'Hello',
        })
        .expect(401);  // ৪০১ মানে অনুমতি নেই

      expect(response.body).toHaveProperty('error');
    });

    // ❌ রিসিপিয়েন্ট আইডি না দিলে এরর আসবে
    it('should return error for missing recipient ID', async () => {
      const { token } = await createAuthenticatedUser();

      const response = await request(app)
        .post('/api/messages')
        .set('Cookie', [`jwt=${token}`])
        .send({
          message: 'Hello',
        })
        .expect(400);  // ৪০০ মানে খারাপ রিকোয়েস্ট

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Recipient ID and message are required');
    });

    // ❌ মেসেজ না দিলে এরর আসবে
    it('should return error for missing message', async () => {
      const { token } = await createAuthenticatedUser();

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      const recipient = await User.create({
        name: 'Recipient User',
        email: 'recipient@example.com',
        username: 'recipient',
        password: hashedPassword,
      });

      const response = await request(app)
        .post('/api/messages')
        .set('Cookie', [`jwt=${token}`])
        .send({
          recipientId: recipient._id.toString(),
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Recipient ID and message are required');
    });

    // ❌ মেসেজ ৫০০০ অক্ষরের বেশি হলে এরর আসবে
    it('should return error for message exceeding 5000 characters', async () => {
      const { token } = await createAuthenticatedUser();

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      const recipient = await User.create({
        name: 'Recipient User',
        email: 'recipient@example.com',
        username: 'recipient',
        password: hashedPassword,
      });

      // ৫০০১ অক্ষরের মেসেজ বানানো
      const longMessage = 'a'.repeat(5001);

      const response = await request(app)
        .post('/api/messages')
        .set('Cookie', [`jwt=${token}`])
        .send({
          recipientId: recipient._id.toString(),
          message: longMessage,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Message must be less than 5000 characters');
    });
  });

  // ============= ২. দুই ইউজারের মেসেজ দেখা =============
  describe('GET /api/messages/:otherUserId', () => {
    
    // ✅ দুই ইউজারের মেসেজ পাওয়া যাচ্ছে
    it('should get messages between two users', async () => {
      const { user: user1, token: token1 } = await createAuthenticatedUser();

      // দ্বিতীয় ইউজার তৈরি
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      const user2 = await User.create({
        name: 'User 2',
        email: 'user2@example.com',
        username: 'user2',
        password: hashedPassword,
      });

      // কথোপকথন তৈরি
      const conversation = await Conversation.create({
        participants: [user1._id, user2._id],
        lastMessage: {
          text: 'Hello',
          sender: user1._id,
        },
      });

      // মেসেজ তৈরি
      await Message.create({
        conversationId: conversation._id,
        sender: user1._id,
        text: 'Hello',
      });

      await Message.create({
        conversationId: conversation._id,
        sender: user2._id,
        text: 'Hi there',
      });

      // মেসেজ দেখার রিকোয়েস্ট
      const response = await request(app)
        .get(`/api/messages/${user2._id}`)
        .set('Cookie', [`jwt=${token1}`])
        .expect(200);  // ২০০ মানে সফল

      // চেক: ২টা মেসেজ আছে?
      expect(response.body.length).toBe(2);
      // চেক: প্রথম মেসেজ ঠিক আছে?
      expect(response.body[0].text).toBe('Hello');
      // চেক: দ্বিতীয় মেসেজ ঠিক আছে?
      expect(response.body[1].text).toBe('Hi there');
    });

    // ❌ কথোপকথন না থাকলে ৪০৪ এরর আসবে
    it('should return 404 if no conversation exists', async () => {
      const { token } = await createAuthenticatedUser();

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      const user2 = await User.create({
        name: 'User 2',
        email: 'user2@example.com',
        username: 'user2',
        password: hashedPassword,
      });

      // কোনো কথোপকথন তৈরি না করে সরাসরি মেসেজ চাওয়া
      const response = await request(app)
        .get(`/api/messages/${user2._id}`)
        .set('Cookie', [`jwt=${token}`])
        .expect(404);  // ৪০৪ মানে পাওয়া যায়নি

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Conversation not found');
    });
  });

  // ============= ৩. সব কথোপকথন দেখা =============
  describe('GET /api/messages/conversations', () => {
    
    // ✅ ইউজারের সব কথোপকথন পাওয়া যাচ্ছে
    it('should get all conversations for a user', async () => {
      const { user: user1, token: token1 } = await createAuthenticatedUser();

      // দ্বিতীয় ইউজার তৈরি
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      const user2 = await User.create({
        name: 'User 2',
        email: 'user2@example.com',
        username: 'user2',
        password: hashedPassword,
      });

      // তৃতীয় ইউজার তৈরি
      const user3 = await User.create({
        name: 'User 3',
        email: 'user3@example.com',
        username: 'user3',
        password: hashedPassword,
      });

      // দুটো কথোপকথন তৈরি
      await Conversation.create({
        participants: [user1._id, user2._id],
        lastMessage: {
          text: 'Hello',
          sender: user1._id,
        },
      });

      await Conversation.create({
        participants: [user1._id, user3._id],
        lastMessage: {
          text: 'Hi',
          sender: user3._id,
        },
      });

      // সব কথোপকথন দেখার রিকোয়েস্ট
      const response = await request(app)
        .get('/api/messages/conversations')
        .set('Cookie', [`jwt=${token1}`])
        .expect(200);

      // চেক: ২টা কথোপকথন আছে?
      expect(response.body.length).toBe(2);
      
      // চেক: বর্তমান ইউজার অংশগ্রহণকারীদের থেকে বাদ গেছে?
      response.body.forEach((conversation) => {
        const otherParticipant = conversation.participants[0];
        expect(otherParticipant._id).not.toBe(user1._id.toString());
      });
    });
  });
});