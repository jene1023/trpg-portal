import Image from "next/image";

type Props = {
  url: string | null;
  name: string;
  className?: string;
};

export default function PortraitImage({ url, name, className = "" }: Props) {
  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        fill
        className={`object-cover ${className}`}
        sizes="(max-width: 768px) 100vw, 33vw"
      />
    );
  }

  return (
    <div
      className={`coc-portrait-fallback flex items-center justify-center ${className}`}
    >
      <span
        className="font-cinzel text-5xl select-none"
        style={{
          color: "var(--color-coc-gold-dim)",
          opacity: 0.42,
          textShadow: "0 0 28px rgba(201,133,58,0.22), 0 2px 8px rgba(0,0,0,0.50)",
          letterSpacing: "0.05em",
        }}
      >
        {name.charAt(0)}
      </span>
    </div>
  );
}
