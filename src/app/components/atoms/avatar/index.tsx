"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type AvatarProps = {
  src?: string;
  alt?: string;
  size?: number;
};

export default function Avatar({ src, alt = "User avatar", size = 48 }: Readonly<AvatarProps>) {
  const [imageSrc, setImageSrc] = useState(src || "/logoudea.png");

  useEffect(() => {
    setImageSrc(src || "/logoudea.png");
  }, [src]);

  return (
    <Image
      src={imageSrc}
      alt={alt}
      width={size}
      height={size}
      className="rounded-full border-2 border-[#2E6347] bg-white p-1 object-contain"
      onError={() => {
        if (imageSrc !== "/user.svg") {
          setImageSrc("/user.svg");
        }
      }}
    />
  );
}
