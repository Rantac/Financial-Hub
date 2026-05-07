import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const { initKey } = await req.json();

    // Simple security check - you can make this more secure
    if (initKey !== 'init-super-admin-2026') {
      return NextResponse.json(
        { error: 'Invalid initialization key' },
        { status: 403 }
      );
    }

    await connectDB();

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    if (existingSuperAdmin) {
      return NextResponse.json(
        { message: 'Super admin already exists', exists: true },
        { status: 200 }
      );
    }

    // Create super admin
    const superAdmin = await User.create({
      email: process.env.SUPER_ADMIN_EMAIL || 'admin@financialhub.com',
      password: process.env.SUPER_ADMIN_PASSWORD || '@Black123456',
      name: process.env.SUPER_ADMIN_NAME || 'Super Admin',
      role: 'superadmin',
    });

    return NextResponse.json(
      {
        message: 'Super admin created successfully',
        user: {
          email: superAdmin.email,
          name: superAdmin.name,
          role: superAdmin.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Super admin initialization error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
