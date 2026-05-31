# LiftLog - Workout Tracker

A progressive overload workout tracking app built with Next.js and deployed on Vercel.

## Features

- 📊 Track workouts across 7 weeks with progressive overload
- 💪 4-day workout split (Saturday, Sunday, Monday, Wednesday)
- ✅ Log sets and reps with visual completion tracking
- 🔄 Automatic progressive overload calculations
- 💾 Cloud database storage with offline support
- 📱 Responsive design for mobile and desktop

## Tech Stack

- **Framework**: Next.js 16 with TypeScript
- **Database**: Neon Postgres (serverless)
- **Deployment**: Vercel
- **Styling**: Inline styles with custom design system

## Database Setup

This app uses Neon Postgres for data persistence. To set it up:

### Option 1: Via Vercel Dashboard (Recommended)

1. Go to your Vercel project dashboard
2. Click on the "Storage" tab
3. Click "Create Database"
4. Select "Neon Postgres"
5. Follow the prompts to create your database
6. Vercel will automatically add the `DATABASE_URL` environment variable

### Option 2: Manual Setup

1. Create a free account at [Neon](https://neon.tech)
2. Create a new project and database
3. Copy your connection string
4. In Vercel, go to Settings → Environment Variables
5. Add `DATABASE_URL` with your Neon connection string
6. Redeploy your app

## Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
# Create .env.local and add:
# DATABASE_URL=your_neon_connection_string

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## How It Works

### Data Storage

- **Primary**: Cloud database (Neon Postgres) for persistent storage
- **Fallback**: localStorage for offline functionality
- **Sync**: Automatic 2-second debounced sync to database

### Progressive Overload

- **Bodyweight exercises**: +1 rep per week
- **Weighted exercises**: Alternates between rep increases and weight increases
  - Odd weeks: +1 rep per set
  - Even weeks: +5% weight (minimum 2.5 lbs)

## Deployment

The app is automatically deployed via Vercel when you push to the main branch.

```bash
# Commit changes
git add .
git commit -m "Your message"
git push origin main
```

Vercel will automatically:

1. Build your app
2. Run type checking
3. Deploy to production
4. Provide a live URL

## Environment Variables

Required environment variables:

- `DATABASE_URL`: Neon Postgres connection string (automatically set by Vercel Storage)

## License

MIT
