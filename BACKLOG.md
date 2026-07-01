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

## [DONE] NPC管理ページ — 優先度: 中
**対象:** KP
**概要:** KPがシナリオ別にNPCの名前・外見・目的・特徴メモを登録・検索・閲覧できるページ。Character型とは独立したシンプルな構造。
**実装ヒント:** Supabaseに`npcs`テーブルを追加（id, scenario_name, name, appearance, purpose, notes, created_at）。`src/app/npcs/page.tsx`（一覧）と `src/app/npcs/new/page.tsx`（作成フォーム）を新規作成。`src/app/_components/NavBar.tsx` に「NPC」リンクを追加。フィルタはscenario_nameのselect要素で実装。
**コミット:** `feat: NPC management page for KP`

## [DONE] キャラクター関係メモ — 優先度: 低
**対象:** PL
**概要:** キャラクターと他PC・NPCとの関係性（友人/ライバル/恩人など）を一行メモで記録できる機能。セッション前の設定確認に使う。
**実装ヒント:** Supabaseに`character_relations`テーブルを追加（id, character_id, target_name, relation_type, memo, created_at）。`src/app/characters/[id]/relations/page.tsx` を新規作成。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）の末尾に「関係メモ」セクションへのリンクを追加。relation_typeは "友人"|"ライバル"|"恩人"|"要注意"|"その他" の select で実装。
**コミット:** `feat: character relation memo`

## [DONE] 狂気状態管理 — 優先度: 高
**対象:** PL
**概要:** セッション中のSAN喪失で発生した一時的狂気・不定の狂気の症状を記録・追跡できる機能。発症中か回復済みかのステータス管理も行う。
**実装ヒント:** Supabaseに`madness_records`テーブルを追加（id, character_id, madness_type: "temporary"|"indefinite", symptom, is_active: boolean, started_at, recovered_at, created_at）。`src/app/characters/[id]/madness/page.tsx` を新規作成（一覧＋追加フォーム）。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）にSAN現在値が低い場合は警告バッジを表示し「狂気記録」リンクを追加。`src/lib/supabase.ts` に `MadnessRecord` 型を追加。
**コミット:** `feat: madness state tracking per character`

## [DONE] キャラクターJSONエクスポート — 優先度: 高
**対象:** PL / 共通
**概要:** キャラクターデータ（ステータス・技能・セッションログ）をJSONファイルとしてダウンロードできる機能。セッション前後のバックアップやシート共有に使う。
**実装ヒント:** `src/app/_components/ExportButton.tsx` を "use client" で新規作成。`supabase.from("characters").select("*, character_skills(*), sessions(*)")` で全データ取得し `JSON.stringify` + `Blob` + `URL.createObjectURL` でダウンロード。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）のヘッダー右上に「エクスポート」ボタンとして配置。
**コミット:** `feat: character JSON export for backup and sharing`

## [DONE] シナリオ管理 — 優先度: 中
**対象:** KP
**概要:** KPがシナリオのタイトル・概要・GMメモ・進行状態（準備中/進行中/完了）を管理できるページ。NPCやセッションログと紐づけて参照できる。
**実装ヒント:** Supabaseに`scenarios`テーブルを追加（id, title, synopsis, gm_notes, status: "planning"|"ongoing"|"completed", played_at, created_at）。`src/app/scenarios/page.tsx`（一覧・ステータスフィルタ付き）と `src/app/scenarios/new/page.tsx`（作成フォーム）を新規作成。`src/app/_components/NavBar.tsx` に「シナリオ」リンクを追加。`src/lib/supabase.ts` に `Scenario` 型を追加。
**コミット:** `feat: scenario management page for KP`

## [DONE] ハンドアウト管理 — 優先度: 中
**対象:** KP
**概要:** シナリオ別にハンドアウト（情報カード）をタイトル・本文・受け取りPC名・秘匿フラグ付きで作成・一覧できる機能。セッション当日の情報配布ミスを防ぐ。
**実装ヒント:** Supabaseに`handouts`テーブルを追加（id, scenario_id, title, content, recipient_name, is_secret: boolean, created_at）。`src/app/scenarios/[id]/handouts/page.tsx` を新規作成（一覧＋インライン作成フォーム）。is_secretがtrueのカードはデフォルト折りたたみ表示（`<details>` 要素またはstateで制御）。`src/lib/supabase.ts` に `Handout` 型を追加。
**コミット:** `feat: handout management per scenario for KP`

## [DONE] チャットパレット生成 — 優先度: 高
**対象:** PL / 共通
**概要:** キャラクターの技能・能力値をもとに、ユドナリウム・ここフォリア等のVTTツールで使えるBCDice互換のチャットパレット（ロールコマンド集）を自動生成してコピーできる機能。
**リサーチ根拠:** ユドナリウム・ここフォリア等の人気VTTツールがBCDiceチャットパレットを標準サポートしており、コピペで使えるパレット生成がユーザーの大きな需要として確認された。
**実装ヒント:** `src/app/characters/[id]/chat-palette/page.tsx` を新規作成（"use client"）。`supabase.from("characters").select("*, character_skills(*)")` でデータ取得し、技能ごとに `{技能名} 1D100<={現在値}` 形式のBCDiceコマンドを生成。テキストエリアに一覧表示し「クリップボードにコピー」ボタンを配置。キャラ詳細ページ（`src/app/characters/[id]/page.tsx`）にリンクを追加。
**コミット:** `feat: BCDice chat palette generator for VTT tools`

## [DONE] 武器・装備・所持品管理 — 優先度: 高
**対象:** PL / 共通
**概要:** キャラクターが所持する武器（ダメージ・射程・装弾数）と一般アイテムをセッション中に参照・更新できるインベントリ管理機能。
**リサーチ根拠:** Roll20・PrismScroll Cthulhu・公式シートを含む主要CoC管理ツールほぼ全てで実装されている定番機能であり、このポータルに明確に欠けている要素として確認された。
**実装ヒント:** Supabaseに `inventory_items` テーブルを追加（id, character_id, item_type: "weapon"|"item", name, damage, range, ammo_current, ammo_max, notes, created_at）。`src/app/characters/[id]/inventory/page.tsx` を新規作成（一覧＋インライン編集フォーム）。武器は damage/range/ammo を、アイテムは name/notes のみ表示するよう item_type で分岐。`src/app/_components/InventoryForm.tsx` を "use client" で作成。`src/lib/supabase.ts` に `InventoryItem` 型を追加。
**コミット:** `feat: weapon and item inventory management`

## [DONE] PDFシートエクスポート — 優先度: 中
**対象:** PL / 共通
**概要:** キャラクターシート全体（ステータス・技能・所持品）をA4 PDF形式でダウンロードできる機能。既存のJSONエクスポートを補完し、印刷・オフラインセッション用途に対応する。
**リサーチ根拠:** Charaeno・PrismScroll Cthulhu・Roll20等の主要ツールが全てPDF出力をサポートしており、オフラインセッション・印刷需要がユーザーから継続的に挙げられている。
**実装ヒント:** `src/app/_components/PdfExportButton.tsx` を "use client" で新規作成。ブラウザの `window.print()` + 印刷用CSSメディアクエリ（`@media print`）方式で実装するか、`react-to-print` ライブラリを使用。印刷対象コンポーネント `src/app/characters/[id]/print/page.tsx` を新規作成し、ステータス・技能・所持品を1ページに収めるレイアウトで構成。キャラクター詳細ページのヘッダーに「PDF出力」ボタンを追加。
**コミット:** `feat: PDF character sheet export for offline/print use`

## [DONE] キャラクター紹介カード — 優先度: 中
**対象:** PL / 共通
**概要:** キャラクターの名前・外見・職業・背景・能力値ハイライトをSNS共有向けのカード形式で表示し、画像としてダウンロードできる機能。セッション前の自己紹介や卓外での共有に使う。
**リサーチ根拠:** Charaenoの「キャラ紹介」機能やいあキャラのプロフィールカードが人気を集めており、SNSでのキャラ共有・セッション募集時の自己紹介ニーズが高いことが確認された。
**実装ヒント:** `src/app/characters/[id]/profile-card/page.tsx` を新規作成。`html2canvas` ライブラリでカードDOMをCanvas化し PNG ダウンロード。カードレイアウトはキャラ名・職業・外見テキスト・HP/SAN/能力値サマリを縦に配置する `src/app/_components/ProfileCard.tsx` で実装（"use client"）。OGP用途に `/api/characters/[id]/og` ルートも将来追加可能な構造にする。キャラクター詳細ページに「紹介カード」リンクを追加。
**コミット:** `feat: character profile card for SNS sharing`

## [DONE] シナリオ参加キャラクター管理 — 優先度: 高
**対象:** KP / 共通
**概要:** KPがシナリオに参加するキャラクターを登録し、セッションの参加者を一画面で把握できる機能。既存のシナリオ・キャラクター両データと連携する。
**実装ヒント:** Supabaseに `scenario_participants` テーブルを追加（id, scenario_id, character_id, created_at）。`src/app/scenarios/[id]/participants/page.tsx` を新規作成（一覧＋キャラクター選択フォーム）。`src/lib/supabase.ts` に `ScenarioParticipant` 型を追加。シナリオ一覧ページ（`src/app/scenarios/page.tsx`）の各カードに参加者数バッジを追加。
**コミット:** `feat: scenario participant management linking characters to scenarios`

## [DONE] キャラクター一覧フィルタ・検索 — 優先度: 中
**対象:** PL / 共通
**概要:** 複数キャラクターを管理するプレイヤー向けに、名前・職業・ステータス（alive/dead/insane/retired）でリアルタイムフィルタできる検索UIをキャラ一覧ページに追加する。
**実装ヒント:** `src/app/characters/page.tsx` を "use client" 化し、useState で `nameQuery`, `statusFilter`, `occupationQuery` を管理。`supabase.from("characters").select("*")` で全件取得後クライアントサイドでフィルタ（件数が多い場合は `.ilike()` クエリに切り替え可）。検索バー＋ステータスselectを既存 CharacterCard グリッドの上部に配置。追加DBなし。
**コミット:** `feat: character list filter and search by name, occupation, status`

## [DONE] シナリオ詳細ダッシュボード — 優先度: 中
**対象:** KP
**概要:** シナリオのNPC一覧・ハンドアウト・参加者・セッション概要を一画面で確認できるKP専用の詳細ページ。各データへのナビゲーションハブとして機能する。
**実装ヒント:** `src/app/scenarios/[id]/page.tsx` を新規作成（現在は未実装）。`supabase.from("scenarios").select("*").eq("id", id)` でシナリオ取得。同一ページ内で `npcs`（scenario_nameで絞り込み）と `handouts`（scenario_idで絞り込み）のカウントをサマリー表示。`src/app/scenarios/[id]/handouts/page.tsx` と `participants/page.tsx` へのカードリンクを配置。シナリオ一覧（`src/app/scenarios/page.tsx`）の各カードを `/scenarios/[id]` へリンクするよう修正。
**コミット:** `feat: scenario detail dashboard with NPC, handout, and participant summary`

## [DONE] キャラクタータイムライン（年表） — 優先度: 低
**対象:** PL
**概要:** セッションログを時系列で可視化し、キャラクターの成長・出来事・SAN喪失の流れを年表形式で振り返れるビュー。既存のSessionLogデータを流用するため追加DBなし。
**実装ヒント:** `src/app/characters/[id]/timeline/page.tsx` を新規作成。`supabase.from("sessions").select("*").eq("character_id", id).order("session_number", {ascending: true})` でログ取得。各セッションを縦線上のノードとして表示（CSS border-leftで疑似タイムライン）。SAN喪失量に応じてノードの色を変える（例: san_loss >= 5 で赤、1-4 で黄）。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「年表」リンクを追加。
**コミット:** `feat: character session timeline visualization`

## [DONE] 探索者特質・重要情報管理 — 優先度: 高
**対象:** PL
**概要:** CoC7版キャラシートの「重要な人物」「重要な場所」「大切な宝物」「性格的特質」「イデオロギー/信念」を個別記録できる機能。現在のbackgroundフィールド（単一テキスト）では粒度が不足している。
**実装ヒント:** Supabaseに `character_traits` テーブルを追加（id, character_id, trait_type: "person"|"place"|"treasure"|"personality"|"ideology"|"wound", content, created_at）。`src/app/characters/[id]/traits/page.tsx` を新規作成（trait_typeごとにセクション分けして一覧・追加・削除）。`src/lib/supabase.ts` に `TraitType` と `CharacterTrait` 型を追加。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「特質・重要情報」リンクを追加。
**コミット:** `feat: character trait and important info management for CoC 7th`

## [DONE] セッション前チェックリスト — 優先度: 高
**対象:** PL / 共通
**概要:** セッション開始直前にHP/MP/SAN・装備・狂気状態・前回ログ・関係メモを一画面でまとめて確認できるプリフライトUI。セッション中の「確認し忘れ」を防ぐ。
**実装ヒント:** `src/app/characters/[id]/preflight/page.tsx` を新規作成（Server Component）。`supabase.from("characters").select("*, character_skills(*), inventory_items(*), madness_records(*), sessions(*)")` でデータ一括取得。HP/MP/SAN の現在値をカラーコードで表示（残量50%以下で黄、25%以下で赤）。アクティブな狂気・所持武器・最新セッションサマリーを縦に並べる。追加DBなし。キャラクター詳細ページに「セッション前確認」リンクを追加。
**コミット:** `feat: pre-session checklist for in-session readiness`

## [DONE] ダイスロール履歴 — 優先度: 中
**対象:** PL / 共通
**概要:** DiceRollerで行ったロールを自動保存し、セッション中・後に「いつ・何の技能・何を振ったか・成功度」を一覧確認できる履歴機能。KPとの確認作業や振り返りに使う。
**実装ヒント:** Supabaseに `dice_rolls` テーブルを追加（id, character_id, skill_name, skill_value, roll_value, success_level: "critical_success"|"success"|"failure"|"fumble", rolled_at）。`src/app/_components/DiceRoller.tsx` でロール後に `supabase.from("dice_rolls").insert(...)` を呼ぶ。`src/app/characters/[id]/dice-history/page.tsx` を新規作成（セッション日付でグループ表示、直近50件）。`src/lib/supabase.ts` に `DiceRoll` 型を追加。
**コミット:** `feat: dice roll history per character`

## [DONE] NPCスタッツ拡張（能力値・技能） — 優先度: 中
**対象:** KP
**概要:** 現在のNPCは外見・目的・メモのみだが、戦闘NPCには STR/CON/DEX/HP等の能力値と代表技能値も記録できるよう拡張する。シナリオ中の戦闘・対抗判定に即座に参照できる。
**実装ヒント:** Supabaseの `npcs` テーブルに `str`, `con`, `pow`, `dex`, `app`, `siz`, `int_stat`, `edu`, `hp`, `mp`, `db` (ダメージボーナス) カラムをNULL許容で追加（ALTER TABLE）。`src/app/npcs/new/page.tsx` と編集ページに「能力値」セクションを任意入力で追加。`src/app/_components/NpcForm.tsx` を更新。`src/lib/supabase.ts` の `Npc` 型に各カラムを追加。能力値未入力のNPCは従来通り外見・目的・メモのみ表示。
**コミット:** `feat: NPC stats extension with ability scores and skills`

## [DONE] お気に入りキャラクターのピン留め — 優先度: 低
**対象:** PL / 共通
**概要:** 複数キャラクターを管理するPLが「現在プレイ中のキャラ」をピン留めし、キャラクター一覧の先頭に固定表示できる機能。セッション開始時のキャラ選択を高速化する。
**実装ヒント:** `characters` テーブルに `is_pinned: boolean DEFAULT false` カラムを追加（ALTER TABLE）。`src/lib/supabase.ts` の `Character` 型に `is_pinned: boolean` を追加。`src/app/characters/page.tsx` のフィルタ処理でピン留めキャラを先頭ソート。`src/app/_components/CharacterCard.tsx` にピン留めトグルボタン（星アイコン等）を追加し `supabase.from("characters").update({is_pinned}).eq("id", id)` で更新。
**コミット:** `feat: pin favorite characters to top of character list`

## [DONE] ダイス判定統計ダッシュボード — 優先度: 中
**対象:** PL / 共通
**概要:** キャラクターのダイスロール履歴（`dice_rolls`テーブル）を集計し、技能別の成功率・ファンブル率・最多使用技能・総判定数をグラフ/表形式で可視化するダッシュボード。セッションをまたいだキャラクターの判定傾向が分かる。
**実装ヒント:** `src/app/characters/[id]/dice-stats/page.tsx` を新規作成（Server Component）。`supabase.from("dice_rolls").select("*").eq("character_id", id)` で全件取得し、技能名ごとにグループ化して成功数/総数を集計。追加DBなし（既存`dice_rolls`のみ使用）。グラフはCSSのみのバー表示（`width: calc(${rate}%)`）で依存ライブラリ不要。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「判定統計」リンクを追加。
**コミット:** `feat: dice roll statistics dashboard per character`

## [DONE] NPC詳細ページ＋クイックロール — 優先度: 中
**対象:** KP
**概要:** 現在NPCは一覧のみで詳細ページが存在しない。NPC個別詳細ページを追加し、拡張済みの能力値スタッツを確認しながら技能ロールをその場で実行できるKP専用ビュー。戦闘・対抗判定時の参照コストを大幅に下げる。
**実装ヒント:** `src/app/npcs/[id]/page.tsx` を新規作成（Server Component + "use client" 子コンポーネント）。`supabase.from("npcs").select("*").eq("id", id)` でNPC取得。能力値（STR/CON/POW/DEX/APP/SIZ/INT/EDU/HP/MP/DB）を StatBlock 風に表示。既存の `DiceRoller.tsx` を流用し、NPCの技能値を任意入力できるシンプルロールUIを配置。`src/app/npcs/page.tsx` の各NPCカードを `/npcs/[id]` へリンクするよう修正。追加DBなし。
**コミット:** `feat: NPC detail page with quick dice roll for KP`

## [DONE] セッション中クイックノート — 優先度: 高
**対象:** PL / 共通
**概要:** セッション中にキャラクター単位で走り書きメモを残せる軽量ノート機能。セッションログ（`sessions`テーブル）は終了後の記録用だが、こちらはセッション中のリアルタイムメモ用途（重要情報・KPの発言・思いついたこと）に特化する。
**実装ヒント:** Supabaseに `quick_notes` テーブルを追加（id, character_id, content, created_at）。`src/app/characters/[id]/quick-notes/page.tsx` を "use client" で新規作成。`<textarea>` で内容を入力し「保存」「削除」ができるシンプルなUI（一覧はcreated_at降順、最新10件）。モバイルクイックダッシュボード（`src/app/characters/[id]/quick/page.tsx`）にも「メモ」ショートカットリンクを追加。`src/lib/supabase.ts` に `QuickNote` 型を追加。
**コミット:** `feat: in-session quick note pad per character`

## [DONE] キャラクター成長履歴 — 優先度: 中
**対象:** PL
**概要:** 技能成長チェック後に実際に技能値が上がったとき、その変化を「どのセッション後にどの技能が何点上がったか」として記録する成長ログ。キャラクター成長の軌跡をセッション単位で振り返れる。
**実装ヒント:** Supabaseに `growth_history` テーブルを追加（id, character_id, skill_name, old_value, new_value, session_label, grown_at, created_at）。`src/app/characters/[id]/growth/page.tsx` を新規作成（一覧＋成長記録追加フォーム）。SkillList.tsx の成長チェック解除フロー（`growth_checked: false` に戻す処理）の直前に「成長記録を追加しますか？」モーダルを挿入するか、独立したページとして実装。`src/lib/supabase.ts` に `GrowthHistory` 型を追加。キャラクタータイムライン（`src/app/characters/[id]/timeline/page.tsx`）の各セッションノードに成長情報を付記。
**コミット:** `feat: character skill growth history tracking`

## [DONE] 呪文・魔術管理 — 優先度: 高
**対象:** PL
**概要:** CoC 7版の呪文（マジック）をキャラクター単位で管理できる機能。呪文名・MP消費・SAN消費・効果概要・ページ参照を記録し、セッション中に素早く参照できる。現在インベントリ・技能・狂気は管理できるが呪文機能が完全に欠落している。
**実装ヒント:** Supabaseに `character_spells` テーブルを追加（id, character_id, spell_name, mp_cost, san_cost, casting_time, effect, source_page, created_at）。`src/app/characters/[id]/spells/page.tsx` を新規作成（一覧＋追加フォーム）。呪文カードは `spell_name`・`mp_cost`/`san_cost` バッジ・`effect` テキストを縦に並べる。`src/lib/supabase.ts` に `CharacterSpell` 型を追加。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「呪文」リンクを追加。セッション前チェックリスト（`preflight/page.tsx`）にも習得呪文サマリーを追記。
**コミット:** `feat: character spell management for CoC magic system`

## [DONE] 戦闘ロール統合（インベントリ武器からクイックロール） — 優先度: 高
**対象:** PL / 共通
**概要:** インベントリの武器カードにロールボタンを追加し、対応する戦闘技能（格闘/拳銃/ライフル等）を自動選択して 1d100 判定を実行できる機能。現在は武器一覧とDiceRollerが独立しており、セッション中に技能リストを探す手間がある。
**実装ヒント:** `src/app/characters/[id]/inventory/page.tsx` に "use client" コンポーネントを追加。各武器カードに「ロール」ボタンを配置し、`item_type === "weapon"` の場合は character_skills から `格闘技 (武器)`, `回避`, `拳銃`, `ライフル` 等を候補として表示するプルダウンを出す。判定後は `supabase.from("dice_rolls").insert(...)` に保存（dice_history と連携）。追加DBなし（既存 `inventory_items`, `character_skills`, `dice_rolls` を流用）。
**コミット:** `feat: combat roll integration on inventory weapon cards`

## [DONE] キャラクター複製機能 — 優先度: 中
**対象:** PL / 共通
**概要:** 既存キャラクターを1クリックで複製し、名前だけ変えた新キャラクターとして保存できる機能。別シナリオ用バリアント作成・過去シートの再利用・NPCのひな型作成を高速化する。
**実装ヒント:** `src/app/characters/[id]/page.tsx` のヘッダーに「複製」ボタンを追加（"use client" コンポーネント）。ボタン押下で `supabase.from("characters").select("*, character_skills(*)")` で全データ取得し、name に「（コピー）」を付加して `characters` テーブルに INSERT、続いて `character_skills` を新IDで一括 INSERT。複製後は新キャラクターの詳細ページへリダイレクト。追加DBなし。スキルの `growth_checked` はすべて `false` にリセット。
**コミット:** `feat: duplicate character with skills for quick character creation`

## [DONE] KPハンドアウト共有URL — 優先度: 中
**対象:** KP / 共通
**概要:** KPがシナリオのハンドアウトを選択し、有効期限付き閲覧専用URLを発行してPLに共有できる機能。現在ハンドアウトはKP画面内にしか存在せず、PLへの情報提供が口頭かコピペに限られている。
**実装ヒント:** Supabaseに `share_tokens` テーブルを追加（id, handout_id, token: uuid, expires_at: timestamptz, created_at）。ハンドアウト一覧（`src/app/scenarios/[id]/handouts/page.tsx`）の各ハンドアウトカードに「共有リンク生成」ボタンを追加し、`supabase.from("share_tokens").insert({handout_id, token: crypto.randomUUID(), expires_at: +24h})` でトークン発行。`src/app/share/[token]/page.tsx` を新規作成（Server Component）。`supabase.from("share_tokens").select("*, handouts(*)").eq("token", token).gt("expires_at", now)` で取得し、is_secret でなければ本文を表示。`src/lib/supabase.ts` に `ShareToken` 型を追加。
**コミット:** `feat: shareable handout URL with expiry for KP to PL distribution`

## [DONE] パーティービュー（シナリオ参加者HP/SAN一覧） — 優先度: 高
**対象:** KP / 共通
**概要:** シナリオに参加する全キャラクターのHP/MP/SANを一画面で確認できるビュー。セッション中のパーティー全体の状態把握・生死確認を一覧で行える。
**実装ヒント:** `src/app/scenarios/[id]/party/page.tsx` を新規作成（Server Component）。`supabase.from("scenario_participants").select("*, characters(*)").eq("scenario_id", id)` で参加者＋キャラデータを一括取得。各キャラのHP/MP/SANを残量に応じてカラーコード表示（50%以下→黄、25%以下→赤）。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「パーティービュー」リンクを追加。追加DBなし。
**コミット:** `feat: party view showing all participant HP/SAN for scenario`

## [DONE] プッシュ/対抗ロールUI — 優先度: 高
**対象:** PL / KP / 共通
**概要:** CoC7版の「プッシュロール（失敗後の再挑戦）」と「対抗ロール（2者の技能値を同時判定）」を専用UIで実行できる機能。通常のDiceRollerでは再現できない重要ルールを補完する。
**実装ヒント:** `src/app/_components/SpecialRoller.tsx` を新規作成（"use client"）。ロール種別タブ（通常/プッシュ/対抗）を切り替え。プッシュは前回ロール値を保持して再判定し成功度を表示。対抗ロールは2つの技能値入力欄を持ち双方のロール値と成功度を比較して勝敗を判定。判定結果は `supabase.from("dice_rolls").insert(...)` に保存（既存dice_historyと連携）。キャラクター詳細ページのダイスローラーセクションに「特殊ロール」ボタンとして追加。
**コミット:** `feat: push roll and opposed roll UI for CoC7 special mechanics`

## [DONE] キャラクターJSONインポート — 優先度: 中
**対象:** PL / 共通
**概要:** 既存エクスポート機能（ExportButton.tsx）で作成したJSONファイルを読み込み、キャラクター＋技能を一括復元・新規作成できる機能。バックアップからの復元・別環境への移行・テンプレートキャラ共有に対応する。
**実装ヒント:** `src/app/characters/import/page.tsx` を新規作成（"use client"）。`<input type="file" accept=".json">` でファイル選択し `FileReader` でJSON解析。バリデーション後に `supabase.from("characters").insert(...)` でキャラ作成し、続いて `character_skills` を新IDで一括INSERT（nameに「（インポート）」付加でオリジナルと区別）。インポート後は新キャラクター詳細ページへリダイレクト。`src/app/characters/page.tsx` に「JSONからインポート」ボタンを追加。追加DBなし。
**コミット:** `feat: character JSON import to restore from backup or share templates`

## [DONE] シナリオ共有メモ（パーティーノート） — 優先度: 中
**対象:** KP / 共通
**概要:** シナリオに紐づいた共有メモページ。KPとPL全員が確認できる「パーティーで共有すべき情報」（判明した手がかり・決定事項・次のアクション）をセッション中にリアルタイムで記録できる。
**実装ヒント:** Supabaseに `scenario_notes` テーブルを追加（id, scenario_id, content, author_name, created_at）。`src/app/scenarios/[id]/notes/page.tsx` を "use client" で新規作成（一覧＋追加フォーム、作成日時降順）。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「共有メモ」リンクを追加。`src/lib/supabase.ts` に `ScenarioNote` 型を追加。
**コミット:** `feat: shared scenario notes for party information tracking`

## [DONE] 戦闘ラウンドカウンター — 優先度: 低
**対象:** KP / 共通
**概要:** セッション中の戦闘をラウンド単位で管理できるシンプルなカウンター。現在ラウンド数・各キャラクターのDEX順イニシアチブ・行動済みフラグをセッション中に追跡できる。
**実装ヒント:** `src/app/scenarios/[id]/combat/page.tsx` を "use client" で新規作成。useState でラウンド数・参加者リスト・行動済みフラグを管理（ページリロードで状態リセット）。参加者は `scenario_participants` から取得したキャラクターのDEXでソートしてイニシアチブ順を自動生成。行動済みキャラはチェックマークでトグル、全員完了で次ラウンドボタンを有効化。シナリオ詳細ダッシュボードに「戦闘管理」リンクを追加。追加DBなし（ローカル状態のみ）。
**コミット:** `feat: combat round counter with DEX-based initiative tracking`

## [DONE] グローバル横断検索 — 優先度: 中
**対象:** PL / KP / 共通
**概要:** キャラクター・NPC・シナリオを名前やキーワードで横断検索できる検索ページ。複数キャラ・複数シナリオを管理するユーザーが目的のデータへすぐ辿り着けるようにする。
**実装ヒント:** `src/app/search/page.tsx` を "use client" で新規作成。クエリパラメータ `?q=` を受け取り、`supabase.from("characters").select("*").ilike("name", `%${q}%`)`、`npcs`、`scenarios` の3テーブルに対して並行クエリ（`Promise.all`）を実行し、種別ごとにセクション分けして結果一覧表示。`src/app/_components/NavBar.tsx`（`src/app/_components/NavBar.tsx:8-14`の`navLinks`付近）に検索アイコン＋入力欄を追加し、Enterで `/search?q=...` に遷移。追加DBなし。
**コミット:** `feat: global search across characters, NPCs, and scenarios`

## [DONE] キャラクターHP/SAN推移グラフ — 優先度: 中
**対象:** PL
**概要:** セッションログ（`sessions`テーブルの`san_loss`/`hp_loss`）を累積し、セッションを重ねるごとのHP・SANの減少傾向を視覚的に確認できるグラフビュー。既存のタイムライン（年表）は出来事の一覧表示のみで数値推移が分かりにくい点を補う。
**実装ヒント:** `src/app/characters/[id]/timeline/page.tsx` 内、または新規 `src/app/characters/[id]/stats-graph/page.tsx` に実装。`supabase.from("sessions").select("*").eq("character_id", id).order("session_number")` でログ取得後、`san_max`/`hp_max` からの残量推移を session_number ごとに算出。依存ライブラリなしでCSSの `height: calc(${pct}%)` を使った縦棒グラフで表示（SAN用・HP用の2系統）。追加DBなし（既存`sessions`を流用）。キャラクター詳細ページに「推移グラフ」リンクを追加。
**コミット:** `feat: HP/SAN trend graph across sessions`

## [DONE] シナリオ次回予定リマインド — 優先度: 中
**対象:** KP / 共通
**概要:** 進行中のシナリオに「次回セッション予定日」を設定し、シナリオ一覧・ダッシュボードで直近の予定を分かりやすく表示できる機能。現在`played_at`は実施済み記録用のみで、未来の予定管理ができない。
**実装ヒント:** `scenarios` テーブルに `next_session_at: timestamptz | null` カラムをALTER TABLEで追加。`src/lib/supabase.ts` の `Scenario` 型に `next_session_at: string | null` を追加。`src/app/_components/ScenarioForm.tsx` に日時入力フィールドを追加。シナリオ一覧（`src/app/scenarios/page.tsx`）で `status === "ongoing"` かつ `next_session_at` が直近7日以内のシナリオをカード上部に「次回予定」バッジで強調表示。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）にも次回予定日を表示。
**コミット:** `feat: scenario next session date and reminder display`

## [DONE] NPC判定履歴記録 — 優先度: 低
**対象:** KP
**概要:** NPC詳細ページのクイックロール（`NpcQuickRoller.tsx`）はロール結果がページ離脱で消える一時表示のみ。判定結果をDBに保存し、戦闘・対抗判定の経緯を後から振り返れる履歴機能を追加する。
**実装ヒント:** Supabaseに `npc_dice_rolls` テーブルを追加（id, npc_id, skill_name, skill_value, roll_value, success_level, rolled_at）。`src/app/_components/NpcQuickRoller.tsx`（`roll()`関数内、`setResult`の直後）でロール結果を `supabase.from("npc_dice_rolls").insert(...)` で保存するよう拡張（npcIdをpropsで追加受け取り）。NPC詳細ページ（`src/app/npcs/[id]/page.tsx`）に直近の判定履歴一覧（最新10件）を追加表示。`src/lib/supabase.ts` に `NpcDiceRoll` 型を追加。
**コミット:** `feat: NPC dice roll history tracking`

