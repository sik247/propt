# 🚀 Deployment Guide - GitHub + Vercel

This guide will help you deploy your Propt application to Vercel with GitHub integration.

## 📋 Prerequisites

- [GitHub Account](https://github.com)
- [Vercel Account](https://vercel.com) (free tier available)
- Your Supabase credentials ready

## 🔧 Step 1: Prepare for GitHub

### 1.1 Initialize Git (if not already done)
```bash
git init
git add .
git commit -m "Initial commit"
```

### 1.2 Create GitHub Repository
1. Go to [GitHub](https://github.com) and create a new repository
2. Name it `propt` or any name you prefer
3. **DO NOT** initialize with README, .gitignore, or license (we already have these)

### 1.3 Connect Local Repository to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

## 🌐 Step 2: Deploy to Vercel

### 2.1 Connect GitHub to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect it's a React + Python project

### 2.2 Configure Environment Variables
In your Vercel project dashboard, go to **Settings > Environment Variables** and add:

#### **Production Environment Variables:**
```
VITE_SUPABASE_URL=https://rikbnpaewnsakkafeikb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpa2JucGFld25zYWtrYWZlaWtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNTE4NTgsImV4cCI6MjA2ODcyNzg1OH0.5rlZNlFGBDP_ITCH4Q9wH_ivDYC2ND3mceBmRmKL5lQ
OPENAI_API_KEY=your-openai-api-key-here
```

⚠️ **Important:** Replace `your-openai-api-key-here` with your actual OpenAI API key

### 2.3 Deploy
1. Click "Deploy" in Vercel
2. Wait for the build to complete (usually 2-3 minutes)
3. Your app will be live at `https://your-project-name.vercel.app`

## 🔄 Step 3: Automatic Deployments

Once connected, Vercel will automatically:
- Deploy when you push to the `main` branch
- Create preview deployments for pull requests
- Show build logs and deployment status

## 🎯 Step 4: Custom Domain (Optional)

1. In Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. SSL certificate will be automatically provisioned

## 🛠️ Step 5: Post-Deployment Setup

### 5.1 Update Supabase Settings
1. Go to your Supabase dashboard
2. Navigate to Authentication → URL Configuration
3. Add your Vercel domain to allowed redirect URLs:
   - `https://your-project-name.vercel.app/*`
   - `https://your-custom-domain.com/*` (if using custom domain)

### 5.2 Test Your Deployment
1. Visit your deployed site
2. Test prompt generation (should work for 1 attempt without auth)
3. Test user registration/login
4. Test API key addition in settings (for unlimited access)

## 🔧 Troubleshooting

### Common Issues:

**1. Build Fails - Python Dependencies**
- Ensure `requirements.txt` is in the `backend/` folder
- Check that all imports in `main_flask.py` are available

**2. Environment Variables Not Working**
- Ensure variable names exactly match (case-sensitive)
- Redeploy after adding environment variables

**3. Authentication Not Working**
- Check Supabase URL configuration
- Verify redirect URLs include your Vercel domain

**4. API Endpoints Not Working**
- Check that your API routes are working locally first
- Verify the `vercel.json` configuration is correct

### Debug Commands:
```bash
# Test local build
npm run build

# Test backend locally
cd backend && python3 main_flask.py

# Check environment variables in Vercel
vercel env ls
```

## 🎉 Features After Deployment

Your deployed app will have:

✅ **Frontend Features:**
- Homepage with service overview
- One free prompt generation for guests
- User authentication (sign up/login)
- Unlimited prompts for authenticated users
- API key settings for direct OpenAI access
- Browse existing prompts
- Download prompts as Markdown

✅ **Backend Features:**
- Prompt generation API
- Document analysis
- Sample prompt loading
- Health checks

✅ **User Experience:**
- Professional UI with usage indicators
- Clear API key policies
- Mobile-responsive design
- Toast notifications for user feedback

## 📈 Monitoring

Monitor your deployment:
- **Vercel Analytics:** Track page views and performance
- **Vercel Functions:** Monitor API performance
- **Supabase Dashboard:** Track user registrations and database usage

## 🔄 Making Updates

To update your live site:
1. Make changes locally
2. Test thoroughly
3. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update: description of changes"
   git push origin main
   ```
4. Vercel will automatically deploy the changes

---

🎯 **Your app is now live and ready for users!** Share your Vercel URL and start collecting feedback.
