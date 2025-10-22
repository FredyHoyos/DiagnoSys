"use client";

import Avatar from "@/app/components/atoms/avatar";
import TextLabel from "@/app/components/atoms/textLabel";
import EditProfileModal from "../editProfileModal";

type UserInfoProps = {
  name: string;
  gmail: string;
  role: string;
  avatar?: string;
};

export default function UserInfo({ name, gmail, role, avatar }: UserInfoProps) {
  return (
    <div className="flex flex-col space-y-2">
      {/* Información actual */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <Avatar src={avatar} size={56} />
        <div className="flex flex-col">
          <TextLabel text={name} className="font-bold text-lg" />
          <TextLabel text={gmail} className="text-sm text-blue-500" />
          <TextLabel text={role} className="text-sm text-gray-800" />
        </div>
      </div>

      {/* Modal de edición */}
      <div className="flex justify-end">
        <EditProfileModal name={name} gmail={gmail} role={role}/>
      </div>
    </div>
  );
}
