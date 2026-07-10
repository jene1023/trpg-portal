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

## [DONE] キャラクター参加シナリオ履歴 — 優先度: 中
**対象:** PL / 共通
**概要:** キャラクターが参加した全シナリオを時系列で一覧表示するページ。現在 `scenario_participants` テーブルでキャラ×シナリオが紐づいているが、キャラ側から参加履歴を辿るページが存在しない。長期プレイヤーが「このキャラでどのシナリオを遊んだか」を振り返るのに使う。
**実装ヒント:** `src/app/characters/[id]/scenario-history/page.tsx` を新規作成（Server Component）。`supabase.from("scenario_participants").select("*, scenarios(*)").eq("character_id", id).order("created_at", {ascending: false})` で参加シナリオを取得し、シナリオタイトル・ステータス・next_session_at を一覧表示。各シナリオは `/scenarios/[id]` へリンク。追加DBなし（既存 `scenario_participants`, `scenarios` を流用）。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「参加シナリオ」リンクを追加。
**コミット:** `feat: character scenario participation history page`

## [DONE] 呪文カタログ（CoC7版マスターリスト参照・キャラへ一括追加） — 優先度: 中
**対象:** PL / 共通
**概要:** CoC7版に掲載される主要呪文（接触・召喚・変容・防護系など）を静的カタログとして参照できるページ。各呪文のMP消費・SAN消費・効果概要を確認しながら、ボタン1クリックでキャラクターの呪文リストへ追加できる。毎回呪文名やコストを手入力する手間を省く。
**実装ヒント:** `src/app/spells/page.tsx` を新規作成（"use client"）。CoC7版の代表的呪文データ（呪文名・mp_cost・san_cost・effect）を `src/lib/spellCatalog.ts` に静的配列で定義。`?characterId=` クエリパラメータを受け取り、呪文カードの「追加」ボタンで `supabase.from("character_spells").insert(...)` を実行し指定キャラへ登録。キャラクター詳細ページの呪文セクション（`src/app/characters/[id]/spells/page.tsx`）に「カタログから追加」リンクを追加。`src/app/_components/NavBar.tsx` には追加しなくてよい（キャラ詳細からのみアクセス）。追加DBなし。
**コミット:** `feat: CoC7 spell catalog with one-click add to character`

## [DONE] CoC7版職業技能ポイント計算UI — 優先度: 高
**対象:** PL
**概要:** キャラクター作成/編集時に職業を選ぶと職業技能ポイント（例: 探偵=EDU×4+INT×2）と趣味技能ポイント（INT×2）を自動計算してUI上に表示し、技能に割り振りながら残りポイントをリアルタイム確認できる機能。能力値オートロール（DONE済み）の次のステップとして、CoCキャラ作成で最も手間のかかるフローを補完する。
**実装ヒント:** `src/lib/occupationData.ts` を新規作成し、職業名とポイント計算式（`edu * 4`, `edu * 2 + dex * 2` 等）を静的配列で定義。`src/app/characters/[id]/skill-builder/page.tsx` を "use client" で新規作成し、職業select → ポイント上限表示 → 各技能の `current_value - base_value` 差分を合計してリアルタイム残ポイントを表示。`supabase.from("character_skills").select("*").eq("character_id", id)` で技能を取得し、変更後は `supabase.from("character_skills").update({ current_value }).eq("id", skillId)` で保存。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「技能ポイント割り振り」リンクを追加。追加DBなし。
**コミット:** `feat: occupation skill point calculator for CoC character creation`

## [DONE] 神話的クリーチャー管理（KP向け） — 優先度: 中
**対象:** KP
**概要:** CoC特有の神話的クリーチャー（深きものども・神格等）をNPCとは別のテーブルで管理する機能。SAN喪失式・戦闘能力・呪文使用可否・神話的背景を記録し、シナリオに紐づけて参照できる。NPCは人間型に適した構造のため、異形の存在向けに専用の管理画面を提供する。
**実装ヒント:** Supabaseに `creatures` テーブルを追加（id, scenario_id: nullable, name, mythos_background: text | null, san_loss_success: string | null, san_loss_failure: string | null, str: int | null, con: int | null, pow: int | null, dex: int | null, siz: int | null, hp: int | null, mp: int | null, armor: string | null, attacks: text | null, can_use_spells: boolean DEFAULT false, notes: text | null, created_at）。`src/app/creatures/page.tsx`（一覧・シナリオフィルタ）と `src/app/creatures/new/page.tsx`（作成フォーム）、`src/app/creatures/[id]/page.tsx`（StatBlock＋SAN喪失式表示）を新規作成。`src/app/_components/NavBar.tsx` に「クリーチャー」リンクを追加。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）にシナリオ別クリーチャー数バッジを追加。`src/lib/supabase.ts` に `Creature` 型を追加。
**コミット:** `feat: mythical creature management for KP scenarios`

## [DONE] 場面BGM・演出キューリスト（KP向け） — 優先度: 中
**対象:** KP
**概要:** シナリオに紐づいた場面別のBGMリンク（YouTube/Spotify等）と演出メモ（照明・SE・演出タイミング）をリスト管理できる機能。既存のシナリオエリアメモ（`scenario_areas`/DONE済み）はロケーション情報向けだが、こちらはセッション当日のタイムライン的な演出指示書として機能する。
**実装ヒント:** Supabaseに `bgm_cues` テーブルを追加（id, scenario_id, order_index: integer, label: text（例: "導入シーン"）, bgm_url: text | null, mood: text | null, direction_notes: text | null, created_at）。`src/app/scenarios/[id]/bgm/page.tsx` を "use client" で新規作成（一覧＋追加フォーム、▲▼ボタンで `order_index` を swap して並び替え）。`bgm_url` があれば `<a href={bgm_url} target="_blank">` でリンク表示。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「BGM・演出」リンクを追加。`src/lib/supabase.ts` に `BgmCue` 型を追加。
**コミット:** `feat: scenario BGM and direction cue list for KP`

## [DONE] キャラクター最終章ページ（死亡/退場記念） — 優先度: 低
**対象:** PL / 共通
**概要:** `status === "dead" | "retired"` のキャラクターに向けた「最後のシーン」と「PLからのひとこと」を記録できる追悼ページ。長期プレイでキャラが退場した際に最終セッション・死因/退場理由・思い出のエピソードをまとめて保存でき、キャラクター一覧でも追悼バッジとして表示される。
**実装ヒント:** `characters` テーブルに `farewell_scene: text | null`（最後のシーン説明）と `farewell_message: text | null`（PLからの一言）カラムをALTER TABLEで追加。`src/app/characters/[id]/farewell/page.tsx` を "use client" で新規作成（フォーム＋表示の切り替え、`supabase.from("characters").update({ farewell_scene, farewell_message }).eq("id", id)` で保存）。`src/lib/supabase.ts` の `Character` 型に両カラムを追加。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）で `status !== "alive"` の場合のみ「最終章を記録」リンクを表示。`src/app/characters/page.tsx` の退場済みキャラカードに追悼バッジ（黒帯アイコン等）を表示。追加DBカラムのみ、新テーブルなし。
**コミット:** `feat: character farewell page for deceased or retired characters`

## [DONE] KPセッションアジェンダ（場面別プランナー） — 優先度: 中
**対象:** KP
**概要:** シナリオの各セッションを「場面1: 導入」「場面2: 調査」のように場面単位で構造化できるプランナー。既存の `gm_notes`（単一テキスト）や `scenario_notes`（共有パーティーノート）とは異なり、KP専用の事前計画ノートとして機能する。セッション当日に「次の場面」をチェックしながら進行できる。
**実装ヒント:** Supabaseに `scenario_scenes` テーブルを追加（id, scenario_id, scene_order: integer, title, notes, is_done: boolean DEFAULT false, created_at）。`src/app/scenarios/[id]/agenda/page.tsx` を "use client" で新規作成。場面一覧は `scene_order` 昇順で表示し、各場面に「完了」トグル（`supabase.from("scenario_scenes").update({is_done})`）と削除ボタンを配置。▲▼ボタンで並び替え（`scene_order` を swap）。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「アジェンダ」リンクを追加。`src/lib/supabase.ts` に `ScenarioScene` 型を追加。
**コミット:** `feat: KP session agenda with scene-by-scene planner`

## [DONE] 技能成長判定ロールUI — 優先度: 高
**対象:** PL
**概要:** `growth_checked: true` の技能に対してセッション後に成長判定ロール（1d100 > 現在値なら1d10加算）を実行し、成功時に技能値を自動更新して成長履歴へ登録できるUI。現在、成長チェックフラグ設定（`SkillList.tsx`）と成長履歴記録（`growth_history`テーブル）の間のフローが完全に欠落している。
**実装ヒント:** `src/app/characters/[id]/growth-roll/page.tsx` を "use client" で新規作成。`supabase.from("character_skills").select("*").eq("character_id", id).eq("growth_checked", true)` で対象技能を取得し一覧表示。各技能に「成長ロール」ボタンを配置し、`Math.floor(Math.random()*100)+1 > current_value` の場合に `Math.floor(Math.random()*10)+1` を加算して `supabase.from("character_skills").update({current_value, growth_checked: false}).eq("id", skillId)` で更新。同時に `supabase.from("growth_history").insert({skill_name, old_value, new_value, session_label})` で成長ログを記録。追加DBなし（既存 `character_skills`, `growth_history` を流用）。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「成長判定」リンクを追加（growth_checked な技能がある場合にバッジ表示）。
**コミット:** `feat: skill growth roll UI to resolve checked skills after session`

## [DONE] PLシナリオ感想投票（4軸評価） — 優先度: 中
**対象:** PL / 共通
**概要:** シナリオ終了後にPLが「楽しさ・恐怖演出・謎解き・キャラクター活躍度」の4軸を1〜5で匿名評価できる投票機能。既存の `scenario_retrospectives`（KP振り返りノート）はKP視点のみで、参加者からのフィードバックを収集できない。平均スコアをシナリオ詳細ダッシュボードに表示し、KPの改善サイクルを補完する。
**実装ヒント:** Supabaseに `scenario_player_ratings` テーブルを追加（id, scenario_id, voter_name, fun_rating: integer 1-5, horror_rating: integer 1-5, mystery_rating: integer 1-5, character_rating: integer 1-5, comment: text | null, created_at）。`src/app/scenarios/[id]/ratings/page.tsx` を "use client" で新規作成（投票フォーム＋集計結果表示）。voter_name が同一の場合は upsert で上書き可能。集計は `fun_rating` 等の平均を算出してスター表示（CSS で `★` を rating 数だけ塗る）。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に平均スコアサマリーと「感想を投票する」リンクを追加。`src/lib/supabase.ts` に `ScenarioPlayerRating` 型を追加。
**コミット:** `feat: player scenario rating with 4-axis feedback`

## [DONE] 神話生物カタログ（静的参照・クリーチャー一括追加） — 優先度: 中
**対象:** KP
**概要:** CoC7版代表的神話生物（ディープワン・ショゴス・ハウンド・バイアクヘー等）を静的カタログとして参照でき、ボタン1クリックでシナリオのクリーチャーとして追加できる機能。既存の神話的クリーチャー管理（`creatures`テーブル/DONE）は自作クリーチャー向けで、定番モンスターを都度手入力する手間がある。呪文カタログ（DONE）・職業技能テンプレート（DONE）と同じパターン。
**実装ヒント:** `src/lib/creatureCatalog.ts` を新規作成し、神話生物データ（name, san_loss_success, san_loss_failure, str, con, pow, dex, siz, hp, mp, armor, attacks, can_use_spells, notes）を静的配列で定義（15〜20種程度）。`src/app/creatures/catalog/page.tsx` を "use client" で新規作成。`?scenarioId=` クエリパラメータを受け取り、カタログカードの「追加」ボタンで `supabase.from("creatures").insert({...entry, scenario_id})` を実行。クリーチャー一覧ページ（`src/app/creatures/page.tsx`）に「カタログから追加」リンクを追加。追加DBなし（既存 `creatures` テーブルを流用）。
**コミット:** `feat: creature catalog with one-click add from CoC7 bestiary`

## [DONE] シナリオ真相タイムライン（KP用事件経緯メモ） — 優先度: 低
**対象:** KP
**概要:** シナリオの「真相側の時系列」（いつ・何が起きたか・登場人物の行動経緯）をKPが構造化して記録できるページ。既存の `scenario_areas`（場所メモ）・`bgm_cues`（演出キュー）・`gm_notes`（単一メモ）とは異なり、謎の根拠となる過去の事件経緯を時間軸で整理するKP専用ノート。長編や複雑なシナリオでKPが真相を忘れずセッションを進行できるようにする。
**実装ヒント:** Supabaseに `scenario_timeline_events` テーブルを追加（id, scenario_id, event_date: text（「1920年3月15日」等の任意書式）, event_order: integer, title, description: text | null, is_revealed: boolean DEFAULT false, created_at）。`src/app/scenarios/[id]/truth-timeline/page.tsx` を "use client" で新規作成。`event_order` 昇順で縦線タイムライン（CSS `border-left`）表示。`is_revealed` トグルで「PLに明かされた真相」をマーク。▲▼で `event_order` を swap して並び替え。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「真相タイムライン」リンクを追加。`src/lib/supabase.ts` に `ScenarioTimelineEvent` 型を追加。
**コミット:** `feat: scenario truth timeline for KP to organize mystery backstory`

## [DONE] キャラクター能力値成長記録（EDU成長チェック） — 優先度: 高
**対象:** PL
**概要:** CoC7版ルールでEDU成長チェック（1d100 > EDU なら1d10加算）が実施できるUI。技能成長判定ロール（growth-roll/DONE）と同様の仕組みを能力値へ拡張し、成功時に能力値を自動更新して成長履歴を記録する。現在は技能成長のみ対応で能力値成長が完全に欠落している。
**実装ヒント:** Supabaseに `character_ability_growths` テーブルを追加（id, character_id, ability_name: text, old_value: integer, new_value: integer, grown_at: timestamptz | null, created_at）。`src/app/characters/[id]/ability-growth/page.tsx` を "use client" で新規作成。対象能力値（主にEDU、任意でPOWも選択可）をselectで選び「成長チェック」ボタンで `Math.floor(Math.random()*100)+1 > currentValue` を判定。成功時に `Math.floor(Math.random()*10)+1` を加算し `supabase.from("characters").update({edu: newValue})` で更新、同時に `character_ability_growths` へ挿入。過去の成長ログを一覧表示。`src/lib/supabase.ts` に `CharacterAbilityGrowth` 型を追加。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「能力値成長」リンクを追加。
**コミット:** `feat: ability score growth check for EDU and other stats`

## [DONE] キャラクター比較ビュー（能力値・技能の横並び比較） — 優先度: 中
**対象:** PL / KP / 共通
**概要:** 複数のキャラクターの能力値・代表技能を横並びで比較できるページ。パーティー編成時の役割分担確認・NPC vs PC の能力差把握・複数キャラを持つPLの使い分け判断に使う。現在は各キャラ詳細を個別に開かなければ比較できない。
**実装ヒント:** `src/app/characters/compare/page.tsx` を "use client" で新規作成。`?ids=id1,id2,id3` クエリパラメータで最大4キャラ指定し `supabase.from("characters").select("*, character_skills(*)").in("id", ids)` で一括取得。STR/CON/POW/DEX/APP/SIZ/INT/EDU/HP/MP/SANの能力値を行、キャラ名を列にした表形式で表示。各セルは最高値を緑ハイライト。技能は「全キャラが共通で持つ技能」のみ比較行として追加表示。キャラクター一覧ページ（`src/app/characters/page.tsx`）に各キャラカードの「比較に追加」ボタン（チェックボックス）を追加し、選択後「比較する」ボタンで `/characters/compare?ids=...` に遷移。追加DBなし。
**コミット:** `feat: character comparison view for side-by-side stat and skill analysis`

## [DONE] NPC陣営・組織タグ管理 — 優先度: 中
**対象:** KP
**概要:** NPCに「陣営/組織名」タグを付与してフィルタ・グループ表示できる機能。現在NPC一覧は `scenario_name` 絞り込みのみで、「敵対/中立/友好」や「アーカムPD/カルト教団/一般市民」などの組織別整理ができない。長期キャンペーンや多数NPC登場シナリオでの情報整理を改善する。
**実装ヒント:** `npcs` テーブルに `faction: text | null` カラムをALTER TABLEで追加。`src/lib/supabase.ts` の `Npc` 型に `faction: string | null` を追加。`src/app/npcs/page.tsx` の一覧フィルタに `faction` の select 要素を追加し、クライアントサイドでフィルタ（`.filter(n => !factionFilter || n.faction === factionFilter)`）。`src/app/npcs/new/page.tsx` と `src/app/npcs/[id]/page.tsx` のフォームに `faction` 入力欄を追加（`src/app/_components/NpcForm.tsx` を更新）。フィルタのオプション候補は既存NPCから動的取得（`.map(n => n.faction).filter(Boolean).unique()`）。
**コミット:** `feat: NPC faction/organization tag for group filtering`

## [DONE] Supabase Realtimeセッション中HP/SAN同期 — 優先度: 高
**対象:** PL / KP / 共通
**概要:** セッション中にQuickStatEditorやPartyStatAdjusterでHP/MP/SANを変更すると、同じキャラクターを開いている全クライアントに即時反映されるリアルタイム同期機能。現在はrouter.refresh()による手動更新のみで、KPとPLが別々の画面で同じデータを操作すると表示がずれる。
**実装ヒント:** `src/app/_components/QuickStatEditor.tsx` と `src/app/scenarios/[id]/party/page.tsx`（`PartyStatAdjuster.tsx`）に `supabase.channel('character-stats').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'characters' }, payload => { /* stateを更新 */ }).subscribe()` を追加し、DB更新と同時にリアルタイムイベントを受信してUIを再描画。`src/app/characters/[id]/quick/page.tsx`（モバイルクイックダッシュボード）でも同様に subscribe してHP/MP/SANを自動更新。追加DBなし。
**コミット:** `feat: realtime HP/SAN sync across clients via Supabase Realtime`

## [DONE] セッション終了ウィザード（一括処理フロー） — 優先度: 高
**対象:** PL / 共通
**概要:** セッション終了時に「①セッションログ記入 → ②成長チェック技能の成長判定ロール → ③狂気状態の更新 → ④次回セッション予定の設定」を4ステップで順番にガイドするウィザードUI。各機能は個別ページとして実装済みだが横断フローが存在せず、セッション後の処理を忘れがちな課題を解消する。
**実装ヒント:** `src/app/characters/[id]/session-end/page.tsx` を "use client" で新規作成。`useState` でステップ番号（0〜3）を管理し、「次へ」ボタンでステップを進める。Step0: `supabase.from("sessions").insert(...)` でセッションログ入力フォーム（SessionLogFormを流用）。Step1: `growth_checked: true` の技能一覧と成長ロールボタン（growth-roll/page.txの入力ロジックを再利用）。Step2: アクティブな狂気記録一覧と回復/継続トグル（madness/page.tsxから流用）。Step3: シナリオ一覧selectで `next_session_at` を設定。追加DBなし（既存テーブルのみ利用）。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「セッション終了処理」ボタンを追加。
**コミット:** `feat: post-session end wizard guiding log, growth roll, madness, and next date`

## [DONE] キャラクター口調・ロールプレイメモ — 優先度: 中
**対象:** PL
**概要:** キャラクターの一人称・語尾・口癖・話し方の特徴をセッション中に素早く参照できる専用フィールド。現在は `background` や `notes` に混在させるしかなく、ロールプレイ中に探しにくい。モバイルクイックダッシュボードにも表示して口調ブレを防ぐ。
**実装ヒント:** `characters` テーブルに `speech_style: text | null`（例: "一人称: 俺。語尾に「だぜ」が多い。仲間には砕けた口調」）カラムをALTER TABLEで追加。`src/lib/supabase.ts` の `Character` 型に `speech_style: string | null` を追加。`src/app/_components/CharacterForm.tsx` と `src/app/characters/[id]/edit/page.tsx` に `<textarea>` フィールドを追加。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）の基本情報セクションに表示。`src/app/characters/[id]/quick/page.tsx`（モバイルクイックダッシュボード）にも折りたたみ表示で追加し、セッション中の口調確認に使えるようにする。
**コミット:** `feat: character speech style memo for roleplay reference`

## [DONE] 卓URLリンク管理（VTT・通話ツール連携） — 優先度: 中
**対象:** KP / 共通
**概要:** Roll20・ユドナリウム・ここフォリア・Discord・Zoomなど、シナリオで使うVTTや通話ツールのURLをシナリオに紐づけて保存し、セッション開始時にワンクリックで各ツールに飛べる機能。現在KPはURLをLINEやDiscordで毎回共有しなければならず、ポータル内で完結しない。
**実装ヒント:** `scenarios` テーブルに `vtt_url: text | null`（卓URL）と `vtt_type: text | null`（"ユドナリウム"|"ここフォリア"|"Roll20"|"Discord"|"Zoom"|"その他"）カラムをALTER TABLEで追加。`src/lib/supabase.ts` の `Scenario` 型に両カラムを追加。`src/app/_components/ScenarioForm.tsx` に `vtt_type` select と `vtt_url` 入力欄を追加。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「卓に入る」ボタンを表示（`<a href={vtt_url} target="_blank" rel="noopener">`）。セッション準備チェックリスト（`src/app/scenarios/[id]/preflight/page.tsx`）にも卓URLの設定状態を確認項目として追加。
**コミット:** `feat: VTT and call tool URL management per scenario`

## [DONE] キャラクターお気に入り技能ピン留め（クイックロール強化）— 優先度: 高
**対象:** PL / 共通
**概要:** 「回避」「目星」「聞き耳」など頻繁に使う技能を3〜5件ピン留めし、モバイルクイックダッシュボードとDiceRollerの先頭に固定表示してセッション中に即座にロールできるようにする。
**実装ヒント:** `character_skills` テーブルに `is_favorite: boolean DEFAULT false` カラムをALTER TABLEで追加。`src/lib/supabase.ts` の `CharacterSkill` 型に `is_favorite: boolean` を追加。`src/app/_components/SkillList.tsx` の各技能行にスター/ピンアイコンを追加し `supabase.from("character_skills").update({ is_favorite }).eq("id", id)` でトグル。`src/app/_components/DiceRoller.tsx` にお気に入り技能を先頭グループとして表示。`src/app/characters/[id]/quick/page.tsx`（モバイルクイックダッシュボード）にお気に入り技能ショートカットセクションを追加。追加DBカラムのみ、新テーブルなし。
**コミット:** `feat: favorite skill pinning for quick roll access during sessions`

## [DONE] パーティー一括SANチェック（恐怖イベント対応）— 優先度: 高
**対象:** KP / 共通
**概要:** 神話生物遭遇時など全員が同じSAN喪失判定を行う場面で、KPがシナリオのパーティービューから「一括SANチェック」をトリガーし、参加者全員のSAN値を自動更新できるUI。既存のSanCheckRollerとPartyStatAdjusterの組み合わせを強化する。
**実装ヒント:** `src/app/scenarios/[id]/party/page.tsx` に「一括SANチェック」ボタンを持つ "use client" セクションを追加。成功時喪失ダイス式と失敗時喪失ダイス式を入力し、ボタン押下で全参加者ごとに 1d100判定（`Math.floor(Math.random()*100)+1`）を実行してsanの現在値を自動更新。各キャラの結果（成功/失敗・喪失量）を結果テーブルで表示し `supabase.from("characters").update({ san_current }).eq("id", id)` で一括反映。SAN喪失5以上のキャラクターには狂気記録（`madness_records`）追加導線を表示。追加DBなし（既存 `scenario_participants`, `characters` を流用）。
**コミット:** `feat: party-wide SAN check trigger from scenario party view`

## [DONE] プレイヤー情報管理（卓メンバーメモ）— 優先度: 中
**対象:** KP
**概要:** 一緒に遊ぶプレイヤー（人）の名前・Discord/TwitterID・好みのシナリオ傾向・特記事項をポータル内で管理できるページ。シナリオごとのメンバーアサインや長期グループ運営に役立てる。
**実装ヒント:** Supabaseに `players` テーブルを追加（id, display_name, contact_discord: text | null, contact_other: text | null, preferred_genre: text | null, notes: text | null, created_at）。`src/app/players/page.tsx`（一覧）と `src/app/players/new/page.tsx`（作成フォーム）を新規作成。`scenario_participants` テーブルに `player_id: uuid | null REFERENCES players(id)` カラムをALTER TABLEで追加し、KPが参加者にプレイヤーを紐づけできるよう `src/app/scenarios/[id]/participants/page.tsx` を更新。`src/lib/supabase.ts` に `Player` 型を追加。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）のサイドリンクとして配置。
**コミット:** `feat: player info management for KP group coordination`

## [DONE] ハンドアウト配布済みトラッキング — 優先度: 中
**対象:** KP / 共通
**概要:** ハンドアウトをPLへ渡したかどうかを「配布済み」フラグで管理し、未配布ハンドアウトをセッション準備チェックリストで警告表示できる機能。セッション中の「渡し忘れ」防止に特化する。
**実装ヒント:** `handouts` テーブルに `is_distributed: boolean DEFAULT false` カラムをALTER TABLEで追加。`src/lib/supabase.ts` の `Handout` 型に `is_distributed: boolean` を追加。`src/app/scenarios/[id]/handouts/page.tsx`（`src/app/_components/HandoutList.tsx`）の各ハンドアウトカードに「配布済み」チェックボックスを追加し `supabase.from("handouts").update({ is_distributed }).eq("id", id)` でトグル。`src/app/scenarios/[id]/preflight/page.tsx`（KPセッション準備チェックリスト/DONE済み）の「ハンドアウト準備状況」セクションに未配布件数を警告バッジで追加。追加DBカラムのみ、新テーブルなし。
**コミット:** `feat: handout distribution tracking to prevent forgotten handouts`

## [DONE] GMスクリーン（KP用セッション中統合ビュー） — 優先度: 高
**対象:** KP
**概要:** シナリオに紐づくNPC能力値・クリーチャーSAN喪失式・パーティーHP/SAN・ハンドアウト配布状況を1画面に集約したKP専用ビュー。セッション中に複数ページを行き来する手間を省き、KPの進行をスムーズにする。
**実装ヒント:** `src/app/scenarios/[id]/gm-screen/page.tsx` を新規作成（Server Component）。`supabase.from("scenarios").select("*, scenario_participants(*, characters(*)), handouts(*), npcs(*), creatures(*)")` で関連データを一括取得。NPCはStatBlock風に（STR/DEX/HP/MPを2列グリッド）、クリーチャーはSAN喪失式をバッジ表示、パーティーはHP/SANをカラーバー表示、ハンドアウトは`is_distributed`フラグ付きリスト表示。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「GMスクリーン」リンクを追加。追加DBなし。
**コミット:** `feat: KP GM screen with NPC, creature, party, and handout overview`

