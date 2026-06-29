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

## [TODO] PDFシートエクスポート — 優先度: 中
**対象:** PL / 共通
**概要:** キャラクターシート全体（ステータス・技能・所持品）をA4 PDF形式でダウンロードできる機能。既存のJSONエクスポートを補完し、印刷・オフラインセッション用途に対応する。
**リサーチ根拠:** Charaeno・PrismScroll Cthulhu・Roll20等の主要ツールが全てPDF出力をサポートしており、オフラインセッション・印刷需要がユーザーから継続的に挙げられている。
**実装ヒント:** `src/app/_components/PdfExportButton.tsx` を "use client" で新規作成。ブラウザの `window.print()` + 印刷用CSSメディアクエリ（`@media print`）方式で実装するか、`react-to-print` ライブラリを使用。印刷対象コンポーネント `src/app/characters/[id]/print/page.tsx` を新規作成し、ステータス・技能・所持品を1ページに収めるレイアウトで構成。キャラクター詳細ページのヘッダーに「PDF出力」ボタンを追加。
**コミット:** `feat: PDF character sheet export for offline/print use`

## [TODO] キャラクター紹介カード — 優先度: 中
**対象:** PL / 共通
**概要:** キャラクターの名前・外見・職業・背景・能力値ハイライトをSNS共有向けのカード形式で表示し、画像としてダウンロードできる機能。セッション前の自己紹介や卓外での共有に使う。
**リサーチ根拠:** Charaenoの「キャラ紹介」機能やいあキャラのプロフィールカードが人気を集めており、SNSでのキャラ共有・セッション募集時の自己紹介ニーズが高いことが確認された。
**実装ヒント:** `src/app/characters/[id]/profile-card/page.tsx` を新規作成。`html2canvas` ライブラリでカードDOMをCanvas化し PNG ダウンロード。カードレイアウトはキャラ名・職業・外見テキスト・HP/SAN/能力値サマリを縦に配置する `src/app/_components/ProfileCard.tsx` で実装（"use client"）。OGP用途に `/api/characters/[id]/og` ルートも将来追加可能な構造にする。キャラクター詳細ページに「紹介カード」リンクを追加。
**コミット:** `feat: character profile card for SNS sharing`

## [TODO] シナリオ参加キャラクター管理 — 優先度: 高
**対象:** KP / 共通
**概要:** KPがシナリオに参加するキャラクターを登録し、セッションの参加者を一画面で把握できる機能。既存のシナリオ・キャラクター両データと連携する。
**実装ヒント:** Supabaseに `scenario_participants` テーブルを追加（id, scenario_id, character_id, created_at）。`src/app/scenarios/[id]/participants/page.tsx` を新規作成（一覧＋キャラクター選択フォーム）。`src/lib/supabase.ts` に `ScenarioParticipant` 型を追加。シナリオ一覧ページ（`src/app/scenarios/page.tsx`）の各カードに参加者数バッジを追加。
**コミット:** `feat: scenario participant management linking characters to scenarios`

## [TODO] キャラクター一覧フィルタ・検索 — 優先度: 中
**対象:** PL / 共通
**概要:** 複数キャラクターを管理するプレイヤー向けに、名前・職業・ステータス（alive/dead/insane/retired）でリアルタイムフィルタできる検索UIをキャラ一覧ページに追加する。
**実装ヒント:** `src/app/characters/page.tsx` を "use client" 化し、useState で `nameQuery`, `statusFilter`, `occupationQuery` を管理。`supabase.from("characters").select("*")` で全件取得後クライアントサイドでフィルタ（件数が多い場合は `.ilike()` クエリに切り替え可）。検索バー＋ステータスselectを既存 CharacterCard グリッドの上部に配置。追加DBなし。
**コミット:** `feat: character list filter and search by name, occupation, status`

## [TODO] シナリオ詳細ダッシュボード — 優先度: 中
**対象:** KP
**概要:** シナリオのNPC一覧・ハンドアウト・参加者・セッション概要を一画面で確認できるKP専用の詳細ページ。各データへのナビゲーションハブとして機能する。
**実装ヒント:** `src/app/scenarios/[id]/page.tsx` を新規作成（現在は未実装）。`supabase.from("scenarios").select("*").eq("id", id)` でシナリオ取得。同一ページ内で `npcs`（scenario_nameで絞り込み）と `handouts`（scenario_idで絞り込み）のカウントをサマリー表示。`src/app/scenarios/[id]/handouts/page.tsx` と `participants/page.tsx` へのカードリンクを配置。シナリオ一覧（`src/app/scenarios/page.tsx`）の各カードを `/scenarios/[id]` へリンクするよう修正。
**コミット:** `feat: scenario detail dashboard with NPC, handout, and participant summary`

## [TODO] キャラクタータイムライン（年表） — 優先度: 低
**対象:** PL
**概要:** セッションログを時系列で可視化し、キャラクターの成長・出来事・SAN喪失の流れを年表形式で振り返れるビュー。既存のSessionLogデータを流用するため追加DBなし。
**実装ヒント:** `src/app/characters/[id]/timeline/page.tsx` を新規作成。`supabase.from("sessions").select("*").eq("character_id", id).order("session_number", {ascending: true})` でログ取得。各セッションを縦線上のノードとして表示（CSS border-leftで疑似タイムライン）。SAN喪失量に応じてノードの色を変える（例: san_loss >= 5 で赤、1-4 で黄）。キャラクター詳細ページ（`src/app/characters/[id]/page.tsx`）に「年表」リンクを追加。
**コミット:** `feat: character session timeline visualization`
