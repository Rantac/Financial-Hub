# Quick Start Guide - Authentication Setup

## 🚀 Quick Steps to Get Started

### 1. Start MongoDB
Ensure MongoDB is running on your system:
```bash
mongod
```
Or use MongoDB Atlas (cloud) by updating the `MONGODB_URI` in `.env.local`

### 2. Start the Development Server
```bash
npm run dev
```

### 3. Initialize Super Admin
1. Open your browser and go to: `http://localhost:9002/auth/init-superadmin`
2. Enter initialization key: `init-super-admin-2026`
3. Click "Initialize Super Admin"

### 4. Sign In
1. Go to: `http://localhost:9002/auth/signin`
2. Use credentials:
   - Email: `admin@financialhub.com`
   - Password: `@Black123456`

### 5. Start Using the App! 🎉
You're now logged in and can access all features.

---

## 📝 Creating Additional Users (Super Admin Only)

This is an **internal application**. Only the super admin can create new user accounts.

### To Create Users:
1. Sign in as super admin
2. Click on **"User Management"** in the sidebar (or profile dropdown)
3. Fill in the new user's details:
   - Name
   - Email
   - Password
4. Click "Create User"

All new users will have the "user" role and can perform all actions except creating other users.

---

## 🔐 Default Super Admin Credentials

**Email**: `admin@financialhub.com`  
**Password**: `@Black123456`

⚠️ **Important**: Change the super admin password after first login!

---

## 🛠️ Environment Variables (Already Set Up)

Your `.env.local` file has been created with default values:

```env
MONGODB_URI=mongodb://localhost:27017/financial-hub
NEXTAUTH_URL=http://localhost:9002
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production
SUPER_ADMIN_EMAIL=admin@financialhub.com
SUPER_ADMIN_PASSWORD=@Black123456
SUPER_ADMIN_NAME=Super Admin
```

For production, update these values accordingly.

---

## 📚 User Roles

- **Super Admin**: Full access including user creation and management
- **User**: Standard access to all features (cannot create users)

⚠️ **Note**: There is no public registration. Only super admin can create accounts.

---

## ✅ What's Been Set Up

- ✅ MongoDB connection
- ✅ User authentication with NextAuth.js
- ✅ Password hashing with bcrypt
- ✅ 2-role system (superadmin and user)
- ✅ Protected routes
- ✅ Login page (no public signup)
- ✅ User management panel (super admin only)
- ✅ User profile display with sign-out
- ✅ Super admin initialization

---

## 🔗 Important URLs

- Sign In: `http://localhost:9002/auth/signin`
- Initialize Super Admin: `http://localhost:9002/auth/init-superadmin`
- User Management: `http://localhost:9002/auth/signup` (super admin only)
- Main App: `http://localhost:9002/`

---

## 🐛 Troubleshooting

### Can't connect to MongoDB?
- Make sure MongoDB is running: `mongod`
- Check connection string in `.env.local`

### Super admin already exists?
- You can only initialize once
- Use existing credentials to sign in
- To reset, delete from MongoDB: `db.users.deleteOne({ role: 'superadmin' })`

### Can't create users?
- Only super admin can create users
- Make sure you're signed in as super admin
- Check the "User Management" link in sidebar or profile dropdown

### Authentication errors?
- Check `.env.local` file exists and has all variables
- Restart the development server
- Clear browser cookies and try again

---

## 📖 Full Documentation

For detailed documentation, see: `docs/AUTHENTICATION.md`

---

**Happy coding! 🎉**
