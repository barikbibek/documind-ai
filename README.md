# DocuMind AI 🧠📄

> **DocuMind AI** is an intelligent, full-stack Retrieval-Augmented Generation (RAG) platform that empowers users to upload multiple PDF documents and converse with them in real-time. Powered by Google Gemini and LangChain, it streams contextual, grounded answers token-by-token alongside citation sources.

---

## 🌐 Live Deployments

| Component | Status / Link |
| :--- | :--- |
| **Frontend Web App** | [https://ai.10xlab.online](https://ai.10xlab.online) |
| **Backend API Health** | [https://documind-api.10xlab.online/health](https://documind-api.10xlab.online/health) |

---

## ✨ Features

- 📑 **Multi-PDF Document Ingestion**: Upload, parse, chunk, and embed documents in seconds.
- ⚡ **Asynchronous Background Processing**: PDF parsing, chunking, and embedding generation are offloaded to **BullMQ** worker queues backed by **Redis** to keep the API reactive.
- 🔍 **Vector Search with `pgvector`**: High-performance semantic vector retrieval powered by PostgreSQL and the `pgvector` extension.
- 💬 **Streaming RAG Conversions (SSE)**: Real-time token streaming using Server-Sent Events (SSE) with source attribution before responses.
- 🏷️ **Dynamic Session Titles**: AI-generated smart conversation titles produced automatically on your first message.
- 🛡️ **Multi-Tier Rate Limiting**: Built-in security with tiered rate limiting (aggressive limits on authentication, document upload, and LLM inference).
- 🧪 **Comprehensive Automated Testing**: Unit and integration test coverage using **Vitest**, **Supertest**, and **React Testing Library**.
- 🚀 **Automated CI/CD**: GitHub Actions pipeline for continuous testing, automated Netlify frontend deployments, and native ARM64 Docker deployment to Oracle Cloud Infrastructure (OCI).

---

## 🛠️ Tech Stack & Technologies

### Frontend (Client)
- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching & Caching**: [@tanstack/react-query](https://tanstack.com/query)
- **Routing**: React Router DOM v7
- **Icons & Markdown**: [Lucide React](https://lucide.dev/), [React Markdown](https://github.com/remarkjs/react-markdown)
- **Testing**: [Vitest](https://vitest.dev/), [@testing-library/react](https://testing-library.com/), JSDOM

### Backend (Server)
- **Runtime & Framework**: [Node.js](https://nodejs.org/) + [Express 5](https://expressjs.com/)
- **Language**: TypeScript (`tsx`, `tsup`)
- **LLM & RAG Orchestration**: [LangChain](https://js.langchain.com/) + [Google Gemini API](https://ai.google.dev/) (`@google/generative-ai`, `@langchain/google-genai`)
- **Vector Database**: [PostgreSQL](https://www.postgresql.org/) with [`pgvector`](https://github.com/pgvector/pgvector)
- **ORM & Migrations**: [Drizzle ORM](https://orm.drizzle.team/) + `drizzle-kit`
- **Job Queue & Cache**: [BullMQ](https://docs.bullmq.io/) + [Redis](https://redis.io/) (`ioredis`)
- **PDF Extraction**: `pdf-parse`
- **Validation & Security**: [Zod](https://zod.dev/), `bcryptjs`, `jsonwebtoken`, `helmet`, `express-rate-limit`
- **Testing**: [Vitest](https://vitest.dev/), [Supertest](https://github.com/ladjs/supertest)

### Infrastructure & Deployment
- **Containerization**: Docker & Docker Compose
- **Frontend Hosting**: [Netlify](https://www.netlify.com/)
- **Backend Hosting**: Oracle Cloud Infrastructure (OCI) Ampere A1 ARM64 (`VM.Standard.A1.Flex`)
- **CI/CD**: GitHub Actions

---

## 🚀 Local Setup & Installation

Follow these steps to run DocuMind AI locally on your development machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (v20 or newer)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Google Gemini API Key](https://aistudio.google.com/)

---

### 1. Clone the Repository
```bash
git clone https://github.com/barikbibek/documind-ai.git
cd documind-ai
```

---

### 2. Configure Environment Variables

#### Root `.env` (for Docker Compose)
Create a `.env` in the root directory:
```env
POSTGRES_PASSWORD=your_secure_db_password
```

#### Server `.env`
Create `server/.env`:
```env
PORT=4000
NODE_ENV=development

# Database & Cache
DATABASE_URL="postgresql://postgres:your_secure_db_password@localhost:5432/documind"
REDIS_URL="redis://localhost:6379"

# Authentication
JWT_SECRET="your_super_secret_jwt_key_min_6_chars"
JWT_EXPIRES_IN=7d

# Google Gemini AI
GEMINI_API_KEY="AIzaSy..."
GEMINI_EMBEDDING_MODEL="models/gemini-embedding-001"
GEMINI_CHAT_MODEL="models/gemini-1.5-flash"

# Storage
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE_MB=50

# CORS
CLIENT_URL="http://localhost:5173"
```

#### Client `.env`
Create `client/.env`:
```env
VITE_API_URL="http://localhost:4000/api"
```

---

### 3. Run with Docker Compose (Recommended)

Start PostgreSQL (with `pgvector`), Redis, and the backend services in containers:

```bash
# Start all backend services
docker compose up --build -d

# Run database migrations
docker compose exec backend npm run db:migrate
```

Then, in a separate terminal, run the frontend client:

```bash
cd client
npm install
npm run dev
```

The application will now be running at:
- **Client**: `http://localhost:5173`
- **Server API**: `http://localhost:4000`
- **Health Check**: `http://localhost:4000/health`

---

### 4. Running Without Docker (Manual Development)

If you prefer running services locally:

1. Ensure PostgreSQL (with `pgvector` enabled) is running on port `5432` and Redis is running on port `6379`.
2. **Start Backend**:
   ```bash
   cd server
   npm install
   npm run db:migrate
   npm run dev
   ```
3. **Start Frontend**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

---

## 🧪 Running Tests

Both frontend and backend include automated test suites powered by **Vitest**.

### Run Backend Tests (Unit & Integration)
```bash
cd server
npm test
```

### Run Frontend Tests
```bash
cd client
npm test
```

---

## 📡 API Overview

| Method | Endpoint | Description | Rate Limit |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Server health check | Global (100 req / 15 min) |
| `POST` | `/api/auth/register` | Register a new user | **Auth Limit** (5 req / 15 min) |
| `POST` | `/api/auth/login` | Log in and receive JWT | **Auth Limit** (5 req / 15 min) |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Global |
| `GET` | `/api/sessions` | List user chat sessions | Global |
| `POST` | `/api/sessions` | Create a new chat session | Global |
| `POST` | `/api/sessions/:sessionId/documents/upload` | Upload PDF documents (Multipart) | **Doc Limit** (10 req / hour) |
| `POST` | `/api/sessions/:sessionId/chat/message` | Send message & stream RAG response | **Chat Limit** (10 req / min) |
| `GET` | `/api/sessions/:sessionId/chat/messages` | Retrieve conversation history | Global |

---

## 🔄 CI/CD Workflow

The automated GitHub Actions pipeline (`.github/workflows/ci-cd.yml`) runs on:
1. **Pull Requests**: Runs tests and build validation for both `client` and `server`.
2. **Pushes to `main`**:
   - **Frontend**: Automatically builds and deploys to **Netlify**.
   - **Backend**: Connects securely via SSH to the **Oracle Cloud A1 ARM64 VM**, triggers a `git pull`, rebuilds native ARM Docker containers, and validates server health.

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).
