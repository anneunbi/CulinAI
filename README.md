# 🍳 CulinAI - AI-Powered Recipe Generator

[![Next.js](https://img.shields.io/badge/Next.js-14.2.32-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.5-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Replicate](https://img.shields.io/badge/Replicate-AI-FF6B6B?style=for-the-badge)](https://replicate.com/)

> **Turn Your Fridge Into Delicious Recipes** 🥕🥩🥚

## 🌟 Overview

CulinAI is an intelligent web application that transforms your available ingredients into personalized recipes using cutting-edge AI technology. Simply upload a photo of your fridge or ingredients, and our AI will analyze what you have and generate delicious, customized recipes.

### ✨ Key Features

- **📸 Smart Image Analysis** - AI-powered ingredient detection from photos
- **🍽️ Personalized Recipes** - Custom recipes based on your available ingredients
- **🎨 AI-Generated Visuals** - Beautiful recipe images created by Stable Diffusion
- **📱 Modern Web Interface** - Responsive design that works on all devices
- **⚡ Real-time Processing** - Instant recipe generation with live updates
- **🌍 Zero Food Waste** - Make the most of what you already have

## 🎯 Perfect For

- **Home Cooks** who want to try new recipes
- **Busy Professionals** looking for quick meal ideas
- **Budget-Conscious** individuals who want to reduce food waste
- **Creative Chefs** seeking inspiration from available ingredients
- **Anyone** who asks "What can I cook with what I have?"

## 🚀 Live Demo

**🌐 Production Site**: [Deployed on Vercel](https://culin-9abbfl6u5-anneunbis-projects.vercel.app/)

**💻 Local Development**: `http://localhost:3000`

## 🏗️ Tech Stack

### **Frontend**

- **Next.js 14.2.32** - React framework with server-side rendering
- **TypeScript 5.9.2** - Type-safe JavaScript development
- **Tailwind CSS 3.3.5** - Utility-first CSS framework
- **React 18.2.0** - Modern React with hooks and concurrent features

### **Backend & AI**

- **Replicate API** - LLaVa model for ingredient detection
- **Stable Diffusion** - AI-generated recipe images
- **Next.js API Routes** - Serverless backend functions
- **Node.js** - JavaScript runtime environment

### **Development Tools**

- **ESLint** - Code quality and consistency
- **PostCSS** - CSS processing and optimization
- **Autoprefixer** - Automatic vendor prefixing

## 📁 Project Structure

```
CulinAI/
├── 📁 pages/                    # Next.js pages and API routes
│   ├── 📄 index.tsx            # Main application interface
│   ├── 📄 _app.tsx             # App wrapper and global styles
│   └── 📁 api/                 # Backend API endpoints
│       ├── 📁 predictions/     # Recipe generation API
│       └── 📁 image_predictions/ # Image processing API
├── 📁 public/                  # Static assets
│   └── 🖼️ CulinAI-logo.png    # Application logo
├── 📁 styles/                  # Global CSS and fonts
│   └── 📄 globals.css         # Tailwind CSS and custom styles
├── 📄 package.json             # Dependencies and scripts
├── 📄 tsconfig.json            # TypeScript configuration
├── 📄 tailwind.config.js       # Tailwind CSS configuration
├── 📄 vercel.json              # Vercel deployment configuration
└── 📄 .env.local               # Environment variables (not in repo)
```

## 🚀 Quick Start

### **Prerequisites**

- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager
- **Replicate API Token** ([Get one here](https://replicate.com/account#token))

### **1. Clone the Repository**

```bash
git clone https://github.com/anneunbi/CulinAI.git
cd CulinAI
```

### **2. Install Dependencies**

```bash
npm install
```

### **3. Environment Setup**

Create a `.env.local` file in the root directory:

```env
REPLICATE_API_TOKEN=your_replicate_api_token_here
```

### **4. Run Development Server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### **5. Build for Production**

```bash
npm run build
npm start
```

## 🌐 Deployment

### **Vercel (Recommended)**

1. **Connect Repository**: Import your GitHub repo to [Vercel](https://vercel.com)
2. **Environment Variables**: Add `REPLICATE_API_TOKEN` in Vercel dashboard
3. **Auto-Deploy**: Every push to main branch triggers automatic deployment

### **Other Platforms**

- **Netlify**: Supports Next.js with serverless functions
- **Railway**: Good for full-stack applications
- **AWS/GCP**: Enterprise-grade deployment options

## 🔧 API Endpoints

### **Recipe Generation**

- **POST** `/api/predictions` - Generate recipes from ingredients
- **GET** `/api/predictions/[id]` - Get prediction status and results

### **Image Processing**

- **POST** `/api/image_predictions` - Process and analyze food images
- **GET** `/api/image_predictions/[id]` - Get image processing results

## 🎨 Customization

### **Styling**

- **Colors**: Modify Tailwind CSS classes in components
- **Fonts**: Update font imports in `styles/globals.css`
- **Layout**: Adjust component structure in `pages/index.tsx`

### **AI Models**

- **Ingredient Detection**: Update LLaVa model version in API routes
- **Image Generation**: Modify Stable Diffusion parameters
- **Recipe Logic**: Customize AI prompts for different cuisines

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### **Development Guidelines**

- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Maintain responsive design
- Test API endpoints thoroughly
- Update documentation for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Replicate** for providing powerful AI models
- **Next.js** team for the excellent framework
- **Tailwind CSS** for the utility-first CSS approach
- **OpenAI** for the LLaVa model
- **Stability AI** for Stable Diffusion

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/anneunbi/CulinAI/issues)
- **Discussions**: [GitHub Discussions](https://github.com/anneunbi/CulinAI/discussions)
- **Email**: [Contact via GitHub](https://github.com/anneunbi)

## 🔮 Roadmap

- [ ] **User Accounts** - Save favorite recipes and preferences
- [ ] **Recipe Categories** - Filter by cuisine, difficulty, and dietary restrictions
- [ ] **Social Features** - Share recipes and cooking experiences
- [ ] **Mobile App** - Native iOS and Android applications
- [ ] **Voice Commands** - Hands-free recipe navigation
- [ ] **Nutritional Information** - Detailed nutritional analysis
- [ ] **Shopping Lists** - Generate shopping lists for missing ingredients

---

<div align="center">

**Made with ❤️ for food lovers everywhere**

_Turn your ingredients into culinary masterpieces with the power of AI_

[![GitHub stars](https://img.shields.io/github/stars/anneunbi/CulinAI?style=social)](https://github.com/anneunbi/CulinAI/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/anneunbi/CulinAI?style=social)](https://github.com/anneunbi/CulinAI/network/members)
[![GitHub issues](https://img.shields.io/github/issues/anneunbi/CulinAI)](https://github.com/anneunbi/CulinAI/issues)

</div>