## [DONE] ダイスロール結果リアルタイム共有（卓内ブロードキャスト） — 優先度: 中
**対象:** PL / KP / 共通
**概要:** DiceRollerでロールした結果をSupabase Realtimeで同じシナリオの他クライアントに即時ブロードキャストする機能。現在のHP/SAN同期（Realtime実装済み）に続く第二のリアルタイム機能で、「誰が・何を・いくつ振ったか」をテーブル全員が見えるようにする。
**実装ヒント:** `src/app/_components/DiceRoller.tsx` のロール後処理で `supabase.channel('dice-broadcast-{scenarioId}').send({ type: 'broadcast', event: 'dice_roll', payload: { characterName, skillName, rollValue, successLevel } })` を追加。`src/app/scenarios/[id]/party/page.tsx` または新規 `src/app/scenarios/[id]/roll-feed/page.tsx` で同チャンネルをsubscribeし、直近のロール結果を最新10件フィードとして表示。scenarioIdはURLパラメータかlocalStorageで保持。追加DBなし（Realtime broadcast は揮発性のため永続化不要）。シナリオ詳細ダッシュボードに「ロールフィード」リンクを追加。
**コミット:** `feat: realtime dice roll broadcast to all players in the same scenario`

## [DONE] セッション情報パック配布（KP→PL閲覧専用URL） — 優先度: 中
**対象:** KP / 共通
**概要:** KPがシナリオ概要・参加者一覧・前回セッションあらすじ・配布済みハンドアウトをまとめた閲覧専用ページのURLをワンボタン発行し、PLに共有できる機能。LINEやDiscordで毎回手動まとめる手間をなくし、ポータル内で情報共有を完結させる。
**実装ヒント:** `share_tokens` テーブルに `target_type: "handout"|"session_pack"` と `scenario_id: uuid | null` カラムをALTER TABLEで追加（既存handout共有と同テーブルに統合）。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「情報パックを共有」ボタン（"use client" コンポーネント `SessionPackShareButton.tsx`）を追加し、`supabase.from("share_tokens").insert({ scenario_id, target_type: "session_pack", token: crypto.randomUUID(), expires_at: +72h })` でトークン発行。`src/app/share/[token]/page.tsx`（既存）を target_type 分岐に対応させ、session_pack 時は `supabase.from("scenarios").select("*, scenario_participants(*, characters(*)), handouts(*), sessions(*)")` でデータ取得して表示（is_secret=true のハンドアウトは除外）。`src/lib/supabase.ts` の `ShareToken` 型に両カラムを追加。
**コミット:** `feat: session info pack share URL for KP to distribute to players`

## [DONE] 技能値テキスト一括インポート（他ツールからの移行支援） — 優先度: 低
**対象:** PL
**概要:** 「目星50、聞き耳40、図書館75」のようなカンマ区切りテキストや、公式キャラクターシートからコピペした技能値をパースしてキャラクターの技能に一括登録できる機能。既存JSONインポートはポータル独自形式のみ対応で、他ツールや紙シートからの移行に使えない。
**実装ヒント:** `src/app/characters/[id]/skill-import/page.tsx` を "use client" で新規作成。`<textarea>` に「技能名 数値」形式（スペース/カンマ/タブ区切り）のテキストを貼り付けると、正規表現 `/([^\d,、\n\t]+?)\s*(\d+)/g` でパースして技能名・値のペアを抽出しプレビュー表示。確認後「一括登録」ボタンで `supabase.from("character_skills").upsert(...)` で既存技能は更新、新規は追加（skill_name をキーに upsert）。`src/lib/skillNormalizer.ts` を新規作成し、表記ゆれ（「目星」「目星（ものを見つける）」）を正規化するマッピングを定義。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「技能を一括入力」リンクを追加。追加DBなし。
**コミット:** `feat: bulk skill value import from text for migration from other tools`

## [DONE] 技能カテゴリ別フィルタ・タブ表示 — 優先度: 低
**対象:** PL / 共通
**概要:** 現在の技能リストは全技能を一覧表示するのみ。CoC7版の技能カテゴリ（戦闘系・調査系・対人系・知識系・移動系）別にタブまたはドロップダウンフィルタで絞り込み表示できるようにし、技能の多いキャラクターでの参照速度を上げる。
**実装ヒント:** `character_skills` テーブルに `category: text | null`（例: "戦闘"|"調査"|"対人"|"知識"|"移動"|"その他"）カラムをALTER TABLEで追加。`src/lib/supabase.ts` の `CharacterSkill` 型に `category: string | null` を追加。`src/app/_components/SkillList.tsx` にカテゴリタブ（CSS border-bottom active スタイル）を追加し `useState` でアクティブカテゴリを管理してフィルタ表示。既存の技能は `category: null`（＝「すべて」タブに表示）。新規技能追加フォームに category の select 要素を追加。追加DBカラムのみ。
**コミット:** `feat: skill category filter tabs on character skill list`

## [DONE] 探索手がかりボード（シナリオ×PL用クルーメモ） — 優先度: 高
**対象:** PL / 共通
**概要:** PLがシナリオ中に発見した手がかり・情報を「発見済み」「調査中」「解決済み」のステータスで構造化管理できるカンバン風ボード。既存のクイックノート（`quick_notes`）は散文メモだが、こちらはCoCの謎解きフローに特化した手がかり整理ツール。長期シナリオでの情報整理と伏線回収に使う。
**実装ヒント:** Supabaseに `scenario_clues` テーブルを追加（id, scenario_id, character_id, title, content: text | null, status: "found"|"investigating"|"resolved", created_at）。`src/app/characters/[id]/clues/page.tsx` を "use client" で新規作成（シナリオselect＋ステータス列ごとのカード表示）。カード追加フォームはモーダルまたはインライン入力で実装。`supabase.from("scenario_clues").update({ status })` でドラッグ不要のボタントグルによりステータス変更。`src/lib/supabase.ts` に `ScenarioClue` 型を追加。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「手がかりボード」リンクを追加。
**コミット:** `feat: scenario clue board for PL investigation tracking`

## [DONE] 戦闘中敵HPトラッカー（セッション中ウィジェット） — 優先度: 高
**対象:** KP / 共通
**概要:** セッション中に遭遇した敵（NPC/クリーチャー）のHPをその場でトラッキングできるウィジェット。既存の「戦闘ラウンドカウンター」（`scenario_participants`ベース）はPC側のDEX/イニシアチブ管理のみで、敵のHP追跡が欠落している。複数体の雑魚が登場する戦闘でのダメージ管理を大幅に効率化する。
**実装ヒント:** `src/app/scenarios/[id]/combat/page.tsx` を拡張（または `src/app/scenarios/[id]/enemy-tracker/page.tsx` を新規作成）し "use client" で実装。useState で「敵リスト（名前・HP最大・HP現在）」を管理（ページリロードでリセット、ローカル状態のみ・追加DBなし）。「敵を追加」フォームで名前と最大HPを入力し敵カードを生成。各カードに+/-ボタンでHP増減し 0以下で「倒れた」バッジ表示。既存の `src/app/creatures/[id]/page.tsx` からクリーチャーを「敵として追加」するボタンも配置し、HPを初期値として取り込む。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「戦闘トラッカー」リンクを追加（既存「戦闘管理」と統合または並置）。
**コミット:** `feat: enemy HP tracker widget for in-session combat management`

## [DONE] 探索者の誓約・長期目標管理 — 優先度: 中
**対象:** PL
**概要:** キャラクターがセッションをまたいで追い求める「大きな目標」（例: カルトの壊滅・行方不明の兄の真相究明・呪われた家の謎解き）を記録し、達成/失敗/放棄の決着をつけられる機能。既存の「技能目標トラッカー」（`skill_goals`）は数値的な技能値目標のみで、物語的・キャラクター的な誓約を管理する手段が存在しない。
**実装ヒント:** Supabaseに `character_vows` テーブルを追加（id, character_id, title, description: text | null, status: "active"|"fulfilled"|"failed"|"abandoned", resolved_at: timestamptz | null, created_at）。`src/app/characters/[id]/vows/page.tsx` を新規作成（Server Component + "use client" フォーム）。アクティブ誓約はカード上部に、解決済みはアーカイブとして下部に表示。各カードに「達成」「失敗」「放棄」ボタンを配置し `supabase.from("character_vows").update({ status, resolved_at })` で更新。`src/lib/supabase.ts` に `CharacterVow` 型を追加。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「誓約・目標」リンクを追加。
**コミット:** `feat: character vow and long-term goal tracking`

## [DONE] 状態異常タグ管理（負傷・毒・拘束等） — 優先度: 中
**対象:** PL / 共通
**概要:** セッション中に発生する一時的な身体状態異常（負傷、毒、拘束、盲目、恐怖硬直等）をキャラクターにタグとして付与・解除できる機能。既存の「狂気状態管理」（`madness_records`）は精神的状態専用で、物理的状態異常のトラッキング手段が欠落している。セッション前チェックリスト（`preflight/page.tsx`）や戦闘時に確認できる。
**実装ヒント:** Supabaseに `character_conditions` テーブルを追加（id, character_id, condition_name: text, color: text | null（例: "red"|"yellow"|"blue"）, is_active: boolean DEFAULT true, notes: text | null, created_at）。`src/app/_components/ConditionBadgeEditor.tsx` を "use client" で新規作成（プリセット: "負傷"|"毒"|"拘束"|"盲目"|"硬直"|"出血"|"疲弊"|"その他"、またはカスタム入力）。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）のHP/SANセクション付近にバッジとして表示し、クリックで追加/解除トグル。モバイルクイックダッシュボード（`src/app/characters/[id]/quick/page.tsx`）にも表示。`src/app/characters/[id]/preflight/page.tsx` のチェックリストにアクティブ状態異常を追加。`src/lib/supabase.ts` に `CharacterCondition` 型を追加。
**コミット:** `feat: character condition tags for physical status effects`

## [DONE] ポートレートギャラリー（複数参考画像管理） — 優先度: 低
**対象:** PL / 共通
**概要:** キャラクターに複数の参考画像URL（立ち絵・衣装違い・雰囲気画像）を登録しギャラリー表示できる機能。現在の `portrait_url` は1枚のメイン画像のみで、複数のビジュアルコンセプトやSNS共有用バリアントを管理する手段がない。
**実装ヒント:** Supabaseに `character_gallery_images` テーブルを追加（id, character_id, image_url: text, caption: text | null, is_main: boolean DEFAULT false, order_index: integer DEFAULT 0, created_at）。`src/app/characters/[id]/gallery/page.tsx` を "use client" で新規作成（グリッド表示＋URL入力フォームで追加）。「メインに設定」ボタンで `supabase.from("characters").update({ portrait_url })` にも反映（`is_main` フラグと連動）。▲▼ボタンで `order_index` を swap して並び替え可能。`src/lib/supabase.ts` に `CharacterGalleryImage` 型を追加。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）のポートレートセクションに「ギャラリーを見る」リンクを追加（画像数バッジ付き）。
**コミット:** `feat: character portrait gallery for managing multiple reference images`

## [DONE] NPCロールプレイメモ（口調・セリフ支援） — 優先度: 中
**対象:** KP
**概要:** NPC個別に「口調」「よく使うセリフ例」「行動パターン」を記録し、NPC詳細ページからセッション中に即参照できる機能。既存のキャラクター `speech_style` フィールドと同様のアプローチをNPCに適用し、KPの演技ブレとNPC個性の忘却を防ぐ。
**実装ヒント:** `npcs` テーブルに `speech_style: text | null`（口調・一人称）と `sample_quotes: text | null`（セリフ例・口癖）カラムをALTER TABLEで追加。`src/lib/supabase.ts` の `Npc` 型に両カラムを追加。`src/app/_components/NpcForm.tsx` に `<textarea>` フィールドを2つ追加（`src/app/npcs/new/page.tsx` と `src/app/npcs/[id]/page.tsx` に自動反映）。`src/app/npcs/[id]/page.tsx` の「セリフ例」セクションはデフォルト折りたたみ（`<details>`）で表示しセッション中の参照コストを下げる。追加DBカラムのみ、新テーブルなし。
**コミット:** `feat: NPC roleplay memo with speech style and sample quotes for KP`

## [DONE] シナリオ物証・道具管理（KP向けプロップ管理） — 優先度: 中
**対象:** KP
**概要:** シナリオ中に登場する物証・道具・アイテム（手紙・鍵・古地図・血染めの日記等）を名前・説明・入手条件・配布済みフラグで管理できる機能。ハンドアウト（`handouts`テーブル）は「情報カード」の管理に特化しているのに対し、こちらは「物理的な道具・証拠品」の管理に特化し、KPのプロップ渡し忘れを防ぐ。
**実装ヒント:** Supabaseに `scenario_props` テーブルを追加（id, scenario_id, name, description: text | null, acquisition_condition: text | null, is_distributed: boolean DEFAULT false, created_at）。`src/app/scenarios/[id]/props/page.tsx` を "use client" で新規作成（一覧＋インライン追加フォーム、配布済みチェックボックスで `supabase.from("scenario_props").update({is_distributed})` トグル）。`src/lib/supabase.ts` に `ScenarioProp` 型を追加。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「物証・道具」リンクと未配布件数バッジを追加。KPセッション準備チェックリスト（`src/app/scenarios/[id]/preflight/page.tsx`）にも未配布プロップの確認項目を追加。
**コミット:** `feat: scenario prop and evidence management for KP`

## [DONE] ランダムイベントテーブル（KP向けランダム抽選） — 優先度: 低
**対象:** KP
**概要:** シナリオに紐づいたランダムイベント候補リストを作成し、ボタン1クリックで重み付き抽選できる機能。探索中の偶発的展開や、セッション進行に詰まった際の補助ツール。KPが事前に候補を登録しておけば即座に使える。
**実装ヒント:** Supabaseに `scenario_random_events` テーブルを追加（id, scenario_id, weight: integer DEFAULT 1, title, description: text | null, created_at）。`src/app/scenarios/[id]/random-events/page.tsx` を "use client" で新規作成（一覧＋追加フォーム）。「抽選する」ボタン押下で各イベントの `weight` 合計に対する累積比率で `Math.random()` を使い1件を選出してモーダル表示。`src/lib/supabase.ts` に `ScenarioRandomEvent` 型を追加。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「ランダムイベント」リンクを追加。追加DBテーブルのみ。
**コミット:** `feat: scenario random event table with weighted draw for KP`

## [DONE] セッション後合同フィードバック（KP・PL共同振り返り） — 優先度: 中
**対象:** PL / KP / 共通
**概要:** セッションログ単位でKP・PL双方が「印象に残った場面・良かった演出・次回への期待・改善提案」を自由記述で投稿し合える共同振り返りページ。既存の `scenario_retrospectives`（KP専用の構造化ノート）と `scenario_player_ratings`（PL評価）とは異なり、セッション単位の自由記述フィードバックに特化し、参加者全員の声を一か所に集約する。
**実装ヒント:** Supabaseに `session_reflections` テーブルを追加（id, session_id, author_name, role: "kp"|"pl"|"other", content: text, created_at）。`src/app/scenarios/[id]/reflections/page.tsx` を "use client" で新規作成（シナリオ内のセッションログを select で選び、投稿フォーム＋created_at降順の一覧表示）。`role` は select（KP/PL/その他）で入力。`src/lib/supabase.ts` に `SessionReflection` 型を追加。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「合同振り返り」リンクを追加。`session_id` は `sessions` テーブルの `id` を参照（外部キー推奨）。
**コミット:** `feat: shared session reflection notes for KP and PL post-game feedback`

## [DONE] ユドナリウム互換コマデータ出力 — 優先度: 高
**対象:** PL / 共通
**概要:** ユドナリウム（Udonarium）で使えるキャラクターコマのXMLデータを自動生成してダウンロードできる機能。既存のここフォリアコマJSON出力（DONE）に続き、もう一方の主要VTTツールに対応する。
**リサーチ根拠:** ユドナリウムはここフォリアと並ぶ二大オンセツールで独自XML形式を採用しており、Charaeno・いあキャラ・キャラクター保管所いずれも未対応のブルーオーシャン領域。コマ手動作成の手間削減ニーズが複数サイトで確認された（「ユドナリウムのキャラコマを作るやつ」等の外部ツールが存在するほど需要がある）。
**実装ヒント:** `src/app/characters/[id]/udonarium-piece/page.tsx` を新規作成（"use client"）。ユドナリウムのキャラコマ形式（`<character>` 要素配下に `<data name="name">` 等のネストでステータス定義するXML）を生成。BCDiceチャットパレット生成ロジック（`src/app/characters/[id]/chat-palette/page.tsx`）を流用してコマンドリストを挿入。`new Blob([xmlString], {type: "text/xml"})` + `URL.createObjectURL` で `{キャラ名}_udonarium.xml` をダウンロード。既存Cocofoliaコマ出力ページを参考に実装。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「ユドナリウムコマ」リンクを追加。追加DBなし。
**コミット:** `feat: Udonarium character piece XML export for VTT integration`

## [DONE] 探索者プロフィール詳細フィールド拡張（ふりがな・誕生日・外見詳細） — 優先度: 中
**対象:** PL / 共通
**概要:** キャラクターにふりがな・誕生日・目の色・髪の色・身長/体重・読了した神話書リストなど、ロールプレイを豊かにする細かいフィールドを追加する。現在の `characters` テーブルは基本ステータス中心で、外見・経歴の詳細情報が不足している。
**リサーチ根拠:** いあキャラが2023年の大型アップデートで「ふりがな・誕生日・読んだクトゥルフ神話の書・遭遇した超自然存在」等の細かいフィールドを追加してユーザーから高評価を受けた。CoCキャラクター管理ツールに求められる「かゆい所に手が届く」機能として需要が確認された。
**実装ヒント:** `characters` テーブルに `furigana: text | null`, `birthday: date | null`, `eye_color: text | null`, `hair_color: text | null`, `height_cm: integer | null`, `weight_kg: decimal | null`, `mythos_books_read: integer DEFAULT 0`（読了神話書数）カラムをALTER TABLEで追加。`src/lib/supabase.ts` の `Character` 型に各カラムを追加。`src/app/_components/CharacterForm.tsx` と `src/app/characters/[id]/edit/page.tsx` に「詳細プロフィール」セクションとして各入力フィールドを追加（折りたたみ表示でもOK）。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）の基本情報セクションに表示。公開プロフィールページ（`src/app/public/[slug]/page.tsx`）にも反映。追加DBカラムのみ、新テーブルなし。
**コミット:** `feat: extended character profile fields for furigana, birthday, and appearance details`

## [DONE] PLレベル横断統計ダッシュボード — 優先度: 中
**対象:** PL / 共通
**概要:** 複数キャラクター・複数シナリオをまたいだプレイヤー単位の総合統計を可視化するページ。「何セッション遊んだか・累計SAN喪失量・総ダイスロール数・生存キャラ数/死亡キャラ数・技能別通算成功率」を一画面で確認でき、継続プレイへのモチベーションを高める。
**リサーチ根拠:** Roll20・World Anvil等の海外ツールがプレイヤー活動統計を継続利用モチベーション向上の手段として実装しており、Charaeno・いあキャラ・キャラクター保管所いずれも未対応の差別化ポイントとなることが確認された。
**実装ヒント:** `src/app/stats/page.tsx` を新規作成（Server Component）。`supabase.from("characters").select("*, sessions(*), dice_rolls(*)")` で全キャラのデータを一括取得し集計。主要メトリクス: 総キャラクター数/生存数/死亡数/退場数、総セッション数、累計SAN喪失合計（`sessions.san_loss` 合計）、総ダイスロール数と通算成功率（`dice_rolls` 集計）、最多使用技能TOP5。グラフはCSSバーのみで依存ライブラリ不要。`src/app/_components/NavBar.tsx` に「統計」リンクを追加。追加DBなし（既存テーブルのみ）。
**コミット:** `feat: player-level statistics dashboard across all characters and sessions`

## [DONE] セッション録音・アーカイブURLリンク管理 — 優先度: 低
**対象:** PL / KP / 共通
**概要:** Zoom/Discord/YouTubeなどで録音・録画されたセッションのアーカイブURLをセッションログに紐づけて保存できる機能。「あの時のセッションの録音どこだっけ？」という問題を解決し、セッションログから直接アーカイブに飛べるようにする。
**リサーチ根拠:** オンラインセッション（オンセ）では録音・録画が広く行われており、アーカイブURLをセッション情報と一緒に管理したいニーズが確認された。既存の `bgm_cues` テーブルでURLリンク管理パターンは確立済みで、セッションログへの拡張が自然。
**実装ヒント:** `sessions` テーブルに `recording_url: text | null` カラムをALTER TABLEで追加。`src/lib/supabase.ts` の `Session` 型に `recording_url: string | null` を追加。`src/app/_components/SessionLogForm.tsx` に URL入力フィールドを追加。`src/app/characters/[id]/sessions/page.tsx` の各セッションカードに `recording_url` が設定されている場合「録音を聞く」リンクボタン（`<a target="_blank" rel="noopener">`）を表示。追加DBカラムのみ、新テーブルなし。
**コミット:** `feat: session recording URL field for linking archived audio/video`

## [DONE] PWA化（ホーム画面追加・オフラインキャッシュ） — 優先度: 中
**対象:** PL / KP / 共通
**概要:** Next.js アプリをプログレッシブウェブアプリ（PWA）化し、スマホのホーム画面への追加とキャラクター基本情報のオフラインキャッシュを実現する。セッション会場のWi-Fiが不安定な状況でも基本ステータス・技能を参照できるようにし、ネイティブアプリに近い体験を提供する。
**リサーチ根拠:** Quest Portal VTTがモバイルネイティブ感でユーザーから高評価を受けており、Charaeno・いあキャラ・キャラクター保管所いずれもPWA化されていないことがリサーチで確認された。オンセ外（対面セッション）での需要も明確。
**実装ヒント:** `next-pwa` または `@ducanh2912/next-pwa` パッケージを追加。`public/manifest.json` を新規作成（name, short_name, icons, start_url, display: "standalone"）。`next.config.ts` に PWA 設定を追加（`runtimeCaching` でキャラクター詳細・技能・クイックダッシュボードページをキャッシュ）。PWAアイコン（192px・512px）を `public/icons/` に配置。`src/app/layout.tsx` の `<head>` に `<link rel="manifest" href="/manifest.json">` を追加。`src/app/characters/[id]/quick/page.tsx`（モバイルクイックダッシュボード）を Service Worker でキャッシュ優先対象に設定。Next.jsガイド（`node_modules/next/dist/docs/` を必ず参照）に従い実装。
**コミット:** `feat: PWA support with offline caching for in-session mobile use`

## [DONE] Supabaseリアルタイム対応パーティービュー — 優先度: 高
**対象:** KP / 共通
**概要:** パーティービュー（`scenarios/[id]/party`）にSupabase Realtimeを組み込み、HP/SAN変更がページリロードなしで全接続デバイスへ即時反映されるようにする。KPが複数のPLデバイスからの状態変化をリアルタイムで監視でき、戦闘中の全体把握が劇的に向上する。
**実装ヒント:** `src/app/scenarios/[id]/party/page.tsx` を "use client" コンポーネント化し、`supabase.channel("party-\${scenarioId}").on("postgres_changes", { event: "UPDATE", schema: "public", table: "characters" }, handler)` でリアルタイム購読を開始（`useEffect` 内でサブスクライブ・クリーンアップ）。参加者の `character_id` のみをフィルタして他シナリオのキャラ更新を受け取らないよう `filter` オプションを設定。`PartyStatAdjuster.tsx` からの更新が即座に他デバイスへも伝播する。追加DBなし（Supabase Realtime は既存テーブルで動作）。
**コミット:** `feat: real-time party status sync via Supabase Realtime`

## [DONE] Discordウェブフック連携 — 優先度: 中
**対象:** KP / 共通
**概要:** シナリオにDiscordウェブフックURLを設定し、SANチェック結果・セッションログ追加・狂気発症をDiscordに自動投稿できる機能。オンセグループ全体への状況共有をポータル内操作で完結させる。
**実装ヒント:** `scenarios` テーブルに `discord_webhook_url: text | null` カラムをALTER TABLEで追加。`src/lib/supabase.ts` の `Scenario` 型に `discord_webhook_url: string | null` を追加。`src/app/_components/ScenarioForm.tsx` にウェブフックURL入力欄を追加（シナリオ編集ページのみ表示）。`src/lib/discordWebhook.ts` を新規作成（`fetch(webhookUrl, { method: "POST", body: JSON.stringify({ content }) })` のラッパー関数）。`SanCheckRoller.tsx`・`SessionLogForm.tsx` のデータ保存後処理にオプションの `discordWebhook()` 呼び出しを追加（webhookUrl が未設定の場合はスキップ）。
**コミット:** `feat: Discord webhook integration for SAN checks and session logs`

## [DONE] キャラクターダウンタイム活動記録 — 優先度: 中
**対象:** PL
**概要:** セッション間の空き期間にキャラクターが何をしていたか（図書館調査・技能訓練・休養・情報収集など）を記録できる機能。次セッション前の「前回から今日までの行動」整理とロールプレイの深みを高める。
**実装ヒント:** Supabaseに `character_downtime` テーブルを追加（id, character_id, activity_type: "research"|"training"|"rest"|"social"|"other", title, description, duration_days, result, created_at）。`src/app/characters/[id]/downtime/page.tsx` を新規作成（一覧＋追加フォーム、created_at降順）。`src/lib/supabase.ts` に `CharacterDowntime` 型を追加。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「ダウンタイム」リンクを追加。セッション前チェックリスト（`src/app/characters/[id]/preflight/page.tsx`）に最新ダウンタイム活動サマリーを追記。
**コミット:** `feat: character downtime activity log between sessions`

## [DONE] 公開キャラクターへのリアクション機能 — 優先度: 低
**対象:** PL / 共通
**概要:** `is_public` フラグが立ったキャラクターの公開プロフィールページ（`/public/[slug]`）に、閲覧者がスタンプ（❤️🎲💀😱）や一言コメントを送れるリアクション機能を追加する。セッション後のキャラ紹介・卓仲間からのフィードバックを可視化する。
**実装ヒント:** Supabaseに `character_reactions` テーブルを追加（id, character_id, reactor_name: text | null, reaction_type: "heart"|"dice"|"skull"|"scream", message: text | null, created_at）。`src/app/public/[slug]/page.tsx` 下部に "use client" の `ReactionForm.tsx` コンポーネントを新規作成・配置（既存の `is_public` チェックを流用）。リアクション一覧も同ページにカード形式で表示。`src/lib/supabase.ts` に `CharacterReaction` 型を追加。スパム防止のためreactor_nameが未設定の場合は「匿名」として保存し、同一セッションからの30秒以内の連続送信はクライアント側stateで制御。
**コミット:** `feat: reaction stamps and comments on public character profiles`

