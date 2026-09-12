import { Coffee } from 'lucide-react';

interface BuyMeACoffeeButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function BuyMeACoffeeButton({
  className = '',
  size = 'md',
  showText = true,
}: BuyMeACoffeeButtonProps) {
  const sizeClasses = {
    sm: 'h-8 px-3 text-xs gap-1.5',
    md: 'h-9 px-4 text-xs gap-2',
    lg: 'h-11 px-5 text-sm gap-2.5',
  };

  return (
    <a
      href="https://buymeacoffee.com/Krrish1411"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 shadow-xs hover:shadow-md active:scale-95 cursor-pointer select-none text-black bg-[#FFDD00] hover:bg-[#ffe333] border border-black/15 ${sizeClasses[size]} ${className}`}
      title="Support Krish Patel on Buy Me a Coffee"
      aria-label="Buy me a coffee - Support Krish Patel"
    >
      <Coffee className={size === 'sm' ? 'h-3.5 w-3.5 text-black shrink-0' : 'h-4 w-4 text-black shrink-0'} />
      {showText && (
        <span className="font-sans font-extrabold tracking-tight">
          Buy me a coffee
        </span>
      )}
    </a>
  );
}