## [DONE] 能力値オートロール（キャラクター作成支援） — 優先度: 中
**対象:** PL
**概要:** キャラクター新規作成時に、CoC7版ルールに沿った能力値（STR/CON/POW/DEX/APP=3D6×5、SIZ/INT/EDU=2D6×5+6）を自動でロールし入力欄に反映できる機能。現在は能力値を手入力する必要があり、キャラ作成の手間とサイコロ計算ミスの原因になっている。
**実装ヒント:** `src/app/_components/CharacterForm.tsx` に「能力値を振る」ボタンを追加（"use client"のまま）。クリック時に各能力値ごとに `Math.floor(Math.random()*6)+1` を3回または2回合計し倍率をかけた値をstateにセットしてフォームの該当input値を更新。手動修正も引き続き可能なように上書き可能なテキスト入力のままにする。追加DBなし。
**コミット:** `feat: ability score auto-roll for character creation`

## [DONE] シナリオ複製（NPC・ハンドアウトひな型流用） — 優先度: 中
**対象:** KP
**概要:** 既存シナリオをタイトルだけ変えて複製し、紐づくNPC・ハンドアウトも一緒にコピーできる機能。既存の「キャラクター複製機能」と同様のアプローチをシナリオ側にも提供し、類似シナリオ作成や過去シナリオの改変版作成を高速化する。
**実装ヒント:** シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）のヘッダーに「複製」ボタンを持つ "use client" コンポーネントを新規作成（`src/app/_components/DuplicateButton.tsx` のシナリオ版として `ScenarioDuplicateButton.tsx` を新規作成）。`supabase.from("scenarios").select("*")` でシナリオ取得後、title に「（コピー）」を付加し status を `"planning"` にリセットして INSERT。続けて `npcs`（scenario_nameで紐づくもの）と `handouts`（scenario_idで紐づくもの）を新IDで一括INSERT。複製後は新シナリオの詳細ページへリダイレクト。追加DBなし。
**コミット:** `feat: scenario duplication with linked NPCs and handouts`

## [DONE] NPC複製機能 — 優先度: 低
**対象:** KP
**概要:** 既存NPC（特に能力値スタッツ込みの戦闘NPC）を1クリックで複製できる機能。同系統の雑魚NPCを複数体素早く用意したい場合の入力の手間を省く。
**実装ヒント:** NPC詳細ページ（`src/app/npcs/[id]/page.tsx`）のヘッダーに「複製」ボタンを持つ "use client" コンポーネント（`src/app/_components/NpcDuplicateButton.tsx`）を新規作成。`supabase.from("npcs").select("*")` で全カラム取得し、name に「（コピー）」を付加して `npcs` テーブルにINSERT（能力値・db等もそのまま複製）。複製後は新NPCの詳細ページへリダイレクト。追加DBなし。
**コミット:** `feat: duplicate NPC for quickly preparing similar enemies`

## [DONE] 職業技能テンプレート — 優先度: 中
**対象:** PL
**概要:** よく使う職業の初期技能セット（技能名と職業技能フラグ）をテンプレートとして保存し、新規キャラクター作成時に呼び出して技能を一括追加できる機能。毎回同じ職業の技能を手入力する手間を省く。
**実装ヒント:** Supabaseに `skill_templates` テーブルを追加（id, occupation_name, skill_name, is_occupation, created_at）。キャラクター作成フォーム（`src/app/_components/CharacterForm.tsx`）に「テンプレートから技能を読み込む」select要素を追加し、選択した occupation_name に紐づく `skill_templates` 行を技能リストstateへ一括追加。テンプレート自体の管理（作成・編集）は `src/app/skill-templates/page.tsx` を新規作成し簡易CRUDを提供。`src/lib/supabase.ts` に `SkillTemplate` 型を追加。
**コミット:** `feat: occupation skill template for quick character setup`

## [DONE] ボーナス/ペナルティダイス対応ダイスローラー — 優先度: 高
**対象:** PL / KP / 共通
**概要:** CoC7版の核心ルールであるボーナスダイス・ペナルティダイス（十の位d10を2つ振り有利/不利な方を採用）に現行のDiceRollerが未対応。判定種別（通常/ボーナス/ペナルティ）を選んでロールできるよう拡張する。
**実装ヒント:** `src/app/_components/DiceRoller.tsx` を拡張し、ロール前に「通常/ボーナス/ペナルティ」のトグルを追加。ボーナス時は十の位用d10を2つ振り小さい方を、ペナルティ時は大きい方を採用し、一の位d10と組み合わせて100面ロール値を算出（00+0は100として扱う）。`SpecialRoller.tsx` の通常ロールにも同トグルを追加可能であれば併せて対応。`dice_rolls` への保存は既存のまま（roll_valueは最終算出値）。追加DBなし。
**コミット:** `feat: bonus and penalty dice support for dice roller`

## [DONE] SANチェック（正気度ロール） — 優先度: 高
**対象:** PL / 共通
**概要:** キャラクターの現在SAN値に対して1d100判定を行い、失敗時に喪失SAN（例: 1d4/1d10など可変ダイス）を自動算出してsan_currentを即時更新できる専用ロールUI。既存のmadness_records・sessionsのsan_lossと連携し、CoCセッションの中核行為であるSANチェックを正式にサポートする。
**実装ヒント:** `src/app/_components/SanCheckRoller.tsx` を新規作成（"use client"）。props: characterId, sanCurrent, sanMax。失敗時喪失ダイス式（例: "1d4", "1d10"）を成功時/失敗時で入力できるフォームを用意し、1d100判定後に該当ダイスを振ってsan_current から減算、`supabase.from("characters").update({ san_current })` で即時反映。SAN0到達時や1回で5以上喪失時は狂気記録（`madness_records`）への追加導線を表示。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）のダイスローラーセクション付近に配置。追加DBなし（既存`characters`, `madness_records`を流用）。
**コミット:** `feat: sanity check roller with auto SAN deduction`

## [DONE] パーティービューからのダメージ/回復適用 — 優先度: 高
**対象:** KP / 共通
**概要:** 現在のパーティービュー（`scenario_participants`一覧）はHP/MP/SANの閲覧専用。KPが戦闘中にその場で参加者へダメージ/回復を入力し、各キャラクターのステータスへ即時反映できるようにする。戦闘管理ページ（ローカル状態のみ）と実データを橋渡しする。
**実装ヒント:** `src/app/scenarios/[id]/party/page.tsx` をServer Component + "use client" 子コンポーネント（`src/app/_components/PartyStatAdjuster.tsx`）構成に変更。既存の `QuickStatEditor.tsx` の増減ロジックを参考に、各参加者カードへHP/MP/SANの+/-入力欄とボタンを追加し `supabase.from("characters").update({ hp_current/mp_current/san_current }).eq("id", char.id)` で更新後に再取得（router.refresh()等）。追加DBなし。
**コミット:** `feat: apply damage and healing from party view`

## [DONE] セッションログ・メモ全文検索（グローバル検索拡張） — 優先度: 中
**対象:** PL / KP / 共通
**概要:** 現在のグローバル検索（`src/app/search/page.tsx`）はキャラクター名・NPC名・シナリオタイトルのみが対象で、セッションログの本文やクイックメモ・共有メモの内容は検索できない。これらの本文もキーワード検索対象に加え、過去の出来事やメモを素早く探せるようにする。
**実装ヒント:** `src/app/search/page.tsx` の `runSearch` 内に `supabase.from("sessions").select("*, characters(name)").ilike("summary", `%${q}%`)`、`supabase.from("quick_notes").select("*, characters(name)").ilike("content", `%${q}%`)`、`supabase.from("scenario_notes").select("*, scenarios(title)").ilike("content", `%${q}%`)` を `Promise.all` に追加。結果セクションに「セッションログ」「メモ」を追加し、各結果は紐づくキャラクター/シナリオの詳細ページへリンク。追加DBなし。
**コミット:** `feat: extend global search to session logs and notes content`

