import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { redis } from "@/lib/redis";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          console.log("Login attempt for:", credentials?.identifier);
          
          if (!credentials?.identifier || !credentials?.password) {
            console.log("Missing credentials");
            return null;
          }
          
          let userJson = await redis.get(`user:email:${credentials.identifier}`);
          
          if (!userJson) {
            userJson = await redis.get(`user:username:${credentials.identifier}`);
          }
          
          console.log("User from Redis:", userJson ? "Found" : "Not found");
          
          if (!userJson) {
            console.log("User not found");
            return null;
          }
          
          const user = userJson as any;
          
          const isValid = await bcrypt.compare(credentials.password, user.password);
          console.log("Password match result:", isValid);
          
          if (!isValid) {
            console.log("Password invalid");
            return null;
          }
          
          console.log("Login success for:", user.email);
          
          return {
            id: user.email,
            email: user.email,
            name: user.username
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };