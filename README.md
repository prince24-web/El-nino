# 🌿 El-Nino — AI Agricultural Intelligence & Plant Pathology

> **Next-Generation Cloud Agricultural Advisory & Multimodal Crop Disease Detection Platform for Smallholder Farmers in Sub-Saharan Africa.**  
> Powered by **Next.js 16**, **Google Gemini 3.1 Flash**, and **Tailwind CSS**, designed for effortless 1-click deployment on **Vercel**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/prince24-web/el-nino&env=GEMINI_API_KEY&envDescription=Google%20Gemini%20API%20Key%20from%20AI%20Studio&envLink=https://aistudio.google.com/)

---

## 🌟 Overview & Hackathon Purpose

Smallholder farmers across Africa face devastating crop losses (up to 40% annually) caused by rapidly evolving plant pathogens (such as Tomato Late Blight, Maize Common Rust, and Fall Armyworm) alongside climate extremes. 

**El-Nino** transforms complex agricultural extension services into an accessible, intelligent, and instant web app:
- 📸 **Multimodal Plant Pathology Scanner**: Farmers and extension agents can snap or upload leaf photos to instantly diagnose bacterial, fungal, or viral diseases, assess severity, and receive organic and chemical remedies.
- ⚡ **Real-Time Streaming Advisory**: High-speed edge streaming powered by **Gemini 3.1 Flash**.
- 🇳🇬 **Grounded Local Agricultural Knowledge**: Native support for Nigerian agro-zones, local crop names (*Agbado, Akpu, Tomati, Rogo*), fertilizer application timings (NPK, Urea), and real-time regional market prices in Naira (₦) across Mile 12, Bodija, and Dawanau.
- 📱 **Mobile-First & Modern UI**: Earthy nature design system with dark and light modes, responsive layout, glassmorphic accents, and offline-ready responsiveness.

---

## 🏗️ Architecture & Tech Stack

```text
                             ┌───────────────────────────────┐
                             │       User Web Browser        │
                             │  (Mobile, Tablet, or Desktop) │
                             └───────────────┬───────────────┘
                                             │ HTTP / Edge Stream
                                             ▼
                             ┌───────────────────────────────┐
                             │   Next.js 16 (App Router)     │
                             │      Hosted on Vercel         │
                             └───────────────┬───────────────┘
                                             │
                      ┌──────────────────────┴──────────────────────┐
                      ▼                                             ▼
          ┌───────────────────────┐                     ┌───────────────────────┐
          │   /api/chat Route     │                     │  Local Grounding DB   │
          │ (Serverless Function) │◄────────────────────┤  (20 Crops, Pests,    │
          └───────────┬───────────┘                     │   Fertilizers, ₦ Rates│
                      │                                 └───────────────────────┘
                      ▼
          ┌───────────────────────┐
          │   Google Gemini API   │
          │  (gemini-3.1-flash)   │
          │  Multimodal & Stream  │
          └───────────────────────┘
```

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons, React Markdown & Remark GFM.
- **Backend**: Next.js Serverless Route (`/api/chat`) with streaming `ReadableStream`.
- **AI Core**: `@google/genai` with `gemini-3.1-flash-lite` (multimodal vision + text streaming).
- **Knowledge Engine**: Grounded database of 20 staple crops, 15 major pests, 24 targeted treatments, 18 fertilizer timings, and regional market prices in Nigerian Naira (₦).
- **Hosting**: Vercel (Edge-compatible, zero-config serverless deployment).

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v18+` or `v20+` or `v24+`
- Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone the repository
```bash
git clone https://github.com/prince24-web/el-nino.git
cd el-nino
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env.local` file in the root directory:
```bash
cp .env.example .env.local
```
Add your Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to experience El-Nino.

---

## ☁️ Deploying to Vercel

1. Push this repository to GitHub under `prince24-web/el-nino`.
2. Connect your repository on [Vercel](https://vercel.com).
3. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Google Gemini API Key
4. Click **Deploy**. Vercel will build and host El-Nino with edge streaming support in under 60 seconds!

---

## 🌿 Core Features

| Feature | Description |
| :--- | :--- |
| **Instant Leaf Pathology** | Upload or drag & drop leaf images for automated disease classification, severity scoring, and remedial advice. |
| **Edge Token Streaming** | Direct stream chunking delivers answers in milliseconds without UI freezes. |
| **Regional Market Intelligence** | Real-time commodity tracking in Nigerian Naira (₦) for major markets (Mile 12, Bodija, Dawanau, Ose). |
| **NPK Fertilizer Calendars** | Tailored fertilizer scheduling (basal and top-dressing) with bag cost estimates. |
| **Accessible Dark & Light UI** | High-contrast earthy themes engineered for low-light or outdoor sunlight usage on farms. |

---

## 📄 License
MIT License. Built for agricultural impact.
