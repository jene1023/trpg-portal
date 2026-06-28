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
      className={`flex items-center justify-center bg-coc-surface text-coc-muted ${className}`}
    >
      <span className="font-cinzel text-4xl select-none opacity-40">
        {name.charAt(0)}
      </span>
    </div>
  );
}