## [DONE] カスタムダイス式ショートカット集 — 優先度: 高
**対象:** PL / KP / 共通
**概要:** セッション中によく使うダイス式（"2d6"・"1d4+1d6"・ダメージ確認用の式など）をプリセット登録し、DiceRollerからワンタップで実行できるショートカット機能。技能に紐づかない任意ロールの手間を大幅に削減する。
**実装ヒント:** Supabaseに `dice_shortcuts` テーブルを追加（id, character_id, label, expression, created_at）。`src/app/characters/[id]/dice-shortcuts/page.tsx` を新規作成（一覧＋追加フォーム）。`src/app/_components/DiceShortcutPad.tsx` を "use client" で新規作成し、各ショートカットボタンを押すと `diceExpression.ts`（既存）でロールして結果を表示し `supabase.from("dice_rolls").insert(...)` で保存。`src/lib/supabase.ts` に `DiceShortcut` 型を追加。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）のダイスローラーセクションに「ショートカット」リンクを追加。
**コミット:** `feat: custom dice expression shortcuts for quick in-session rolls`

## [DONE] シナリオ振り返りレポート（KP用） — 優先度: 中
**対象:** KP
**概要:** 完了したシナリオに対してKPが5段階評価・感想・反省点・次回改善点を記録できるレビュー機能。シナリオをまたいだKP自身の成長ログとなり、同じ失敗を繰り返さないための振り返り習慣を支援する。
**実装ヒント:** Supabaseに `scenario_reviews` テーブルを追加（id, scenario_id, rating: smallint 1-5, went_well, improvements, overall_notes, reviewed_at, created_at）。`src/app/scenarios/[id]/review/page.tsx` を "use client" で新規作成（フォーム＋既存レビュー表示）。`src/lib/supabase.ts` に `ScenarioReview` 型を追加。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）の `status === "completed"` のシナリオに「KP振り返り」リンクを表示。シナリオ一覧（`src/app/scenarios/page.tsx`）の完了カードに星評価バッジを追加（reviewが存在する場合）。
**コミット:** `feat: KP retrospective report with rating for completed scenarios`

## [DONE] キャラクター比較ビュー — 優先度: 低
**対象:** PL / 共通
**概要:** 2〜4名のキャラクターの能力値・主要技能・HP/SAN/MPを横並びで比較できるページ。パーティー編成時の役割分担確認や、リビルド前後の差分チェックに使う。
**実装ヒント:** `src/app/characters/compare/page.tsx` を "use client" で新規作成。URLクエリパラメータ `?ids=id1,id2,id3` でキャラクターを指定し `supabase.from("characters").select("*, character_skills(*)").in("id", ids)` で一括取得。能力値（STR/CON/POW/DEX/APP/SIZ/INT/EDU）をテーブル形式で横並び表示し、最高値セルを強調（`font-bold text-green-600`）。`src/app/characters/page.tsx` の各キャラカードに「比較に追加」チェックボックスを追加し、選択後「比較する」ボタンで `/characters/compare?ids=...` に遷移。追加DBなし。
**コミット:** `feat: character comparison view for side-by-side stat review`

## [DONE] アイテムカタログ（インベントリ用テンプレートライブラリ） — 優先度: 中
**対象:** PL / 共通
**概要:** 探偵道具・医薬品・銃器・消耗品など CoC で頻出のアイテムを「カタログ」として登録し、インベントリ追加時にワンクリックで選択できるテンプレートライブラリ。毎回同じアイテム名・ダメージ式・メモを手入力する手間をなくす。
**実装ヒント:** Supabaseに `item_catalog` テーブルを追加（id, category: "weapon"|"medical"|"tool"|"misc", name, damage, notes, created_at）。`src/app/item-catalog/page.tsx` を新規作成（カテゴリフィルタ＋一覧＋追加フォーム）。`src/app/characters/[id]/inventory/page.tsx` の追加フォームに「カタログから選択」ボタンを追加し、選択したカタログエントリの name/damage/notes をフォームへ自動補完。`src/lib/supabase.ts` に `ItemCatalog` 型を追加。初期データとして代表的な武器・アイテムをシードデータとして `item_catalog` に挿入するSQLをコメントで記載。`src/app/_components/NavBar.tsx` には追加不要（キャラクターインベントリ内の補助機能として位置づける）。
**コミット:** `feat: item catalog template library for quick inventory addition`

## [DONE] セッションリプレイ記事生成補助 — 優先度: 高
**対象:** KP / 共通
**概要:** セッション終了後、シナリオに紐づくセッションログ・共有メモ・NPC遭遇記録を自動集約し、リプレイ風まとめテキストをワンクリックで生成してクリップボードにコピーできる機能。毎回手動でまとめ記事を書く手間を大幅に削減する。
**実装ヒント:** `src/app/scenarios/[id]/recap/page.tsx` を新規作成（Server Component）。参加者のcharacter_idを `scenario_participants` から取得し、`sessions`（セッションログ）・`scenario_notes`（共有メモ）・`npc_encounters`（NPC遭遇）を `Promise.all` で並行取得。セクション「セッション概要」「登場NPC」「共有メモ」「SAN/HP損害サマリー」に分けて表示し、`navigator.clipboard.writeText()` でマークダウン形式コピーボタンを配置。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「リプレイ記事を生成」リンクを追加。追加DBなし。
**コミット:** `feat: session recap text generator for KP post-session report`

## [DONE] シリーズ/キャンペーン管理 — 優先度: 中
**対象:** KP / 共通
**概要:** 複数シナリオを「キャンペーン」としてまとめ、連作の進行状況・全体シノプシス・通算セッション数を一画面で把握できる機能。単発シナリオと連作両方に対応し、長期卓の全体感を可視化する。
**実装ヒント:** Supabaseに `campaigns` テーブルを追加（id, title, synopsis, status: "ongoing"|"completed"|"planning", created_at）と `campaign_scenarios` テーブルを追加（id, campaign_id, scenario_id, order_index, created_at）。`src/app/campaigns/page.tsx`（一覧＋作成フォーム）と `src/app/campaigns/[id]/page.tsx`（シナリオ一覧・進捗サマリー）を新規作成。シナリオ詳細（`src/app/scenarios/[id]/page.tsx`）に「キャンペーンに追加」ボタンを追加。`src/app/_components/NavBar.tsx` に「キャンペーン」リンクを追加。`src/lib/supabase.ts` に `Campaign`, `CampaignScenario` 型を追加。
**コミット:** `feat: campaign/series management to group and track multi-scenario arcs`

## [DONE] シナリオ謎・伏線管理（プロットスレッド） — 優先度: 中
**対象:** KP
**概要:** シナリオ内の未解明の謎・伏線・秘密をリスト管理し、「未解明」「解明済み」「放棄」のステータスで追跡できる機能。`truth-timeline`（出来事年表）は時系列記録だが、こちらはKPが「どの謎がまだ残っているか」を把握するためのチェックリスト。
**実装ヒント:** Supabaseに `plot_threads` テーブルを追加（id, scenario_id, title, description, status: "pending"|"revealed"|"abandoned", created_at）。`src/app/scenarios/[id]/plot-threads/page.tsx` を "use client" で新規作成（ステータス別カンバン風リスト＋追加フォーム）。ステータス変更は `supabase.from("plot_threads").update({ status }).eq("id", id)` で即時更新。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「未解明の謎：N件」バッジを追加。`src/lib/supabase.ts` に `PlotThread` 型を追加（status: "pending" | "revealed" | "abandoned"）。
**コミット:** `feat: plot thread tracking for mystery and foreshadowing management`

## [DONE] シナリオデータ一括エクスポート（KPアーカイブ） — 優先度: 低
**対象:** KP
**概要:** シナリオに紐づくデータ（ハンドアウト・NPC・エリア・シーン・BGMキュー・共有メモ・プロットスレッド）を1つのJSONファイルとしてダウンロードできる機能。完了シナリオのアーカイブ、バックアップ、他のKPとのシナリオ素材共有に使う。
**実装ヒント:** `src/app/scenarios/[id]/export/page.tsx` を "use client" で新規作成。`supabase.from("scenarios").select("*, handouts(*), scenario_areas(*), scenario_scenes(*), bgm_cues(*), scenario_notes(*)")` で関連データを一括取得し、NPC（`scenario_name` 一致）も含める。`JSON.stringify(data, null, 2)` + `Blob` + `URL.createObjectURL` でダウンロード。ファイル名は `scenario-{title}-{date}.json` 形式。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）のヘッダー右上に「エクスポート」ボタンを追加。追加DBなし。
**コミット:** `feat: scenario full data JSON export for archiving and sharing`

## [DONE] リアルタイムHP/SAN同期（Supabase Realtime） — 優先度: 高
**対象:** PL / KP / 共通
**概要:** KPがパーティービューでHPを更新した瞬間、PLのクイックダッシュボードにも即時反映されるリアルタイム同期機能。現在はページリロードしないと変更が見えないため、セッション中の状態把握にタイムラグがある。
**実装ヒント:** `src/app/characters/[id]/quick/page.tsx` と `src/app/scenarios/[id]/party/page.tsx` を "use client" 化し、`supabase.channel("characters").on("postgres_changes", { event: "UPDATE", schema: "public", table: "characters" }, payload => setState(payload.new))` でリアルタイム購読。既存の `QuickStatEditor.tsx` と `PartyStatAdjuster.tsx` のDB更新後の `router.refresh()` 呼び出しはそのまま残し、Realtime受信側でもstateを更新する二段構えにすることでフォールバックを保つ。Supabase Realtime はプロジェクト設定でデフォルト有効。追加DBなし。
**コミット:** `feat: realtime HP/SAN sync via Supabase Realtime channels`

## [DONE] KPセッションアジェンダ（進行チェックリスト） — 優先度: 高
**対象:** KP
**概要:** セッション当日にKPが「必達シーン」「配布ハンドアウト」「登場NPC」「リマインド事項」をチェックリスト形式で管理・消し込みできる進行補助機能。現在の共有メモ（scenario_notes）はメモ書き用途で、やることリストの消し込みに向いていない。
**実装ヒント:** Supabaseに `session_agenda_items` テーブルを追加（id, scenario_id, item_type: "scene"|"handout"|"npc"|"note", label, is_done: boolean, order_index, created_at）。`src/app/scenarios/[id]/agenda/page.tsx` を "use client" で新規作成（ドラッグ不要のシンプルな順序付きチェックリスト＋追加フォーム）。is_done のトグルは `supabase.from("session_agenda_items").update({ is_done }).eq("id", id)` で即時更新。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「セッションアジェンダ」リンクを追加。`src/lib/supabase.ts` に `SessionAgendaItem` 型を追加。
**コミット:** `feat: KP session agenda checklist for in-session progression tracking`

## [DONE] キャラクター間In-characterメッセージ（手紙・伝言） — 優先度: 中
**対象:** PL / 共通
**概要:** キャラクター同士がIn-characterで「手紙」「伝言メモ」をやり取りし、ポータル内に保存できる機能。セッション外のロールプレイや、KPからPL個別へのキャラクター宛メッセージをテキスト記録として残す。
**実装ヒント:** Supabaseに `character_messages` テーブルを追加（id, sender_character_id, recipient_character_id, subject, body, sent_at, is_read: boolean, created_at）。`src/app/characters/[id]/messages/page.tsx` を "use client" で新規作成（受信箱一覧＋送信フォーム）。送信先はキャラクター一覧（`supabase.from("characters").select("id, name")`）からselectで選択。既読/未読管理（`supabase.from("character_messages").update({ is_read: true }).eq("id", id)`）を実装。未読件数バッジをキャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）のヘッダーに追加。`src/lib/supabase.ts` に `CharacterMessage` 型を追加。
**コミット:** `feat: in-character message / letter system between characters`

## [DONE] シナリオシーン別ペーシングログ — 優先度: 低
**対象:** KP
**概要:** セッション中に各シーン（エリア）の開始・終了時刻を記録し、セッション終了後に「どのシーンに何分かかったか」の振り返りができる時間管理ログ。セッション振り返りレポート（scenario_reviews）の定性評価を補完する定量データとなる。
**実装ヒント:** Supabaseに `scene_pacing_logs` テーブルを追加（id, scenario_id, scene_label, started_at: timestamptz, ended_at: timestamptz | null, created_at）。`src/app/scenarios/[id]/pacing/page.tsx` を "use client" で新規作成。「シーン開始」ボタンで `started_at = now()` を記録し、「シーン終了」で `ended_at = now()` を更新（`supabase.from("scene_pacing_logs").update({ ended_at }).eq("id", activeId)`）。各シーンの経過時間を `(ended_at - started_at)` で分単位計算して一覧表示。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「ペーシングログ」リンクを追加。`src/lib/supabase.ts` に `ScenePacingLog` 型を追加。
**コミット:** `feat: scene pacing log for session time management and retrospective`

## [DONE] グループダイスロール（パーティー一括判定） — 優先度: 高
**対象:** KP / 共通
**概要:** シナリオ参加者全員に同一の技能判定（例：「知覚」「図書館」「SANチェック」）をワンクリックで一括実行し、成功度ごとに結果を並べて表示できる機能。現在はKPがキャラクターごとにDiceRollerを操作する必要があり、複数人同時判定に手間がかかる。
**実装ヒント:** `src/app/scenarios/[id]/group-roll/page.tsx` を "use client" で新規作成。`supabase.from("scenario_participants").select("*, characters(*, character_skills(*))").eq("scenario_id", id)` で参加者と技能を一括取得。技能名テキスト入力（または代表技能の select）と「全員ロール」ボタンで各キャラクターに1d100判定を実行。結果は成功度（決定的成功/通常成功/失敗/致命的失敗）でグループ表示し、`supabase.from("dice_rolls").insert([...])` で各キャラのロールをまとめて保存。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「グループロール」リンクを追加。追加DBなし（既存 `scenario_participants`, `character_skills`, `dice_rolls` を流用）。
**コミット:** `feat: group dice roll for simultaneous party skill checks`

## [DONE] 神話生物・神格クイック辞典 — 優先度: 中
**対象:** KP
**概要:** CoC7版の主要神話生物（グール・ゾンビ・ディープワン・クトゥルフ等）の能力値・代表攻撃・SANチェック値を静的データとして収録し、セッション中にキーワード検索で即参照できる辞典ページ。既存のルールリファレンス（`rules/page.tsx`）を補完するKP専用ツール。
**実装ヒント:** `src/app/mythos/page.tsx` を新規作成（"use client" + useState でフィルタ）。神話生物データは `src/lib/mythosData.ts` に静的配列として定義（name, origin, str, con, pow, dex, hp, san_loss_success, san_loss_fail, attacks: string[], notes）。検索バーで name/origin をリアルタイムフィルタ。各エントリはアコーディオン表示（閉じた状態で名前のみ、開くと全能力値・攻撃・SANロス表示）。rules/page.tsx の実装パターンを踏襲。`src/app/_components/NavBar.tsx` に「神話辞典」リンクを追加。追加DBなし（静的データのみ）。
**コミット:** `feat: mythos bestiary quick reference for KP`

## [DONE] セッション前PLチャレンジ目標 — 優先度: 中
**対象:** PL
**概要:** PLが次回セッションに向けて「この技能で成功する」「このNPCと会話する」「呪文を1回使う」などの個人チャレンジ目標を設定し、セッション後に達成/未達を記録できる機能。成長記録・セッションログと連携し、キャラクターへの没入感と継続プレイのモチベーションを高める。
**実装ヒント:** Supabaseに `session_goals` テーブルを追加（id, character_id, goal: text, status: "pending"|"achieved"|"failed", set_at: timestamptz, resolved_at: timestamptz | null, created_at）。`src/app/characters/[id]/session-goals/page.tsx` を "use client" で新規作成（目標入力フォーム＋一覧、status 別に「進行中」「達成」「未達」タブ表示）。各目標カードに「達成」「未達」ボタンを配置し `supabase.from("session_goals").update({ status, resolved_at }).eq("id", id)` で即時更新。セッション前チェックリスト（`src/app/characters/[id]/preflight/page.tsx`）に保留中の目標一覧を追加表示。`src/lib/supabase.ts` に `SessionGoal` 型を追加。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「セッション目標」リンクを追加。
**コミット:** `feat: per-session PL challenge goals with achievement tracking`

## [DONE] KPオペレーション統合ビュー — 優先度: 高
**対象:** KP
**概要:** セッション当日にKPが使う主要ツール（パーティーステータス・アジェンダチェックリスト・共有メモ・グループロール）を1ページにタブ集約した「指揮卓」ビュー。現在は各機能が別ページにあり、セッション中のタブ切り替えコストが高い。
**実装ヒント:** `src/app/scenarios/[id]/ops/page.tsx` を "use client" で新規作成。タブ切り替え（「ステータス」「アジェンダ」「メモ」「ロール」）で既存コンポーネント（`PartyMemberCard.tsx`, `SessionAgendaChecklist.tsx`, `ScenarioNoteList.tsx`）を切り替え表示。URLハッシュ（`#status`, `#agenda`, `#notes`, `#roll`）でタブ状態を保持しブラウザ履歴に対応（`useEffect` + `window.location.hash`）。データ取得は各コンポーネントに委譲し、このページ自体は `scenarioId` を prop で渡すだけのシェルとして薄く実装。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）のヘッダー右上に「セッション開始 →」ボタンを追加して `/scenarios/[id]/ops` へ遷移。追加DBなし（既存ページのコンポーネントを流用）。
**コミット:** `feat: KP operations dashboard for unified in-session management`

## [DONE] VTTコマJSONエクスポート（ユドナリウム/ここふぁりあ対応） — 優先度: 高
**対象:** PL / 共通
**概要:** キャラクターの能力値・HP/MP/SANをユドナリウムおよびここふぁりあが読み込める「コマデータJSON」形式でエクスポートする機能。既存のBCDiceチャットパレット生成と組み合わせ、VTTセッションへの移行コストをゼロに近づける。
**リサーチ根拠:** ユドナリウム・ここふぁりあは国内オンセの主要VTTであり、「毎回手でコマを作り直すのが面倒」という不満がユーザーアンケートや個人ブログ（TRPGツールガイド等）で繰り返し挙げられている最大の課題の一つ。
**実装ヒント:** `src/app/_components/VttExportButton.tsx` を "use client" で新規作成。`supabase.from("characters").select("*, character_skills(*)")` でデータ取得し、ユドナリウムのコマJSONスキーマ（`name`, `initiative`, `currentStatus:[{label:"HP", value, max}, ...]`）に変換して `Blob` + `URL.createObjectURL` でダウンロード。ここふぁりあ向けには別タブでテキストアリーナに貼るCSV形式も選択可能にする。`src/app/characters/[id]/chat-palette/page.tsx` に「VTTエクスポート」セクションとして配置し既存のチャットパレットページと統合。追加DBなし。
**コミット:** `feat: VTT token JSON export for Udonarium and Kokoforia`

## [DONE] 恐怖症・マニア詳細管理（フォビア/マニア） — 優先度: 高
**対象:** PL
**概要:** CoC7版の恐怖症（フォビア）とマニア（躁病）をキャラクター単位で一覧・記録・管理できる専用UI。既存の「狂気状態管理（madness_records）」はsymptomを自由テキストで記録するが、CoC7版公式シートはフォビア/マニアを独立フィールドとして持つため、症状名・発動トリガー・活性状態を分けて追跡できるよう補完する。
**リサーチ根拠:** Charaeno が恐怖症/マニア用の独立フィールドを実装しており、公式7版シートの構成に沿ったより細かい狂気管理がユーザーから高評価を得ている（Charaeno公式note）。
**実装ヒント:** Supabaseに `character_phobias` テーブルを追加（id, character_id, phobia_type: "phobia"|"mania", name, trigger_description, is_active: boolean, acquired_at, created_at）。`src/app/characters/[id]/phobias/page.tsx` を新規作成（phobia_type別タブ表示 + 追加フォーム）。各行に「活性/回復」トグルを配置し `supabase.from("character_phobias").update({ is_active })` で更新。セッション前チェックリスト（`src/app/characters/[id]/preflight/page.tsx`）にアクティブなフォビア/マニアのサマリーを追記。`src/lib/supabase.ts` に `CharacterPhobia` 型を追加。キャラクター詳細ページに「恐怖症/マニア」リンクを追加。
**コミット:** `feat: phobia and mania management for CoC7 madness tracking`

## [DONE] 魔道書コレクション管理 — 優先度: 中
**対象:** PL
**概要:** キャラクターが入手・読了した魔道書（ネクロノミコン等）をタイトル・言語・読了ステータス・読書時SANロス・クトゥルフ神話技能上昇値・収録呪文と共に記録する機能。現在の「呪文管理（character_spells）」は取得済み呪文の一覧だが、魔道書はSAN/技能への副作用があり独立した管理価値がある。
**リサーチ根拠:** CharaenoやPrismScroll Cthulhuが魔道書専用フィールドを実装しており、呪文マスターのPLが頻繁にセッション中参照する要素として確認された。
**実装ヒント:** Supabaseに `character_tomes` テーブルを追加（id, character_id, title, author, language, san_loss_skimming: text（例: "1/1d3"）, san_loss_full_read: text（例: "1d4/2d6"）, cthulhu_mythos_gain: integer, spells_contained: text, is_read: boolean, notes, created_at）。`src/app/characters/[id]/tomes/page.tsx` を新規作成（一覧＋追加フォーム）。is_readのトグルで既読/未読を管理。`src/lib/supabase.ts` に `CharacterTome` 型を追加。キャラクター詳細ページに「魔道書」リンクを追加し、呪文ページ（`src/app/characters/[id]/spells/page.tsx`）にも「所有魔道書」への導線を設置。
**コミット:** `feat: grimoire/tome collection management with SAN and skill effects`

## [DONE] KP秘匿メモ（キャラクター/NPC/シナリオへのKP専用非公開フィールド） — 優先度: 中
**対象:** KP
**概要:** KPがキャラクター・NPC・シナリオのそれぞれに「PLに見せない秘匿情報」（真の正体・隠し設定・KP向け注記）を追記できる非公開メモフィールド。現在全データがPLにも見える前提で構築されており、KP専用情報の記録場所がない。
**リサーチ根拠:** CharaXivの「KP専用非公開フィールド」が人気機能として紹介されており（Charaeno公式note・CharaXiv紹介記事）、KPが安心してキャラ設定を管理したいニーズが確認された。
**実装ヒント:** Supabaseに `kp_memos` テーブルを追加（id, entity_type: "character"|"npc"|"scenario", entity_id: uuid, content: text, created_at）。`src/app/_components/KpMemoSection.tsx` を "use client" で新規作成（props: entityType, entityId）。textarea + 保存ボタンで `supabase.from("kp_memos").upsert(...)` により entity_type + entity_id をキーに1件管理（複数行不要）。キャラクター詳細（`src/app/characters/[id]/page.tsx`）・NPC詳細（`src/app/npcs/[id]/page.tsx`）・シナリオ詳細（`src/app/scenarios/[id]/page.tsx`）の末尾に折りたたみ表示で配置。`src/lib/supabase.ts` に `KpMemo` 型を追加。
**コミット:** `feat: KP-only hidden memo field for characters, NPCs, and scenarios`

## [DONE] タグ付け + タグ横断検索 — 優先度: 低
**対象:** PL / KP / 共通
**概要:** キャラクター・シナリオ・NPCに自由タグ（例: "現代日本" "探偵もの" "長期キャン"）を付与し、タグ単位で横断検索できる機能。既存のキャラクター一覧フィルタ（名前・職業・ステータス）やグローバル検索（テキスト一致）を補完し、テーマ・時代・ジャンルでのグルーピングを可能にする。
**リサーチ根拠:** いあキャラ・Charaenoともにタグ検索をサポートしており、大量のキャラやシナリオを管理するベテランユーザーからの需要が高いと複数のブログ・ユーザーレビューで確認された。
**実装ヒント:** Supabaseに `tags` テーブル（id, name, created_at）と `entity_tags` テーブル（id, entity_type: "character"|"scenario"|"npc", entity_id: uuid, tag_id: uuid, created_at）を追加。`src/app/_components/TagSelector.tsx` を "use client" で新規作成（テキスト入力でタグ追加、×ボタンで削除、既存タグはオートコンプリート）。キャラクター一覧（`src/app/characters/page.tsx`）・シナリオ一覧（`src/app/scenarios/page.tsx`）にタグフィルタ追加。グローバル検索（`src/app/search/page.tsx`）にタグ横断検索を追加。`src/lib/supabase.ts` に `Tag`, `EntityTag` 型を追加。
**コミット:** `feat: tag system for characters, scenarios, and NPCs with cross-search`

## [DONE] ハンドアウト画像添付（ビジュアルハンドアウト） — 優先度: 高
**対象:** KP / 共通
**概要:** KPがハンドアウトに画像URL（古文書・地図・手紙の模写・写真）を添付してセッション中に視覚的に共有できる機能。現在のハンドアウトはテキストのみで、没入感の高い視覚的証拠品の配布ができない。ポートレートアップロード（Supabase Storage）と同様のアプローチで画像を管理する。
**実装ヒント:** `handouts` テーブルに `image_url: text | null` カラムをALTER TABLEで追加。`src/lib/supabase.ts` の `Handout` 型に `image_url: string | null` を追加。`src/app/_components/HandoutList.tsx` のハンドアウトカードで `image_url` が設定されていれば `<img>` をカード内に表示（`object-contain max-h-48` 等でサイズ制御）。`src/app/scenarios/[id]/handouts/page.tsx` の追加フォームに「画像URL」入力欄を追加。Supabase Storageの `portraits` バケットと同様に `handout-images` バケットへの直接アップロード対応は `src/app/_components/HandoutList.tsx` 内にオプションのファイル入力として実装可能。共有URL（`src/app/share/[token]/page.tsx`）でも `image_url` が設定されていれば表示。追加DBカラムのみ、新テーブルなし。
**コミット:** `feat: visual handout image attachment for immersive prop sharing`

## [DONE] PC+NPC統合イニシアチブトラッカー（戦闘管理強化） — 優先度: 高
**対象:** KP / 共通
**概要:** 現在の「戦闘ラウンドカウンター」（`combat/page.tsx`）はPC側のDEXソートのみ、「敵HPトラッカー」（`enemy-tracker` ローカル状態）はHP管理のみで分離している。PC・NPC・カスタム敵を同一のイニシアチブリストで管理し、各エンティティのHP増減・行動済みフラグ・倒れたバッジを1画面で操作できる完全な戦闘管理ページへ統合する。
**実装ヒント:** `src/app/scenarios/[id]/combat/page.tsx` を刷新（"use client"）。既存の `scenario_participants` から取得するPC列（DEX値あり）に加え、「NPC/敵を追加」フォームで名前・DEX・HPを入力した即席エントリを同リストに追加（ローカル state のみ、追加DBなし）。既存クリーチャー（`src/app/creatures/[id]/page.tsx`）から「戦闘に追加」ボタンでHP・DEXを取り込む。全エンティティをDEX降順ソートしてイニシアチブ順を一覧表示。各行に「行動済み」チェック・HP+/-ボタン（現在値0以下で「倒れた」バッジ）を配置。「次ラウンド」ボタンで行動済みフラグ全解除＋ラウンド数+1。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）の「戦闘管理」リンクをこのページへ誘導。
**コミット:** `feat: unified PC+NPC initiative tracker with HP management for combat`