## [DONE] 武器ダメージロール（ダメージボーナス込み） — 優先度: 高
**対象:** PL / 共通
**概要:** インベントリの武器カードから命中判定だけでなく、ダメージダイス（例: "1d6+1D4"）をダメージボーナス(db)込みで解決できるロールボタンを追加する。現在は命中判定（戦闘ロール統合）のみで、命中後のダメージ算出をセッション中に手計算する必要がある。
**実装ヒント:** `src/lib/diceExpression.ts` を新規作成し、"1d6+1D4+2" のようなダイス式文字列をパースして合計値を返すユーティリティを実装（`character.str + character.siz` からdb文字列を解決するロジックも含める）。`src/app/characters/[id]/inventory/page.tsx` の武器カード（`item_type === "weapon"`）に「ダメージロール」ボタンを追加し、`damage` フィールドの式 + `db` を加算してロール結果を表示。結果は `supabase.from("dice_rolls").insert({ skill_name: `ダメージ:${item.name}`, ... })` でdice_historyに保存（既存`dice_rolls`テーブルを流用、追加DBなし）。
**コミット:** `feat: weapon damage roll with damage bonus calculation`

## [DONE] 所持金・出費管理 — 優先度: 中
**対象:** PL
**概要:** キャラクターの所持金を収入・出費のログとして記録し、現在の残高をキャラクター詳細ページで確認できる機能。セッション中の購入・報酬獲得を都度記録できる。
**実装ヒント:** Supabaseに `character_finances` テーブルを追加（id, character_id, amount: integer（収入は正・出費は負）, reason, recorded_at, created_at）。`src/app/characters/[id]/finances/page.tsx` を新規作成（一覧＋追加フォーム、`amount`の合計を残高として上部表示）。`src/lib/supabase.ts` に `CharacterFinance` 型を追加。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「所持金」リンクを追加。
**コミット:** `feat: character cash and expense tracking`

## [DONE] 次回セッション出欠管理 — 優先度: 中
**対象:** KP / 共通
**概要:** シナリオの次回セッション予定（`next_session_at`）に対し、参加者ごとの出欠（参加/欠席/未定）を記録・一覧できる機能。既存の参加者管理は参加可否を扱っておらず、KPが日程調整の状況を把握しづらい。
**実装ヒント:** `scenario_participants` テーブルに `attendance_status: "unconfirmed"|"attending"|"absent"` カラムをALTER TABLEで追加（デフォルト `"unconfirmed"`）。`src/lib/supabase.ts` の `ScenarioParticipant` 型に `attendance_status` を追加。`src/app/scenarios/[id]/participants/page.tsx` の各参加者行に出欠select要素を追加し `supabase.from("scenario_participants").update({ attendance_status }).eq("id", id)` で更新。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「参加○名/欠席○名/未定○名」のサマリーを表示。
**コミット:** `feat: attendance tracking for next scenario session`

## [DONE] NPC遭遇ログ（セッション×NPC紐付け） — 優先度: 低
**対象:** KP
**概要:** どのセッションでどのNPCが登場したかを記録し、NPC詳細ページから「過去の登場セッション」を、セッションログからは「登場NPC」を相互に確認できる機能。長期キャンペーンでのNPC再登場時の記憶補助になる。
**実装ヒント:** Supabaseに `session_npc_encounters` テーブルを追加（id, session_id, npc_id, created_at）。`src/app/characters/[id]/sessions/page.tsx` の各セッション項目に「登場NPC」選択・追加UIを実装（`supabase.from("npcs").select("id, name")` で候補取得）。`src/app/npcs/[id]/page.tsx` に紐づくセッション一覧（`session_npc_encounters` 経由で `sessions` をjoin取得）を表示するセクションを追加。`src/lib/supabase.ts` に `SessionNpcEncounter` 型を追加。
**コミット:** `feat: link NPCs to sessions for encounter history tracking`

## [DONE] 重傷判定サポート（メジャーウウンド） — 優先度: 高
**対象:** PL / 共通
**概要:** CoC7版の重要ルール「最大HPの半分以上を1度のダメージで失った場合は重傷となり、ショックで意識を失わないためCONロールが必要」を、HP減少操作時に自動検知して促すUI。現在のQuickStatEditor/PartyStatAdjusterはHP増減のみで重傷判定が未サポート。
**実装ヒント:** `src/app/_components/QuickStatEditor.tsx` の `adjust("hp", delta, max)` 内、delta が負かつ `Math.abs(delta) >= Math.ceil(hpMax / 2)` の場合に重傷警告バナーを表示し、`src/app/_components/SpecialRoller.tsx` のCONロール導線（技能値=con*5換算）へのショートカットボタンを出す。同様のチェックを `src/app/_components/PartyStatAdjuster.tsx`（`src/app/scenarios/[id]/party/page.tsx` から利用）にも追加。追加DBなし（既存`characters.con`を利用）。重傷フラグの永続化はせず、その場の警告表示のみ。
**コミット:** `feat: major wound detection on large HP loss`

## [DONE] クトゥルフ神話技能とSAN上限自動連動 — 優先度: 中
**対象:** PL
**概要:** CoC7版ルールでは「クトゥルフ神話」技能値が上がるとSAN最大値が `99 - クトゥルフ神話技能値` に減少する。現在SkillListで技能値を更新してもsan_maxへの連動がなく手動計算が必要。
**実装ヒント:** `src/app/_components/SkillList.tsx` の技能値更新処理で `skill_name === "クトゥルフ神話技能"` の更新時に、新しい current_value を基に `san_max = 99 - current_value` を算出し `supabase.from("characters").update({ san_max })` を同時実行。san_currentがsan_maxを超えていれば併せて切り下げる。キャラクター詳細ページのSANセクションに「神話技能連動済み」の小さな注記を表示。追加DBなし。
**コミット:** `feat: auto-adjust SAN max based on Cthulhu Mythos skill`

## [DONE] KPセッション準備チェックリスト — 優先度: 高
**対象:** KP
**概要:** PL向けの「セッション前チェックリスト」(`preflight/page.tsx`)のKP版。シナリオに紐づくNPC一覧・ハンドアウト準備状況・参加者の出欠（出欠管理実装後は`attendance_status`も含む）・次回セッション予定日を一画面でまとめて確認できるプリフライトUI。既存のシナリオ詳細ダッシュボードはナビゲーションハブだが、セッション当日の「準備漏れ確認」に特化したビューが存在しない。
**実装ヒント:** `src/app/scenarios/[id]/preflight/page.tsx` を新規作成（Server Component）。`supabase.from("scenarios").select("*, scenario_participants(*, characters(*)), handouts(*)").eq("id", id)` と `npcs` を `scenario_name` で取得し一括表示。ハンドアウトは`is_secret`件数・配布先未設定件数を警告表示。参加者は出欠ステータスごとに人数サマリー（出欠管理TODO実装後に連携）。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「セッション準備確認」リンクを追加。追加DBなし。
**コミット:** `feat: KP pre-session preparation checklist`

## [DONE] キャラクター技能目標トラッカー — 優先度: 中
**対象:** PL
**概要:** 技能に「目標値」を設定し、現在値からの達成率をプログレスバーで可視化できる機能。長期キャンペーンでの育成方針を明確化し、セッションごとの成長チェックを目標達成にフォーカスできるようにする。既存の `growth_history` とも連携して「あと何点で目標達成か」を表示できる。
**実装ヒント:** Supabaseに `skill_goals` テーブルを追加（id, character_id, skill_name, target_value, created_at）。`src/app/characters/[id]/skill-goals/page.tsx` を新規作成（Server Component + "use client" フォーム）。`supabase.from("character_skills").select("*")` で現在値を取得し、同じ `skill_name` の `skill_goals` 目標値と突合してプログレスバー（`width: calc(${current/target*100}%)`）を表示。目標達成済みスキルは緑ハイライト。`src/lib/supabase.ts` に `SkillGoal` 型を追加。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「技能目標」リンクを追加。
**コミット:** `feat: skill goal tracker with progress visualization`

