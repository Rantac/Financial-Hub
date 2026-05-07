# Authentication System Documentation

## Overview

This is an **internal application** with a complete authentication system featuring user management and role-based access control with MongoDB integration.

## Features

- ✅ User authentication (no public registration)
- ✅ Password hashing with bcrypt
- ✅ Session management with NextAuth.js
- ✅ 2-role system: Super Admin and User
- ✅ Protected routes with middleware
- ✅ MongoDB database integration
- ✅ Super admin initialization
- ✅ User management panel (super admin only)

## Key Differences from Public Apps

🔒 **Internal App**: No public registration - only super admin can create accounts
👥 **2 Roles Only**: Super Admin and User
🎯 **User Permissions**: Users can do everything except create other users

## Setup Instructions

### 1. Install MongoDB

Make sure you have MongoDB installed and running on your system:
- **Local Installation**: [MongoDB Community Edition](https://www.mongodb.com/try/download/community)
- **Cloud Option**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Free tier available)

### 2. Configure Environment Variables

The `.env.local` file has been created with default values. Update it with your configuration:

```env
# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/financial-hub
# For MongoDB Atlas, use: mongodb+srv://username:password@cluster.mongodb.net/financial-hub

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:9002
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production

# Super Admin Credentials
SUPER_ADMIN_EMAIL=admin@financialhub.com
SUPER_ADMIN_PASSWORD=@USESTRONGKEY
SUPER_ADMIN_NAME=Super Admin
```

**Important**: Generate a secure `NEXTAUTH_SECRET` for production:
```bash
openssl rand -base64 32
```

### 3. Initialize Super Admin

Before using the application, you need to create the super admin account:

1. Visit: `http://localhost:9002/auth/init-superadmin`
2. Enter the initialization key: `init-super-admin-2026`
3. Click "Initialize Super Admin"

This will create the super admin account with the credentials from your `.env.local` file.

### 4. Sign In

After initializing the super admin:

1. Visit: `http://localhost:9002/auth/signin`
2. Use the super admin credentials:
   - **Email**: `admin@financialhub.com`
   - **Password**: `@USESTRONGKEY`

## User Roles

### Super Admin
- Highest level of access
- Can create and manage all users
- Can delete user accounts (except other super admins)
- Full system access

### User
- Standard role for all created accounts
- Can access all application features
- **Cannot** create or manage other users

⚠️ **Note**: The admin role has been removed. Only 2 roles exist: superadmin and user.

## API Endpoints

### Authentication

