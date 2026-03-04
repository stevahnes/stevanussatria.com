# Stevanus Satria's Portfolio (VitePress)

A modern JAM-stack personal website built with [VitePress](https://vitepress.dev/), [Vue 3](https://vuejs.org/), and [Tailwind CSS v4](https://tailwindcss.com/).
Home page is manned by GPT-powered advocate agent built using Vercel's AI SDK and hosted on a [Next.js](https://nextjs.org/) backend.
Everything is deployed on [Vercel](https://vercel.com/) with [Cloudflare](https://www.cloudflare.com/) as CDN.

**Live Site:** [stevanussatria.com](https://stevanussatria.com)

## ✨ Features

- ⚡️ **VitePress**: Fast, minimal, and optimized static site generator.
- 🎨 **Tailwind CSS v4**: Utility-first CSS framework for rapid UI development.
- 🌙 **Dark Mode**: Seamless light/dark theme toggle.
- 📱 **Responsive Design**: Mobile-first and fully responsive layout.
- 🧠 **Advocado**: The AMA agent welcoming you to the site, directly built using Vercel's AI SDK.
- 🛠 **Dedicated Backend**: Proxies requests to Langbase without exposing secret tokens.
- 📦 **GitHub-Vercel Integration**: Dynamically fetches and displays public repositories to Vercel.

## 🚀 Getting Started

### 📝 Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- [npm](https://www.npmjs.com/) or [pnpm](https://pnpm.io/)

### ⏳ Installation

```bash
# Clone the repository
git clone https://github.com/stevahnes/vitepress-portfolio.git
cd vitepress-portfolio

# Install dependencies for frontend
cd frontend & npm install
# or
cd frontend & pnpm install

# Install dependencies for backend
cd api & npm install
# or
cd api & pnpm install
```

### 🏃 Start the development server

#### Frontend

```bash
npm run docs:dev
# or
pnpm docs:dev
```

#### Backend

```bash
cd api & npm run dev
# or
cd api & pnpm run dev
```

### 🏗️ Generate static files

#### Frontend

```bash
npm run docs:build
# or
pnpm docs:build
```

## 📄 License

This project is licensed under the MIT License.