## [DONE] CoC7版「絆」管理（ボンドルール対応） — 優先度: 中
**対象:** PL
**概要:** CoC7版の核心ルールである「絆（Bonds）」——探索者が深く結びついた人物との関係性を記録し、SANロス時の回復源や絆へのダメージ・喪失を追跡できる専用機能。既存の `character_relations`（関係メモ）や `character_traits`（重要な人物）とは異なり、絆のポイント値・ダメージ量・喪失フラグを持ちCoC7版のゲームメカニクスに特化する。
**実装ヒント:** Supabaseに `character_bonds` テーブルを追加（id, character_id, target_name, bond_score: integer, damage_taken: integer DEFAULT 0, is_lost: boolean DEFAULT false, notes: text | null, created_at）。`src/app/characters/[id]/bonds/page.tsx` を新規作成（Server Component + "use client" フォーム）。絆スコア・ダメージ値を表示し「ダメージを受ける（-1）」「回復（+1）」「喪失」ボタンを配置、`supabase.from("character_bonds").update(...)` で更新。`bond_score - damage_taken` で有効絆値をリアルタイム表示。セッション前チェックリスト（`src/app/characters/[id]/preflight/page.tsx`）にアクティブな絆一覧と有効絆値サマリーを追記。`src/lib/supabase.ts` に `CharacterBond` 型を追加。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「絆」リンクを追加。
**コミット:** `feat: CoC7 bond management with score, damage, and loss tracking`

## [DONE] シナリオPDF出力（KP用オフライン資料） — 優先度: 中
**対象:** KP
**概要:** KPがシナリオに紐づく情報（基本情報・NPC一覧・エリアメモ・ハンドアウト一覧・プロットスレッド）をA4印刷・PDF保存できるページ。既存のキャラクターPDF出力（`characters/[id]/print/page.tsx`）と同様のアプローチで、対面セッション時のKP手元資料やシナリオアーカイブに使う。
**実装ヒント:** `src/app/scenarios/[id]/print/page.tsx` を新規作成（Server Component）。`supabase.from("scenarios").select("*, scenario_participants(*, characters(*)), handouts(*), scenario_areas(*), plot_threads(*)")` と NPCを `scenario_name` で取得して一括表示。`@media print { nav { display: none; } .no-print { display: none; } }` で印刷時はヘッダー・ナビを非表示。セクション区切りは `break-inside: avoid` で改ページ制御。`src/app/_components/ScenarioExportButton.tsx` を "use client" で新規作成し `window.print()` を呼び出す（または `src/app/_components/ScenarioExportButton.tsx` が既存の場合は流用）。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）のヘッダーに「印刷/PDF」ボタンを追加。追加DBなし。
**コミット:** `feat: scenario print/PDF export for KP offline session materials`

## [DONE] セッション前キャラクタースナップショット（ロールバック対応） — 優先度: 高
**対象:** PL / 共通
**概要:** セッション開始前にキャラクターのステータス・技能値をまるごとスナップショットとして保存し、誤ったHP/MP/SAN更新や技能値ミスが発生した場合に任意の時点へロールバックできる機能。データ損失防止として最優先。
**実装ヒント:** Supabaseに `character_snapshots` テーブルを追加（id, character_id, label: text, snapshot_data: jsonb, taken_at: timestamptz, created_at）。`src/app/characters/[id]/preflight/page.tsx`（セッション前チェックリスト）に「スナップショットを保存」ボタン（"use client" コンポーネント）を追加し、`supabase.from("characters").select("*, character_skills(*)")` の全データをJSONB形式で格納。`src/app/characters/[id]/snapshots/page.tsx` を新規作成（一覧表示＋復元UI）。復元時は `characters.update({hp_current, mp_current, san_current, ...})` および `character_skills` の一括 upsert を実行し、復元前に確認ダイアログを表示。`src/lib/supabase.ts` に `CharacterSnapshot` 型を追加。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「スナップショット」リンクを追加。
**コミット:** `feat: character snapshot and rollback for session data safety`

## [DONE] シナリオ別参加者ダイス統計ダッシュボード — 優先度: 中
**対象:** KP / 共通
**概要:** シナリオに参加した全キャラクターのダイスロール履歴（`dice_rolls`テーブル）をシナリオ単位で集計し、参加者別の成功率・ファンブル率・最多使用技能・総判定数を一覧表示するKP向けダッシュボード。既存のキャラクター単位統計（`dice-stats`）とは異なり卓全体の傾向を把握できる。
**実装ヒント:** `src/app/scenarios/[id]/dice-stats/page.tsx` を新規作成（Server Component）。`supabase.from("scenario_participants").select("character_id").eq("scenario_id", id)` で参加者IDを取得し、`supabase.from("dice_rolls").select("*").in("character_id", ids)` でロール履歴を一括取得。character_idごとにグループ化して成功数/総数/ファンブル数を集計し、参加者名と共に表示（参加者名は `characters.name` で取得）。CSSの `width: calc(${rate}%)` バーグラフで成功率を可視化。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「判定統計」リンクを追加。追加DBなし。
**コミット:** `feat: per-scenario dice statistics dashboard across all participants`

## [DONE] NPCプリセットライブラリ（KP汎用NPCテンプレート） — 優先度: 低
**対象:** KP
**概要:** よく使う汎用NPC（医師・警察官・教授・店員等）を「NPCプリセット」としてあらかじめ保存しておき、新規シナリオのNPC作成時に呼び出して即座にフォームへ反映できる機能。既存の「NPC複製機能」はシナリオ内NPCのコピーだが、こちらはシナリオ横断で使い回せる汎用テンプレートとして機能する。
**実装ヒント:** Supabaseに `npc_presets` テーブルを追加（id, name, occupation_name, appearance, purpose, notes, str, con, pow, dex, app, siz, int_stat, edu, hp, mp, db, created_at）。`src/app/npc-presets/page.tsx` を新規作成（一覧＋作成フォーム）。NPC作成ページ（`src/app/npcs/new/page.tsx`）に「プリセットから読み込む」select 要素を追加し、選択すると `supabase.from("npc_presets").select("*").eq("id", presetId)` で取得した値をフォームの各 state へ自動入力。`src/app/_components/NavBar.tsx` に「NPCプリセット」リンクを追加。`src/lib/supabase.ts` に `NpcPreset` 型を追加。追加DBあり（`npc_presets` テーブル）。
**コミット:** `feat: NPC preset library for reusable NPC templates across scenarios`

## [DONE] 探索者実績・称号システム — 優先度: 低
**対象:** PL / 共通
**概要:** セッション参加回数・SAN喪失総量・技能成長回数・ダイス成功率・狂気発症回数などの行動履歴から達成バッジ（称号）を自動判定し、キャラクターページで表示するゲーミフィケーション機能。既存テーブルの集計のみで追加DBは不要。
**実装ヒント:** `src/app/characters/[id]/achievements/page.tsx` を新規作成（Server Component）。`sessions`, `dice_rolls`, `growth_history`, `madness_records` を `Promise.all` で並行取得して各バッジ条件を判定（例: "ベテラン探索者" = sessions.length >= 10, "折れない精神" = san_loss合計 >= 30, "成長の証" = growth_history.length >= 5, "ファンブル常連" = fumble回数 >= 5）。バッジ定義は静的配列（name, description, icon, condition関数）で管理。達成済み/未達成を視覚的に区別（達成済みはカラー、未達成はグレーアウト）して表示。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「実績」リンクを追加。追加DBなし。
**コミット:** `feat: character achievement badge system based on session history`

## [DONE] ダイス成功率シミュレーター — 優先度: 中
**対象:** PL / KP / 共通
**概要:** 技能値と判定種別（通常/ボーナスダイス/ペナルティダイス）を入力すると、成功確率・通常成功率・決定的成功率・ファンブル率を即座に計算して表示するリファレンスツール。セッション前の戦略立案やKPの難易度設計に役立つ。
**実装ヒント:** `src/app/dice-calc/page.tsx` を "use client" で新規作成（追加DBなし・静的計算のみ）。技能値スライダー（0〜99）と判定種別セレクタを配置。通常判定は `rate = Math.min(skill, 99) / 100`、ボーナスは `1 - (1 - rate)^2`、ペナルティは `rate^2` で確率計算。決定的成功は技能値の1/5以下、ファンブルは96以上かつ技能値50未満で100。結果をパーセンテージ＋CSSバーで表示。`src/app/_components/NavBar.tsx` に「確率計算」リンクを追加。
**コミット:** `feat: dice success rate simulator for skill check probability`

## [DONE] シナリオ難易度・メタ情報タグ — 優先度: 中
**対象:** KP / 共通
**概要:** シナリオに「難易度（初心者向け/中級/上級）」「推定プレイ時間（短編/中編/長編）」「推奨人数（最小・最大）」「コンテンツ警告タグ」を設定できる機能。シナリオ一覧での絞り込みや参加者へのプレ情報共有に使う。
**実装ヒント:** `scenarios` テーブルに `difficulty: "beginner"|"intermediate"|"advanced" | null`、`playtime_type: "short"|"medium"|"long" | null`、`min_players: integer | null`、`max_players: integer | null`、`content_tags: text[] | null` カラムをALTER TABLEで追加。`src/lib/supabase.ts` の `Scenario` 型に各フィールドを追加。`src/app/_components/ScenarioForm.tsx` にメタ情報入力セクション（select要素＋タグ入力）を追加。`src/app/scenarios/page.tsx` のフィルタUIに難易度・プレイ時間フィルタを追加。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）の概要カードにバッジ表示。
**コミット:** `feat: scenario difficulty and meta tags for filtering and player briefing`

## [DONE] セッション振り返りフォーム（卓評価） — 優先度: 中
**対象:** KP / 共通
**概要:** セッション終了後に「楽しさ（1〜5）」「緊張感（1〜5）」「印象的な場面（自由記述）」「次回への改善点（自由記述）」を記録できる振り返りフォーム。セッションログの事実記録と分けて感想・評価を残せる。
**実装ヒント:** Supabaseに `session_reviews` テーブルを追加（id, scenario_id, session_label, fun_score: smallint, tension_score: smallint, highlight, improvement, reviewed_at, created_at）。`src/app/scenarios/[id]/review/page.tsx` を "use client" で新規作成（一覧＋新規入力フォーム）。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「卓振り返り」リンクと平均スコアサマリを追加。`src/lib/supabase.ts` に `SessionReview` 型を追加。
**コミット:** `feat: post-session review form for scenario feedback and improvement tracking`

## [DONE] キャラクター肖像画プロンプト生成 — 優先度: 低
**対象:** PL / 共通
**概要:** キャラクターの外見・職業・性格・背景情報をもとに、Midjourney/StableDiffusion等のAI画像生成ツールで使える英語プロンプトを自動生成してクリップボードにコピーできる機能。プロフィールカード機能（SNS共有）と組み合わせて、キャラクターのビジュアル化を支援する。
**実装ヒント:** `src/app/characters/[id]/portrait-prompt/page.tsx` を "use client" で新規作成（追加DBなし）。`supabase.from("characters").select("*, character_traits(*)")` でキャラデータを取得し、外見テキスト（`appearance`フィールド）・職業（`occupation`）・性格特質（`character_traits`のpersonalityタイプ）を組み合わせて英語プロンプトを組み立てる静的テンプレート関数 `buildPortraitPrompt(character)` を `src/lib/portraitPrompt.ts` に実装。生成されたプロンプトをテキストエリアに表示し「コピー」ボタンを配置。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「肖像画プロンプト」リンクを追加。
**コミット:** `feat: AI portrait prompt generator from character appearance and traits`

## [DONE] KP準備チェックリスト（セッション当日用） — 優先度: 高
**対象:** KP
**概要:** KPがセッション当日にハンドアウト配布・BGMキュー確認・シーンリスト・参加者出欠を一画面でまとめて点検できる専用のプリフライトUI。PLの `preflight` ページ（`/characters/[id]/preflight`）のKP対応版として、セッション直前の「確認漏れ」を防ぐ。
**実装ヒント:** `src/app/scenarios/[id]/kp-preflight/page.tsx` を新規作成（Server Component + "use client" 子コンポーネント）。`supabase.from("scenarios").select("*, handouts(*), bgm_cues(*), scenario_scenes(*), scenario_participants(*, characters(*))")` でシナリオ関連データを一括取得。ハンドアウトは `is_distributed` フラグをトグル可（`supabase.from("handouts").update({is_distributed}).eq("id", id)` で即時反映）。BGMキュー・シーン・参加者出欠は読み取り表示のみ（既存フラグを参照）。チェック状態は各テーブルの既存フラグを使用し追加DBなし。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「KP準備確認」リンクを追加。
**コミット:** `feat: KP pre-session preflight checklist for scenario readiness`

## [DONE] アイテムカタログ（マスター装備リスト） — 優先度: 中
**対象:** PL / KP / 共通
**概要:** CoC7版の標準武器・装備・道具をあらかじめ登録したマスターカタログを一覧表示し、キャラクターを選択してインベントリへ一クリック追加できる機能。毎回武器名・ダメージ・射程を手入力する手間を省く。`ItemCatalog` 型（`src/lib/supabase.ts:563`）は定義済みだがUIページが未実装。
**実装ヒント:** `src/app/item-catalog/page.tsx` を新規作成（Server Component + "use client" 子コンポーネント `src/app/_components/ItemCatalogAddButton.tsx`）。`supabase.from("item_catalog").select("*").order("category")` でカテゴリ別一覧表示（weapon/medical/tool/misc の4区分タブまたはフィルタ）。各アイテムの「追加」ボタンでキャラクター選択モーダルを表示し `supabase.from("inventory_items").insert({character_id, item_type: item.category === "weapon" ? "weapon" : "item", name: item.name, damage: item.damage, notes: item.notes})` でインベントリへ登録。カタログ自体のCRUD（作成・削除）も同ページ内の管理セクションで実装。`src/app/_components/NavBar.tsx` に「装備カタログ」リンクを追加。追加DBなし（既存 `item_catalog` テーブルを流用）。
**コミット:** `feat: item catalog master list with one-click inventory add`

## [DONE] シナリオ統計サマリー（KP実績レポート） — 優先度: 中
**対象:** KP / 共通
**概要:** 全シナリオを横断した集計（総実施数・参加者のべ数・平均SAN損失・キャラクター死亡/引退数・完了シナリオ数）をグラフ・数値カードで表示するKP向けダッシュボード。個別シナリオの統計ではなく、KP活動全体の実績を一覧できる。
**実装ヒント:** `src/app/scenarios/stats/page.tsx` を新規作成（Server Component）。`Promise.all` で以下を並行取得: `supabase.from("scenarios").select("id, status, played_at")`、`supabase.from("scenario_participants").select("id, scenario_id")`、`supabase.from("sessions").select("san_loss, hp_loss")`、`supabase.from("characters").select("id, status").in("status", ["dead", "retired"])`。取得データをサーバー側でステータス別・月別に集計しカード表示（追加DBなし）。グラフはCSSのみの棒グラフ（`width: calc(${pct}%)`）で依存ライブラリ不要。シナリオ一覧（`src/app/scenarios/page.tsx`）に「統計」リンクを追加。
**コミット:** `feat: KP scenario statistics summary dashboard`

## [DONE] 死亡・引退キャラクター追悼ホール — 優先度: 低
**対象:** PL / 共通
**概要:** ステータスが "dead" または "retired" のキャラクターを専用の追悼ページで一覧表示し、`farewell_scene`・`farewell_message` を含む追悼カードとして並べる機能。個別の farewell ページ（`/characters/[id]/farewell`）は存在するが、全キャラを横断する「英雄の記念碑」ビューはない。
**実装ヒント:** `src/app/characters/hall-of-fame/page.tsx` を新規作成（Server Component）。`supabase.from("characters").select("*").in("status", ["dead", "retired"]).order("updated_at", {ascending: false})` で取得。各キャラをカード形式で表示（名前・職業・ステータスバッジ・`farewell_message` の先頭50文字プレビュー）。`farewell_scene` が入力済みのキャラは `<details>` 要素で展開可能にする。`src/app/characters/page.tsx`（キャラ一覧）フッターまたは `src/app/_components/NavBar.tsx` に「記念碑」リンクを追加。追加DBなし。
**コミット:** `feat: hall of fame page for deceased and retired characters`

## [DONE] シナリオ別NPC管理ページ — 優先度: 高
**対象:** KP
**概要:** シナリオ詳細から直接そのシナリオのNPCだけを一覧・追加できるページ。現在NPCは `scenario_name`（テキスト）で紐づいており、KPはNPC一覧（`/npcs`）へ移動して手動フィルタする必要がある。シナリオ内に留まったままNPCを管理できるようにする。
**実装ヒント:** `src/app/scenarios/[id]/npcs/page.tsx` を新規作成（Server Component + "use client" 追加フォーム）。`supabase.from("scenarios").select("title").eq("id", id)` でシナリオ名取得後、`supabase.from("npcs").select("*").eq("scenario_name", scenario.title).order("created_at")` でNPC一覧取得。各NPCカードには `/npcs/[npc_id]` への詳細リンクと削除ボタンを配置。新規NPC追加フォームは `NpcForm.tsx` を流用し `scenario_name` を自動セット。`src/app/scenarios/[id]/page.tsx`（シナリオ詳細ダッシュボード）に「NPC管理」カードリンクを追加。追加DBなし。
**コミット:** `feat: scenario-scoped NPC management page`

## [DONE] シナリオ参加者能力値バランスビュー — 優先度: 高
**対象:** KP
**概要:** シナリオに参加する全キャラクターの主要能力値（STR・DEX・INT・EDU・SAN・HP）を横並び比較できるKP向けページ。現在のパーティービュー（`/party`）はHP/MP/SANの現在値表示のみで、セッション前の編成確認・戦闘難易度調整には能力値比較が不可欠。
**実装ヒント:** `src/app/scenarios/[id]/party-balance/page.tsx` を新規作成（Server Component）。`supabase.from("scenario_participants").select("*, characters(*)").eq("scenario_id", id)` で参加者＋キャラデータを一括取得。各能力値（str/con/pow/dex/int_stat/edu）をテーブル形式で横並び表示し、最大値の列をハイライト。CSSバーで全体の中での位置を視覚化（`width: calc(${val/21*100}%)`）。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「能力値バランス」リンクを追加。追加DBなし。
**コミット:** `feat: party ability score balance view for KP pre-session prep`

## [DONE] キャンペーン統計ダッシュボード — 優先度: 中
**対象:** KP / 共通
**概要:** キャンペーンに紐づく全シナリオを横断した実績集計（参加シナリオ数・完了数・のべ参加者数・累計SAN損失・累計HP損失・死亡/引退キャラ数）をカード＋棒グラフで表示するダッシュボード。現在 `/campaigns/[id]/page.tsx` はシナリオ一覧のみで数値集計がない。
**実装ヒント:** `src/app/campaigns/[id]/stats/page.tsx` を新規作成（Server Component）。`supabase.from("campaign_scenarios").select("scenario_id").eq("campaign_id", id)` でシナリオID一覧取得後、`Promise.all` で `scenarios`（status別カウント）・`scenario_participants`（のべ参加者数）・`sessions`（san_loss/hp_lossの合計）・`characters`（dead/retiredのカウント）を並行取得しサーバーサイドで集計。CSSのみのバーグラフ（`width: calc(${pct}%)`）で依存ライブラリ不要。`src/app/campaigns/[id]/page.tsx` に「統計」リンクを追加。追加DBなし（`campaign_scenarios`は既存）。
**コミット:** `feat: campaign statistics dashboard with aggregate metrics`

## [DONE] セッションリプレイページ（全参加者記録統合） — 優先度: 中
**対象:** PL / KP / 共通
**概要:** シナリオの全参加キャラクターのセッションログ＋ファンブル/クリティカル判定（`dice_rolls`テーブル）を時系列にまとめたリプレイ振り返りページ。現在セッションログはキャラ単位でしか見られず、卓全体の流れを一つのストーリーとして振り返る手段がない。セッション後の感想会・SNSシェアに活用できる。
**実装ヒント:** `src/app/scenarios/[id]/replay/page.tsx` を新規作成（Server Component）。`supabase.from("scenario_participants").select("character_id, characters(name)").eq("scenario_id", id)` で参加者取得後、`Promise.all` で各キャラの `sessions`（session_number・title・summary・san_loss・hp_loss）と `dice_rolls`（critical_success/fumbleのみ・rolled_at昇順）を取得。全イベントを `played_at`/`rolled_at` でソートし、キャラ名バッジ付きのタイムライン形式で表示（CSSの `border-left` で縦線）。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「リプレイ」リンクを追加。追加DBなし。
**コミット:** `feat: scenario replay page combining all participant session logs`

## [DONE] CoC 6版キャラクターシート対応 — 優先度: 高
**対象:** PL / 共通
**概要:** 現在のポータルはCoC 7版専用だが、日本国内では6版コミュニティが今も根強く活動している。キャラクター作成時に6版/7版を選択できるようにし、版ごとの技能ポイント計算式・技能基本値・技能リストの差異を吸収する。
**リサーチ根拠:** クトゥルフWEBダイス・キャラクター保管所など主要ツールが「6版・7版両対応」をウリにしており、6版ユーザーが既存ツールを使い続ける最大の理由が版対応であることを複数サイトで確認した。
**実装ヒント:** `characters` テーブルに `rule_edition: text NOT NULL DEFAULT '7th'` カラムを追加（ALTER TABLE）。`src/lib/supabase.ts` の `Character` 型に `rule_edition: "6th" | "7th"` を追加。`src/lib/coc-calc.ts` に6版用関数（`calcOccupationPoints6th(edu) = edu * 20`、`calcPersonalPoints6th(int) = int * 10`）を追加。`src/app/_components/CharacterForm.tsx` にエディション選択 `<select>` を追加し、選択に応じてポイント計算と初期値ラベルを分岐。`src/app/rules/page.tsx` に6版タブを追加（技能基本値が7版と異なるため専用リストを `src/lib/occupationData.ts` に追記）。
**コミット:** `feat: CoC 6th edition character sheet support`

## [DONE] ランダム探索者名／NPC名生成 — 優先度: 中
**対象:** PL / KP / 共通
**概要:** キャラクター作成・NPC追加時に、ボタン1つで日本人らしい名前をランダム生成して入力欄に反映できる機能。名前が思い浮かばないユーザーの詰まりを解消し、1920年代設定と現代設定の2種から選べるようにする。
**リサーチ根拠:** 「TRPGでキャラを作る際、性格などが思いつかなくなる」というユーザーニーズが2025年の検索結果に明示されており、CharaXivほか複数ツールがランダム生成機能を提供している。ランダム名生成は最も実装コストが低く即効性が高い改善点として確認された。
**実装ヒント:** `src/lib/nameData.ts` を新規作成し、1920年代向け姓100件・名100件と現代向け姓100件・名100件の静的配列を定義。`src/app/_components/CharacterForm.tsx` の名前フィールド横に「🎲」ボタンを追加（"use client" のまま onClick で配列からランダム取得しフォームstateを更新）。`src/app/_components/NpcForm.tsx` にも同様のボタンを追加し `nameData.ts` を流用。追加DBなし。
**コミット:** `feat: random investigator and NPC name generator`

## [DONE] セッション前日リマインド通知（Supabase Edge Function） — 優先度: 中
**対象:** KP / 共通
**概要:** 進行中シナリオの `next_session_at` が翌日に迫ったとき、Supabase Edge Function + メール送信でKPへリマインドを自動配信する機能。現在 next_session_at の表示（DONE）はあるが、ユーザーがポータルを開かないと気づけず「うっかり忘れ」が発生する。
**リサーチ根拠:** TRPGセッションは月1〜2回程度の開催頻度のため「うっかり忘れた」ケースがコミュニティで散見されると複数のTRPG情報サイトで言及されており、日程調整ツールとの併用が前提になっている現状を改善する。
**実装ヒント:** `supabase/functions/session-reminder/index.ts` を新規作成（Deno Edge Function）。`supabase-js` でサービスロールキーを使い `scenarios` テーブルの `next_session_at` が翌日（`BETWEEN now()+23h AND now()+25h`）かつ `remind_enabled = true` のレコードを取得し、Resend API（または SMTP）でKPのメールアドレスへHTMLメールを送信。`scenarios` テーブルに `remind_enabled: boolean DEFAULT false`・`remind_email: text` カラムを追加（ALTER TABLE）。`src/app/scenarios/[id]/page.tsx` のシナリオ詳細に「リマインドメール設定」セクションを追加（`src/app/_components/ScenarioForm.tsx` に `remind_enabled` チェックボックス・`remind_email` 入力欄を追記）。Supabase Dashboard の pg_cron で毎日 JST 9:00 にEdge Functionを呼び出すCronジョブを設定。
**コミット:** `feat: session reminder email via Supabase Edge Function`

## [DONE] キャラクター/ハンドアウトQRコード出力 — 優先度: 低
**対象:** PL / KP / 共通
**概要:** 公開中のキャラクタープロフィールURL（`/p/[slug]`）やハンドアウト共有URL（`/share/[token]`）をQRコードとして画面表示・PNG保存できる機能。物理セッション・コンベンション参加時にスマートフォン同士でURLを瞬時に共有できる。
**リサーチ根拠:** オフラインセッション向けのPDF出力需要（DONE済み）と並行して、スマートフォン間のURL共有をQRコード化することがコンベンション参加者に有効という声が国内TRPGコミュニティブログで確認された。ここフォリアのQRコマシェア機能も類似ニーズを示している。
**実装ヒント:** `src/app/_components/QrCodeShare.tsx` を "use client" で新規作成。`qrcode` npm パッケージ（軽量・ゼロ依存）でCanvas/SVGにQRコードを描画し、モーダルで表示。「PNGダウンロード」ボタンで `canvas.toBlob` → `URL.createObjectURL` でダウンロード。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）の公開URLコピーボタン隣に「QR」ボタンとして追加（is_public が true のときのみ表示）。ハンドアウト一覧（`src/app/scenarios/[id]/handouts/page.tsx`）の共有リンク生成ボタン隣にも同様に追加。追加DBなし。
**コミット:** `feat: QR code share for public character profile and handout URLs`

## [DONE] ホームダッシュボード（アクティビティフィード） — 優先度: 高
**対象:** PL / KP / 共通
**概要:** ポータルのトップページに「直近のセッションログ」「進行中シナリオの次回予定」「最近更新されたキャラクター」「アクティブな狂気状態キャラクターの警告」を一画面に集約したダッシュボードを実装する。現在のトップページはリンク集にとどまっており、開いた瞬間に状況を把握できない。
**実装ヒント:** `src/app/page.tsx` を Server Component として拡張。`Promise.all` で `supabase.from("sessions").select("*, characters(name)").order("created_at",{ascending:false}).limit(5)`・`supabase.from("scenarios").select("*").eq("status","ongoing").not("next_session_at","is",null).order("next_session_at").limit(5)`・`supabase.from("characters").select("*").order("updated_at",{ascending:false}).limit(6)`・`supabase.from("madness_records").select("*, characters(name)").eq("is_active",true).limit(5)` を並行取得し、各セクションをカード形式で縦に配置。追加DBなし。
**コミット:** `feat: home dashboard with activity feed and upcoming sessions`

