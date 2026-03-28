// Message Controller Tests
import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import messageRoutes from '../routes/messageRoutes.js';
import Message from '../models/messageModel.js';
import Conversation from '../models/conversationModel.js';
import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Create test app
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use('/api/messages', messageRoutes);

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

describe('Message Controller', () => {
  describe('POST /api/messages', () => {
    it('should send a message successfully', async () => {
      const { user: sender, token: senderToken } = await createAuthenticatedUser();

      // Create recipient user
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
        .set('Cookie', [`jwt=${senderToken}`])
        .send({
          recipientId: recipient._id.toString(),
          message: 'Hello, this is a test message',
        })
        .expect(201);

      expect(response.body).toHaveProperty('_id');
      expect(response.body.text).toBe('Hello, this is a test message');
      expect(response.body.sender).toBe(sender._id.toString());

      // Verify conversation was created
      const conversation = await Conversation.findOne({
        participants: { $all: [sender._id, recipient._id] },
      });
      expect(conversation).not.toBeNull();
      expect(conversation.lastMessage.text).toBe('Hello, this is a test message');
    });

    it('should return error without authentication', async () => {
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
        .send({
          recipientId: recipient._id.toString(),
          message: 'Hello',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return error for missing recipient ID', async () => {
      const { token } = await createAuthenticatedUser();

      const response = await request(app)
        .post('/api/messages')
        .set('Cookie', [`jwt=${token}`])
        .send({
          message: 'Hello',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Recipient ID and message are required');
    });

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

  describe('GET /api/messages/:otherUserId', () => {
    it('should get messages between two users', async () => {
      const { user: user1, token: token1 } = await createAuthenticatedUser();

      // Create second user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      const user2 = await User.create({
        name: 'User 2',
        email: 'user2@example.com',
        username: 'user2',
        password: hashedPassword,
      });

      // Create conversation
      const conversation = await Conversation.create({
        participants: [user1._id, user2._id],
        lastMessage: {
          text: 'Hello',
          sender: user1._id,
        },
      });

      // Create messages
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

      const response = await request(app)
        .get(`/api/messages/${user2._id}`)
        .set('Cookie', [`jwt=${token1}`])
        .expect(200);

      expect(response.body.length).toBe(2);
      expect(response.body[0].text).toBe('Hello');
      expect(response.body[1].text).toBe('Hi there');
    });

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

      const response = await request(app)
        .get(`/api/messages/${user2._id}`)
        .set('Cookie', [`jwt=${token}`])
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Conversation not found');
    });
  });

  describe('GET /api/messages/conversations', () => {
    it('should get all conversations for a user', async () => {
      const { user: user1, token: token1 } = await createAuthenticatedUser();

      // Create second user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      const user2 = await User.create({
        name: 'User 2',
        email: 'user2@example.com',
        username: 'user2',
        password: hashedPassword,
      });

      // Create third user
      const user3 = await User.create({
        name: 'User 3',
        email: 'user3@example.com',
        username: 'user3',
        password: hashedPassword,
      });

      // Create conversations
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

      const response = await request(app)
        .get('/api/messages/conversations')
        .set('Cookie', [`jwt=${token1}`])
        .expect(200);

      expect(response.body.length).toBe(2);
      // Verify that the current user is filtered out from participants
      response.body.forEach((conversation) => {
        const otherParticipant = conversation.participants[0];
        expect(otherParticipant._id).not.toBe(user1._id.toString());
      });
    });
  });
});
