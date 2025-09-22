"use client";

import Image from "next/image";

type AvatarProps = {
  src?: string;
  alt?: string;
  size?: number;
};

export default function Avatar({ src, alt = "User avatar", size = 48 }: AvatarProps) {
  return (
    <Image
      src={src || "/user.svg"}
      alt={alt}
      width={size}
      height={size}
      className="rounded-full border-2 border-[#2E6347] object-cover"
    />
  );
}
