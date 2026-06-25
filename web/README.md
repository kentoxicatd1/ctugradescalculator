# CTU Grade Calculator (Web Version)

A modern, responsive Next.js web application migrated from the native Android CTU Grade Calculator. 
It allows students from Cebu Technological University (CTU) to upload their PDF grade reports and automatically calculate their General Weighted Average (GWA), total units, and determine their Latin Honors standing.

## Features
- **Client-Side Parsing:** PDF grade reports are processed securely in the browser using `pdfjs-dist` without sending sensitive data to any server.
- **Accurate GWA Logic:** Filters out non-academic subjects (NSTP, PE, PATHFIT) correctly and calculates units exactly like the native Android app.
- **Latin Honors Check:** Applies CTU's specific Latin Honors thresholds (e.g. <= 1.200 for Summa Cum Laude) and checks disqualification rules (no grade lower than 2.50).
- **Persistent Storage:** Uses `zustand` and `localStorage` so your parsed grades survive page reloads.
- **Responsive UI:** Built with Tailwind CSS and `shadcn/ui` for a beautiful mobile-first experience.

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand
- **PDF Extraction:** pdfjs-dist

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Deployment

This application is ready to be deployed on [Vercel](https://vercel.com).
Simply push this repository to GitHub, import it in Vercel, and the defaults for Next.js will automatically configure the build commands.
