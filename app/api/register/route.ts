import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { redis } from '@/lib/redis';

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    console.log("Registration attempt:", { username, email });

    if (!username || !email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const existingEmail = await redis.get(`user:email:${email}`);
    if (existingEmail) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const existingUsername = await redis.get(`user:username:${username}`);
    if (existingUsername) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userData = {
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    };

    await redis.set(`user:email:${email}`, JSON.stringify(userData));
    await redis.set(`user:username:${username}`, JSON.stringify(userData));

    return NextResponse.json({ success: true, message: 'User created' });
    
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Registration failed: ' + (error.message || 'Unknown error') }, { status: 500 });
  }
}