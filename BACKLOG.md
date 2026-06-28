# CoC Portal 機能バックログ

> 実装エージェントが `[TODO]` を上から順に実装し、完了したら `[DONE]` に変更する。
> プランニングエージェントが `[TODO]` が2件以下になったら新しい項目を追加する。

---

## [DONE] HP/SAN/MPクイック更新UI — 優先度: 高
**対象:** PL / 共通
**概要:** キャラクター詳細ページでHP・MP・SANをリロードなしで+1/-1更新できるUI
**実装ヒント:** `src/app/_components/QuickStatEditor.tsx` を新規作成（"use client"）。props: characterId, hpCurrent, hpMax, mpCurrent, mpMax, sanCurrent, sanMax。supabase.from("characters").update().eq("id", characterId) でDB更新。詳細ページの派生ステータスセクション直下に配置。
**コミット:** `feat: HP/SAN/MP quick update buttons on character detail`

## [DONE] ダイスローラー（技能連携） — 優先度: 高
**対象:** PL / KP / 共通
**概要:** 技能を選んで1d100判定し、成功度（決定的成功/通常成功/失敗/致命的失敗）をその場で表示
**実装ヒント:** `src/app/_components/DiceRoller.tsx` を新規作成（"use client"）。props: skills: CharacterSkill[]。技能選択 → 判定ボタン → Math.floor(Math.random()*100)+1 → 成功度判定。キャラ詳細ページの技能セクション上部に配置。
**コミット:** `feat: skill dice roller on character detail`

## [DONE] 技能成長チェック — 優先度: 中
**対象:** PL
**概要:** セッション後に技能へ成長チェックフラグを立て、次セッション前に成長判定できるUI
**実装ヒント:** `src/lib/supabase.ts` の CharacterSkill型に `growth_checked: boolean` 追加。`supabase_schema.sql` にALTER TABLE文追記。`src/app/_components/SkillList.tsx` にチェックボックスUI追加。
**コミット:** `feat: skill growth check tracking`

## [DONE] ルールリファレンス — 優先度: 中
**対象:** PL / KP / 共通
**概要:** CoC 7版の技能一覧（技能名・基本値）と判定ルールを検索・参照できるページ
**実装ヒント:** `src/app/rules/page.tsx` を実装。技能データは静的配列で定義（"use client" + useState でフィルタ）。判定ルール（通常/プッシュ/対抗）はアコーディオン表示。
**コミット:** `feat: rules reference with skill list and judgment rules`

## [DONE] セッションログ記録 — 優先度: 高
**対象:** PL / KP / 共通
**概要:** セッションごとの出来事・SAN喪失量・重要決定事項をキャラクター単位で時系列記録できる機能。後から振り返りに使う。
**実装ヒント:** Supabaseに`sessions`テーブルを追加（id, character_id, session_number, title, summary, san_loss, hp_loss, played_at, created_at）。`src/app/characters/[id]/sessions/page.tsx` を新規作成し、一覧表示と新規追加フォームを実装。`src/app/_components/SessionLogForm.tsx` を "use client" で作成。CharacterWithSkills型はsupabase.tsのまま流用。
**コミット:** `feat: session log recording per character`

## [DONE] モバイルクイックダッシュボード — 優先度: 高
**対象:** PL / 共通
**概要:** セッション中にスマホから即座に参照できるキャラクター専用ビュー。HP/MP/SANを大きなフォントで表示し、QuickStatEditorとDiceRollerのみ縦に並べたモバイルファーストレイアウト。
**実装ヒント:** `src/app/characters/[id]/quick/page.tsx` を新規作成（Server Component + "use client" ChildでOK）。既存の `QuickStatEditor.tsx` と `DiceRoller.tsx` を import して縦スタック配置。ステータス数値は `text-5xl font-bold` 等で大きく表示。キャラ詳細ページ（`src/app/characters/[id]/page.tsx`）に「クイックビュー」リンクを追加。
**コミット:** `feat: mobile quick dashboard for in-session use`

