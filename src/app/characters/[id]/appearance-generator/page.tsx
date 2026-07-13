"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Shuffle, Check, Loader2 } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { Character } from "@/lib/supabase";

type Gender = "男性" | "女性" | "中性";
type AgeRange = "10代" | "20代" | "30代" | "40代以上";
type Atmosphere = "知的" | "神秘的" | "頑丈" | "優雅" | "粗野" | "庶民的";

type GeneratedAppearance = {
  hairColor: string;
  eyeColor: string;
  build: string;
  heightRange: string;
  description: string;
};

const HAIR_COLORS: Record<Gender, string[]> = {
  男性: ["黒髪", "濃い茶髪", "栗色の髪", "明るい茶髪", "赤みがかった茶髪", "灰色の髪", "白髪交じりの黒髪", "白髪"],
  女性: ["黒髪", "濃い茶髪", "栗色の髪", "明るい茶髪", "赤みがかった茶髪", "ブロンドがかった茶髪", "灰色の髪", "白髪"],
  中性: ["黒髪", "茶髪", "栗色の髪", "明るい茶髪", "赤みがかった茶髪", "灰色の髪"],
};

const EYE_COLORS = [
  "黒",
  "濃い茶色",
  "茶色",
  "琥珀色",
  "ヘーゼル",
  "灰色",
  "薄い青",
  "灰青色",
  "緑がかった茶色",
  "オリーブ色",
];

const BUILDS: Record<Gender, string[]> = {
  男性: ["細身で長身", "中肉中背", "がっしりした体格", "小柄でやせ形", "筋肉質", "ずんぐりした体格", "すらりとした長身"],
  女性: ["細身", "中肉中背", "小柄でほっそりした", "ふっくらとした体格", "引き締まった体型", "小柄でしっかりした体格", "すらりとした体型"],
  中性: ["細身", "中肉中背", "やや小柄", "すらりとした体格", "しなやかな体格"],
};

const HEIGHT_RANGES: Record<Gender, Record<AgeRange, string[]>> = {
  男性: {
    "10代": ["155〜165cm", "160〜170cm", "165〜175cm"],
    "20代": ["165〜175cm", "170〜180cm", "175〜185cm"],
    "30代": ["165〜175cm", "170〜180cm", "175〜185cm"],
    "40代以上": ["163〜173cm", "168〜178cm", "170〜180cm"],
  },
  女性: {
    "10代": ["148〜158cm", "153〜163cm", "155〜165cm"],
    "20代": ["153〜163cm", "155〜165cm", "158〜168cm"],
    "30代": ["153〜163cm", "155〜165cm", "157〜167cm"],
    "40代以上": ["150〜160cm", "153〜163cm", "155〜165cm"],
  },
  中性: {
    "10代": ["150〜165cm", "155〜170cm", "153〜163cm"],
    "20代": ["158〜173cm", "163〜175cm", "160〜170cm"],
    "30代": ["158〜173cm", "160〜175cm", "163〜173cm"],
    "40代以上": ["155〜170cm", "158〜173cm", "160〜170cm"],
  },
};

const FACE_FEATURES: Record<Atmosphere, string[]> = {
  知的: ["知性的な眼差し", "鋭くも落ち着いた目元", "思慮深さを感じさせる眉", "整った目鼻立ち", "冷静な表情"],
  神秘的: ["深みのある瞳", "謎めいた微笑み", "どこか遠くを見つめるような目", "静かな威厳を感じさせる表情", "憂いを帯びた瞳"],
  頑丈: ["力強い顎線", "意志の強さを感じさせる目元", "日焼けした肌", "逞しい顔立ち", "傷跡の残る顔"],
  優雅: ["繊細な顔立ち", "品のある口元", "澄んだ瞳", "柔らかな笑顔", "高貴さを感じさせる輪郭"],
  粗野: ["無精ひげがよく似合う顔", "風雪を経てきたような面構え", "骨格のくっきりした顔立ち", "無骨だが誠実そうな顔", "荒れた肌"],
  庶民的: ["人懐っこい顔", "温かみのある目元", "親しみやすい笑顔", "平凡だが誠実そうな顔立ち", "快活な表情"],
};