## [DONE] KPシナリオ振り返りノート — 優先度: 中
**対象:** KP
**概要:** シナリオ完了後にKPが「何がうまくいったか」「PLの反応」「次回改善点」「バランス評価（難易度・恐怖演出）」を記録できる振り返り機能。既存の `gm_notes` はセッション前の計画用メモだが、こちらは実施後の記録に特化する。KPとして複数シナリオを経験するうちに自身の傾向と改善点を蓄積できる。
**実装ヒント:** Supabaseに `scenario_retrospectives` テーブルを追加（id, scenario_id, what_worked, what_to_improve, player_reactions, difficulty_rating: integer 1–5, horror_rating: integer 1–5, created_at）。`src/app/scenarios/[id]/retrospective/page.tsx` を新規作成（"use client"）。フォームは各フィールドを `<textarea>` で入力、難易度・恐怖演出は星選択UIで入力。`supabase.from("scenario_retrospectives").upsert(...)` でシナリオ1件につき1レコード管理（複数作成不可）。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「振り返りノート」リンクを追加。`src/lib/supabase.ts` に `ScenarioRetrospective` 型を追加。
**コミット:** `feat: KP scenario retrospective notes with rating`

## [DONE] 次回セッションカレンダービュー — 優先度: 低
**対象:** KP / 共通
**概要:** 複数シナリオの `next_session_at` を月単位カレンダー形式で一覧表示するページ。シナリオ一覧は都度フィルタが必要だが、カレンダー表示なら複数卓の日程重複が一目で確認できる。`next_session_at` は既実装済みのため追加DBなし。
**実装ヒント:** `src/app/calendar/page.tsx` を新規作成（"use client"）。`supabase.from("scenarios").select("id, title, status, next_session_at").not("next_session_at", "is", null)` で取得。useState で表示月（year/month）を管理し、前月/翌月ボタンで切り替え。該当月のカレンダーグリッド（7列×最大6行）を `Array.from` で生成し、各セルに一致するシナリオタイトルを表示してシナリオ詳細ページへリンク。`src/app/_components/NavBar.tsx` に「カレンダー」リンクを追加。追加DBなし。
**コミット:** `feat: session calendar view showing upcoming scenario dates`

## [DONE] シナリオ別SAN/HP喪失サマリー — 優先度: 中
**対象:** KP / 共通
**概要:** シナリオに参加したキャラクター全員のセッションログ（`sessions`テーブル）を集計し、「セッション別・参加者別のSAN/HP喪失量」と「シナリオ全体の合計喪失量」をKPが俯瞰できるサマリービュー。シナリオのバランス評価・難易度確認・KP振り返りの補助に使う。既存テーブルのみ使用で追加DBなし。
**実装ヒント:** `src/app/scenarios/[id]/damage-summary/page.tsx` を新規作成（Server Component）。`supabase.from("scenario_participants").select("*, characters(id, name, san_max, hp_max)")` で参加者を取得後、各 `character_id` ごとに `supabase.from("sessions").select("*").eq("character_id", id)` でセッションログを取得（`Promise.all`）。セッション番号×参加者のマトリクス表として表示し、各セルに san_loss/hp_loss を表示。行末に参加者合計、列末にセッション合計を集計。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「喪失サマリー」リンクを追加。
**コミット:** `feat: scenario SAN/HP loss summary matrix for KP review`

## [DONE] ここフォリアキャラコマJSON出力（VTT連携強化） — 優先度: 高
**対象:** PL / 共通
**概要:** ここフォリア（Cocofolia）で使えるキャラクターコマJSONを自動生成してダウンロードできる機能。現在のチャットパレットはBCDiceコマンドのみだが、コマデータ（ステータス表示・チャットパレット統合）を丸ごとインポートできるJSONにすることで、VTT上での手入力を完全に排除する。
**リサーチ根拠:** Charaenoの最大の差別化機能がここフォリアへのコマ出力で、PLが「Charaenoを使う理由はこれ一択」と評価するほど需要が高く、ユーザーの一般的なワークフローに組み込まれている。
**実装ヒント:** `src/app/characters/[id]/cocofolia-piece/page.tsx` を新規作成（"use client"）。`supabase.from("characters").select("*, character_skills(*)")` でデータ取得し、ここフォリアのpiece JSON形式（`name`, `initiative`, `width`, `height`, `color`, `text`（HP/MP/SAN表示文字列）, `commands`（BCDiceコマンド配列））を生成。`Blob` + `URL.createObjectURL` で `{キャラ名}_piece.json` としてダウンロード。既存のチャットパレット生成ロジック（`src/app/characters/[id]/chat-palette/page.tsx`）の `commands` 配列を流用。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「コマ出力」リンクを追加。
**コミット:** `feat: Cocofolia character piece JSON export for VTT integration`

## [DONE] 探索者公開プロフィールページ（URLシェア） — 優先度: 高
**対象:** PL / 共通
**概要:** キャラクターに公開用スラッグURLを発行し、ログイン不要で誰でも閲覧できる公開プロフィールページを提供する機能。セッション募集時のキャラ紹介・卓外での共有・PLへのキャラ確認依頼に使う。現在のプロフィールカードは画像ダウンロードのみで、リンク共有には対応していない。
**リサーチ根拠:** CharaXiv・Charaeno・きゃらはぶいずれも「URLで共有できる公開キャラクターページ」をコアバリューとして提供しており、TRPG界隈でキャラシートをリンク共有するワークフローが定着していることが確認された。
**実装ヒント:** `characters` テーブルに `is_public: boolean DEFAULT false` と `public_slug: text UNIQUE` カラムをALTER TABLEで追加。`src/app/public/[slug]/page.tsx` を新規作成（Server Component、認証不要）。`supabase.from("characters").select("*, character_skills(*)").eq("public_slug", slug).eq("is_public", true)` でデータ取得し、名前・職業・能力値・技能・背景を表示。`src/app/_components/PublicShareToggle.tsx` を "use client" で作成し、スラッグ自動生成（`crypto.randomUUID().slice(0,8)`）とコピーボタンを実装。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）のヘッダーに「公開設定」ボタンを追加。`src/lib/supabase.ts` の `Character` 型に `is_public`・`public_slug` を追加。
**コミット:** `feat: public character profile page with shareable URL`

## [DONE] キャラクター相関図（グラフ可視化） — 優先度: 中
**対象:** PL
**概要:** 既存の `character_relations` データを元に、中心キャラクターと関係人物をSVGグラフで可視化するページ。テキスト一覧では把握しにくい複数の関係性の全体像を視覚的に確認できる。追加DBなし（既存 `character_relations` テーブルを流用）。
**リサーチ根拠:** きゃらはぶ・CharaXivの「キャラクター相関図」機能はSNS拡散・セッション自己紹介での利用が多く、単なる関係リストよりも大幅にエンゲージメントが高いことが複数のレビューで確認された。
**実装ヒント:** `src/app/characters/[id]/relation-graph/page.tsx` を新規作成（"use client"）。`supabase.from("character_relations").select("*").eq("character_id", id)` で関係データ取得。SVG要素で中心ノード（現キャラ）を中央に配置し、関係先ノードを円周上に等間隔配置、線でつなぐ（三角関数で座標計算）。ノードの色は `relation_type` で分岐（友人=緑・ライバル=橙・恩人=青・要注意=赤・その他=灰）。エッジに `relation_type` ラベルを表示。`src/app/characters/[id]/relations/page.tsx` のヘッダーに「相関図を見る」リンクを追加。
**コミット:** `feat: character relation graph visualization with SVG`