## [TODO] NPC管理ページ — 優先度: 中
**対象:** KP
**概要:** KPがシナリオ別にNPCの名前・外見・目的・特徴メモを登録・検索・閲覧できるページ。Character型とは独立したシンプルな構造。
**実装ヒント:** Supabaseに`npcs`テーブルを追加（id, scenario_name, name, appearance, purpose, notes, created_at）。`src/app/npcs/page.tsx`（一覧）と `src/app/npcs/new/page.tsx`（作成フォーム）を新規作成。`src/app/_components/NavBar.tsx` に「NPC」リンクを追加。フィルタはscenario_nameのselect要素で実装。
**コミット:** `feat: NPC management page for KP`

## [TODO] キャラクター関係メモ — 優先度: 低
**対象:** PL
**概要:** キャラクターと他PC・NPCとの関係性（友人/ライバル/恩人など）を一行メモで記録できる機能。セッション前の設定確認に使う。
**実装ヒント:** Supabaseに`character_relations`テーブルを追加（id, character_id, target_name, relation_type, memo, created_at）。`src/app/characters/[id]/relations/page.tsx` を新規作成。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）の末尾に「関係メモ」セクションへのリンクを追加。relation_typeは "友人"|"ライバル"|"恩人"|"要注意"|"その他" の select で実装。
**コミット:** `feat: character relation memo`

## [TODO] 狂気状態管理 — 優先度: 高
**対象:** PL
**概要:** セッション中のSAN喪失で発生した一時的狂気・不定の狂気の症状を記録・追跡できる機能。発症中か回復済みかのステータス管理も行う。
**実装ヒント:** Supabaseに`madness_records`テーブルを追加（id, character_id, madness_type: "temporary"|"indefinite", symptom, is_active: boolean, started_at, recovered_at, created_at）。`src/app/characters/[id]/madness/page.tsx` を新規作成（一覧＋追加フォーム）。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）にSAN現在値が低い場合は警告バッジを表示し「狂気記録」リンクを追加。`src/lib/supabase.ts` に `MadnessRecord` 型を追加。
**コミット:** `feat: madness state tracking per character`

## [TODO] キャラクターJSONエクスポート — 優先度: 高
**対象:** PL / 共通
**概要:** キャラクターデータ（ステータス・技能・セッションログ）をJSONファイルとしてダウンロードできる機能。セッション前後のバックアップやシート共有に使う。
**実装ヒント:** `src/app/_components/ExportButton.tsx` を "use client" で新規作成。`supabase.from("characters").select("*, character_skills(*), sessions(*)")` で全データ取得し `JSON.stringify` + `Blob` + `URL.createObjectURL` でダウンロード。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）のヘッダー右上に「エクスポート」ボタンとして配置。
**コミット:** `feat: character JSON export for backup and sharing`

## [TODO] シナリオ管理 — 優先度: 中
**対象:** KP
**概要:** KPがシナリオのタイトル・概要・GMメモ・進行状態（準備中/進行中/完了）を管理できるページ。NPCやセッションログと紐づけて参照できる。
**実装ヒント:** Supabaseに`scenarios`テーブルを追加（id, title, synopsis, gm_notes, status: "planning"|"ongoing"|"completed", played_at, created_at）。`src/app/scenarios/page.tsx`（一覧・ステータスフィルタ付き）と `src/app/scenarios/new/page.tsx`（作成フォーム）を新規作成。`src/app/_components/NavBar.tsx` に「シナリオ」リンクを追加。`src/lib/supabase.ts` に `Scenario` 型を追加。
**コミット:** `feat: scenario management page for KP`

## [TODO] ハンドアウト管理 — 優先度: 中
**対象:** KP
**概要:** シナリオ別にハンドアウト（情報カード）をタイトル・本文・受け取りPC名・秘匿フラグ付きで作成・一覧できる機能。セッション当日の情報配布ミスを防ぐ。
**実装ヒント:** Supabaseに`handouts`テーブルを追加（id, scenario_id, title, content, recipient_name, is_secret: boolean, created_at）。`src/app/scenarios/[id]/handouts/page.tsx` を新規作成（一覧＋インライン作成フォーム）。is_secretがtrueのカードはデフォルト折りたたみ表示（`<details>` 要素またはstateで制御）。`src/lib/supabase.ts` に `Handout` 型を追加。
**コミット:** `feat: handout management per scenario for KP`