const AGE_FEATURES: Record<AgeRange, string[]> = {
  "10代": ["若々しい肌", "幼さの残る顔立ち", "すっきりとした顔立ち"],
  "20代": ["若い活力を感じさせる外見", "溌剌とした印象"],
  "30代": ["落ち着いた雰囲気", "大人の余裕を感じさせる佇まい"],
  "40代以上": ["年齢相応の渋みがある", "風格が漂う佇まい", "深みのある人相"],
};

const ATMOSPHERE_LABELS: Record<Atmosphere, string> = {
  知的: "📚 知的",
  神秘的: "🌙 神秘的",
  頑丈: "💪 頑丈",
  優雅: "🌹 優雅",
  粗野: "⚡ 粗野",
  庶民的: "😊 庶民的",
};

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateAppearance(
  gender: Gender,
  ageRange: AgeRange,
  atmosphere: Atmosphere
): GeneratedAppearance {
  const hairColor = pick(HAIR_COLORS[gender]);
  const eyeColor = pick(EYE_COLORS);
  const build = pick(BUILDS[gender]);
  const heightRange = pick(HEIGHT_RANGES[gender][ageRange]);
  const faceFeature = pick(FACE_FEATURES[atmosphere]);
  const ageFeature = pick(AGE_FEATURES[ageRange]);

  const genderLabel = gender === "男性" ? "男性" : gender === "女性" ? "女性" : "人物";
  const description =
    `${ageRange}の${genderLabel}。${build}で、${heightRange}ほどの身長。` +
    `${hairColor}で${eyeColor}の瞳を持つ。` +
    `${faceFeature}が印象的。${ageFeature}。`;

  return { hairColor, eyeColor, build, heightRange, description };
}

const GENDERS: Gender[] = ["男性", "女性", "中性"];
const AGE_RANGES: AgeRange[] = ["10代", "20代", "30代", "40代以上"];
const ATMOSPHERES: Atmosphere[] = ["知的", "神秘的", "頑丈", "優雅", "粗野", "庶民的"];

