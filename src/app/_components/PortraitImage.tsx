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
      <div className="relative flex items-center justify-center" style={{ width: "6rem", height: "6rem" }}>
        {/* 外輪: 封蝋印のようにゆっくりと回転する外環 */}
        <span className="coc-initial-ring-outer" aria-hidden="true" />
        {/* 内輪: 頭文字を囲む明滅する封印の輪 */}
        <span className="coc-initial-ring" aria-hidden="true" />
        {/* 頭文字 */}
        <span
          className="font-cinzel text-5xl select-none relative"
          style={{
            color: "var(--color-coc-gold-dim)",
            opacity: 0.42,
            textShadow: "0 0 28px rgba(201,133,58,0.22), 0 2px 8px rgba(0,0,0,0.50)",
            letterSpacing: "0.05em",
            zIndex: 1,
          }}
        >
          {name.charAt(0)}
        </span>
      </div>
    </div>
  );
}
