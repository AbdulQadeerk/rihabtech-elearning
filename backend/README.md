# Rihab Technologies Backend API

This is the backend API server for the Rihab Technologies e-learning platform, providing email services and configuration management.

## Features

- **Email Service**: Send emails using Nodemailer with configurable providers (SMTP, Gmail, Outlook, SendGrid, Mailgun)
- **Configuration Management**: Manage Razorpay and email settings via Firebase
- **Email Templates**: Store and manage email templates in Firebase
- **Rate Limiting**: Built-in rate limiting for API protection
- **Security**: Helmet.js for security headers and CORS protection

## Prerequisites

- Node.js 16+ 
- Firebase project with Firestore enabled
- Firebase Admin SDK credentials

## Installation

1. **Clone and navigate to backend directory**:
   ```bash
   cd rihabtech-elearning/backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   ```bash
   cp env.example .env
   ```

4. **Configure environment variables** in `.env`:
   ```env
   # Server Configuration
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000

   # Firebase Configuration
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_CLIENT_EMAIL=your-firebase-client-email
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour Firebase Private Key\n-----END PRIVATE KEY-----\n"
   ```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3001` (or the port specified in your `.env` file).

## API Endpoints

### Health Check
- **GET** `/health` - Server health status

### Email Service
- **POST** `/api/email/send` - Send email
- **POST** `/api/email/test-connection` - Test email connection
- **POST** `/api/email/send-test` - Send test email

### Configuration Service
- **GET** `/api/config/razorpay` - Get Razorpay configuration
- **GET** `/api/config/email` - Get email settings
- **GET** `/api/config/email-templates` - Get all email templates
- **GET** `/api/config/email-templates/:type` - Get specific email template

## Email Configuration

The email service supports multiple providers:

### SMTP
```json
{
  "provider": "smtp",
  "smtp": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "your-email@gmail.com",
      "pass": "your-app-password"
    }
  }
}
```

### Gmail
```json
{
  "provider": "gmail",
  "gmail": {
    "user": "your-email@gmail.com",
    "pass": "your-app-password"
  }
}
```

### SendGrid
```json
{
  "provider": "sendgrid",
  "sendgrid": {
    "apiKey": "your-sendgrid-api-key"
  }
}
```

### Mailgun
```json
{
  "provider": "mailgun",
  "mailgun": {
    "apiKey": "your-mailgun-api-key",
    "domain": "your-mailgun-domain"
  }
}
```

## Firebase Collections

The backend expects the following Firebase collections:

### `razorpayConfig`
```json
{
  "keyId": "rzp_test_xxxxxxxxxxxxx",
  "keySecret": "your-razorpay-key-secret",
  "currency": "INR",
  "theme": {
    "color": "#6A5ACD"
  },
  "isTestMode": true,
  "description": "Subscription Payment",
  "prefill": {
    "name": "John Doe",
    "email": "john@example.com",
    "contact": "+919876543210"
  },
  "notes": {
    "platform": "Rihab Technologies",
    "source": "admin_panel"
  },
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "updatedBy": "admin"
}
```

### `emailSettings`
```json
{
  "provider": "smtp",
  "smtp": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "noreply@rihabtech.com",
      "pass": "encrypted-password"
    }
  },
  "from": {
    "name": "Rihab Technologies",
    "email": "noreply@rihabtech.com"
  },
  "replyTo": "support@rihabtech.com",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "updatedBy": "admin"
}
```

### `emailTemplates`
```json
{
  "name": "Subscription Confirmation",
  "subject": "Welcome! Your {{planName}} subscription is now active",
  "htmlContent": "<html>...</html>",
  "textContent": "Welcome!...",
  "variables": ["userName", "planName", "amount"],
  "type": "subscription_confirmation",
  "isActive": true,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configured for specific frontend URL
- **Helmet.js**: Security headers
- **Input Validation**: Joi validation for all endpoints
- **Error Handling**: Comprehensive error handling and logging

## Development

### Project Structure
```
backend/
├── routes/
│   ├── email.js          # Email service endpoints
│   └── config.js         # Configuration endpoints
├── server.js             # Main server file
├── package.json          # Dependencies
├── env.example           # Environment variables template
└── README.md            # This file
```

### Adding New Endpoints

1. Create route file in `routes/` directory
2. Add validation schema using Joi
3. Import and use in `server.js`
4. Add proper error handling

### Testing

Test the email service:
```bash
curl -X POST http://localhost:3001/api/email/test-connection \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "provider": "smtp",
      "smtp": {
        "host": "smtp.gmail.com",
        "port": 587,
        "secure": false,
        "auth": {
          "user": "test@gmail.com",
          "pass": "test-password"
        }
      }
    }
  }'
```

## Deployment

### Environment Variables for Production
- Set `NODE_ENV=production`
- Configure proper Firebase credentials
- Set secure `FRONTEND_URL`
- Configure production email settings

### Docker Deployment (Optional)
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## Troubleshooting

### Common Issues

1. **Firebase Authentication Error**
   - Check Firebase credentials in `.env`
   - Ensure Firebase Admin SDK is properly configured

2. **Email Sending Fails**
   - Verify email provider credentials
   - Check firewall/network restrictions
   - Test with different email providers

3. **Rate Limiting**
   - Adjust rate limit settings in `server.js`
   - Check if requests are coming from same IP

### Logs
The server logs all requests and errors. Check console output for debugging information.

## Support

For issues and questions, please contact the development team or create an issue in the project repository.
