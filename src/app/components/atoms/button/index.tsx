"use client";

type ButtonProps = {
  label: string;
  onClick?: () => void;
};

export default function Button({ label, onClick }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-primary text-white rounded-lg transition cursor-pointer"
    >
      {label}
    </button>
  );
}