#### Create User (Super Admin Only)
```
POST /api/auth/signup
Headers: {
  Cookie: session-token (must be super admin)
}
Body: {
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Sign In (Login)
```
POST /api/auth/signin
Handled by NextAuth.js
```

#### Initialize Super Admin
```
POST /api/auth/init-superadmin
Body: {
  "initKey": "init-super-admin-2026"
}
```

### User Management

#### Get All Users (Super Admin Only)
```
GET /api/users
Headers: {
  Cookie: session-token (must be super admin)
}
```

#### Delete User (Super Admin Only)
```
DELETE /api/users
Headers: {
  Cookie: session-token (must be super admin)
}
Body: {
  "userId": "user-id-here"creation (super admin only)
│   │   │   └── init-superadmin/
│   │   │       └── route.ts          # Super admin initialization
│   │   ├── users/
│   │   │   └── route.ts              # User management (list, delete)
│   │   └── user/
│   │       └── route.ts              # User profile API
│   ├── auth/
│   │   ├── signin/
│   │   │   └── page.tsx              # Login page
│   │   ├── signup/
│   │   │   └── page.tsx              # User management panel (super admin)
│   │   ├── error/
│   │   │   └── page.tsx              # Error page
│   │   └── init-superadmin/
│   │       └── page.tsx              # Super admin init page
│   └── layout.tsx                    # App layout with AuthProvider
├── components/
│   ├── AuthProvider.tsx              # Session provider wrapper
│   └── UserInfo.tsx                  # User profile display with management link
├── lib/
│   ├── auth.ts                       # NextAuth configuration
│   └── mongodb.ts                    # MongoDB connection
├── models/
│   └── User.ts                       # User model schema (2 roles)
│   │   │   └── init-superadmin/
│   │   │       └── route.ts          # Super admin initialization
│   │   └── user/
│   │       └── route.ts              # User profile API
│   ├── auth/
│   │   ├── signin/
│   │   │   └── page.tsx              # Login page
│   │   ├── signup/
│   │   │   └── page.tsx              # Registration page
│   │   ├── error/
│   │   │   └── page.tsx              # Error page
│   │   └── init-superadmin/
│   │       └── page.tsx              # Super admin init page
│   └── layout.tsx                    # App layout with AuthProvider
├── components/
│   ├── AuthProvider.tsx              # Session provider wrapper
│   └── UserInfo.tsx                  # User profile display
├── lib/
│   ├── auth.ts                       # NextAuth configuration
│   └── mongodb.ts                    # MongoDB connection
├── models/
│   └── User.ts                       # User model schema
├── types/
│   └── next-auth.d.ts               # TypeScript definitions
└── middleware.ts                     # Route protection middleware
```

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt with 10 salt rounds
2. **Session Management**: JWT-based sessions with NextAuth.js
3. **Protected Routes**: Middleware automatically redirects unauthenticated users
4. **Role-Based Access**: User roles stored in session and database
5. **Environment Variables**: Sensitive data stored in environment variables

## Usage Examples (Super Admin Only)

Super admin must create all user accounts through the user management panel:
1. Sign in as super admin
2. Navigate to User Management (sidebar or profile dropdown)
3. Fill in user details and click "Create User"

### Managing Users (Super Admin Only)

Super admin can:
- View all users in the system
- See user statistics (super admins vs regular users)
- Delete user accounts (except super admin accounts)

Users can self-register at `/auth/signup`. All new users are created with the "user" role by default.

### Checking Authentication Status

```tsx
'use client';

import { useSession } from 'next-auth/react';

export default function MyComponent() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return <div>Not authenticated</div>;
  }

  return (
    <div>
      <p>Welcome, {session.user.name}!</p>
      <p>Role: {session.user.role}</p>
    </div>
  );
}
```

### Protecting Server Components

```tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  return <div>Protected content for {session.user.name}</div>;
}
```

### Role-Based Access

```tsx
'use client';

import { useSession } from 'next-auth/react';

export default function AdminPanel() {
  const { data: session } = useSession();

  if (session?.user.role !== 'superadmin' && session?.user.role !== 'admin') {
    return <div>Access Denied</div>;
  }

  return <div>Admin Panel Content</div>;
}
```

## Troubleshooting

### MongoDB Connection Issues

1. Make sure MongoDB is running:
   ```bash
   # For local MongoDB
   mongod
   ```

2. Check your `MONGODB_URI` in `.env.local`

3. For MongoDB Atlas, ensure your IP is whitelisted

### NextAuth Errors

1. Ensure `NEXTAUTH_SECRET` is set in `.env.local`
2. Make sure `NEXTAUTH_URL` matches your application URL
3. Check browser console for detailed error messages

### Super Admin Already Exists

If you see "Super admin already exists" message:
- The super admin has already been initialized
- Use the existing credentials to sign in
- To reset, delete the user from MongoDB:
  ```bash
  mongosh
  use financial-hub
  db.users.deleteOne({ role: 'superadmin' })
  ```

## Development vs Production

### Development
- Use local MongoDB or MongoDB Atlas free tier
- Keep default environment variables for testing

### Production
- Use a production MongoDB cluster
- Generate a secure `NEXTAUTH_SECRET`
- Change super admin password immediately
- Use environment variables from your hosting provider
- Enable HTTPS for secure session handling

## Next Steps

1. ✅ Authentication is fully set up
2. Consider adding:
   - Email verification
   - Password reset functionality
   - Two-factor authentication
   - User management dashboard for admins
   - Activity logging
   - OAuth providers (Google, GitHub, etc.)

## Support

For issues or questions:
1. Check the console for error messages
2. Review the NextAuth.js documentation: https://next-auth.js.org
3. Check MongoDB connection logs
4. Ensure all environment variables are properly set
