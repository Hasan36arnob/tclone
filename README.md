# 12+ Hour MERN Masterclass: Build and Deploy a Threads App with Real-Time Chat Functionality

![Demo App](https://i.ibb.co/BnGdh10/Group-62.png)

[Video Tutorial on Youtube](https://youtu.be/G4V4xO9wyD8)

Feature List:

-   🌟 Tech stack: MERN + Socket.io + Chakra UI
-   🎃 Authentication & Authorization with JWT
-   📝 Create Post
-   🗑️ Delete Post
-   ❤️ Like/Unlike Post
-   💬 Comment to a Post
-   👥 Follow/Unfollow Users
-   ❄️ Freeze Your Account
-   🌓 Dark/Light Mode
-   📱 Completely Responsive
-   💬 Chat App With Image Support
-   👀 Seen/Unseen Status for Messages
-   🔊 Notification sounds
-   ⭐ Deployment for FREE

## 🔒 Production Security Features

This application includes production-ready security features:

- **Helmet**: Sets various HTTP headers for security
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Prevents abuse with request rate limiting
- **Input Validation**: All user inputs are validated and sanitized
- **MongoDB Sanitization**: Prevents NoSQL injection attacks
- **XSS Protection**: Cross-site scripting prevention
- **Parameter Pollution Protection**: HPP middleware
- **Secure Cookies**: HTTP-only, secure, same-site cookies
- **Graceful Shutdown**: Proper cleanup on server termination
- **Error Handling**: Global error handler with proper error responses

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Cloudinary account (for image uploads)

## 🚀 Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd tclone
```

### 2. Install dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Environment Configuration

Copy the example environment file and configure your variables:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration (use a strong, random secret in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Client URL (for CORS in production)
CLIENT_URL=http://localhost:3000

# Ping URL (for cron job in production)
PING_URL=https://your-app.onrender.com/api/health
```

### 4. Build the app

```shell
npm run build
```

### 5. Start the app

```shell
# Development
npm run dev

# Production
npm start
```

## 🌐 Deployment

### Environment Variables for Production

When deploying to production, ensure you set these environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Set to `production` | Yes |
| `PORT` | Server port (default: 5000) | Yes |
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | Strong random secret for JWT | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `CLIENT_URL` | Frontend URL for CORS | Yes |
| `PING_URL` | URL for health check cron job | No |

### Deploy to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Configure the following:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**: Add all required variables from `.env.example`

### Deploy to Railway

1. Create a new project on Railway
2. Connect your GitHub repository
3. Add environment variables
4. Railway will automatically detect and deploy your Node.js app

### Deploy to Heroku

1. Create a new app on Heroku
2. Connect your GitHub repository
3. Add environment variables in Settings > Config Vars
4. Enable automatic deploys

## 🔧 API Endpoints

### Authentication
- `POST /api/users/signup` - Register new user
- `POST /api/users/login` - Login user
- `POST /api/users/logout` - Logout user

### Users
- `GET /api/users/profile/:query` - Get user profile
- `POST /api/users/follow/:id` - Follow/unfollow user
- `PUT /api/users/update/:id` - Update user profile
- `GET /api/users/suggested` - Get suggested users
- `POST /api/users/freeze` - Freeze account

### Posts
- `POST /api/posts/create` - Create new post
- `GET /api/posts/:id` - Get post by ID
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/like/:id` - Like/unlike post
- `POST /api/posts/reply/:id` - Reply to post
- `GET /api/posts/feed` - Get feed posts
- `GET /api/posts/user/:username` - Get user posts

### Messages
- `POST /api/messages` - Send message
- `GET /api/messages/:otherUserId` - Get messages
- `GET /api/messages` - Get all conversations

### Health Check
- `GET /api/health` - Server health check

## 🧪 Testing

The project includes comprehensive unit and integration tests for both backend and frontend.

### Backend Tests

```bash
# Run all backend tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

**Test Coverage:**
- User authentication (signup, login, logout)
- Post management (create, delete, like, reply)
- Messaging (send, receive, conversations)
- Authentication middleware
- Input validation
- Error handling

For more details, see [`backend/tests/README.md`](backend/tests/README.md).

### Frontend Tests

```bash
# Navigate to frontend directory
cd frontend

# Run all frontend tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

**Test Coverage:**
- Component rendering
- User interactions
- Utility functions
- Form validation

For more details, see [`frontend/TESTING.md`](frontend/TESTING.md).

## 🎨 Frontend

The project includes a complete React frontend with:

- **Chakra UI** for modern, responsive design
- **Dark/Light mode** toggle
- **Real-time updates** via Socket.io
- **Image upload** support
- **Notification sounds** for messages
- **Fully responsive** design

### Frontend Structure

```
frontend/
├── src/
│   ├── components/     # React components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── context/        # React context providers
│   ├── atoms/          # State management atoms
│   └── assets/         # Static assets
├── public/             # Public assets
└── package.json        # Frontend dependencies
```

### Frontend Features

- **Authentication Pages**: Login and Signup
- **Home Page**: Feed of posts from followed users
- **User Profile**: View and update profile
- **Post Page**: View individual posts with comments
- **Chat Page**: Real-time messaging
- **Settings Page**: Account settings

## 🛡️ Security Best Practices

1. **Always use HTTPS in production**
2. **Use strong, random JWT secrets** (at least 32 characters)
3. **Keep dependencies updated** - Run `npm audit` regularly
4. **Use environment variables** - Never commit secrets to version control
5. **Enable MongoDB authentication** in production
6. **Set up proper CORS** - Only allow your frontend domain
7. **Monitor rate limits** - Adjust based on your traffic
8. **Use secure cookies** - Already configured for production

## 📝 License

ISC
