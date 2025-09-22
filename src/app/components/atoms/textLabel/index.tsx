"use client";

type TextLabelProps = {
  text: string;
  className?: string;
};

export default function TextLabel({ text, className }: TextLabelProps) {
  return <p className={`text-gray-800 ${className}`}>{text}</p>;
}
