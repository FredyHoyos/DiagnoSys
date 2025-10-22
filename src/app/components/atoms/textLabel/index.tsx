"use client";

type TextLabelProps = {
  text: string;
  className?: string;
};

export default function TextLabel({ text, className }: TextLabelProps) {
  return <p className={` font-bold text-[#2E6347] ${className}`}>{text}</p>;
}
