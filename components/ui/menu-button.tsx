import { Menu } from "lucide-react";

interface MenuButtonProps {
  onClick: () => void;
  className?: string;
}

export function MenuButton({ onClick, className = "" }: MenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-full bg-white text-gray-600 shadow-lg hover:bg-gray-100 transition duration-150 ${className}`}
    >
      <Menu className="w-5 h-5" />
    </button>
  );
}