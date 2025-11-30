# MongoDB Atlas Setup - Step by Step Guide

## ✅ Step 1: Create Database User

1. In MongoDB Atlas, click **"Security"** in the left sidebar
2. Click **"Database Access"** (under Security)
3. Click **"Add New Database User"** button (green button)
4. Choose **"Password"** authentication method
5. Enter:
   - **Username**: `taskmanager` (or your choice)
   - **Password**: Create a strong password (SAVE THIS!)
   - **Database User Privileges**: Select **"Atlas admin"** (or "Read and write to any database")
6. Click **"Add User"**

⚠️ **IMPORTANT**: Save your username and password! You'll need them for the connection string.

---

## ✅ Step 2: Configure Network Access

1. Still in **"Security"** section, click **"Network Access"**
2. Click **"Add IP Address"** button
3. For development/testing: Click **"Allow Access from Anywhere"**
   - This adds `0.0.0.0/0` (allows all IPs)
   - ⚠️ For production, you might want to restrict this later
4. Click **"Confirm"**
5. Wait a few minutes for the changes to propagate

---

## ✅ Step 3: Get Connection String

1. Go back to **"Database"** → **"Clusters"** (left sidebar)
2. Click the **"Connect"** button on your Cluster0
3. Choose **"Connect your application"** (drivers icon)
4. Select:
   - **Driver**: Node.js
   - **Version**: 5.5 or later
5. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

6. **Replace the placeholders:**
   - Replace `<username>` with your database username (from Step 1)
   - Replace `<password>` with your database password (from Step 1)
   - Add database name: After `.net/` add `taskmanager` so it becomes:
   ```
   mongodb+srv://taskmanager:yourpassword@cluster0.xxxxx.mongodb.net/taskmanager?retryWrites=true&w=majority
   ```

---

## ✅ Step 4: Test Connection Locally

1. Create a `.env` file in your project root:
   ```bash
   touch .env
   ```

2. Add your MongoDB connection string to `.env`:
   ```env
   PORT=3000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://taskmanager:yourpassword@cluster0.xxxxx.mongodb.net/taskmanager?retryWrites=true&w=majority
   JWT_SECRET=your-local-secret-key-for-testing
   FRONTEND_URL=*
   ```

3. **Generate a JWT_SECRET** (run in terminal):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copy the output and use it as your JWT_SECRET.

4. **Test the connection:**
   ```bash
   npm start
   ```

5. You should see: `MongoDB Connected` in the console
   - If you see an error, check:
     - Username/password are correct
     - Network access is configured (Step 2)
     - Connection string format is correct

---

## ✅ Step 5: Test Your App

1. Open `http://localhost:3000`
2. Register a new user
3. Check MongoDB Atlas → Database → Browse Collections
4. You should see a `users` collection with your registered user!

---

## 🚀 Next: Deploy to Production

Once local testing works:
1. Choose a hosting platform (Render, Heroku, Railway, etc.)
2. Set environment variables on the platform
3. Deploy your code
4. Update `public/config.js` with your production API URL

See `DEPLOYMENT.md` for detailed deployment instructions.

---

## ❌ Troubleshooting

### "Authentication failed"
- Check username/password in connection string
- Verify database user was created correctly

### "IP not whitelisted"
- Check Network Access settings
- Make sure `0.0.0.0/0` is added (or your IP)

### "Connection timeout"
- Wait a few minutes after adding IP address
- Check if your cluster is running (should show green)

### "Database not found"
- The database will be created automatically when you first save data
- Make sure connection string includes `/taskmanager` at the end

