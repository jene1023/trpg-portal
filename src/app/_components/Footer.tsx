import SectionDivider from "./SectionDivider";

export default function Footer() {
  return (
    <footer className="mt-auto pt-8 pb-10 px-4" aria-label="フッター">
      <SectionDivider />
      <div className="mt-5 flex flex-col items-center gap-2 text-center select-none" aria-hidden="true">
        <span className="text-coc-faint text-[9px] coc-star-twinkle opacity-40" style={{ animationDelay: "0.8s" }}>✦</span>
        <p className="font-cinzel text-[11px] text-coc-faint tracking-[0.22em] uppercase opacity-50">
          CoC Portal
        </p>
        <p className="font-crimson text-xs text-coc-faint italic tracking-[0.05em] coc-footer-quote">
          深淵の向こうから、物語は始まる
        </p>
      </div>
    </footer>
  );
}
