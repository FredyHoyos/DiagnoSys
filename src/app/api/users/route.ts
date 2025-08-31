import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
  const users = await prisma.user.findMany();
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const body = await req.json();
  const newUser = await prisma.user.create({
    data: { name: body.name, email: body.email },
  });
  return NextResponse.json(newUser);
}