## [DONE] Discord Webhook 自動通知（セッションイベント連携） — 優先度: 中
**対象:** KP / 共通
**概要:** シナリオに設定された `discord_webhook_url` へ、セッションログ追加・SAN5以上喪失・キャラクター死亡 のイベント発生時に自動でDiscord通知を送信する機能。現在はURLを保存するだけで実際の送信処理が未実装。
**実装ヒント:** `src/lib/discordNotify.ts` を新規作成（`sendDiscordNotification(webhookUrl: string, content: string): Promise<void>` — `fetch` でDiscord Webhook エンドポイントにPOST）。`src/app/_components/SessionLogForm.tsx` のフォーム送信成功後に呼び出し（`san_loss >= 5` の場合は喪失警告メッセージ、それ以外はセッション記録通知）。`src/app/_components/CharacterForm.tsx` で status を `"dead"` に変更した際にも呼び出し。webhookUrlは `character → scenario_participants → scenarios` の連鎖取得、またはフォームに scenario_id を props 経由で渡して取得。追加DBなし（既存 `scenarios.discord_webhook_url` を利用）。
**コミット:** `feat: auto Discord notification on session events via webhook`

## [DONE] セッション参加者ダイスロールスコアボード — 優先度: 低
**対象:** PL / KP / 共通
**概要:** シナリオに参加した全キャラクターの `dice_rolls` を集計し「最多ファンブル」「最多クリティカル成功」「最高成功率」「総判定数」のランキングを表示するエンタメ統計ページ。セッション後の振り返り・盛り上がりに使える。
**実装ヒント:** `src/app/scenarios/[id]/scoreboard/page.tsx` を新規作成（Server Component）。`supabase.from("scenario_participants").select("character_id, characters(name)").eq("scenario_id", id)` で参加者一覧取得後、各 `character_id` の `dice_rolls` を `Promise.all` で並行取得しサーバーサイドで集計（fumble数・critical_success数・成功率・総判定数）。ランキングはCSSのみのカード形式で表示。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「スコアボード」リンクを追加。追加DBなし（既存 `dice_rolls`・`scenario_participants` を流用）。
**コミット:** `feat: dice roll scoreboard across scenario participants`

## [DONE] セッション録画埋め込みビューア — 優先度: 低
**対象:** PL / KP / 共通
**概要:** `sessions` テーブルの `recording_url`（YouTube/ニコニコ動画）が入力されたセッションログに対して、セッション詳細ページで iframe 埋め込みプレイヤーとして録画を視聴できる機能。現在フィールドは存在するが参照UIが未実装。
**実装ヒント:** `src/app/characters/[id]/sessions/[sessionId]/page.tsx` を新規作成（Server Component）。`supabase.from("sessions").select("*").eq("id", sessionId).single()` でログ取得。YouTube URL（`youtube.com/watch?v=` または `youtu.be/`）から動画IDを抽出し `https://www.youtube.com/embed/{videoId}` に変換してiframe表示。ニコニコ動画URL（`nicovideo.jp/watch/`）は `https://embed.nicovideo.jp/watch/{smId}` に変換。recording_url が null の場合はセッション情報のみ表示。セッションログ一覧（`src/app/characters/[id]/sessions/page.tsx`）の各ログカードに「録画を見る」リンクを追加（recording_url が non-null の場合のみ）。追加DBなし。
**コミット:** `feat: session recording embedded viewer for YouTube and Niconico`

## [DONE] 困難/極限判定閾値インジケーター（技能リスト拡張） — 優先度: 高
**対象:** PL / 共通
**概要:** CoC7版の困難成功（技能値÷2）・極限成功（技能値÷5）の閾値を技能リストの各行にサブテキストで表示するトグルを追加する。KPから「困難成功で...」と指定されたとき、PLが即座に自分のターゲット値を把握できるようにする。
**実装ヒント:** `src/app/_components/SkillList.tsx` に「閾値表示」トグルボタン（useState で `showThresholds: boolean` を管理）を追加。`showThresholds` が true のとき、各技能行に `困難: ${Math.floor(skill.current_value / 2)}` / `極限: ${Math.floor(skill.current_value / 5)}` をグレーのサブテキストで表示。DiceRoller（`src/app/_components/DiceRoller.tsx`）でも技能選択後に選択技能の3段階閾値（通常/困難/極限）をインフォバーとして表示するとより便利。追加DBなし。
**コミット:** `feat: show hard/extreme success thresholds in skill list`

## [DONE] セッション参加者出欠確認管理 — 優先度: 高
**対象:** KP / 共通
**概要:** シナリオ参加者（`scenario_participants`）に出欠フラグ（確認済み/未確認/欠席）を追加し、KPが次回セッション前に参加確認漏れを防げるようにする。現在は参加者の登録のみで出欠状況の管理ができない。
**実装ヒント:** `scenario_participants` テーブルに `attendance_status: text NOT NULL DEFAULT 'pending'` カラムを追加（ALTER TABLE、値は `"pending"|"confirmed"|"absent"`）。`src/lib/supabase.ts` の `ScenarioParticipant` 型に `attendance_status: "pending" | "confirmed" | "absent"` を追加。`src/app/scenarios/[id]/party/page.tsx`（パーティービュー）内の `PartyStatAdjuster.tsx` または新規 `AttendanceToggle.tsx` コンポーネントで3択ボタンを追加し `supabase.from("scenario_participants").update({attendance_status}).eq("id", p.id)` で更新。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「⚠ 未確認あり」バナーを表示（`pending` 人数 > 0 のとき）。KP準備確認（`src/app/scenarios/[id]/kp-preflight/page.tsx`）にも出欠サマリーを追記。
**コミット:** `feat: session attendance status tracking for scenario participants`

## [DONE] 卓内ダイスロールリアルタイムフィード（Supabase Realtime） — 優先度: 中
**対象:** PL / KP / 共通
**概要:** Supabase Realtimeを使い、シナリオ参加キャラクターのダイスロール（`dice_rolls`テーブル）をセッション中に全員がリアルタイム確認できるフィードページ。誰が何の技能を振り何が出たかをリアルタイムで共有し、オンセの臨場感を高める。
**実装ヒント:** `src/app/scenarios/[id]/dice-feed/page.tsx` を "use client" で新規作成。参加者の `character_id` 一覧を `scenario_participants` から取得後、`supabase.channel('dice-feed-${scenarioId}').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dice_rolls', filter: \`character_id=in.(${ids.join(',')})\` }, payload => setRolls(prev => [payload.new, ...prev].slice(0, 50)))` でリアルタイム購読（useEffect でサブスクライブ、アンマウントで `supabase.removeChannel`）。各ロールは「キャラ名・技能名・ロール値・成功度バッジ」のカードで表示（成功度別に色分け）。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「ダイスフィード」リンクを追加。追加DBなし（既存 `dice_rolls`・`scenario_participants` を流用）。
**コミット:** `feat: realtime dice roll feed for scenario participants via Supabase`

## [DONE] PLフィードバック収集フォーム（セッション後アンケート） — 優先度: 中
**対象:** KP / 共通
**概要:** セッション後にPLがKPへ感想・評価（楽しさ1〜5・印象的な場面・改善提案）を匿名で送れる公開フォーム。既存のKP自己評価（`session_reviews`、DONE済み）を補完し、PLの率直なフィードバックをKPが受け取れるようにする。
**実装ヒント:** Supabaseに `player_feedback` テーブルを追加（id, scenario_id, session_label, player_name, fun_score: smallint, highlight, improvement, created_at）。`src/app/scenarios/[id]/feedback/page.tsx` を "use client" で新規作成（認証不要・公開アクセス可）。フォームはシンプルな1ページ構成（fun_score の星評価UI・highlight と improvement のtextarea）。KPのシナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）には受信済みフィードバック件数バッジと閲覧リンクを追加。`src/app/scenarios/[id]/feedback/results/page.tsx` を新規作成し、KPが全フィードバックを一覧確認できるページを実装（認証済みユーザーのみ表示）。`src/lib/supabase.ts` に `PlayerFeedback` 型を追加。
**コミット:** `feat: player feedback form for post-session KP improvement`

## [DONE] 公開探索者プロフィールページ（/c/[slug]） — 優先度: 中
**対象:** PL / 共通
**概要:** `is_public=true` + `public_slug` 設定済みキャラクターをURLで誰でも閲覧できる専用ページ。SNSのプロフィールリンクやセッション募集時の自己紹介リンクとして使える。現在フィールドは存在するが閲覧ルートが未実装。
**実装ヒント:** `src/app/c/[slug]/page.tsx` を新規作成（Server Component）。`supabase.from("characters").select("*, character_skills(*), character_traits(*), character_spells(*)").eq("public_slug", slug).eq("is_public", true).single()` でデータ取得（未設定または `is_public=false` の場合は 404）。キャラ詳細の読み取り専用ビュー（編集UI非表示）を実装。`<head>` に `og:title` / `og:description` の OGP メタタグを追加しSNSプレビューを最適化。`src/app/_components/PublicShareToggle.tsx`（既存）から生成するURLをこのルートに変更。追加DBなし。
**コミット:** `feat: public character profile page at /c/[slug] with OGP support`

## [DONE] ユーザー認証・個人データ分離（Supabase Auth + RLS） — 優先度: 高
**対象:** PL / KP / 共通
**概要:** Supabase Auth のメール認証を実装し、PLは自分のキャラのみ・KPは自分のシナリオのみ管理できるよう Row Level Security でデータを分離する。現在は認証なしで全データが共有状態にあり、プライバシー・セキュリティ上の根本課題。
**実装ヒント:** `src/middleware.ts` を新規作成し未認証ユーザーを `/login` へリダイレクト。`src/app/login/page.tsx` を "use client" で実装（`supabase.auth.signInWithPassword` + `signUp`）。`src/app/_components/AuthProvider.tsx` を Context として作成しセッション状態を全体で共有。`characters`・`scenarios`・`npcs`・`handouts` 等の主要テーブルに `user_id uuid REFERENCES auth.users DEFAULT auth.uid()` を追加し `CREATE POLICY` で `auth.uid() = user_id` を設定。`src/app/_components/NavBar.tsx` にユーザーメニュー（表示名・ログアウト）を追加。`src/lib/supabase.ts` のクライアントを `@supabase/ssr` の `createBrowserClient` / `createServerClient` に移行。
**コミット:** `feat: Supabase Auth with email login and per-user data isolation via RLS`

## [DONE] キャラクター月次活動サマリーレポート — 優先度: 中
**対象:** PL / 共通
**概要:** 月単位でプレイしたセッション数・SAN喪失合計・成長した技能数・参加シナリオを集計した「月次レポート」ページ。過去の活動量を振り返りモチベーション向上に活用できる。
**実装ヒント:** `src/app/characters/[id]/monthly-report/page.tsx` を新規作成（Server Component）。クエリパラメータ `?month=YYYY-MM` で対象月を指定（未指定時は当月）。`supabase.from("sessions").select("*").eq("character_id", id).gte("played_at", monthStart).lt("played_at", monthEnd)` でセッション取得し san_loss / hp_loss 合計・セッション数を集計。`supabase.from("growth_history").select("*").eq("character_id", id).gte("created_at", monthStart).lt("created_at", monthEnd)` から成長記録件数も取得。グラフはCSSのみのバー表示（既存 `stats-graph` と同方式）で依存ライブラリ不要。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「月次レポート」リンクを追加。追加DBなし。
**コミット:** `feat: monthly activity summary report per character`

## [DONE] セッション安全ツール（X-Card・ライン＆ヴェール） — 優先度: 高
**対象:** KP / 共通
**概要:** セッション内で不快な場面を即座に止める「X-Card」シグナルと、セッション前にKPとPL全員がコンテンツの「ライン（絶対NG）」「ヴェール（フェードアウト可）」を合意できるフォームをシナリオに紐づけて管理する機能。TRPGの安全ツールとして国際的に普及している仕組みを日本語UIで提供し、参加者全員が安心して卓を楽しめるようにする。
**実装ヒント:** Supabaseに `scenario_safety_settings` テーブルを追加（id, scenario_id: uuid UNIQUE, x_card_enabled: boolean DEFAULT true, lines: text | null（絶対NGの事項・箇条書き）, veils: text | null（フェードアウト可の事項）, session_zero_notes: text | null, updated_at）。`src/app/scenarios/[id]/safety/page.tsx` を "use client" で新規作成（`supabase.from("scenario_safety_settings").upsert(...)` でシナリオ1件につき1レコード管理）。X-Card有効時はパーティービュー（`src/app/scenarios/[id]/party/page.tsx`）に目立つ「X（中断）」ボタンを追加し、クリック時に赤背景フラッシュと「シーンを一時中断します」テキストを全画面表示（Supabase Realtime の broadcast でシナリオ参加者全員に通知）。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「安全設定」リンクと設定済みバッジを追加。`src/lib/supabase.ts` に `ScenarioSafetySettings` 型を追加。
**コミット:** `feat: TRPG safety tools with X-Card and Lines/Veils for session safety`

## [DONE] シナリオ内ゲーム内時刻管理（イン・ゲーム・クロック） — 優先度: 中
**対象:** KP / 共通
**概要:** CoCシナリオ内の「架空の日付・時刻」（例: 1923年10月13日 午後3時）をKPが設定・進行させ、パーティービューや共有メモに表示できる機能。現実世界の `played_at` とは別に、シナリオ内の時間経過を追跡する。1920年代設定の没入感を高め、「夜になった」「3日が経過した」などの時間進行をKPが1クリックで共有できる。
**実装ヒント:** `scenarios` テーブルに `game_current_date: text | null`（例: "1923-10-13"）と `game_current_time: text | null`（例: "15:00"）カラムをALTER TABLEで追加。`src/lib/supabase.ts` の `Scenario` 型に両カラムを追加。`src/app/_components/GameClockEditor.tsx` を "use client" で新規作成（date/time input + 「更新」ボタン → `supabase.from("scenarios").update({ game_current_date, game_current_time })`）。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）のヘッダーに「ゲーム内時刻：[日付] [時刻]」を表示し、KPはクリックで `GameClockEditor` を展開して更新。パーティービュー（`src/app/scenarios/[id]/party/page.tsx`）にも同情報をバッジ表示（Supabase Realtimeで他クライアントにも即時反映）。追加DBカラムのみ（新テーブルなし）。
**コミット:** `feat: in-game clock and date tracking for scenario immersion`

## [DONE] パーティー間アイテム譲渡（キャラクターインベントリ移転） — 優先度: 中
**対象:** PL / 共通
**概要:** シナリオ参加キャラクター間でインベントリのアイテムを譲渡できる機能。「この銃をあなたに渡す」などのパーティー内物品のやり取りをポータル内で完結させる。現在 `inventory_items` は固定の `character_id` を持つため、他キャラへの移転が削除→再追加という手間のかかる操作しかできない。
**実装ヒント:** `src/app/characters/[id]/inventory/page.tsx` の各アイテムカードに「譲渡」ボタンを追加（"use client" のまま）。クリックで「譲渡先キャラクター選択」モーダルを表示し、同シナリオの参加者（`supabase.from("scenario_participants").select("*, characters(id, name)").eq("scenario_id", scenarioId)`）から選択。シナリオ不参加の場合は全キャラ一覧（`supabase.from("characters").select("id, name")`）を代替として表示。確認後に `supabase.from("inventory_items").update({ character_id: targetCharacterId }).eq("id", itemId)` で更新しリスト再取得。追加DBなし（既存 `inventory_items` テーブルのみ使用）。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）の「所持品」リンク先で即座に使えるよう、インベントリページ内に自然に配置する。
**コミット:** `feat: item transfer between party characters for in-session inventory management`

## [DONE] 探索者「後継者」リンク（前任キャラクター接続） — 優先度: 低
**対象:** PL / 共通
**概要:** 長期キャンペーンで旧探索者が死亡・引退した際、後継の新探索者を「前任キャラクターの後継者」としてリンクできる機能。旧キャラの遺品（アイテム）を後継者に引き継ぐオプションも提供し、シナリオをまたいだ物語の連続性を記録する。
**実装ヒント:** `characters` テーブルに `successor_of: uuid | null REFERENCES characters(id)` カラムをALTER TABLEで追加（自己参照外部キー、ON DELETE SET NULL）。`src/lib/supabase.ts` の `Character` 型に `successor_of: string | null` を追加。`src/app/characters/[id]/page.tsx`（status が "dead" または "retired" のキャラ詳細）に「後継者を設定」ボタンを追加し（"use client" コンポーネント）、キャラクター選択UIから `supabase.from("characters").update({ successor_of: currentId }).eq("id", successorId)` で後継者に前任リンクを設定。後継者のキャラクター詳細ページで `successor_of` が設定されていれば「前任探索者: [名前] →」リンクを表示。「前任者の遺品を引き継ぐ」ボタンで `supabase.from("inventory_items").update({ character_id: successorId }).eq("character_id", currentId)` を実行するオプションを提供（確認ダイアログ必須）。追加DBカラムのみ（新テーブルなし）。
**コミット:** `feat: character succession link for legacy narrative continuity in campaigns`

## [DONE] セッション日程調整・参加可否投票 — 優先度: 高
**対象:** KP / 共通
**概要:** KPが複数の候補日を提示し、PLが各候補に○×で回答することで最適なセッション日を確定できる日程調整機能。毎回のセッション日程決めをポータル内で完結させ、外部ツール（Doodle等）への依存をなくす。
**実装ヒント:** `src/lib/supabase.ts` に `ScheduleProposal`・`ScheduleVote` 型はすでに定義済み（id, scenario_id / proposal_id, voter_name, is_available）。`src/app/scenarios/[id]/schedule/page.tsx` を "use client" で新規作成（候補日一覧 + 各日への○×投票UI）。KPは `supabase.from("schedule_proposals").insert({ scenario_id, proposed_at })` で候補追加、PLは `supabase.from("schedule_votes").upsert({ proposal_id, voter_name, is_available })` で回答。集計は proposed_at ごとに○票数/×票数を並べてバー表示（CSSのみ）。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「日程調整」リンクと「投票受付中」バッジを追加。DBテーブルは `schedule_proposals`・`schedule_votes` を新規作成（Supabase ダッシュボードで実施）。
**コミット:** `feat: session schedule voting with candidate dates for scenario planning`

## [DONE] 探索者「絆」スコア管理（DG/CoC7版絆ルール） — 優先度: 中
**対象:** PL
**概要:** Delta Green・CoC7版の「絆」ルールに基づき、キャラクターが持つ絆相手（家族・友人等）のスコア・ダメージ・喪失フラグを記録・管理できる機能。CharacterRelation（一行メモ）とは別に数値スコアで追跡し、ダメージを受けた絆の回復やセッション中の絆喪失を記録する。
**実装ヒント:** `src/lib/supabase.ts` に `CharacterBond` 型はすでに定義済み（id, character_id, target_name, bond_score, damage_taken, is_lost, notes）。Supabaseに `character_bonds` テーブルを新規作成（上記カラム構成）。`src/app/characters/[id]/bonds/page.tsx` を新規作成（一覧 + 追加・更新フォーム）。各絆カードに「ダメージを受ける（-1）」「回復（+1）」「喪失」ボタンを配置し `supabase.from("character_bonds").update({ damage_taken, is_lost }).eq("id", id)` で即時更新。is_lost の絆はグレーアウト表示で残し「記録」として保持。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「絆」リンクを追加し、ダメージを受けた絆がある場合は警告バッジを表示。`src/lib/supabase.ts` の `CharacterBond` 型に `created_at` を確認して型追記（未定義なら追加）。
**コミット:** `feat: character bond score management for DG/CoC7 bond mechanics`

## [DONE] クトゥルフ神話技能 → SAN 上限自動連動チェック — 優先度: 高
**対象:** PL / 共通
**概要:** CoC7版のコアルール「SAN最大値 = 99 − クトゥルフ神話技能の現在値」を自動でチェックし、神話技能値が上がった際に san_max の更新を提案するUI。現在は san_max と神話技能が独立管理されており、ルール上の制約が手動管理になっている。
**実装ヒント:** `src/app/_components/SkillList.tsx` で技能名が「クトゥルフ神話」または "Cthulhu Mythos" のとき、current_value 変更後に `const newSanMax = 99 - newValue` を算出し、現在の `san_max` と異なる場合は「SAN最大値を ${newSanMax} に更新しますか？」のインラインバナーを表示。確認後に `supabase.from("characters").update({ san_max: newSanMax }).eq("id", characterId)` を実行（`san_current > newSanMax` のときは san_current も newSanMax にクランプする旨を警告）。キャラクター詳細ページのSANサマリーセクションにも「神話技能: X → SAN上限: ${99 - X}」インジケーターを追加（`character_skills` から「クトゥルフ神話」を検索）。追加DBなし。
**コミット:** `feat: auto SAN max cap from Cthulhu Mythos skill per CoC7 rules`

## [DONE] タグ横断フィルタ（キャラクター・シナリオ・NPC共通タグ検索） — 優先度: 低
**対象:** PL / KP / 共通
**概要:** `Tag` テーブルと `EntityTag`（entity_type: character/scenario/npc に対応）を活用して、タグクリック1つでキャラクター・シナリオ・NPCをまたいで絞り込める横断タグブラウザページを提供する。既存グローバル検索（名前・テキスト検索）を補完し、「ホラー」「現代」「一人用」などのジャンルタグで素早く目的のデータを発見できるようにする。
**実装ヒント:** `src/app/tags/page.tsx` を Server Component で新規作成。`supabase.from("tags").select("*")` でタグ一覧を取得しタグクラウド表示。各タグをクリックすると `src/app/tags/[tagId]/page.tsx`（Server Component）へ遷移し、`supabase.from("entity_tags").select("entity_type, entity_id").eq("tag_id", tagId)` で紐づく全エンティティを取得し、entity_type ごとにセクション分けして character / scenario / npc の詳細をカード表示（各テーブルへの追加クエリで名前等を補完）。`src/app/_components/NavBar.tsx` に「タグ」リンクを追加。`TagSelector.tsx`（既存）での選択結果をこのページへ誘導するリンクも追加。追加DBなし（既存 `tags`・`entity_tags` テーブルを活用）。
**コミット:** `feat: cross-entity tag browser for filtering characters, scenarios, and NPCs`

## [DONE] ここフォリア（CCFOLIA）キャラクターコマJSON出力 — 優先度: 高
**対象:** PL / 共通
**概要:** キャラクターのHP/MP/SAN・能力値・チャットパレットをCCFOLIA（ここフォリア）のキャラクターコマ仕様JSON形式で出力し、VTTツールへ直接インポートできる機能。既存のBCDiceチャットパレット（テキスト出力）を補完し、コマデータごと書き出せるようにする。
**リサーチ根拠:** Charaenoの「ここふぉりあコマ出力」が最も多く言及される差別化機能であり、オンセ勢の標準的なワークフローに組み込まれていることが複数記事・レビューで確認された。
**実装ヒント:** `src/app/characters/[id]/ccfolia-export/page.tsx` を "use client" で新規作成。CCFOLIAのCharacter Room Object仕様（`{"kind":"character","data":{"name":...,"status":[{"label":"HP","value":X,"max":Y},{"label":"MP",...},{"label":"SAN",...}],"params":[{"label":"STR","value":"X"},...],"commands":"...","imageUrl":""}}`）に従いJSONを構築。`supabase.from("characters").select("*, character_skills(*)")` で全データ取得し、`character_skills` からBCDiceコマンドを生成して `commands` フィールドに連結。JSONをテキストエリアに表示しコピーボタン＋.jsonファイルダウンロードボタンを配置。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「CCFOLIAコマ出力」リンクを追加。追加DBなし（既存 `characters`, `character_skills` を流用）。
**コミット:** `feat: CCFOLIA character piece JSON export for VTT import`

## [DONE] キャラクター/探索者アバター画像登録 — 優先度: 中
**対象:** PL / 共通
**概要:** キャラクターに外部URLまたはSupabase Storageへのアップロードで立ち絵・アバター画像を登録し、キャラクター詳細・プロフィールカード・CCFOLIA コマ出力の `imageUrl` フィールドに反映できる機能。
**リサーチ根拠:** いあキャラ ver2.0.0 の大型アップデートで画像登録が最も歓迎された機能であり、Charaeno・キャラ保管所を含む主要CoC管理ツール全てが画像登録機能を持つことが確認された。
**実装ヒント:** `characters` テーブルに `avatar_url: text | null` カラムをALTER TABLEで追加。`src/lib/supabase.ts` の `Character` 型に `avatar_url: string | null` を追加。`src/app/_components/CharacterForm.tsx` にURL入力欄を追加（まずはURL入力のみ、後でSupabase Storage対応可）。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）のヘッダーに `<img>` タグで表示（未設定時はデフォルトシルエット）。プロフィールカード（`src/app/characters/[id]/profile-card/page.tsx`）にも画像を反映。CCFOLIAコマ出力の `imageUrl` にも連携。追加DBカラムのみ（新テーブルなし）。
**コミット:** `feat: character avatar image registration for profile and VTT integration`

## [DONE] AI探索者バックストーリー自動生成（Claude API） — 優先度: 中
**対象:** PL / 共通
**概要:** 職業・能力値・時代設定を入力するとClaude APIが探索者のバックストーリー・性格特質・外見描写の下書きを自動生成するAI支援機能。キャラ作成の中で最も時間がかかる「設定考え」フェーズを支援する。
**リサーチ根拠:** CS CAT（2025年登場、trpg-japan.com掲載）とCthulhu Helper App（App Store）がAI支援キャラ作成を実装して注目を集めており、AIでCoC探索者の設定を補完する需要が明確に高まっていることを確認した。
**実装ヒント:** `src/app/api/characters/generate-background/route.ts` をAPI Routeで新規作成。リクエストBODYで `{ occupation, era, str, con, pow, dex, app, siz, int, edu }` を受け取り、`@anthropic-ai/sdk` の `anthropic.messages.create()` で `claude-haiku-4-5-20251001` モデルを使用（コスト重視）。プロンプト例: 「CoC7版探索者として [occupation]・[era]設定の背景（100字）・性格特質（50字）・外見（50字）を日本語で提案してください」。`src/app/characters/[id]/traits/page.tsx`（探索者特質ページ）に「AIで設定を生成」ボタンを追加し、生成結果をフォームのtextareaにプレビュー表示後にユーザーが編集・確定できる形にする。`.env.local` に `ANTHROPIC_API_KEY` が必要（READMEに追記）。追加DBなし（既存 `character_traits` テーブルを流用）。
**コミット:** `feat: AI-assisted backstory generation for investigators using Claude API`