export default function AppearanceGeneratorPage() {
  const params = useParams();
  const id = params.id as string;

  const [char, setChar] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);

  const [gender, setGender] = useState<Gender>("男性");
  const [ageRange, setAgeRange] = useState<AgeRange>("20代");
  const [atmosphere, setAtmosphere] = useState<Atmosphere>("庶民的");

  const [generated, setGenerated] = useState<GeneratedAppearance | null>(null);
  const [editedDescription, setEditedDescription] = useState("");
  const [editedHairColor, setEditedHairColor] = useState("");
  const [editedEyeColor, setEditedEyeColor] = useState("");

  const [savingHair, setSavingHair] = useState(false);
  const [savingEye, setSavingEye] = useState(false);
  const [savingDesc, setSavingDesc] = useState(false);
  const [savedHair, setSavedHair] = useState(false);
  const [savedEye, setSavedEye] = useState(false);
  const [savedDesc, setSavedDesc] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase
      .from("characters")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }: { data: Character | null }) => {
        setChar(data ?? null);
        if (data?.gender === "女性" || data?.gender === "female") setGender("女性");
        else if (data?.gender === "中性" || data?.gender === "other") setGender("中性");
        if (data?.age) {
          const age = data.age as number;
          if (age < 20) setAgeRange("10代");
          else if (age < 30) setAgeRange("20代");
          else if (age < 40) setAgeRange("30代");
          else setAgeRange("40代以上");
        }
        setLoading(false);
      });
  }, [id]);

  const handleGenerate = useCallback(() => {
    const result = generateAppearance(gender, ageRange, atmosphere);
    setGenerated(result);
    setEditedDescription(result.description);
    setEditedHairColor(result.hairColor);
    setEditedEyeColor(result.eyeColor);
    setSavedHair(false);
    setSavedEye(false);
    setSavedDesc(false);
  }, [gender, ageRange, atmosphere]);

  async function saveHairColor() {
    if (!isSupabaseConfigured || !editedHairColor) return;
    setSavingHair(true);
    await supabase
      .from("characters")
      .update({ hair_color: editedHairColor })
      .eq("id", id);
    setSavingHair(false);
    setSavedHair(true);
    if (char) setChar({ ...char, hair_color: editedHairColor });
  }

  async function saveEyeColor() {
    if (!isSupabaseConfigured || !editedEyeColor) return;
    setSavingEye(true);
    await supabase
      .from("characters")
      .update({ eye_color: editedEyeColor })
      .eq("id", id);
    setSavingEye(false);
    setSavedEye(true);
    if (char) setChar({ ...char, eye_color: editedEyeColor });
  }

  async function saveDescription() {
    if (!isSupabaseConfigured || !editedDescription) return;
    setSavingDesc(true);
    const currentBg = char?.background ?? "";
    const newBg = currentBg
      ? `${currentBg}\n\n【外見】${editedDescription}`
      : `【外見】${editedDescription}`;
    await supabase
      .from("characters")
      .update({ background: newBg })
      .eq("id", id);
    setSavingDesc(false);
    setSavedDesc(true);
    if (char) setChar({ ...char, background: newBg });
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-coc-muted">読み込み中...</p>
      </div>
    );
  }

  if (!char) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-coc-muted">キャラクターが見つかりません。</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/characters/${id}`}
          className="flex items-center gap-1.5 text-sm text-coc-muted hover:text-coc-text transition-colors"
        >
          <ArrowLeft size={16} />
          {char.name}
        </Link>
      </div>

      <div>
        <h1 className="font-cinzel text-xl font-bold text-coc-text">
          外見ランダムジェネレーター
        </h1>
        <p className="mt-1 text-sm text-coc-muted">
          性別・年代・雰囲気を選ぶだけで、髪色・目の色・体格・外見描写をランダム生成します。
        </p>
      </div>

      {/* Selector Panel */}
      <div className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-4">
        {/* Gender */}
        <div>
          <p className="text-xs font-semibold text-coc-muted uppercase tracking-widest mb-2">
            性別
          </p>
          <div className="flex gap-2 flex-wrap">
            {GENDERS.map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  gender === g
                    ? "bg-coc-gold text-black border-coc-gold"
                    : "border-coc-border text-coc-muted hover:border-coc-border-glow hover:text-coc-text"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Age Range */}
        <div>
          <p className="text-xs font-semibold text-coc-muted uppercase tracking-widest mb-2">
            年代
          </p>
          <div className="flex gap-2 flex-wrap">
            {AGE_RANGES.map((a) => (
              <button
                key={a}
                onClick={() => setAgeRange(a)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  ageRange === a
                    ? "bg-coc-gold text-black border-coc-gold"
                    : "border-coc-border text-coc-muted hover:border-coc-border-glow hover:text-coc-text"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Atmosphere */}
        <div>
          <p className="text-xs font-semibold text-coc-muted uppercase tracking-widest mb-2">
            雰囲気
          </p>
          <div className="flex gap-2 flex-wrap">
            {ATMOSPHERES.map((a) => (
              <button
                key={a}
                onClick={() => setAtmosphere(a)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  atmosphere === a
                    ? "bg-coc-gold text-black border-coc-gold"
                    : "border-coc-border text-coc-muted hover:border-coc-border-glow hover:text-coc-text"
                }`}
              >
                {ATMOSPHERE_LABELS[a]}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          className="flex items-center gap-2 rounded-lg bg-coc-gold text-black font-semibold text-sm px-5 py-2.5 hover:brightness-110 transition-all motion-safe:active:scale-[0.97]"
        >
          <Shuffle size={15} />
          ランダム生成
        </button>
      </div>

      {/* Generated Results */}
      {generated && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-coc-muted uppercase tracking-widest">
            生成結果
          </p>

          {/* Hair Color */}
          <ResultField
            label="髪の色"
            value={editedHairColor}
            onChange={setEditedHairColor}
            onSave={saveHairColor}
            saving={savingHair}
            saved={savedHair}
            savedLabel="hair_color に保存済み"
            saveLabel="髪の色を保存"
            currentValue={char.hair_color ?? undefined}
            currentLabel="現在の設定"
          />

          {/* Eye Color */}
          <ResultField
            label="目の色"
            value={editedEyeColor}
            onChange={setEditedEyeColor}
            onSave={saveEyeColor}
            saving={savingEye}
            saved={savedEye}
            savedLabel="eye_color に保存済み"
            saveLabel="目の色を保存"
            currentValue={char.eye_color ?? undefined}
            currentLabel="現在の設定"
          />

          {/* Build & Height (display only) */}
          <div className="rounded-md border border-coc-border bg-coc-void p-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <span className="text-coc-muted">体格</span>
            <span className="text-coc-text">{generated.build}</span>
            <span className="text-coc-muted">身長目安</span>
            <span className="text-coc-text">{generated.heightRange}</span>
          </div>

          {/* Full Description */}
          <div className="rounded-md border border-coc-border bg-coc-void overflow-hidden">
            <div className="px-3 py-1.5 border-b border-coc-border flex items-center justify-between">
              <span className="text-xs font-semibold text-coc-gold">外見の説明文</span>
              {savedDesc ? (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <Check size={12} /> background に追記済み
                </span>
              ) : (
                <button
                  onClick={saveDescription}
                  disabled={savingDesc}
                  className="flex items-center gap-1 text-xs text-coc-gold hover:underline disabled:opacity-50"
                >
                  {savingDesc ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : null}
                  {savingDesc ? "保存中…" : "背景・外見 に追記"}
                </button>
              )}
            </div>
            <textarea
              rows={3}
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm text-coc-text bg-transparent resize-none focus:outline-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            className="flex items-center gap-1.5 text-xs text-coc-muted hover:text-coc-text transition-colors"
          >
            <Shuffle size={12} />
            もう一度生成
          </button>
        </div>
      )}

      {/* Current Values */}
      {(char.hair_color || char.eye_color) && (
        <div className="rounded-lg border border-coc-border bg-coc-surface p-4 space-y-2">
          <p className="text-xs font-semibold text-coc-muted uppercase tracking-widest mb-2">
            現在の外見設定
          </p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {char.hair_color && (
              <>
                <dt className="text-coc-muted">髪の色</dt>
                <dd className="text-coc-text">{char.hair_color}</dd>
              </>
            )}
            {char.eye_color && (
              <>
                <dt className="text-coc-muted">目の色</dt>
                <dd className="text-coc-text">{char.eye_color}</dd>
              </>
            )}
            {char.height_cm && (
              <>
                <dt className="text-coc-muted">身長</dt>
                <dd className="text-coc-text">{char.height_cm}cm</dd>
              </>
            )}
          </dl>
          <p className="text-xs text-coc-muted pt-1">
            詳細な外見設定は
            <Link href={`/characters/${id}/edit`} className="text-coc-gold hover:underline mx-0.5">
              キャラクター編集
            </Link>
            から変更できます。
          </p>
        </div>
      )}
    </div>
  );
}

type ResultFieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  savedLabel: string;
  saveLabel: string;
  currentValue?: string;
  currentLabel: string;
};

function ResultField({
  label,
  value,
  onChange,
  onSave,
  saving,
  saved,
  savedLabel,
  saveLabel,
  currentValue,
}: ResultFieldProps) {
  return (
    <div className="rounded-md border border-coc-border bg-coc-void overflow-hidden">
      <div className="px-3 py-1.5 border-b border-coc-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-coc-gold">{label}</span>
          {currentValue && (
            <span className="text-xs text-coc-muted">（現在: {currentValue}）</span>
          )}
        </div>
        {saved ? (
          <span className="text-xs text-green-400 flex items-center gap-1">
            <Check size={12} /> {savedLabel}
          </span>
        ) : (
          <button
            onClick={onSave}
            disabled={saving}
            className="flex items-center gap-1 text-xs text-coc-gold hover:underline disabled:opacity-50"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : null}
            {saving ? "保存中…" : saveLabel}
          </button>
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm text-coc-text bg-transparent focus:outline-none"
      />
    </div>
  );
}
