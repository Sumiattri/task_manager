# Deployment Guide

This guide will help you deploy your Task Manager application to a live server.

## Prerequisites Checklist

### 1. MongoDB Atlas Setup (Cloud Database)

1. **Create MongoDB Atlas Account**
   - Go to [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account (M0 Free Tier available)

2. **Create a Cluster**
   - Click "Build a Database"
   - Choose FREE tier (M0)
   - Select a cloud provider and region (choose closest to your deployment server)
   - Click "Create"

3. **Configure Database Access**
   - Go to "Database Access" → "Add New Database User"
   - Create a username and strong password (save these!)
   - Set privileges to "Atlas admin" or "Read and write to any database"
   - Click "Add User"

4. **Configure Network Access**
   - Go to "Network Access" → "Add IP Address"
   - For production: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Or add specific IPs of your hosting provider
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" → Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<database>` with `taskmanager` (or your preferred name)
   - Example: `mongodb+srv://username:password@cluster.mongodb.net/taskmanager?retryWrites=true&w=majority`

### 2. Environment Variables

Create a `.env` file in your project root with:

```env
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskmanager?retryWrites=true&w=majority
JWT_SECRET=your-very-secure-random-secret-key-here
FRONTEND_URL=https://your-frontend-url.com
```

**Generate a secure JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Update Frontend API URLs

If deploying frontend separately, update `BASE_URL` in:
- `public/auth.js`
- `public/admin.js`
- `public/user.js`

Change from `http://localhost:3000` to your backend API URL.

## Deployment Options

### Option 1: Deploy to Render (Recommended - Free)

1. **Create Render Account**
   - Go to [https://render.com](https://render.com)
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select your repository

3. **Configure Service**
   - **Name:** task-manager-api (or your choice)
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

4. **Add Environment Variables**
   - Click "Environment" tab
   - Add all variables from your `.env` file:
     - `MONGODB_URI`
     - `JWT_SECRET`
     - `NODE_ENV=production`
     - `FRONTEND_URL` (your frontend URL)

5. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy automatically
   - Your API will be available at: `https://your-app.onrender.com`

### Option 2: Deploy to Heroku

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   ```

2. **Login and Create App**
   ```bash
   heroku login
   heroku create your-app-name
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set MONGODB_URI="your-mongodb-uri"
   heroku config:set JWT_SECRET="your-secret"
   heroku config:set NODE_ENV="production"
   heroku config:set FRONTEND_URL="your-frontend-url"
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

### Option 3: Deploy to Railway

1. **Create Railway Account**
   - Go to [https://railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Environment**
   - Add environment variables in Railway dashboard
   - Railway auto-detects Node.js apps

4. **Deploy**
   - Railway automatically deploys on git push

### Option 4: Deploy to Vercel/Netlify (Frontend) + Backend Separately

**Backend (Render/Heroku/Railway):**
- Deploy as above

**Frontend (Vercel/Netlify):**
1. Update `BASE_URL` in frontend files to point to your backend URL
2. Deploy static files to Vercel or Netlify
3. Configure CORS on backend to allow your frontend domain

## Post-Deployment Checklist

- [ ] MongoDB Atlas cluster is running
- [ ] Database user created with proper permissions
- [ ] Network access configured (IP whitelist)
- [ ] Environment variables set on hosting platform
- [ ] JWT_SECRET is a strong random string
- [ ] CORS configured for your frontend domain
- [ ] Test registration/login functionality
- [ ] Test admin and user dashboards
- [ ] Verify MongoDB connection in server logs
- [ ] Check that static files are being served
- [ ] Test API endpoints

## Security Considerations

1. **Never commit `.env` file** - It's in `.gitignore`
2. **Use strong JWT_SECRET** - Generate random 32+ character string
3. **Restrict CORS** - Don't use `*` in production, specify your frontend URL
4. **MongoDB Security** - Use strong passwords, restrict IP access if possible
5. **HTTPS** - Most hosting platforms provide HTTPS automatically

## Troubleshooting

### MongoDB Connection Issues
- Check MongoDB Atlas IP whitelist includes your server IP
- Verify connection string has correct password
- Check MongoDB Atlas cluster is running

### CORS Errors
- Update `FRONTEND_URL` in environment variables
- Ensure backend CORS allows your frontend domain

### Environment Variables Not Working
- Verify variables are set in hosting platform dashboard
- Restart the application after adding variables
- Check variable names match exactly (case-sensitive)

## Testing Your Deployment

1. **Test API Health:**
   ```bash
   curl https://your-api-url.com/api/auth/login
   ```

2. **Test Registration:**
   - Open your deployed frontend
   - Try registering a new user
   - Check MongoDB Atlas to see if user was created

3. **Test Admin Functions:**
   - Register as admin
   - Try setting prioritization rules
   - Check if rules are saved

## Support

If you encounter issues:
1. Check server logs in your hosting platform
2. Check MongoDB Atlas logs
3. Verify all environment variables are set correctly
4. Test API endpoints with Postman or curl

