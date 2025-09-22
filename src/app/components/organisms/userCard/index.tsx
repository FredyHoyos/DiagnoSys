"use client";

import UserInfo from "@/app/components/molecules/userInfo";
import Button from "@/app/components/atoms/button";
import { signOut } from "next-auth/react";

type UserCardProps = {
  name: string;
  role: string;
  avatar?: string;
  onLogout: () => void;
};

export default function UserCard({ name, role, avatar, onLogout }: UserCardProps) {
  return (
    <div className="mt-auto pt-4 border-t border-gray-200 flex flex-col items-center gap-4">
        <div className="w-full max-w-sm bg-white shadow-md rounded-2xl p-4 ">
           <UserInfo name={name} role={role} avatar={avatar} />
        </div>
        <Button label="Logout" onClick={() => signOut({ callbackUrl: "/auth/card" })} />
    </div>

  );
}
