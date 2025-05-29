# Unity Voice Learning Platform - Frontend

A modern Next.js frontend application for the Unity Voice Learning Platform, designed to help users improve their English speaking skills through interactive voice-based exercises.

## Features

- 🎯 **Interactive Learning Tasks**: Flashcards, conversations, posts, and quizzes
- 🎤 **Voice Recognition**: Real-time speech analysis and feedback
- 📊 **Progress Tracking**: Comprehensive dashboard with learning analytics
- 🌐 **Multi-level Learning**: Beginner, intermediate, and advanced levels
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS
- 🔐 **Secure Authentication**: JWT-based user authentication
- 📱 **Mobile Responsive**: Works seamlessly on all devices

## Tech Stack

- **Framework**: Next.js 15.3.2 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React, React Icons
- **Charts**: Recharts
- **HTTP Client**: Axios
- **Authentication**: JWT with jsonwebtoken
- **Voice Processing**: Azure OpenAI integration

## Prerequisites

- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- Unity Voice Backend API running

## Installation

1. **Clone and navigate to the project**:
   ```bash
   git clone <repository-url>
   cd unity-voice-frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   # API Configuration
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   
   # Azure OpenAI
   NEXT_PUBLIC_AZURE_OPENAI_API_KEY=your_api_key
   NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
   NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT_NAME=your_deployment
   
   # Authentication
   NEXT_PUBLIC_JWT_SECRET=your_jwt_secret
   
   # Database (for API routes)
   NEXT_PUBLIC_DATABASE_URL=mysql://user:password@localhost:3306/unity_voice_db
   ```

## Development

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

3. **Available Scripts**:
   ```bash
   npm run dev          # Start development server
   npm run build        # Build for production
   npm run start        # Start production server
   npm run lint         # Run ESLint
   npm run type-check   # Run TypeScript type checking
   ```

## Project Structure

```
unity-voice-frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes (server-side)
│   │   ├── components/        # Reusable UI components
│   │   ├── dashboard/         # Dashboard pages
│   │   ├── topics/           # Topic-based learning pages
│   │   ├── lib/              # Utility libraries
│   │   └── globals.css       # Global styles
│   ├── hooks/                 # Custom React hooks
│   ├── providers/            # Context providers
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Utility functions
├── public/                    # Static assets
├── data/                     # Static data files
└── src/config/              # Configuration files
```

## Key Components

### Learning Modules
- **Flashcards**: Interactive vocabulary learning
- **Conversations**: AI-powered speaking practice
- **Posts**: Writing and speaking exercises
- **Quizzes**: Knowledge assessment

### Dashboard Features
- User progress tracking
- Learning analytics
- Achievement system
- Performance metrics

### Authentication
- User registration and login
- JWT token management
- Protected routes
- Profile management

## API Integration

The frontend communicates with the Unity Voice Backend through:

- **REST API**: Standard HTTP requests for data operations
- **Real-time Features**: WebSocket connections for live interactions
- **File Uploads**: Audio file processing for voice analysis

## Deployment

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy**: Automatic deployment on push to main branch

### Manual Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start production server**:
   ```bash
   npm start
   ```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_APP_URL=https://your-frontend-domain.com
# ... other production variables
```

## Performance Optimization

- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic route-based code splitting
- **Caching**: Optimized caching strategies
- **Bundle Analysis**: Use `npm run build` to analyze bundle size

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## Troubleshooting

### Common Issues

1. **API Connection Errors**:
   - Verify backend is running
   - Check CORS configuration
   - Validate environment variables

2. **Build Errors**:
   - Clear `.next` directory: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && npm install`
   - Check TypeScript errors: `npm run type-check`

3. **Authentication Issues**:
   - Verify JWT secret matches backend
   - Check token expiration
   - Clear browser localStorage

### Development Tips

- Use React DevTools for component debugging
- Enable verbose logging in development
- Use TypeScript strict mode for better type safety
- Test on multiple devices and browsers

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue in the repository
- Contact the Unity Voice Team
- Check the documentation wiki

---

**Unity Voice Learning Platform** - Empowering English learners through innovative voice technology. 