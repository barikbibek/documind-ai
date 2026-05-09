import bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../../config/db';
import { users } from '../../db/schema';
import { env } from '../../config/env';
import type { RegisterInput, LoginInput } from './auth.schema';

export async function registerUser(input: RegisterInput){
    const { name, email, password } = input;
    const existing = await db.select().from(users).where(eq(users.email, email))
    if(existing.length > 0){
        throw new Error('Email already in use')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const [user] = await db.insert(users).values({
        name,
        email,
        password: hashedPassword
    }).returning({ id: users.id, email: users.email, name: users.name })

    const token = (jwt.sign as any)(
    { userId: user.id, email: user.email },
    env.JWT_SECRET! as string,
    { expiresIn: env.JWT_EXPIRES_IN! as string }
  );


    return { user, token }
}

export async function loginUser(input: LoginInput){
    const { email, password } = input;
    const [user] = await db.select().from(users).where(eq(users.email, email))

    if(!user) throw new Error("User not found ")
    
    const passwordMatch = await bcrypt.compare(password, user.password)
    if(!passwordMatch) throw new Error("Invalid credentials")
    
    const token = (jwt.sign as any)(
        { userId: user.id, email: user.email },
        env.JWT_SECRET!,
        { expiresIn: env.JWT_EXPIRES_IN! }
    )

    return { user: { id: user.id, email: user.email, name: user.name }, token }
}

export async function getMe(userId: string) {
  const [user] = await db
    .select({ id: users.id, email: users.email, name: users.name, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, userId));

  if (!user) throw new Error('User not found');
  return user;
}