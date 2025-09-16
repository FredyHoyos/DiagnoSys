import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

export async function GET() {
  const users = await prisma.user.findMany();
  return NextResponse.json(users);
}