## [DONE] シナリオエリア・地点メモ（KP用） — 優先度: 中
**対象:** KP
**概要:** シナリオに紐づいた地点/エリア単位のメモ機能。現在の `gm_notes` は単一テキストだが、「図書館」「古い屋敷」「港」など場所ごとに説明・GMメモを独立して管理できる構造化ノートを提供する。長期キャンペーンや複数ロケーションシナリオでの準備効率を上げる。
**リサーチ根拠:** PrismScroll CthulhuのJournal機能（NPC・ロケーション別の詳細ノート）がKP向け機能として高評価を受けており、「場所ごとの情報を整理できる仕組み」がKPユーザーの主要要望として海外レビューにも多く挙がっていた。
**実装ヒント:** Supabaseに `scenario_areas` テーブルを追加（id, scenario_id, name, description, gm_notes, order_index: integer, created_at）。`src/app/scenarios/[id]/areas/page.tsx` を新規作成（Server Component + "use client" フォーム）。一覧は `order_index` 昇順で表示し、▲▼ボタンで並び替え（`supabase.from("scenario_areas").update({order_index})`）。各エリアカードは `<details>` 要素でgm_notesを折りたたみ表示。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「エリアメモ」リンクを追加。`src/lib/supabase.ts` に `ScenarioArea` 型を追加。
**コミット:** `feat: scenario area notes for structured KP location management`

## [DONE] セッション日程調整（簡易投票） — 優先度: 低
**対象:** KP / 共通
**概要:** KPが候補日程を複数提示し、参加者が○/×で回答できる簡易スケジュール調整機能。現在は `next_session_at` をKPが単独で設定するだけで、日程候補に対する参加者の可否投票ができない。LINEや外部ツールへの依存をなくし、ポータル内で日程決定まで完結できるようにする。
**リサーチ根拠:** TRPGセッション日程調整の外部ツール（LINEアンケート・伸ばせるくん等）への依存はTRPGユーザーの長年の課題として繰り返し言及されており、複数のTRPGコミュニティ記事で「卓内ツールに日程調整があれば便利」という声が確認された。
**実装ヒント:** Supabaseに `schedule_proposals` テーブル（id, scenario_id, proposed_at: timestamptz, created_at）と `schedule_votes` テーブル（id, proposal_id, voter_name, is_available: boolean, created_at）を追加。`src/app/scenarios/[id]/schedule/page.tsx` を "use client" で新規作成。KPは候補日時を複数追加でき、参加者は voter_name を入力して各日程に○/×を投票（upsertで上書き可能）。集計結果は「○N人/×M人」でリアルタイム表示。最多○の日程に「確定」ボタンを配置し、クリックで `scenarios.next_session_at` を更新。`src/lib/supabase.ts` に `ScheduleProposal`, `ScheduleVote` 型を追加。シナリオ詳細ダッシュボードに「日程調整」リンクを追加。
**コミット:** `feat: session scheduling poll for party date coordination`

## [DONE] ホームダッシュボード強化（ピン留め・次回予定・進行中シナリオ統合） — 優先度: 高
**対象:** PL / KP / 共通
**概要:** 現在のトップページはタイルが3つ（うち2つが「準備中」）と最近のキャラクター一覧のみ。ピン留めキャラクター・直近7日以内の次回セッション予定・進行中シナリオを並べた実用的なダッシュボードへ強化する。NavBarの全主要ページへのクイックリンクも整備。
**実装ヒント:** `src/app/page.tsx` を拡張（Server Component のまま）。`supabase.from("characters").select("*").eq("is_pinned", true)` でピン留めキャラ取得。`supabase.from("scenarios").select("*").eq("status", "ongoing")` で進行中シナリオ取得。`next_session_at` が直近7日のシナリオを「今週の予定」セクションで強調表示。タイルは `/scenarios`, `/npcs`, `/search`, `/calendar` も追加し "available: true" に設定。追加DBなし。
**コミット:** `feat: enrich home dashboard with pinned chars, upcoming sessions, and active scenarios`

## [DONE] 探索者ポートレートファイルアップロード（Supabase Storage連携） — 優先度: 高
**対象:** PL / 共通
**概要:** キャラクターに `portrait_url` フィールドはあるが、現在はURL手入力のみ対応。Supabase StorageにPNG/JPGをアップロードし公開URLを自動取得してキャラクターに紐づけられる専用UIを追加する。立ち絵・アイコン設定をポータル内で完結させる。
**実装ヒント:** `src/app/_components/PortraitUploader.tsx` を "use client" で新規作成。`<input type="file" accept="image/*">` で画像を受け取り `supabase.storage.from("portraits").upload(`{characterId}/{uuid}`, file)` でアップロード後、`supabase.storage.from("portraits").getPublicUrl(path)` で公開URLを取得し `supabase.from("characters").update({ portrait_url })` で更新。Supabase Storageに `portraits` バケットを public で作成する必要あり。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）のポートレート欄と、編集ページ（`src/app/characters/[id]/edit/page.tsx`）に配置。`src/app/_components/PortraitImage.tsx` は既存のため流用可能。
**コミット:** `feat: portrait image upload to Supabase Storage`

## [TODO] キャラクター参加シナリオ履歴 — 優先度: 中
**対象:** PL / 共通
**概要:** キャラクターが参加した全シナリオを時系列で一覧表示するページ。現在 `scenario_participants` テーブルでキャラ×シナリオが紐づいているが、キャラ側から参加履歴を辿るページが存在しない。長期プレイヤーが「このキャラでどのシナリオを遊んだか」を振り返るのに使う。
**実装ヒント:** `src/app/characters/[id]/scenario-history/page.tsx` を新規作成（Server Component）。`supabase.from("scenario_participants").select("*, scenarios(*)").eq("character_id", id).order("created_at", {ascending: false})` で参加シナリオを取得し、シナリオタイトル・ステータス・next_session_at を一覧表示。各シナリオは `/scenarios/[id]` へリンク。追加DBなし（既存 `scenario_participants`, `scenarios` を流用）。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「参加シナリオ」リンクを追加。
**コミット:** `feat: character scenario participation history page`

## [TODO] 呪文カタログ（CoC7版マスターリスト参照・キャラへ一括追加） — 優先度: 中
**対象:** PL / 共通
**概要:** CoC7版に掲載される主要呪文（接触・召喚・変容・防護系など）を静的カタログとして参照できるページ。各呪文のMP消費・SAN消費・効果概要を確認しながら、ボタン1クリックでキャラクターの呪文リストへ追加できる。毎回呪文名やコストを手入力する手間を省く。
**実装ヒント:** `src/app/spells/page.tsx` を新規作成（"use client"）。CoC7版の代表的呪文データ（呪文名・mp_cost・san_cost・effect）を `src/lib/spellCatalog.ts` に静的配列で定義。`?characterId=` クエリパラメータを受け取り、呪文カードの「追加」ボタンで `supabase.from("character_spells").insert(...)` を実行し指定キャラへ登録。キャラクター詳細ページの呪文セクション（`src/app/characters/[id]/spells/page.tsx`）に「カタログから追加」リンクを追加。`src/app/_components/NavBar.tsx` には追加しなくてよい（キャラ詳細からのみアクセス）。追加DBなし。
**コミット:** `feat: CoC7 spell catalog with one-click add to character`

## [TODO] KPセッションアジェンダ（場面別プランナー） — 優先度: 中
**対象:** KP
**概要:** シナリオの各セッションを「場面1: 導入」「場面2: 調査」のように場面単位で構造化できるプランナー。既存の `gm_notes`（単一テキスト）や `scenario_notes`（共有パーティーノート）とは異なり、KP専用の事前計画ノートとして機能する。セッション当日に「次の場面」をチェックしながら進行できる。
**実装ヒント:** Supabaseに `scenario_scenes` テーブルを追加（id, scenario_id, scene_order: integer, title, notes, is_done: boolean DEFAULT false, created_at）。`src/app/scenarios/[id]/agenda/page.tsx` を "use client" で新規作成。場面一覧は `scene_order` 昇順で表示し、各場面に「完了」トグル（`supabase.from("scenario_scenes").update({is_done})`）と削除ボタンを配置。▲▼ボタンで並び替え（`scene_order` を swap）。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「アジェンダ」リンクを追加。`src/lib/supabase.ts` に `ScenarioScene` 型を追加。
**コミット:** `feat: KP session agenda with scene-by-scene planner`