## [DONE] キャラクターシート閲覧専用URL公開 — 優先度: 中
**対象:** PL / 共通
**概要:** キャラクターシートを「読み取り専用の公開URL」として生成し、アカウントなしで閲覧できるページを提供する。KPがPLのキャラシートを事前確認したり、セッション募集時に自分のキャラを他者に見せたりする用途に使える。ハンドアウト共有URL（`share_tokens`）とは独立したキャラシート専用フロー。
**リサーチ根拠:** Charaenoの「公開URLで誰でもキャラシートを閲覧できる」機能がユーザーレビューで高評価を得ており、キャラクター保管所でも公開/非公開設定が標準機能として定着していることを確認した。
**実装ヒント:** `characters` テーブルに `public_token: uuid | null DEFAULT null` カラムをALTER TABLEで追加。`src/lib/supabase.ts` の `Character` 型に `public_token: string | null` を追加。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「公開URLを生成」ボタン（"use client" コンポーネント `PublicShareButton.tsx` として新規作成）を追加し、クリックで `crypto.randomUUID()` を生成して `supabase.from("characters").update({ public_token })` で保存後にURLをクリップボードにコピー。`src/app/public/characters/[token]/page.tsx` を新規作成（Server Component、Supabase認証不要）。`supabase.from("characters").select("*, character_skills(*), inventory_items(*)").eq("public_token", token)` で取得し閲覧専用レイアウト（編集UIなし）で表示。「公開を無効化」ボタンで `public_token: null` にリセット。追加DBカラムのみ（新テーブルなし）。
**コミット:** `feat: public read-only character sheet URL for sharing without login`

## [DONE] 派生ステータス自動計算補助（キャラクター作成UI改善） — 優先度: 高
**対象:** PL / 共通
**概要:** キャラクター作成・編集フォームで能力値（STR/CON/POW/DEX/SIZ等）を入力した後に「派生値を自動計算」ボタンを押すと、CoC7版の計算式に基づいてHP_max・MP_max・SAN_start・ダメージボーナスを自動計算してフォームに反映する機能。既存の「能力値オートロール」はダイス振り機能のみでHP等の派生値は手動入力のままという不便を解消する。
**実装ヒント:** `src/app/_components/CharacterForm.tsx` に「派生値を自動計算」ボタンを追加（"use client"のまま）。クリック時に `hp_max = Math.floor((con + siz) / 10)` (CoC7版)、`mp_max = pow`、`san_start = pow * 5`、DBは STR+SIZの範囲表でダメージボーナス文字列を算出してstateに反映。手動修正も引き続き可能なよう上書き可能な入力欄のまま。6版キャラ（`rule_edition === "6th"`）では `hp_max = Math.floor((con + siz) / 2)` の別計算式を使う。追加DBなし。
**コミット:** `feat: auto-calculate derived stats from ability scores in character form`

## [DONE] シナリオ別探索者パーソナルフック管理 — 優先度: 中
**対象:** KP / PL / 共通
**概要:** シナリオ参加者（`scenario_participants`）ごとに「なぜこの探索者がシナリオに関わることになったか」という個人導入テキスト（パーソナルフック）を登録できる機能。ハンドアウトはKP→PL全体向けの情報配布だが、こちらはキャラクター単位の参加動機メモ。KPが各PLの動機を把握し、PL自身もセッション前に自分のキャラクターの立ち位置を確認するために使う。
**実装ヒント:** `scenario_participants` テーブルに `hook_text: text | null` カラムをALTER TABLEで追加。`src/lib/supabase.ts` の `ScenarioParticipant` 型に `hook_text: string | null` を追加。`src/app/scenarios/[id]/participants/page.tsx` の各参加者行に「フックを編集」インラインテキストエリア（"use client"）を追加し、`supabase.from("scenario_participants").update({ hook_text }).eq("id", id)` で保存。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）のパーティーセクションにフックが設定済みの参加者数バッジを追加。
**コミット:** `feat: personal hook text per participant for scenario intro management`

## [DONE] セッションタイマーウィジェット（KP用時間管理） — 優先度: 低
**対象:** KP / 共通
**概要:** セッション全体の経過時間をリアルタイムで計測できるシンプルなタイマーウィジェット。既存の `ScenePacingList.tsx` は場面の開始/終了の手動記録だが、こちらはリアルタイムのカウントアップタイマー。セッション残り時間を把握し、KPがペース管理に使う。ページリロードしても状態が保持されるよう `localStorage` に保存する。
**実装ヒント:** `src/app/scenarios/[id]/timer/page.tsx` を "use client" で新規作成。`useState` でタイマーの状態（running/paused/stopped, elapsed_seconds, lap_times）を管理し、`useEffect` で `setInterval` を使った秒刻みカウントアップを実装。`localStorage` の `session_timer_<scenario_id>` キーに elapsed_seconds と started_at を保存し、リロード後もタイマーが継続する。ラップ機能で場面ごとの経過時間も記録可能。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「タイマー」リンクを追加。追加DBなし。
**コミット:** `feat: session timer widget with localStorage persistence for KP pacing`

## [DONE] AIシナリオシノプシス生成（KP向けシナリオ概要自動下書き） — 優先度: 中
**対象:** KP
**概要:** KPがシナリオのタイトル・舞台・主要キーワード（例：「1920年代ボストン、行方不明の教授、イカれた儀式」）を入力するとClaude APIがシノプシス（synopsis）とGMメモ下書きを生成してくれる機能。既存の `AIBackstoryGenerator.tsx`（探索者バックストーリー自動生成）のシナリオ版。白紙状態のシナリオ作成を加速する。
**実装ヒント:** `src/app/_components/AIScenarioDraftGenerator.tsx` を "use client" で新規作成。タイトル・舞台・時代・キーワード・プレイ人数入力 → `/api/ai/scenario-draft/route.ts`（POST）に送信 → Anthropic SDK `claude-sonnet-5` で「CoCシナリオのシノプシスとGMメモを日本語で生成」プロンプトを呼ぶ → 結果をテキストエリアに表示し「このシノプシスを使う」ボタンで `ScenarioForm` の synopsis フィールドに反映。`src/app/scenarios/new/page.tsx` に「AIで概要を下書き」ボタンとして組み込む。追加DBなし。
**コミット:** `feat: AI scenario synopsis draft generator for KP using Claude API`

## [DONE] AI NPC会話サンプル生成（セッション中発話サポート） — 優先度: 中
**対象:** KP
**概要:** NPCの `speech_style`・`purpose`・`sample_quotes` を元に、特定シチュエーション（例:「尋問される」「緊急事態に遭遇」）での発話例をClaude APIが自動生成し、KPがセッション中の即興ロールプレイに即座に使える機能。AI探索者バックストーリー（DONE）・AIシナリオシノプシス（TODO）に続くAI支援シリーズとして、NPC発話の即興コストを大幅に下げる。
**実装ヒント:** `src/app/_components/NpcDialogueGenerator.tsx` を "use client" で新規作成。状況テキスト入力 → `/api/ai/npc-dialogue/route.ts`（POST）に `{ npcId, situation }` を送信 → Supabaseで NPC の `speech_style`・`purpose`・`sample_quotes` を取得し、`claude-haiku-4-5-20251001` モデルで「このNPCならどう言うか」を日本語で3パターン生成 → テキストエリアに表示。NPC詳細ページ（`src/app/npcs/[id]/page.tsx`）の下部に「発話例を生成」ボタンとして配置。追加DBなし。
**コミット:** `feat: AI NPC dialogue sample generator for in-session roleplay support`

## [DONE] AIセッションサマリー自動生成（プレイログ語り直し） — 優先度: 中
**対象:** PL / 共通
**概要:** セッションログ（`sessions`テーブル）の summary・san_loss・hp_loss と、そのセッション中のダイスロールハイライト（クリティカル/ファンブル）をインプットに、Claude APIがリプレイ風のナラティブ要約（200〜300字）を自動生成する機能。手書き要約の負担を減らし、後から見返したときに読み応えある記録として残せる。
**実装ヒント:** `src/app/_components/SessionSummaryGenerator.tsx` を "use client" で新規作成。セッションログ一覧（`src/app/characters/[id]/sessions/page.tsx`）の各ログカードに「AIでまとめを生成」ボタンを配置。`/api/ai/session-summary/route.ts`（POST）で `{ sessionId, characterId }` を受け取り、`supabase.from("sessions").select("*").eq("id", sessionId)` + `supabase.from("dice_rolls").select("*").eq("character_id", characterId).gte("rolled_at", session.played_at)` でデータ取得後、`claude-haiku-4-5-20251001` で「TRPGリプレイ風の短い語り」を生成。結果をテキストエリアに表示し「このサマリーで更新」ボタンで `sessions.summary` に上書き保存するオプションを提供。追加DBなし。
**コミット:** `feat: AI session summary generator for narrative log recap`

## [DONE] スナップショット前後比較ビュー（セッション成長差分） — 優先度: 中
**対象:** PL
**概要:** 既存のキャラクタースナップショット保存機能（`CharacterSnapshot`、SnapshotSaveButton.tsx DONE）を活用し、任意の2スナップショットを選択して能力値・技能値・HP/SANの変化を差分表示するビュー。「セッション前スナップショット vs 現在」を比較することで、セッション中の成長・損失を一目で確認できる。
**実装ヒント:** `src/app/characters/[id]/snapshot-compare/page.tsx` を "use client" で新規作成。`supabase.from("character_snapshots").select("*").eq("character_id", id).order("created_at", {ascending: false})` でスナップショット一覧を取得し、2件をプルダウンで選択。`snapshot_data`（JSONB）に保存されている能力値・技能値を比較し、変化した項目を色分け表示（増加→緑、減少→赤、変化なし→グレー）。追加DBなし（既存 `character_snapshots` テーブルを流用）。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「スナップショット比較」リンクを追加。
**コミット:** `feat: snapshot diff view to compare character state before and after session`

## [DONE] シナリオ参加者募集ページ（公開告知リンク） — 優先度: 低
**対象:** KP / 共通
**概要:** KPがシナリオの公開告知ページ（タイトル・あらすじ概要・開催予定日・プレイ人数・難易度・タグ）を生成し、URLをDiscord/SNSで共有してプレイヤーを募集できる機能。現在シナリオ情報はKP専用ダッシュボード内にのみ存在し、外部の潜在プレイヤーへ告知する手段がない。
**実装ヒント:** `src/app/scenarios/[id]/recruit/page.tsx` を Server Component で新規作成（Supabase認証不要・公開アクセス可）。`supabase.from("scenarios").select("id, title, synopsis, difficulty, min_players, max_players, content_tags, next_session_at").eq("id", id)` でパブリックに必要なフィールドのみ取得（`gm_notes` は非表示）。難易度バッジ・タグチップ・参加定員・次回予定日をカード形式で表示。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「募集ページを共有」ボタンを追加しURLをクリップボードにコピー。追加DBなし（既存Scenarioフィールドを活用）。
**コミット:** `feat: public scenario recruitment page for gathering players via shared link`

## [DONE] シナリオ手がかりボード（KP視点） — 優先度: 高
**対象:** KP
**概要:** KPがシナリオ全体の手がかり（ScenarioClue）を一覧管理し、「誰が何を発見したか・調査中か・解決済みか」をセッション進行に合わせてリアルタイム更新できるKP専用ページ。既存の `characters/[id]/clues/page.tsx` は各PL自身の手がかり記録用だが、こちらはKPが全参加者の進捗を俯瞰するビューとなる。
**実装ヒント:** `src/app/scenarios/[id]/clues/page.tsx` を "use client" で新規作成。`supabase.from("scenario_clues").select("*, characters(name)").eq("scenario_id", id).order("created_at")` でシナリオに紐づく手がかりを全取得（`scenario_clues`のscenario_idカラムを使用）。status（`found`/`investigating`/`resolved`）をselectで変更できる行内UIを実装し `supabase.from("scenario_clues").update({status}).eq("id", clueId)` で即時更新。手がかり追加フォーム（title, content, character_id任意）もインラインで提供。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「手がかり管理」リンクを追加。追加DBなし（既存 `scenario_clues` と `ScenarioClue` 型を流用）。
**コミット:** `feat: scenario clue board for KP to track investigation progress`

## [DONE] プレイヤー詳細ページ — 優先度: 中
**対象:** KP
**概要:** `players/page.tsx` でプレイヤー一覧は表示できるが、個人詳細ページが存在しない。KPが特定プレイヤーの連絡先（Discord・その他）・嗜好ジャンル・過去参加シナリオ・使用してきた探索者を一画面で確認できるプロフィールページ。セッション招集や配役選定に使う。
**実装ヒント:** `src/app/players/[id]/page.tsx` を Server Component で新規作成。`supabase.from("players").select("*").eq("id", id)` でプレイヤー取得。`supabase.from("scenario_participants").select("*, scenarios(title, status), characters(name, occupation)").eq("player_id", id).order("created_at", {ascending: false})` で参加履歴を取得。contact_discord・contact_other・preferred_genre・notesをセクション分けして表示。`src/app/players/page.tsx` の各プレイヤー行に `/players/[id]` へのリンクを追加。`src/lib/supabase.ts` の `Player` 型はそのまま流用。追加DBなし。
**コミット:** `feat: player profile page with scenario history and contact info`

## [DONE] 探索者コンディション管理ページ — 優先度: 中
**対象:** PL / 共通
**概要:** セッション中に発生する一時的状態異常（毒・失血・束縛・恐怖・盲目・衰弱等）をキャラクター単位で管理する専用ページ。現在 `ConditionBadgeEditor.tsx` がキャラクター詳細ページに埋め込まれているが、状態が多い場合に一覧管理・ON/OFFトグル・カラーコード表示ができる独立ページが不足している。
**実装ヒント:** `src/app/characters/[id]/conditions/page.tsx` を "use client" で新規作成。`supabase.from("character_conditions").select("*").eq("character_id", id).order("is_active", {ascending: false})` で取得し、アクティブなコンディションを上部に表示。各カードにON/OFFトグル（`supabase.from("character_conditions").update({is_active}).eq("id", id)`）と削除ボタンを配置。新規追加フォームは condition_name（テキスト）・color（カラーピッカーまたはselectで「赤/黄/青/緑」）・notes（任意）を入力。既存の `CharacterCondition` 型を流用。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「コンディション」リンクを追加し、アクティブ件数をバッジ表示。追加DBなし。
**コミット:** `feat: character condition management page for in-session status tracking`

## [DONE] クリーチャー遭遇SANチェック一括ロール — 優先度: 高
**対象:** KP / 共通
**概要:** クリーチャー詳細ページからシナリオを選択し、参加者全員にクリーチャーのSAN喪失値（成功/失敗）でSANチェックを一括実行してキャラクターのsan_currentを即時更新できる機能。遭遇するたびに手動でSANチェックを個別実行する手間を1クリック化する。
**実装ヒント:** `src/app/creatures/[id]/page.tsx` に「パーティーSANチェック」ボタンを持つ "use client" コンポーネント（`src/app/_components/CreatureSanCheckButton.tsx`）を追加。モーダルでシナリオを選択後、`supabase.from("scenario_participants").select("*, characters(*)").eq("scenario_id", scenarioId)` で参加者取得。各キャラの `san_current` に対して `creature.san_loss_success` / `san_loss_failure` のダイス式をパースして振り、判定結果と喪失量を一覧表示しつつ `supabase.from("characters").update({ san_current })` を並列更新。`Creature.san_loss_success` / `san_loss_failure` フィールドを流用。追加DBなし。
**コミット:** `feat: batch SAN check from creature encounter for whole party`

## [DONE] PC間アイテム受け渡し — 優先度: 中
**対象:** PL / 共通
**概要:** インベントリのアイテムを同シナリオの別キャラクターへ譲渡できる機能。パーティー内でのリソース共有（包帯・懐中電灯・拳銃の貸し借り）をセッション中に記録できる。現在は各自のインベントリが独立しており、移動手段がない。
**実装ヒント:** `src/app/characters/[id]/inventory/page.tsx` の各アイテムカードに「渡す」ボタンを追加（"use client" 化）。シナリオ参加者リストを `supabase.from("scenario_participants").select("*, characters(id, name)").eq("scenario_id", ...)` で取得してターゲットを選択、`supabase.from("inventory_items").update({ character_id: targetId }).eq("id", itemId)` で移転。対象シナリオが未設定のキャラは全キャラ一覧から選択するフォールバックを提供。追加DBなし。
**コミット:** `feat: item transfer between characters within a party`

## [DONE] NPC感情状態トラッカー — 優先度: 中
**対象:** KP
**概要:** シナリオ中にNPCのPLへの態度（好意的/中立/敵対的/未知）をリアルタイム更新・管理できる機能。NPCとの関係推移をセッション中に一画面で俯瞰でき、KPが台詞トーンや行動選択の判断に役立てられる。
**実装ヒント:** Supabaseに `npc_dispositions` テーブルを追加（id, npc_id, scenario_id, disposition: "friendly"|"neutral"|"hostile"|"unknown", notes, updated_at, created_at）。シナリオNPC管理ページ（`src/app/scenarios/[id]/npcs/page.tsx`）の各NPCカードに態度セレクター（色付きバッジ切り替え）を追加し `supabase.from("npc_dispositions").upsert(...)` で即時保存。NPC詳細ページ（`src/app/npcs/[id]/page.tsx`）にも直近シナリオでの態度を表示。`src/lib/supabase.ts` に `NpcDisposition` 型を追加。
**コミット:** `feat: NPC disposition tracker for real-time attitude management`

## [DONE] セッション前キャラクター自己紹介シート — 優先度: 低
**対象:** PL / 共通
**概要:** PLがセッション前に「今回のキャラクター紹介」を定型フォーマット（動機・秘密の目標）で書いてシナリオ参加者全員で共有できるページ。参加者同士が互いのキャラクターを事前に把握してセッションをスムーズに始められる。
**実装ヒント:** Supabaseに `session_introductions` テーブルを追加（id, scenario_id, character_id, motivation, secret_goal, created_at）。`src/app/scenarios/[id]/introductions/page.tsx` を新規作成。各参加キャラの紹介カードを横並び表示し、キャラクター既存フィールド（catchphrase, speech_style, occupation）と新規 `motivation`/`secret_goal` を組み合わせて表示。編集はキャラクター所有者のみ（認証チェック）。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「自己紹介シート」リンクを追加。`src/lib/supabase.ts` に `SessionIntroduction` 型を追加。
**コミット:** `feat: pre-session character introduction sheet for party sharing`

## [DONE] キャラクター神話遭遇記録 — 優先度: 高
**対象:** PL
**概要:** キャラクターが直接遭遇した神話生物・神格・アーティファクトをセッション単位で記録し、キャラクター固有の「神話体験ログ」として蓄積できる機能。既存の `mythos/page.tsx` はグローバル参照ページだが、こちらはキャラクターの体験値としての遭遇履歴に特化する。
**実装ヒント:** Supabaseに `character_mythos_encounters` テーブルを追加（id, character_id, entity_name, entity_type: "creature"|"deity"|"artifact"|"spell"|"other", session_label, san_lost, notes, encountered_at, created_at）。`src/app/characters/[id]/mythos-log/page.tsx` を新規作成（一覧＋追加フォーム）。既存クリーチャーテーブル（`creatures`）からの参照選択と、自由入力の両方を提供。遭遇エンティティごとにSAN喪失累計を集計表示。`src/lib/supabase.ts` に `CharacterMythosEncounter` 型を追加。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）と `preflight/page.tsx` に「神話遭遇ログ」リンクを追加。
**コミット:** `feat: character mythos encounter log per investigator`

## [DONE] セッションハイライト投票（ベストシーン記録） — 優先度: 中
**対象:** PL / KP / 共通
**概要:** セッション終了後にKP・PLが「最も印象的だったシーン/瞬間」を自由テキストで投稿し合い、シナリオ単位でハイライト集として閲覧できる機能。既存の `session-review/page.tsx` や `reflections/page.tsx` はログ/振り返りだが、こちらは参加者全員が「名シーン投票」として盛り上がれる一覧を指向する。
**実装ヒント:** Supabaseに `session_highlights` テーブルを追加（id, scenario_id, author_name, character_name, scene_description, category: "roll"|"rp"|"story"|"comedy"|"tragedy"|"other", liked_count: int DEFAULT 0, created_at）。`src/app/scenarios/[id]/highlights/page.tsx` を "use client" で新規作成（カード一覧＋投稿フォーム）。いいね数は `supabase.from("session_highlights").update({ liked_count: prev + 1 }).eq("id", id)` で楽観的更新。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「ハイライト」リンクを追加。`src/lib/supabase.ts` に `SessionHighlight` 型を追加。
**コミット:** `feat: session highlight voting for memorable scene collection`

## [DONE] GMメモ全文検索（グローバル検索拡張） — 優先度: 中
**対象:** KP
**概要:** 現在のグローバル検索（`src/app/search/page.tsx`）はシナリオのタイトル・キャラクター名・NPC名が対象で、シナリオの `gm_notes`（GMメモ）本文は検索できない。シナリオが増えると過去のGMメモを探すのに時間がかかるため、gm_notes内テキスト検索を追加する。
**実装ヒント:** `src/app/search/page.tsx` の `runSearch` 内 `Promise.all` に `supabase.from("scenarios").select("id, title, gm_notes, status").ilike("gm_notes", \`%${q}%\`)` を追加。結果セクションに「GMメモ」セクションを追加し、マッチ箇所前後50文字を抜粋表示（キーワードをハイライト）。各結果はシナリオ詳細ページ（`/scenarios/[id]`）へリンク。追加DBなし。
**コミット:** `feat: extend global search to include scenario GM notes content`

## [DONE] 技能カテゴリ別レーダービュー（スキルバランス可視化） — 優先度: 低
**対象:** PL
**概要:** キャラクターの技能値をカテゴリ別（戦闘/探索/対人/学術/芸術・製作/その他）に平均集計し、各軸の強み・弱みをレーダーチャート風のCSSビジュアルで表示するページ。現在の `dice-stats/page.tsx` はロール頻度・成功率の集計だが、こちらは「育て方のバランス」を一目で俯瞰する用途に特化する。
**実装ヒント:** `src/app/characters/[id]/skill-radar/page.tsx` を新規作成（Server Component）。`supabase.from("character_skills").select("*").eq("character_id", id)` で技能取得後、技能名に基づいてカテゴリに分類（例: 格闘/射撃/回避/鎧→戦闘、目星/聴耳/図書館→探索、説得/心理学/言いくるめ→対人、etc.）してカテゴリ平均を算出。レーダーチャートはCSSの clip-path またはSVG polygon で依存ライブラリ不要。追加DBなし。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「スキルレーダー」リンクを追加。
**コミット:** `feat: skill category radar view for character balance visualization`

## [DONE] パーティー能力値比較テーブル — 優先度: 高
**対象:** KP / 共通
**概要:** シナリオ参加者全員の8能力値（STR/CON/POW/DEX/APP/SIZ/INT/EDU）を横並びの表で一覧表示するビュー。既存のパーティービューはHP/MP/SANのみで、戦闘時の対抗判定・難易度調整に必要な能力値が確認できない。KPが即座に参照できるようにする。
**実装ヒント:** `src/app/scenarios/[id]/party-stats/page.tsx` を新規作成（Server Component）。`supabase.from("scenario_participants").select("*, characters(*)").eq("scenario_id", id)` で参加者＋キャラデータを一括取得。各能力値を縦軸・キャラを横軸にした `<table>` でグリッド表示。行ごとに最大値のセルを強調（`font-bold text-emerald-600`）。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「能力値比較」リンクを追加。追加DBなし（既存 `scenario_participants`, `characters` を流用）。
**コミット:** `feat: party ability score comparison table per scenario`

## [DONE] NPCプリセットライブラリ管理 — 優先度: 中
**対象:** KP
**概要:** よく使うNPCの雛形（職業・能力値・外見メモ込み）をプリセットとして保存・管理し、シナリオ作成時に1クリックでNPCとして展開できるライブラリ機能。`NpcPreset` 型は `src/lib/supabase.ts` に定義済みだが管理UIが存在しない。
**実装ヒント:** `src/app/npc-presets/page.tsx`（一覧）と `src/app/npc-presets/new/page.tsx`（作成フォーム）を新規作成。フォームは `NpcForm.tsx` を参考に `NpcPreset` 型に合わせた occupation_name・能力値・外見入力欄で構成。NPC詳細ページ（`src/app/npcs/[id]/page.tsx`）またはNPC一覧ページ（`src/app/npcs/page.tsx`）に「プリセットとして保存」ボタンを追加し `supabase.from("npc_presets").insert(...)` で保存。NPC新規作成ページ（`src/app/npcs/new/page.tsx`）にプリセット選択 select を追加して選択値をフォームに自動入力。`src/app/_components/NavBar.tsx` に「NPCプリセット」リンクを追加。追加DBなし（`npc_presets` テーブルは既存想定）。
**コミット:** `feat: NPC preset library for quick NPC deployment`

## [DONE] 探索者心理統合ビュー（フォビア・狂気・SAN推移一覧） — 優先度: 高
**対象:** PL
**概要:** 現在フォビア（phobia）・狂気記録（madness_records）・SAN推移グラフはそれぞれ別ページに分散しており、セッション中にキャラクターの精神状態を素早く把握しにくい。これら3種の情報を1ページに統合した「心理プロファイル」ページを追加する。
**実装ヒント:** `src/app/characters/[id]/mental-health/page.tsx` を新規作成（Server Component + "use client" 子）。`Promise.all` で `supabase.from("character_phobias").select("*").eq("character_id", id)`・`supabase.from("madness_records").select("*").eq("character_id", id)`・`supabase.from("sessions").select("session_number, san_loss").eq("character_id", id).order("session_number")` を並行取得。ページ上部にアクティブな狂気バッジ（赤）とフォビア（橙）を横並びで表示、中段にSAN残量の推移バー（セッション番号順）、下部に狂気・フォビアの全履歴を並べる。既存の `PhobiaList.tsx`・`MadnessList.tsx` コンポーネントを import して流用。追加DBなし。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「心理プロファイル」リンクを追加。
**コミット:** `feat: integrated mental health profile combining phobias, madness, and SAN trend`

## [DONE] シナリオ開始前参加確認ハブ（出席確認・フック配布一括） — 優先度: 中
**対象:** KP / 共通
**概要:** セッション当日にKPが「誰が来るか」「各PLのフックを渡したか」を一画面で管理できるハブページ。現在 `AttendanceToggle.tsx` と `hook_text`（ScenarioParticipant）は実装済みだが、参加者全員の出欠＋フック配布状況を一覧できるKP専用ページが存在しない。
**実装ヒント:** `src/app/scenarios/[id]/session-prep/page.tsx` を "use client" で新規作成。`supabase.from("scenario_participants").select("*, characters(name, hp_current, hp_max, san_current, san_max), players(display_name, contact_discord)").eq("scenario_id", id)` で全参加者データ取得。参加者ごとに ①出欠ステータス（attending/absent/unconfirmed）トグル（`AttendanceToggle.tsx` 流用）、②フックテキスト表示・インライン編集、③キャラHP/SAN残量バッジを横一列で表示。参加人数サマリー（出席N/全体M）をページ上部に表示。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「セッション準備」リンクを追加。追加DBなし。
**コミット:** `feat: session prep hub with attendance confirmation and hook distribution`

