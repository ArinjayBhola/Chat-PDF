# Chat-PDF 📄💬

A powerful, AI-powered SaaS application that allows users to upload PDF documents and have intelligent conversations with them using advanced AI technology. Built with modern web technologies and designed for a seamless user experience.

![Next.js](https://img.shields.io/badge/Next.js-15.1.11-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.1.2-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?style=flat-square&logo=tailwind-css)

## 🌟 Features

### Core Functionality
- **PDF Upload & Processing**: Upload PDF files (up to 10MB) with drag-and-drop support
- **AI-Powered Chat**: Engage in intelligent conversations about your PDF content using Google's Gemini AI
- **Vector Search**: Leverages Pinecone vector database for semantic search and context retrieval
- **OCR Support**: Automatic Optical Character Recognition (Tesseract.js) for scanned PDFs
- **Web Search**: Integrated Exa.ai search for broader context beyond the PDF
- **Real-time Streaming**: Get AI responses in real-time with smooth streaming
- **Multi-Document Support**: Manage multiple PDF chats simultaneously

### Authentication & User Management
- **Dual Authentication**: Support for both Google OAuth and email/password credentials
- **Secure Sessions**: JWT-based session management with NextAuth.js
- **Protected Routes**: Middleware-based route protection for authenticated users

### Subscription & Payments
- **Freemium Model**: 
  - **Free Tier**: Up to 3 PDF uploads
  - **Pro Tier**: Unlimited PDF uploads
- **Razorpay Integration**: Secure payment processing for Pro subscriptions
- **Payment Webhooks**: Automated subscription activation upon successful payment

### User Experience
- **Clean, Modern UI**: Distraction-free interface with smooth animations
- **Responsive Design**: Works seamlessly across all device sizes
- **Chat History**: Persistent message storage for all conversations
- **PDF Viewer**: Integrated PDF viewing alongside chat interface
- **Loading States**: Clear visual feedback during processing

## 🏗️ Architecture

### Tech Stack

#### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: TailwindCSS 4 with custom animations
- **UI Components**: Radix UI primitives
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form with validation
- **Icons**: React Icons

#### Backend
- **Runtime**: Node.js
- **API Routes**: Next.js API Routes
- **Authentication**: NextAuth.js v4
- **Database ORM**: Drizzle ORM
- **Database**: PostgreSQL (Neon serverless)

#### AI & ML
- **LLM**: Google Gemini 2.5 Flash (via AI SDK)
- **Embeddings**: Google Gemini text-embedding-004
- **Vector Database**: Pinecone
- **PDF Processing**: Langchain PDF Loader
- **OCR**: Tesseract.js
- **Web Search**: Exa.ai SDK
- **Text Splitting**: Recursive Character Text Splitter

#### Storage & Infrastructure
- **File Storage**: AWS S3 (configurable region)
- **Payment Gateway**: Razorpay
- **Deployment**: Vercel-ready

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ installed
- PostgreSQL database (Neon recommended)
- AWS S3 bucket
- Pinecone account and index
- Google OAuth credentials
- Razorpay account
- Exa.ai API key (for web search)

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=your_postgresql_connection_string

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AWS S3
NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID=your_aws_access_key
NEXT_PUBLIC_AWS_S3_SECRET_ACCESS_KEY=your_aws_secret_key
NEXT_PUBLIC_AWS_S3_BUCKET_NAME=your_bucket_name
NEXT_PUBLIC_AWS_REGION=your_aws_region

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Google AI
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key

# Exa AI (Web Search)
EXA_API_KEY=your_exa_api_key
```

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Chat-PDF
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up the database**
```bash
# Generate Drizzle migrations
npx drizzle-kit generate

# Push schema to database
npx drizzle-kit push
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## 📁 Project Structure

```
Chat-PDF/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── chat/                 # Chat streaming endpoint
│   │   ├── create-chat/          # Chat creation endpoint
│   │   ├── get-messages/         # Message retrieval endpoint
│   │   ├── razorpay/             # Payment link creation
│   │   └── webhook/              # Payment webhook handler
│   ├── chat/[chatId]/            # Chat interface page
│   ├── sign-in/                  # Sign-in page
│   ├── sign-up/                  # Sign-up page
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # UI primitives (shadcn/ui)
│   ├── ChatComponent.tsx         # Main chat interface
│   ├── ChatSidebar.tsx           # Chat list sidebar
│   ├── FileUpload.tsx            # PDF upload component
│   ├── MessageList.tsx           # Message display
│   ├── PDFViewer.tsx             # PDF viewer
│   ├── PricingSection.tsx        # Pricing display
│   ├── UpgradeButton.tsx         # Pro upgrade button
│   ├── UserMenu.tsx              # User dropdown menu
│   └── ResizableSplit.tsx        # Resizable layout
├── lib/                          # Utility libraries
│   ├── db/                       # Database configuration
│   │   ├── schema.ts             # Drizzle schema
│   │   ├── auth-schema.ts        # Auth tables schema
│   │   └── index.ts              # Database instance
│   ├── auth-options.ts           # NextAuth configuration
│   ├── context.ts                # Vector search & context retrieval
│   ├── embeddings.ts             # Text embedding generation
│   ├── pinecone.ts               # Pinecone operations
│   ├── s3.ts                     # S3 upload (client)
│   ├── s3-server.ts              # S3 download (server)
│   ├── subscription.ts           # Subscription checking
│   ├── razorpay.ts               # Razorpay client
│   └── utils.ts                  # Helper functions
├── middleware.ts                 # Route protection middleware
│   ├── drizzle.config.ts             # Drizzle ORM configuration
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # TailwindCSS configuration
└── package.json                  # Dependencies
```

## 🔄 How It Works

### PDF Upload & Processing Flow

1. **Upload**: User drops a PDF file in the upload zone
2. **S3 Storage**: File is uploaded to AWS S3 with a unique key
3. **PDF Parsing**: Server downloads PDF and extracts text using Langchain's PDFLoader
4. **Text Chunking**: Document is split into smaller chunks using RecursiveCharacterTextSplitter
5. **Embedding Generation**: Each chunk is converted to vector embeddings using Google Gemini `text-embedding-004`
6. **Vector Storage**: Embeddings are stored in Pinecone with metadata (page numbers, text)
7. **Chat Creation**: A new chat record is created in the database

### Chat Interaction Flow

1. **User Query**: User types a question about the PDF
2. **Query Embedding**: Question is converted to a vector embedding
3. **Semantic Search**: Pinecone finds the top 5 most relevant chunks (similarity > 0.7)
4. **Context Building**: Relevant chunks are concatenated (max 3000 chars)
5. **AI Prompt**: Context + user query sent to Google Gemini AI
6. **Streaming Response**: AI response is streamed back in real-time
7. **Message Storage**: Both user query and AI response are saved to database

### Authentication Flow

#### Google OAuth
1. User clicks "Sign in with Google"
2. Redirected to Google consent screen
3. On success, NextAuth creates/updates user in database
4. Account link created between user and Google provider
5. JWT token issued with user ID

#### Email/Password
1. User signs up with email and password
2. Password hashed with bcrypt (10 rounds)
3. User record created in database
4. On sign-in, password verified against hash
5. JWT token issued on successful authentication

### Subscription & Payment Flow

1. User clicks "Upgrade to Pro"
2. Payment link created via Razorpay API
3. User redirected to Razorpay payment page
4. On successful payment, Razorpay redirects back with payment details
5. Webhook handler verifies payment signature
6. User subscription record created/updated in database
7. User gains access to unlimited PDF uploads

## 🎨 UI/UX Features

- **Clean Design**: Minimalist interface focused on content
- **Smooth Animations**: Micro-interactions for better user engagement
- **Loading States**: Clear feedback during PDF processing and AI responses
- **Error Handling**: User-friendly error messages with toast notifications
- **Responsive Layout**: Adapts to mobile, tablet, and desktop screens
- **Resizable Panels**: Adjustable split view between PDF and chat
- **Auto-scroll**: Chat automatically scrolls to latest message
- **Typing Indicators**: Visual feedback when AI is processing

## 🔒 Security Features

- **Protected Routes**: Middleware ensures only authenticated users access chat
- **JWT Sessions**: Secure, stateless authentication
- **Password Hashing**: bcrypt with salt rounds for credential security
- **Environment Variables**: Sensitive keys stored securely
- **CORS Protection**: API routes protected from unauthorized origins
- **Input Validation**: File size limits and type checking
- **SQL Injection Prevention**: Drizzle ORM with parameterized queries

## 📊 Performance Optimizations

- **Adaptive Batching**: Dynamic batch sizing for Pinecone uploads to avoid rate limits
- **Chunked Uploads**: Large vectors uploaded in optimized batches
- **Streaming Responses**: AI responses streamed for perceived performance
- **React Query Caching**: Efficient data fetching and caching
- **Lazy Loading**: Components loaded on demand
- **Memory Management**: Increased Node.js heap size for large PDFs (8GB)

## 🐛 Known Limitations

- **File Size**: Maximum PDF size is 10MB
- **Free Tier**: Limited to 3 PDF uploads
- **Embedding Model**: Google Gemini text-embedding-004 (768 dimensions)
- **Context Window**: Limited to 3000 characters of context


## 🛠️ Development

### Available Scripts

```bash
# Development server with increased memory
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Generate Drizzle migrations
npx drizzle-kit generate

# Push schema changes to database
npx drizzle-kit push

# Open Drizzle Studio (database GUI)
npx drizzle-kit studio
```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js recommended configuration
- **Formatting**: Consistent code style across project
- **Component Structure**: Functional components with hooks
- **File Naming**: PascalCase for components, kebab-case for utilities
