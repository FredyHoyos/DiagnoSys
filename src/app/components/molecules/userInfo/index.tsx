"use client";

import Avatar from "@/app/components/atoms/avatar";
import TextLabel from "@/app/components/atoms/textLabel";

type UserInfoProps = {
  name: string;
  gmail: string;
  role: string;
  avatar?: string;
};

export default function UserInfo({ name, gmail, role, avatar }: UserInfoProps) {
  return (
    <div className="flex items-center gap-3">
      <Avatar src={avatar} size={56} />
      <div className="flex flex-col">
        <TextLabel text={name} className="font-semibold text-lg" />
        <TextLabel text={gmail} className="text-sm text-gray-500" />
        <TextLabel text={role} className="text-sm text-gray-500" />
      </div>
    </div>
  );
}