## [DONE] シナリオ手がかり管理（クルートラッカー） — 優先度: 高
**対象:** KP / PL / 共通
**概要:** シナリオ内の手がかりを「未発見／調査中／解決済み」で追跡できる機能。`ScenarioClue`型（found/investigating/resolved, character_id）がsupabase.tsに定義済みだが管理UIが存在しない。謎解きシナリオで「どのPLがどの手がかりを持っているか」をKPとPL双方が把握できる。
**実装ヒント:** `src/app/scenarios/[id]/clues/page.tsx` を "use client" で新規作成。`supabase.from("scenario_clues").select("*, characters(name)").eq("scenario_id", id)` で手がかり一覧取得（character_idはNULL許容のため全シナリオClueをselectし`scenario_id`で絞る形でも可）。手がかりカードはステータス（found=緑/investigating=黄/resolved=灰）と担当キャラ名を表示。インライン追加フォームで title・content・status・character_id（select）を入力。ステータス変更は各カードのボタンで `supabase.from("scenario_clues").update({status})` を呼ぶ。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「手がかり管理」リンクを追加。追加DBなし（既存`scenario_clues`テーブルを流用）。
**コミット:** `feat: scenario clue tracker for mystery investigation management`

## [DONE] 神話遭遇記録（ミュトス遭遇ログ） — 優先度: 中
**対象:** PL
**概要:** キャラクターがクトゥルフ神話的存在（クリーチャー・神格・遺物・呪文等）と遭遇した記録を残せる機能。`CharacterMythosEncounter`型（entity_name, entity_type, san_lost, session_label等）がsupabase.tsに定義済みだが専用ページが存在しない。神話知識（Cthulhu Mythos技能）成長の背景を記録し、キャラクターの「知ってしまった者」としての履歴を可視化する。
**実装ヒント:** `src/app/characters/[id]/mythos/page.tsx` を新規作成（Server Component + "use client" フォーム子コンポーネント）。`supabase.from("character_mythos_encounters").select("*").eq("character_id", id).order("encountered_at", {ascending: false})` で遭遇履歴取得。各カードに entity_name・entity_type バッジ・san_lost・session_label・notes を表示。entity_typeは "creature"|"deity"|"artifact"|"spell"|"other" の select で実装。追加フォームはインライン。`src/lib/supabase.ts` の `CharacterMythosEncounter` 型は既存のまま使用。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「神話遭遇記録」リンクを追加。追加DBなし。
**コミット:** `feat: mythos encounter log tracking character's cosmic horror experiences`

## [DONE] キャラクター絆スコア管理 — 優先度: 中
**対象:** PL
**概要:** キャラクターが大切にする人物との「絆スコア」「絆ダメージ」「喪失済みフラグ」を管理できる機能。`CharacterBond`型（bond_score, damage_taken, is_lost, target_name, notes）がsupabase.tsに定義済みだが専用ページが存在しない。CoC7版の絆ルールやDG系ルールに対応し、セッションを通じた絆の変化を追跡する。
**実装ヒント:** `src/app/characters/[id]/bonds/page.tsx` を "use client" で新規作成。`supabase.from("character_bonds").select("*").eq("character_id", id).order("created_at")` で絆一覧取得。各絆カードに target_name・bond_score（大きな数字表示）・damage_taken（赤バッジ）・is_lost（打ち消し線＋グレーアウト）・notes を表示。bond_score と damage_taken はインライン+/-ボタンで即時更新（`supabase.from("character_bonds").update(...)`）。is_lost のトグルで絆喪失状態を記録。追加フォームで新規絆追加。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「絆管理」リンクを追加。追加DBなし（既存`character_bonds`テーブルを流用）。
**コミット:** `feat: character bond score management for CoC7 bond mechanics`

## [DONE] セッションハイライト記録 — 優先度: 低
**対象:** PL / KP / 共通
**概要:** セッション後に「この名場面・名判定・名台詞が最高だった」という瞬間をシナリオ単位で投稿し、参加者全員でいいねして振り返れる機能。`SessionHighlight`型（scene_description, category, liked_count, author_name, character_name等）がsupabase.tsに定義済みだが専用ページが存在しない。セッション後のアフタートークを盛り上げ、記録として残す。
**実装ヒント:** `src/app/scenarios/[id]/highlights/page.tsx` を "use client" で新規作成。`supabase.from("session_highlights").select("*").eq("scenario_id", id).order("liked_count", {ascending: false})` でハイライト一覧取得。category（roll=ダイス/rp=RP/story=物語/comedy=笑い/tragedy=感動/other）のタブフィルタを設置。各カードにいいねボタン（`supabase.from("session_highlights").update({liked_count: liked_count+1})`）と author_name・character_name を表示。追加フォームは scene_description（テキストエリア）・category（select）・author_name・character_name の入力のみでシンプルに実装。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「ハイライト」リンクを追加。追加DBなし（既存`session_highlights`テーブルを流用）。
**コミット:** `feat: session highlight board for post-session reflection and sharing`

## [DONE] ホームダッシュボード（マイページ） — 優先度: 高
**対象:** PL / KP / 共通
**概要:** ポータル全体の起点となるホーム画面。ピン留めキャラ・進行中シナリオ・直近のセッション予定・最近のダイスロール・未読メッセージ数を一画面に集約し、セッション前後の素早いナビゲーションを提供する。現状はトップページがキャラ一覧になっており、複数機能を持つヘビーユーザーに入口が不足している。
**実装ヒント:** `src/app/dashboard/page.tsx` を新規作成（Server Component）。`Promise.all` で `characters`（is_pinned=true）、`scenarios`（status="ongoing"）、`sessions`（最新5件）、`character_messages`（is_read=false のカウント）を並行取得。各セクションをカード形式で縦スタック配置。`src/app/_components/NavBar.tsx` のナビリンクに「ダッシュボード」を先頭追加。追加DBなし。
**コミット:** `feat: home dashboard aggregating characters, scenarios, and recent activity`

## [DONE] シナリオNPC相関マップ — 優先度: 中
**対象:** KP
**概要:** シナリオに登場するNPC同士・NPCとキャラクター間の関係をビジュアル相関図で確認できる機能。現在キャラクター単位の関係グラフ（`relation-graph/page.tsx`）は存在するが、シナリオ内の全NPC相関を俯瞰するビューが欠如しており、複雑な人間関係のシナリオでKPが設定を見失いやすい。
**実装ヒント:** `src/app/scenarios/[id]/npc-map/page.tsx` を新規作成（"use client"）。`supabase.from("npcs").select("*").eq("scenario_name", scenario.title)` でNPC取得。各NPCを絶対位置配置のカード（`position: absolute`）として表示し、NPCの `purpose` や `faction` をツールチップで参照できる簡易マップを構成。NPC間の線は `faction` が同じものをグループ色で表示（SVG `<line>` 要素）。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「NPC相関マップ」リンクを追加。追加DBなし。
**コミット:** `feat: scenario NPC relationship map for KP reference`

## [DONE] キャラクター活躍統計レポート — 優先度: 中
**対象:** PL
**概要:** 全セッションを通じたキャラクターの「総セッション数・累計SAN喪失量・累計HP喪失量・最多使用技能・成功率トップ3・ファンブル回数」を集計し、キャラクターの冒険の軌跡を数字で振り返れるレポートページ。既存のタイムライン・判定統計とは異なり、「通算成績」に特化したサマリービュー。
**実装ヒント:** `src/app/characters/[id]/career-report/page.tsx` を新規作成（Server Component）。`Promise.all` で `sessions`（character_id）と `dice_rolls`（character_id）を並行取得。sessions から累計san_loss・hp_lossと総セッション数を集計。dice_rollsから技能別の成功数/総判定数を計算し成功率ランキングを生成。ファンブル（success_level="fumble"）カウントも別掲。CSSのみで表示（追加ライブラリなし）。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「活躍レポート」リンクを追加。追加DBなし。
**コミット:** `feat: character career report summarizing lifetime stats across all sessions`

## [DONE] エンカウンター難易度チェッカー — 優先度: 低
**対象:** KP
**概要:** シナリオに登録されたクリーチャーとパーティーキャラクターのステータスを比較し、エンカウンターの大まかな難易度（安全/普通/危険/壊滅）を推定するKP支援ツール。クリーチャー（`creatures`テーブル）と参加キャラ（`scenario_participants`→`characters`）の既存データを活用するため追加DBなし。
**実装ヒント:** `src/app/scenarios/[id]/difficulty/page.tsx` を新規作成（"use client"）。`supabase.from("creatures").select("*").eq("scenario_id", id)` でクリーチャー取得、`supabase.from("scenario_participants").select("*, characters(*)").eq("scenario_id", id)` でキャラデータ取得。クリーチャー総HP合計 vs パーティー平均HP・ダメージボーナス等の簡易計算で難易度スコアを算出（ヒューリスティックな数式でOK）。結果を「安全🟢/普通🟡/危険🟠/壊滅🔴」の4段階バッジで表示。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「難易度チェック」リンクを追加。
**コミット:** `feat: encounter difficulty checker comparing creatures vs party stats`

## [DONE] 探索者名言録（キャラクター語録・名セリフ集） — 優先度: 中
**対象:** PL / 共通
**概要:** セッション中のキャラクターの名セリフ・印象的な行動・決め台詞をシナリオ単位で記録・管理できる機能。`session_highlights`（セッション全体向け）とは異なりキャラクター個人の語録として蓄積する。公開プロフィールページ（`/c/[slug]`）にも表示してキャラクターの個性を伝える。
**実装ヒント:** Supabaseに `character_quotes` テーブルを追加（id, character_id, scenario_name, quote_text, context, session_label, created_at）。`src/app/characters/[id]/quotes/page.tsx` を新規作成（一覧＋追加フォーム）。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「名言録」リンクを追加。公開ページ（`src/app/c/[slug]/page.tsx`）にも抜粋表示。`src/lib/supabase.ts` に `CharacterQuote` 型を追加。追加DBあり（`character_quotes` テーブル）。
**コミット:** `feat: character quote log for memorable in-session lines`

## [DONE] セッション前チェックイン（参加者コンディション確認） — 優先度: 中
**対象:** KP / 共通
**概要:** セッション開始前にPLが「今日の体力・気分（1〜5段階）」と「一言（期待・懸念事項）」をシナリオに紐づけて報告できるフォーム。KPがセッション前に参加者全員のコンディションを把握し、必要なら内容調整ができる。セッション安全ツール（X-Card / `scenario_safety_settings`）の補完として機能する。
**実装ヒント:** Supabaseに `player_checkins` テーブルを追加（id, scenario_id, character_id, energy_level: smallint 1-5, comment: text | null, checked_in_at: timestamptz）。`src/app/scenarios/[id]/checkin/page.tsx` を "use client" で新規作成。PLがキャラクターを選択してenergy_level（星UI）とcommentを入力し `supabase.from("player_checkins").upsert(...)` で保存。KP向けに全参加者のチェックイン結果を一覧表示するセクションを同ページに配置。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「チェックイン」リンクを追加。`src/lib/supabase.ts` に `PlayerCheckin` 型を追加。追加DBあり（`player_checkins` テーブル）。
**コミット:** `feat: pre-session player check-in for wellbeing and expectation sharing`

## [DONE] セッションカレンダーiCalエクスポート（外部カレンダーアプリ連携） — 優先度: 低
**対象:** PL / KP / 共通
**概要:** シナリオの `next_session_at` を RFC 5545 準拠の .ics ファイルとしてエクスポートし、Google Calendar・Apple Calendar等の外部カレンダーアプリにセッション予定を1クリックで登録できる機能。既存のカレンダービュー（`/calendar/page.tsx`）を補完し、普段使いのカレンダーとの連携でセッション忘れを防ぐ。
**実装ヒント:** `src/app/api/calendar/ical/route.ts` を新規作成（GET APIルート）。`supabase.from("scenarios").select("id, title, next_session_at, synopsis").not("next_session_at", "is", null)` で取得し、RFC 5545形式（BEGIN:VCALENDAR → BEGIN:VEVENT × N件 → END:VCALENDAR）のテキストを生成して `Content-Type: text/calendar` レスポンスとして返す。`src/app/calendar/page.tsx` に「カレンダーに登録（.ics）」ダウンロードボタンを追加（`<a href="/api/calendar/ical" download="trpg-sessions.ics">`）。個別シナリオ詳細ページ（`src/app/scenarios/[id]/page.tsx`）にも単一シナリオ用iCalダウンロードボタンを追加（クエリパラメータ `?id=` で絞り込み）。追加DBなし（既存 `scenarios.next_session_at` を流用）。
**コミット:** `feat: iCal export for syncing session dates to external calendar apps`

## [DONE] KP向けフィードバック集計ダッシュボード（複数フィードバック統合ビュー） — 優先度: 中
**対象:** KP
**概要:** 既存の3種のフィードバック収集機能（`scenario_player_ratings` の4軸評価・`session_reflections` の合同振り返り・`player_feedback` のPLアンケート）を1ページに集約し、KPがシナリオ全体の受け取り方を一画面で総合的に把握できるダッシュボード。現在は3種が別ページに分散しており、KPが全フィードバックを俯瞰する手段がない。
**実装ヒント:** `src/app/scenarios/[id]/feedback-summary/page.tsx` を新規作成（Server Component）。`Promise.all` で `supabase.from("scenario_player_ratings").select("*").eq("scenario_id", id)`・`supabase.from("session_reflections").select("*")`（scenario_idに紐づくsession_idを介して取得）・`supabase.from("player_feedback").select("*").eq("scenario_id", id)` を並行取得。4軸評価の平均スコアをCSSバーで表示、振り返りコメントとフィードバックコメントを統合一覧で created_at 降順表示。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「フィードバック総括」リンクを追加。追加DBなし（既存テーブルのみ）。
**コミット:** `feat: KP feedback summary dashboard integrating ratings, reflections, and player feedback`

## [DONE] セッション進行ライブコントロール（参加者全員ステータス更新パネル） — 優先度: 高
**対象:** KP
**概要:** セッション中にKPが参加全PCのHP/SAN/MPをリアルタイムで一覧・即時更新できるコントロールパネル。現状 `QuickStatEditor.tsx` はキャラクター個別ページに存在するが、全キャラ分を行き来する必要があり、セッション中の負荷が高い。
**実装ヒント:** `src/app/scenarios/[id]/live/page.tsx` を "use client" で新規作成。`supabase.from("scenario_participants").select("*, characters(id, name, hp_current, hp_max, mp_current, mp_max, san_current, san_max, status)").eq("scenario_id", id)` で参加者＋キャラデータ取得。各キャラカードに既存の `QuickStatEditor.tsx` を props で埋め込み（characterId・各stat値を渡す）。変更は即時 `supabase.from("characters").update(...)` で保存。全キャラのHP/SAN危険ライン（残25%以下）は赤枠ハイライト。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「ライブ進行」リンクを追加。追加DBなし。
**コミット:** `feat: live session control panel for real-time party stat management`

## [DONE] ポストセッションウィザード（成長チェックと各種記録の一括案内） — 優先度: 中
**対象:** PL / 共通
**概要:** セッション終了後にPLが行うべき作業（技能成長チェック・狂気記録更新・HP/SAN現在値修正・セッションログ記録）をステップ形式で案内するウィザードUI。記録漏れを防ぎ、セッション後処理の標準化を図る。
**実装ヒント:** `src/app/characters/[id]/post-session/page.tsx` を "use client" で新規作成。useState で currentStep (0〜3) を管理し、ステップごとに ①成長チェック付き技能一覧（`character_skills` の `growth_checked=true` を抽出）→ ②HP/SAN/MP現在値入力（`QuickStatEditor.tsx` 流用）→ ③狂気記録確認・追加（`MadnessList.tsx` 流用）→ ④セッションログ入力（`SessionLogForm.tsx` 流用）を順に表示。最終ステップ完了後「記録完了」バナーを表示しキャラ詳細ページへリダイレクト。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「セッション後記録」ボタンを追加。追加DBなし（既存テーブルのみ）。
**コミット:** `feat: post-session wizard guiding growth check and stat updates`

## [DONE] キャラクターアーカイブ（死亡・引退・発狂探索者追悼ページ） — 優先度: 中
**対象:** PL / 共通
**概要:** ステータスが `dead` / `insane` / `retired` のキャラクターを専用ページに一覧し、`farewell_scene` と `farewell_message` フィールドを大きく表示する追悼・記録ページ。現状メインのキャラ一覧に混在しており、過去キャラを振り返る場所がない。公開されているキャラはリンクも表示する。
**実装ヒント:** `src/app/archive/page.tsx` を新規作成（Server Component）。`supabase.from("characters").select("id, name, occupation, portrait_url, status, farewell_scene, farewell_message, public_slug, scenario_name").in("status", ["dead", "insane", "retired"]).order("updated_at", {ascending: false})` で取得。ステータスごとにセクション分け（死亡🕯/発狂🌀/引退🌸）。各カードは portrait_url サムネイル・名前・職業・farewell_message を表示。公開スラグがあれば `/c/[slug]` へのリンクを付ける。`src/app/_components/NavBar.tsx` に「アーカイブ」リンクを追加。追加DBなし。
**コミット:** `feat: character archive page for dead, insane, and retired investigators`

## [DONE] シナリオ素材・資料ライブラリ（BGM/マップ/参考画像リンク管理） — 優先度: 低
**対象:** KP
**概要:** KPがシナリオ準備時に収集した参考資料URL・BGMリンク・地図画像URLをタグと種別付きで一覧管理できるライブラリ機能。既存の `Material` 型（portrait/background/other）をシナリオ別に管理する専用UIとして実装し、セッション当日に素材を素早く呼び出せるようにする。
**実装ヒント:** `src/app/scenarios/[id]/materials/page.tsx` を "use client" で新規作成。`supabase.from("materials").select("*").contains("tags", [id])` でシナリオIDをタグとして絞り込むか、または `materials` テーブルに `scenario_id` カラムを追加する形で実装。インライン追加フォームで name・type（portrait/background/other）・storage_url（外部URLも可）・tags を入力し `supabase.from("materials").insert(...)` で保存。一覧はカード形式でstorage_urlを画像プレビュー（画像URL）またはリンク表示（その他URL）で分岐。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「素材ライブラリ」リンクを追加。`Material` 型は `src/lib/supabase.ts` に定義済み。
**コミット:** `feat: scenario material library for organizing BGM, maps, and reference links`

## [DONE] キャラクター一括ロングレスト（HP/MP/SAN最大値回復） — 優先度: 高
**対象:** PL / 共通
**概要:** セッション間の休息や拠点帰還時に、HP・MP・SANをまとめて最大値に回復できる「ロングレスト」ボタン。現在はQuickStatEditorで+/-を繰り返す必要があり手間がかかる。セッション前チェックリストやモバイルクイックダッシュボードから1タップで全ステータスをリセットできるようにする。
**実装ヒント:** `src/app/_components/LongRestButton.tsx` を "use client" で新規作成。props: characterId, hpMax, mpMax, sanMax。確認ダイアログ表示後に `supabase.from("characters").update({ hp_current: hpMax, mp_current: mpMax, san_current: sanMax }).eq("id", characterId)` を実行。`src/app/characters/[id]/preflight/page.tsx`（セッション前チェックリスト）と `src/app/characters/[id]/quick/page.tsx`（モバイルクイックダッシュボード）に配置。追加DBなし（既存`characters`テーブルのみ）。
**コミット:** `feat: long rest button to restore HP/MP/SAN to max in one click`

## [DONE] シナリオ完結エピローグ記録（各探索者の物語的結末） — 優先度: 中
**対象:** KP / PL / 共通
**概要:** シナリオ `status = "completed"` 後に、KPがシナリオ全体のエピローグテキストと各参加キャラクターのエンディングコメントを記録できるナラティブ記念ページ。KP振り返りノート（評価・改善点）とは異なり、「物語の結末」そのものを残す。
**実装ヒント:** Supabaseに `scenario_epilogues`テーブル（id, scenario_id UNIQUE, main_epilogue: text | null, created_at）と `character_endings`テーブル（id, scenario_id, character_id, ending_text: text | null, created_at）を追加。`src/app/scenarios/[id]/epilogue/page.tsx` を "use client" で新規作成（メインエピローグ入力＋参加者全員分のエンディング記述フォームを1ページに統合）。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）の `status === "completed"` 時のみ「エピローグを記録」リンクを表示。`supabase.from("scenario_epilogues").upsert(...)` でシナリオ1件につき1レコード管理。
**コミット:** `feat: scenario epilogue page for recording narrative endings per investigator`

## [DONE] エンカウンターテンプレート管理（複数クリーチャーセット保存） — 優先度: 中
**対象:** KP
**概要:** 「深きものども×3・星の落とし子×1」のような複数クリーチャーのセットをテンプレートとして名前付き保存し、戦闘管理ページへワンクリックで展開できる機能。クリーチャーカタログは個体の登録に特化しているが、こちらはエンカウンター単位の構成管理に特化する。
**実装ヒント:** Supabaseに `encounter_templates`テーブル（id, name, created_at）と `encounter_template_entries`テーブル（id, template_id, creature_id, count: integer DEFAULT 1, created_at）を追加。`src/app/encounter-templates/page.tsx` を新規作成（一覧＋作成フォーム、クリーチャーをselectして件数入力）。戦闘管理ページ（`src/app/scenarios/[id]/combat/page.tsx`）の「敵を追加」フォームに「テンプレートから追加」ボタンを配置し、選択したテンプレートのエントリをローカル敵リストにまとめてセット。追加DB2テーブル。
**コミット:** `feat: encounter template manager for bundling creature sets in combat`

## [DONE] パーティー共有アイテムボックス（シナリオ共有インベントリ） — 優先度: 中
**対象:** PL / KP / 共通
**概要:** シナリオ参加者全員がアクセスできる「共有アイテムBOX」機能。PC間アイテム受け渡し（所有権移転）とは異なり、誰でも出し入れできる共有ストレージとして管理する。予備の弾薬・医療品・情報メモなどパーティー共有リソースの管理に使う。
**実装ヒント:** Supabaseに `scenario_shared_items`テーブルを追加（id, scenario_id, name, item_type: "weapon"|"item", damage: text | null, notes: text | null, added_by: text | null, created_at）。`src/app/scenarios/[id]/shared-inventory/page.tsx` を "use client" で新規作成（一覧＋追加フォーム＋削除ボタン）。インライン入力フォームで name・item_type・damage・notes を入力し `supabase.from("scenario_shared_items").insert(...)` で追加。削除は `supabase.from("scenario_shared_items").delete().eq("id", id)` で実装。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「共有装備BOX」リンクを追加。既存の `InventoryForm.tsx` を参考に実装。
**コミット:** `feat: party shared item box for scenario-scoped communal inventory`

## [DONE] グローバルキーワード検索（キャラクター・シナリオ・NPC横断） — 優先度: 高
**対象:** 共通
**概要:** キャラクター名・シナリオ名・NPCメモを1つの検索窓から横断的に検索できるページ。個別の一覧ページ内フィルタでは見つからない情報を素早く発見できるようにする。
**実装ヒント:** `src/app/search/page.tsx` を "use client" で新規作成。input の onChange で `supabase.from("characters").select("id,name").ilike("name", \`%${q}%\`)` / `supabase.from("scenarios").select("id,title").ilike("title", \`%${q}%\`)` / `supabase.from("npcs").select("id,name,notes").or(\`name.ilike.%${q}%,notes.ilike.%${q}%\`)` を並行実行し結果をセクション別にレンダリング。各結果からキャラ詳細・シナリオ詳細・NPC詳細へリンク。Navbarに検索アイコン or リンクを追加（`src/app/_components/NavBar.tsx`）。追加DBなし。
**コミット:** `feat: global keyword search across characters, scenarios, and NPCs`

## [DONE] カスタムランダム表（再利用可能なd6〜d100ルックアップ表） — 優先度: 中
**対象:** KP
**概要:** 「邂逅する怪異の容貌」「戦利品種別」など、KPが独自作成した多面ダイス対応のランダムイベント表を保存・管理できる機能。既存のシナリオ別ランダムイベント（RandomEventList）はシナリオ限定だが、こちらはキャンペーンをまたいで再利用できるグローバルライブラリ。
**実装ヒント:** Supabaseに `random_tables`テーブル（id, name, dice_type: "d6"|"d8"|"d10"|"d12"|"d20"|"d100", created_at）と `random_table_entries`テーブル（id, table_id, roll_min: integer, roll_max: integer, result_text: text）を追加。`src/app/random-tables/page.tsx`（表一覧）と `src/app/random-tables/[id]/page.tsx`（エントリ編集＋ロールボタン）を新規作成。ロールは `Math.ceil(Math.random() * diceMax)` で実装し結果に対応する `result_text` をハイライト表示。`src/app/_components/DiceRoller.tsx` の実装を参考に。追加DB2テーブル。
**コミット:** `feat: custom random table library for reusable KP lookup tables`

## [DONE] 探索者の秘密メモ（PL専用の非公開キャラクター情報） — 優先度: 中
**対象:** PL
**概要:** PLが「キャラクターだけが知っている秘密の過去」「他のPCに隠している事実」などをキャラクター単位で記録できる非公開メモ機能。既存のクイックメモ（quick-notes）とは異なり、秘密の性質・重要度・KP共有フラグを持つ構造化データとして管理する。
**実装ヒント:** Supabaseに `character_secrets`テーブルを追加（id, character_id, title: text, content: text, severity: "minor"|"major"|"critical", share_with_kp: boolean DEFAULT false, created_at）。`src/app/characters/[id]/secrets/page.tsx` を "use client" で新規作成（一覧表示＋インライン追加フォーム＋削除）。severity をバッジ表示、share_with_kp のトグルは `supabase.from("character_secrets").update({ share_with_kp: v }).eq("id", id)` で更新。キャラ詳細ページ（`src/app/characters/[id]/page.tsx`）に「秘密メモ」リンクを追加。追加DB1テーブル。
**コミット:** `feat: character secrets memo for PL-private backstory and hidden facts`

