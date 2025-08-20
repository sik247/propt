# 🎯 Propt - Service Level Prompts in One Place

A professional prompt generation platform that helps you create, refine, and manage AI prompts with intelligent assistance.

## ✨ Features

- **🤖 AI-Powered Generation**: Generate prompts using GPT-5 and GPT-4.1
- **👤 User Authentication**: Secure login with Supabase
- **⚡ Free Trial**: 1 free prompt generation for guests
- **🔑 API Key Integration**: Add your own OpenAI API key for unlimited access
- **📱 Responsive Design**: Works beautifully on all devices
- **📄 Document Analysis**: Upload documents to auto-extract industry and use cases
- **💾 Export Options**: Download prompts as Markdown files
- **🔍 Browse Library**: Explore existing prompt templates

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/propt.git
   cd propt
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd backend && pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   # Create .env in project root
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   
   # Create backend/.env
   OPENAI_API_KEY=your-openai-api-key
   ```

4. **Start the application**
   ```bash
   # Terminal 1: Frontend
   npm run dev
   
   # Terminal 2: Backend
   cd backend && python3 run_server.py
   ```

5. **Open http://localhost:8080** in your browser

### Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions on deploying to Vercel.

## 🏗️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **Tailwind CSS** for styling
- **shadcn/ui** for components
- **React Router** for navigation
- **Supabase** for authentication

### Backend
- **Python 3.13** with Flask
- **OpenAI API** for prompt generation
- **Context7 MCP** for enhanced reasoning
- **Sequential thinking** for complex prompts

## 🎯 Usage

### For Guests
- Generate **1 free prompt** without signing up
- Explore existing prompt templates
- View generated prompts and download as Markdown

### For Authenticated Users
- **Unlimited prompt generation** with platform credits
- Save and manage your prompts
- Access to advanced features
- Add personal API keys for direct OpenAI access

### API Key Users
- **Unlimited access** using your own OpenAI API key
- Better performance and rate limits
- Full control over API usage and costs

## 🔧 Configuration

### Supabase Setup
1. Create a [Supabase](https://supabase.com) project
2. Run the SQL schema from `SUPABASE_SETUP.md`
3. Add your credentials to environment variables

### OpenAI Setup
1. Get an API key from [OpenAI](https://platform.openai.com)
2. Add to backend environment or user settings

## 📊 Features Overview

| Feature | Guest | Authenticated | API Key User |
|---------|-------|---------------|--------------|
| Prompt Generation | 1 free | Unlimited* | Unlimited |
| Save Prompts | ❌ | ✅ | ✅ |
| Browse Library | ✅ | ✅ | ✅ |
| Document Analysis | ❌ | ✅ | ✅ |
| Advanced Models | ❌ | ✅ | ✅ |
| Export Downloads | ✅ | ✅ | ✅ |

*Subject to platform usage limits

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check our guides in the repository
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join GitHub Discussions for questions

## 🔮 Roadmap

- [ ] Prompt collaboration features
- [ ] Advanced analytics dashboard
- [ ] More AI provider integrations
- [ ] Team management features
- [ ] API for third-party integrations

---

Made with ❤️ for the AI community