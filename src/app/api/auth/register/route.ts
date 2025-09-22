// app/api/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password, role } = body ?? {};

        // Basic server-side validation
        if (!name || !email || !password || !role) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            return NextResponse.json({ error: "Invalid email" }, { status: 400 });
        }
        if (typeof password !== "string" || password.length < 8) {
            return NextResponse.json({ error: "Password too short" }, { status: 400 });
        }

        // Validate role (only consultant and organization allowed in registration)
        if (!["consultant", "organization"].includes(role)) {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        // Get role ID from database
        const roleRecord = await prisma.role.findUnique({ where: { name: role } });
        if (!roleRecord) {
            return NextResponse.json({ error: "Role not found" }, { status: 400 });
        }

        // Check existing user
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: "Email already registered" }, { status: 409 });
        }

        // Hash password and create user
        const hashed = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashed,
                roleId: roleRecord.id,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: {
                    select: {
                        name: true,
                        displayName: true,
                    },
                },
                createdAt: true,
            },
        });

        return NextResponse.json({ user }, { status: 201 });
    } catch (err) {
        console.error("Register POST error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

