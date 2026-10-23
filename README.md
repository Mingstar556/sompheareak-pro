# 🧸 Somphea Reak – Customer Storefront (Web & Mobile)

The official customer-facing e-commerce storefront for **Somphea Reak (សម្ភារៈ)** Toy & Italian Modular Charm Studio.

## 🚀 Architecture
- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS + Framer Motion + Lucide Icons
- **Database**: Neon Serverless PostgreSQL (`@neondatabase/serverless`)
- **Hosting**: Render.com Web Service
- **Companion App**: [sompheareak-admin](https://github.com/Mingstar556/sompheareak-admin) (Dedicated Admin Suite sharing the same Neon DB)

## 📦 Features
- 🍱 **Top Category Bento Grid**: Visually stunning bento cards highlighting key categories.
- 🎪 **Arcade Category Bar**: Dynamic category pills with Khmer/English localization and emoji icons.
- 🛍️ **Tactile Product Catalog**: 2-column mobile and 4-column desktop layout with high-converting cart flow.
- 🇮🇹 **Italian Modular Stainless Steel Bracelet Studio**: Interlocking charm simulation, customizable links, and automatic unique charm code generation.
- 📱 **Floating Customer Dock**: Center mascot logo with instant click-to-home and page refresh, customer order history lookup, and account profile.
- 💳 **ABA KHQR & Instant Receipt System**: Seamless Cambodian digital payments with printable receipts and direct seller Telegram chat.

## 🛠️ Deploy to Render.com

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**.
2. Connect your GitHub repository `Mingstar556/sompheareak-pro`.
3. Configure the settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add the following **Environment Variables**:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string:
     ```
     postgresql://neondb_owner:YOUR_PASSWORD@ep-YOUR-PROJECT.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
   - `NEXT_PUBLIC_ADMIN_URL`: URL to your deployed `sompheareak-admin` web service.
5. Click **Deploy Web Service**.