## [DONE] 欠席探索者行動記録（セッション欠席キャラクターの在処ログ） — 優先度: 中
**対象:** KP / 共通
**概要:** PLが欠席したセッションで、そのキャラクターがシナリオ内でどう行動していたか（離脱理由・代理行動・復帰条件）をKPが記録できる機能。欠席管理をトグルで行うAttendanceToggleと組み合わせ、欠席者ごとに物語的整合性のあるメモを残す。
**実装ヒント:** Supabaseに `character_absences`テーブルを追加（id, scenario_id, character_id, session_number: integer | null, reason: text | null, action_taken: text | null, return_condition: text | null, created_at）。`src/app/scenarios/[id]/absences/page.tsx` を "use client" で新規作成。`supabase.from("campaign_participants").select("character_id, characters(name)")` で参加者を取得し、各キャラの欠席エントリを accordion 形式で表示。既存の `AttendanceToggle.tsx`（`src/app/_components/AttendanceToggle.tsx`）と `ParticipantList.tsx` を参考に実装。シナリオ詳細（`src/app/scenarios/[id]/page.tsx`）に「欠席者記録」リンクを追加。追加DB1テーブル。
**コミット:** `feat: absent character action log for in-fiction absence management`

## [DONE] 次回予告AIテキスト生成（セッション終了後の「次回予告」） — 優先度: 高
**対象:** KP / 共通
**概要:** セッション終了後にKPが「今回解決しなかったプロットスレッド・未回収のクリフハンガー・NPCの脅威」を入力すると、Claude APIが「次回予告」風の短いドラマティックなテキスト（100〜150字）を自動生成し、Discord共有やセッション開始前の読み上げに使える機能。既存の`SessionSummaryGenerator`（今回のセッション振り返り）とは異なり、「次回への期待と緊張感」を演出する前向きな煽りテキストに特化する。
**実装ヒント:** `src/app/_components/NextEpisodePreviewGenerator.tsx` を "use client" で新規作成。unresolved_threads（未解決の伏線）・cliffhanger（崖っぷち描写）・npc_threat（NPCの動き）を自由テキストで入力 → `/api/ai/next-episode-preview/route.ts`（POST）に送信 → `claude-haiku-4-5-20251001` で「TRPGリプレイ次回予告風の日本語テキストを生成」プロンプトを実行 → 生成テキストをコピーボタン付きで表示。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）の「セッション後」セクションに配置。`ScenarioDiscordWebhookEditor.tsx` を参考に Discord Webhook への直接送信オプションも追加可能。追加DBなし。
**コミット:** `feat: AI next-episode preview generator for dramatic session cliffhanger teasers`

## [DONE] KPシナリオ準備タスクリスト（セッション前カスタムチェックリスト） — 優先度: 中
**対象:** KP
**概要:** KPがシナリオごとにセッション前準備タスク（「ハンドアウト印刷」「BGMキュー確認」「NPC口調練習」「マップ準備」等）をカスタム登録し、当日チェックしながら消化できるリスト機能。既存の`SessionAgendaChecklist.tsx`はセッション中の進行順序管理だが、こちらは「セッション開始前の準備」に特化したKP専用の事前タスク管理ツール。シナリオ間で再利用できるテンプレートも保存可能。
**実装ヒント:** Supabaseに `scenario_prep_tasks` テーブルを追加（id, scenario_id, task_name: text, is_done: boolean DEFAULT false, sort_order: integer DEFAULT 0, created_at）。`src/app/scenarios/[id]/prep/page.tsx` を "use client" で新規作成。インライン追加フォームで task_name を入力し `supabase.from("scenario_prep_tasks").insert(...)` で保存。各タスクにチェックボックス（`supabase.from("scenario_prep_tasks").update({ is_done })`）とドラッグ不要のソートボタン（上/下矢印で sort_order 入れ替え）を配置。「テンプレートとして保存」ボタンでシナリオIDなしのレコードを `prep_task_templates` テーブル（id, task_name, sort_order, created_at）に保存し、次のシナリオ準備時に一括コピー可能。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「準備チェックリスト」リンクを追加。追加DB2テーブル。
**コミット:** `feat: KP scenario prep task checklist with template reuse`

## [DONE] 探索者の記念品コレクション（物語的意味を持つアイテム記録） — 優先度: 中
**対象:** PL
**概要:** 死亡したNPCの形見・呪われた遺物・特別な経緯で手に入れたアイテム等、ゲーム的なステータスより物語的意義が大きいアイテムをキャラクターごとに記録・展示できるコレクション機能。既存の`inventory_items`（武器/アイテムの戦闘・使用回数管理）とは異なり、セッション名と入手経緯・感情的重みをメインとする「思い出の品」専用ストレージ。探索者の人生の軌跡を物語として可視化する。
**実装ヒント:** Supabaseに `character_keepsakes` テーブルを追加（id, character_id, name: text, obtained_from: text | null, session_label: text | null, story_notes: text | null, is_lost: boolean DEFAULT false, created_at）。`src/app/characters/[id]/keepsakes/page.tsx` を "use client" で新規作成。各記念品カードに name・obtained_from（入手元NPC/シナリオ）・session_label・story_notes（入手時の経緯や感情）・is_lost（失った場合のフラグ、打ち消し線でグレーアウト）を表示。`is_lost` トグルで喪失状態を記録し、喪失した品も履歴として残す。インライン追加フォーム。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「記念品」リンクを追加。`src/app/characters/[id]/bonds/page.tsx` の実装を参考に。追加DB1テーブル。
**コミット:** `feat: character keepsake collection for narrative-significant story items`

## [DONE] キャンペーン年表（シナリオ横断イベント記録） — 優先度: 中
**対象:** KP / 共通
**概要:** キャンペーンに含まれる全シナリオを横断して「重要な出来事・死亡したキャラクター・解明された真実・世界に起きた変化」をタイムライン形式で記録できるページ。既存の`TruthTimeline.tsx`は単一シナリオの伏線年表だが、こちらは複数シナリオにまたがる「キャンペーン全体の歴史」を俯瞰する長期記録ツール。クトゥルフの邪神復活まで何が起きたのかを振り返れる。
**実装ヒント:** Supabaseに `campaign_events` テーブルを追加（id, campaign_id, scenario_id: text | null, event_date: text | null, event_title: text, event_description: text | null, event_type: "death"|"revelation"|"world_change"|"npc_action"|"player_action"|"other", created_at）。`src/app/campaigns/[id]/timeline/page.tsx` を "use client" で新規作成。`supabase.from("campaign_events").select("*, scenarios(title)").eq("campaign_id", id).order("event_date", {ascending: true})` でイベント一覧取得。縦型タイムラインUIで event_type ごとに色分けアイコン（死亡=赤の頭蓋骨、啓示=黄の電球、世界変化=青の地球）を付けて表示。インライン追加フォームで scenario_id（select）・event_date・event_title・event_type を入力。既存の `TruthTimeline.tsx`（`src/app/_components/TruthTimeline.tsx`）を参考に。キャンペーン詳細ページ（`src/app/campaigns/[id]/page.tsx`）に「キャンペーン年表」リンクを追加。追加DB1テーブル。
**コミット:** `feat: campaign-wide event timeline spanning multiple scenarios`

## [DONE] セッションフォーカスモード（プレイ中専用ミニマルUI） — 優先度: 低
**対象:** PL
**概要:** セッション中、PLが手元のスマートフォンで「今すぐ確認したい情報だけ」を表示する全画面フォーカスモードページ。HP/MP/SAN現在値バー・アクティブなコンディションバッジ・上位10技能と現在値・ダイスロールボタン・クイックメモ入力だけをシンプルなカード1枚に集約。既存の`quick/page.tsx`（モバイルクイックダッシュボード）より更に絞り込み、ナビゲーションとサイドバーを完全に非表示にする没入型UI。
**実装ヒント:** `src/app/characters/[id]/focus/page.tsx` を "use client" で新規作成。`<html>` の `overflow` を `hidden` にして全画面表示を確保。`supabase.from("characters").select("*, character_skills(*), character_conditions(*)")` で必要データ取得。ページ上部にHP/MP/SAN の3本バーを大きく表示（緑→黄→赤のグラデーション変化）。中段に `is_active: true` のコンディションバッジを表示。下段に `is_favorite: true` の技能TOP10を2列グリッドで表示し、タップでダイスロール（結果のトースト通知）。画面右下に固定フローティングの「メモ」アイコンでクイックノート入力モーダルを開く。Supabase Realtimeチャンネルで `characters` テーブルの `hp_current`/`mp_current`/`san_current` をリアルタイム購読し、他の参加者がKP側で更新した場合も即時反映（`supabase.channel("focus-mode-character-{id}").on("postgres_changes", ...)` パターン）。既存の `QuickStatsDisplay.tsx` と `DiceRoller.tsx` を参考に。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）の「クイックアクセス」セクションに「フォーカスモード」リンクを追加。追加DBなし。
**コミット:** `feat: session focus mode with fullscreen minimal UI for active play`

## [DONE] BGMシンクロ通知（KPがBGMキューを切り替えると全参加者へリアルタイム通知） — 優先度: 高
**対象:** KP / 共通
**概要:** 既存のBGMキューリスト（`bgm_cues`）に「再生」ボタンを追加し、KPが押すとSupabase Realtimeブロードキャストで全参加者に「現在の曲：[ラベル名]」とBGMリンクを即時通知する機能。VTT（ここフォリア等）のシーン切り替え時のBGM自動切替を補完し、外部通話ツールなしでも音楽演出の合図を共有できる。
**リサーチ根拠:** ここフォリアのシーン別BGM自動切り替えが「オンセの没入感を決定的に上げる」機能として複数ブログで高評価を受けており、既存の`bgm_cues`にリアルタイム通知を加えることでポータルとしてのVTT補完価値が大きく向上することが確認された。
**実装ヒント:** `src/app/scenarios/[id]/bgm/page.tsx` に「再生」ボタンを追加（"use client"化）。`supabase.channel('bgm-${scenarioId}').send({ type: 'broadcast', event: 'bgm_change', payload: { label, bgm_url } })` でブロードキャスト。`src/app/scenarios/[id]/party/page.tsx` または新規 `src/app/scenarios/[id]/bgm-player/page.tsx` で同チャンネルをsubscribeし「♪ Now Playing: [ラベル]」バナーを最上部に表示（`bgm_url` がYouTubeの場合はiframe埋め込みも選択肢）。追加DBなし（既存`bgm_cues`テーブルを流用、Realtime broadcast は揮発性）。
**コミット:** `feat: realtime BGM change notification broadcast for KP via Supabase Realtime`

## [DONE] セッション0サポート（PC関係構築と世界観合意フォーム） — 優先度: 中
**対象:** KP / PL / 共通
**概要:** キャンペーン開始前のSession 0（ゼロセッション）専用ページ。KPがPC間の初期関係性質問（「どこで知り合いましたか？」「誰を信頼していますか？」）を設定し、PLが各自で回答を入力してKPが一覧確認できる。既存の安全設定（`scenario_safety_settings`）・参加者フック（`hook_text`）と連携し、セッション開始前の合意形成を構造化する。
**リサーチ根拠:** 現代TRPGではSession 0がベストプラクティスとして広く普及しており（CoC7版ガイダンス・キャンペーン設定サプリ等）、参加者全員がキャラクター背景と関係性を事前に確認することでセッション満足度が向上することが複数のTRPGブログで確認された。
**実装ヒント:** Supabaseに `session_zero_questions` テーブルを追加（id, scenario_id, question_text, order_index, created_at）と `session_zero_answers` テーブルを追加（id, question_id, character_id, answer_text, created_at）。`src/app/scenarios/[id]/session-zero/page.tsx` を新規作成（"use client"）。KPは質問を追加、PLは自キャラとしてそれぞれ回答。全回答はKPビュー（質問ごとに参加者の回答を横並び）とPLビュー（自分の回答のみ）で表示分岐。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「Session 0」リンクを追加。`src/lib/supabase.ts` に `SessionZeroQuestion`, `SessionZeroAnswer` 型を追加。
**コミット:** `feat: session zero page for pre-campaign PC relationship and world building`

## [DONE] キャンペーン設定Wiki（世界観・用語・勢力ページ集） — 優先度: 中
**対象:** KP / 共通
**概要:** キャンペーンに紐づいた「世界観設定」「用語集」「勢力・組織情報」などをWiki形式のページ集として管理できる機能。現在のキャンペーン管理（`campaigns`テーブル）はシナリオのグループ化のみで、キャンペーン固有の世界設定ノートを記録する場所がない。長期キャンペーンでKPが設定の一貫性を保ち、PLも設定を参照できる。
**リサーチ根拠:** World Anvil（海外TRPG設定管理ツール）が「世界観Wiki」を核心機能として急速に普及しており、TRPGキャンペーンの設定資料をまとめたいニーズが国内外のレビューで繰り返し確認された。国内では`gm_notes`（テキスト1フィールド）に全設定を詰め込む現実があり、構造化された代替手段への需要が高い。
**実装ヒント:** Supabaseに `campaign_wiki_pages` テーブルを追加（id, campaign_id, title, content: text, page_type: "lore"|"faction"|"glossary"|"timeline"|"other", order_index: integer, created_at）。`src/app/campaigns/[id]/wiki/page.tsx` を新規作成（Server Component）でページ一覧をtype別タブで表示。`src/app/campaigns/[id]/wiki/[pageId]/page.tsx` を新規作成（"use client"）で個別ページ閲覧・編集（`<textarea>` + 保存ボタン）。`src/lib/supabase.ts` に `CampaignWikiPage` 型を追加。`src/app/campaigns/[id]/page.tsx` にWikiリンクと総ページ数バッジを追加。
**コミット:** `feat: campaign setting wiki for world lore, factions, and glossary`

## [DONE] セッション中リアルタイムチャット（シナリオ参加者間テキスト） — 優先度: 中
**対象:** PL / KP / 共通
**概要:** シナリオに紐づいたリアルタイムテキストチャット機能。Discordや外部通話ツールを使わないセッションや、セッション中の「OOC（Out of Character）コメント」をIn-charメッセージと分けて記録するのに使う。Supabase Realtimeのbroadcastで実装しDB保存は最小限。
**リサーチ根拠:** 国内TRPGポータルの多くはDiscordや外部チャットツールへの依存を前提にしているが、完全にポータル内で完結するセッション運営ニーズは特に少人数・初心者グループで高いことが複数のTRPG入門記事で確認された。ここフォリアのチャット機能の人気がそのニーズを示している。
**実装ヒント:** `src/app/scenarios/[id]/chat/page.tsx` を "use client" で新規作成。`supabase.channel('chat-${scenarioId}').on('broadcast', { event: 'message' }, payload => setMessages(prev => [payload, ...prev].slice(0, 100)))` でリアルタイム受信。送信時は `.send({ type: 'broadcast', event: 'message', payload: { author, text, timestamp } })` でブロードキャスト（揮発性のため永続化不要。必要なら `chat_messages` テーブルに保存オプションを追加）。メッセージ表示は最新100件をリストで表示し自動スクロール。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「チャット」リンクを追加し、KPオペレーション統合ビュー（`src/app/scenarios/[id]/ops/page.tsx`）のタブにも追加。追加DBなし（broadcast のみ）。
**コミット:** `feat: realtime in-session chat for scenario participants via Supabase Realtime`

## [DONE] 探索者In-characterジャーナル（セッション別キャラ視点日誌） — 優先度: 中
**対象:** PL
**概要:** PLがセッション終了後にキャラクター視点（1人称）で「今日感じたこと・気づいたこと・仲間への想い」を日誌として書き残せる機能。既存のセッションログ（`sessions`テーブル）はGM/PL共有のOOC記録だが、こちらはキャラクター本人が書く物語的・主観的な内面記録。長期キャンペーンでキャラクターの成長弧を振り返る一次資料となる。
**実装ヒント:** Supabaseに `character_journal_entries` テーブルを追加（id, character_id, session_label: text | null, entry_date: date | null, title: text, content: text, mood: "hopeful"|"fearful"|"determined"|"despairing"|"curious"|"numb" | null, is_private: boolean DEFAULT true, created_at）。`src/app/characters/[id]/journal/page.tsx` を "use client" で新規作成。エントリ一覧を `entry_date` 降順で表示し、インライン追加フォームで title・content（`<textarea>`）・mood（select）・session_label を入力。mood は絵文字バッジ（🌟希望 / 😨恐怖 / 💪決意 / 😔絶望 / 🔍好奇 / 😶麻痺）でビジュアル表示。`is_private: false` にすると公開キャラページ（`/c/[slug]`）でも表示可能。既存の `src/app/characters/[id]/bonds/page.tsx` の実装を参考に。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「日誌」リンクを追加。追加DB1テーブル。
**コミット:** `feat: character in-character journal for session-by-session first-person narrative entries`

## [DONE] シナリオ参加者へのKPブロードキャストメッセージ — 優先度: 中
**対象:** KP / 共通
**概要:** KPがシナリオに参加しているPL全員へ「次のセッションは来週日曜20時です」「ハンドアウト3を更新しました」等のテキスト通知を一斉送信できる機能。既存のキャラクター間In-characterメッセージ（`character_messages`）はPC間のIC通信で、BGMブロードキャスト（Supabase Realtime）は揮発性のリアルタイム通知だが、こちらはOOC・永続保存・既読管理付きの公式通知機能。
**実装ヒント:** Supabaseに `scenario_broadcasts` テーブルを追加（id, scenario_id, sender_character_id: uuid | null, title: text, body: text, created_at）と `scenario_broadcast_reads` テーブル（id, broadcast_id, character_id, read_at, created_at）を追加。`src/app/scenarios/[id]/broadcast/page.tsx` を "use client" で新規作成（KP向け送信フォーム＋送信済み一覧）。参加PLが `MessageInbox.tsx`（`src/app/_components/MessageInbox.tsx`）または `src/app/characters/[id]/messages/page.tsx` でブロードキャストを受信し既読マークを付けられるよう既存MessageInbox UIを拡張。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「通知送信」リンクを追加。追加DB2テーブル。
**コミット:** `feat: KP broadcast message system for scenario-wide participant notifications`

## [DONE] キャンペーン全体SAN推移グラフ（探索者健全度モニタリング） — 優先度: 中
**対象:** KP / 共通
**概要:** キャンペーンに参加している全探索者のSAN現在値をセッションごとに折れ線グラフで可視化するダッシュボード。「誰がいつSANを大きく失ったか」「パーティ全体の精神的消耗ペース」を一目で把握し、KPがシナリオ難易度やSAN回復機会を調整する際の判断材料となる。既存の `campaigns/[id]/stats/page.tsx` は参加者・シナリオ数などの集計だが、SAN値の時系列推移に特化したグラフはない。
**実装ヒント:** `src/app/campaigns/[id]/san-graph/page.tsx` を新規作成（Server Component）。`supabase.from("sessions").select("san_loss, played_at, scenario_id, scenarios(campaign_id)").eq("scenarios.campaign_id", id)` と `supabase.from("campaign_participants").select("character_id, characters(name, san_current, san_max)")` を `Promise.all` で並行取得。セッション日付順にSAN損失を累積し「初期SAN − セッションごとの累積SAN損失」で各時点のSAN推定値を算出。CSSのみの折れ線グラフ（SVG pathを手書き）かシンプルな棒グラフでキャラクター別に色分け表示。「SAN 0近づき警告」として現在SANが初期値の30%以下のキャラクターをハイライト。追加DBなし（既存テーブルのみ使用）。キャンペーン詳細ページ（`src/app/campaigns/[id]/page.tsx`）に「SAN推移グラフ」リンクを追加。
**コミット:** `feat: campaign-wide SAN transition graph for party mental health monitoring`

## [DONE] 探索者の未解決疑問リスト（セッション中の謎メモ） — 優先度: 低
**対象:** PL
**概要:** PLがセッション中に「なぜ◯◯なのか」「あのNPCの目的は何か」「◯◯の地下に何があるのか」などキャラクターが抱える謎・疑問を箇条書きで記録し、解決したものにチェックを付けて管理できる機能。既存の`clues/page.tsx`（キャラクターが持つ手がかり）は「わかったこと」の記録だが、こちらは「まだわからないこと・調べたいこと」の疑問管理。タブレット・スマホでセッション中に素早く追記できるシンプルUIを指向する。
**実装ヒント:** Supabaseに `character_mysteries` テーブルを追加（id, character_id, question: text, context_notes: text | null, is_resolved: boolean DEFAULT false, resolved_at: timestamptz | null, created_at）。`src/app/characters/[id]/mysteries/page.tsx` を "use client" で新規作成。未解決リストと解決済みリストを上下に分けて表示（解決済みは打ち消し線付きグレーでアコーディオン折りたたみ）。チェックボタンで `supabase.from("character_mysteries").update({ is_resolved: true, resolved_at: new Date().toISOString() })` を実行。テキスト入力フォームからワンタップで追加。既存の `src/app/characters/[id]/clues/page.tsx` の実装を参考に。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「謎リスト」リンクを追加。追加DB1テーブル。
**コミット:** `feat: character mystery list for tracking unresolved questions during sessions`

## [TODO] 戦闘イニシアティブトラッカー（セッション中の行動順管理） — 優先度: 高
**対象:** KP / 共通
**概要:** セッション中の戦闘ラウンドでPC・NPC全員の行動順（イニシアティブ値）をリアルタイムで管理できるツール。現在のターンを強調表示し「次のキャラクターへ」ボタンで順番を進める。KPがNPCの値を入力し、PLが自分のキャラクターの値を入力してSupabase Realtimeで全員の画面に即時反映される。戦闘開始・終了・ラウンドリセットにも対応する。
**実装ヒント:** `src/app/scenarios/[id]/initiative/page.tsx` を "use client" で新規作成。Supabaseに `initiative_entries` テーブルを追加（id, scenario_id, label: text, initiative_value: integer, is_npc: boolean DEFAULT false, is_active: boolean DEFAULT false, order_index: integer, created_at）。`supabase.channel('initiative-${scenarioId}').on('postgres_changes', { event: '*', schema: 'public', table: 'initiative_entries', filter: `scenario_id=eq.${id}` }, ...)` でリアルタイム同期。エントリは `initiative_value` 降順でソートし、`is_active: true` のエントリを強調表示（背景色変化 + 矢印アイコン）。「次へ」ボタンで現在アクティブエントリの次を `is_active: true` に更新。ラウンド数カウンターも表示。既存の `src/app/_components/NpcQuickRoller.tsx` と `DiceRoller.tsx` を参考にダイスロール連携追加も可。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「戦闘トラッカー」リンクを追加。追加DB1テーブル。
**コミット:** `feat: combat initiative tracker with realtime sync for session combat management`

## [TODO] セッション後PL満足度フィードバック（KP向け改善ダッシュボード） — 優先度: 中
**対象:** PL / KP / 共通
**概要:** セッション終了後にPLが「楽しさ・緊張感・KPのファシリテーション・また遊びたいか」を5段階評価で記録し、KPが全シナリオ・キャンペーン単位での満足度推移をダッシュボードで確認できる機能。既存のセッションログ（`sessions`テーブル）や`session_summary`はOOC記録だが、PLの主観的体験・満足度の定量データを収集する仕組みはない。KPが自分のGMスタイルを改善するための定量フィードバックループを提供する。
**実装ヒント:** Supabaseに `session_feedback` テーブルを追加（id, session_id, character_id, fun_rating: smallint CHECK (1-5), tension_rating: smallint CHECK (1-5), facilitation_rating: smallint CHECK (1-5), would_replay: boolean, free_comment: text | null, is_anonymous: boolean DEFAULT false, created_at）。`src/app/scenarios/[id]/feedback/page.tsx` を "use client" で新規作成。PLビューは星5段階UIで4項目を評価して送信（送信後は編集不可、KPには匿名オプション）。KPビューは各評価項目の平均値をシナリオ一覧で表示し、`src/app/campaigns/[id]/feedback-stats/page.tsx` でキャンペーン全体の満足度推移をSVGバーチャートで可視化。`src/lib/supabase.ts` に `SessionFeedback` 型を追加。追加DB1テーブル。
**コミット:** `feat: post-session player satisfaction feedback with KP improvement dashboard`

## [TODO] KP用カスタムランダムテーブル（セッション中ダイス引き） — 優先度: 中
**対象:** KP
**概要:** KPが独自のランダムイベント表を事前に作成し、セッション中にダイスを振って結果を即時参照できる機能。既存の`RandomEventList`コンポーネントは固定イベントを閲覧するものだが、こちらはd4/d6/d8/d10/d12/d20に対応した「KPが中身を定義するカスタム表」で、シナリオ固有の「遭遇表」「症状表」「目撃者反応表」等を作成できる。
**実装ヒント:** Supabaseに `custom_tables` テーブルを追加（id, scenario_id, table_name: text, dice_type: "d4"|"d6"|"d8"|"d10"|"d12"|"d20", created_at）と `custom_table_entries` テーブルを追加（id, table_id, roll_value: smallint, result_text: text, created_at）。`src/app/scenarios/[id]/custom-tables/page.tsx` を "use client" で新規作成。表一覧と各表のインライン編集（table_name・dice_type を設定し、各ロール値に対応するテキストを入力）。「ロール！」ボタンで `Math.ceil(Math.random() * dice_sides)` を実行し、対応する `result_text` をハイライト表示（アニメーション付き）。既存の `src/app/_components/RandomEventList.tsx` と `DiceRoller.tsx` を参考に。シナリオ詳細ダッシュボード（`src/app/scenarios/[id]/page.tsx`）に「ランダム表」リンクを追加。追加DB2テーブル。
**コミット:** `feat: custom random tables for KP with in-session dice roll and result display`

## [TODO] キャンペーン横断アーティファクトコレクション（重要アイテム記録） — 優先度: 低
**対象:** KP / 共通
**概要:** キャンペーンを通して発見・入手した魔術書・アーティファクト・重要アイテム（クトゥルフ神話に関わる品物）をコレクション形式で記録する機能。既存の`TomeForm`は個別シナリオの魔術書登録、`InventoryForm`はキャラクター所持品管理だが、こちらはキャンペーン全体の「何を手に入れたか・それが世界にどう影響したか」を重要度付きで記録する歴史的資料。ネクロノミコン等の有名なアーティファクトのフレーバーテキストをAIで生成するオプションも検討できる。
**実装ヒント:** Supabaseに `campaign_artifacts` テーブルを追加（id, campaign_id, scenario_id: text | null, name: text, description: text | null, artifact_type: "tome"|"weapon"|"relic"|"key_item"|"other", rarity: "common"|"rare"|"legendary", current_holder_character_id: uuid | null, is_destroyed: boolean DEFAULT false, discovered_at: timestamptz | null, notes: text | null, created_at）。`src/app/campaigns/[id]/artifacts/page.tsx` を "use client" で新規作成。カードグリッドでアーティファクトを表示し、`rarity` ごとに枠線の色を変える（コモン=グレー、レア=青、レジェンダリー=金）。`current_holder_character_id` で現在の所持者を表示しドロップダウンで移譲可能。`is_destroyed: true` になったものは赤の打ち消し線で表示。`src/lib/supabase.ts` に `CampaignArtifact` 型を追加。キャンペーン詳細ページ（`src/app/campaigns/[id]/page.tsx`）に「アーティファクト」リンクを追加。追加DB1テーブル。
**コミット:** `feat: campaign artifact collection for tracking cross-scenario key items and relics`
