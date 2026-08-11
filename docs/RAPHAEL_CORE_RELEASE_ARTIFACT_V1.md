# RaphaelCore Release Artifact V1 / RaphaelCore 發行物 V1

Status: clean-rebase implementation in progress. This document does not declare
a GitHub Release, production pin, HMAX deployment, or Nexus Link live
integration.

狀態：正在以合併後的乾淨 `main` 重新建立。本文不代表已建立 GitHub
Release、production pin、HMAX 部署或 Nexus Link 正式接線。

## Purpose / 目的

Produce one deterministic and reviewable ESM directory from the canonical
RaphaelCore HMAX adapter closure. An operator must know exactly which Core,
contract, authority policy, source commit, and bytes are being loaded.

從 canonical RaphaelCore 的 HMAX adapter 依賴閉包，產生一個可重現、可審查的
ESM 目錄。操作端必須能確認載入的是哪個 Core、contract、權限政策、來源
commit 與實際檔案內容。

## Sealed contents / 封存內容

The allowlist is `release/core-artifact-policy.v1.json`. V1 contains exactly:

```text
adapters/hmax/index.js
contracts/runtimeContract.js
core/canonicalCoreAdapter.js
core/sovereignSafetyPolicy.js
manifest.json
SHA256SUMS
```

The runtime closure has no package dependency and no external or dynamic
import. It excludes model weights, corpus, training data, Nexus adapters,
gateway labs, memory storage, database clients, credentials, transcripts,
analytics, browser access, tool execution, and game reducers.

這個 runtime 閉包沒有套件依賴，也不允許 external 或 dynamic import。內容不含
模型權重、語料、訓練資料、Nexus adapter、gateway lab、記憶儲存、資料庫
client、憑證、聊天原文、分析資料、瀏覽器、工具執行或遊戲 reducer。

## Authority boundary / 權限邊界

- The artifact exposes cognition and safety decisions only.
- Model candidates remain `trusted:false`.
- `health()` must report `modelAuthority:false` and
  `directGameMutation:false`.
- No exported API may write Nexus Link reward, Growth, relationship state,
  save data, or durable memory.
- HMAX may load only an artifact that matches an operator-owned digest pin.
- A digest proves byte identity; it is not a JavaScript sandbox. Source review,
  CI, and explicit operator approval remain mandatory.

- 發行物只提供認知與安全決策介面。
- 模型候選永遠維持 `trusted:false`。
- `health()` 必須回報 `modelAuthority:false` 與
  `directGameMutation:false`。
- 輸出 API 不得寫入 Nexus Link reward、Growth、關係狀態、存檔或耐久記憶。
- HMAX 只能載入符合操作端外部 digest pin 的發行物。
- Digest 只能證明 byte identity，不是 JavaScript sandbox；仍必須經過原始碼
  審查、CI 與操作端明確核准。

## Integrity model / 完整性模型

1. Text is normalized to UTF-8/LF before hashing, so Windows and Linux
   checkouts produce the same payload bytes.
2. Every payload file has an individual SHA-256 and byte count.
3. The artifact digest binds repository, source commit, dirty/release state,
   format, policy digest, Core/contract versions, entrypoint, exports,
   authority report, and ordered file records.
4. `SHA256SUMS` binds every payload file and `manifest.json`.
5. Verification requires an externally supplied expected digest; reading a
   digest only from the artifact itself is not a trust anchor.
6. Verification rejects unknown files, symlinks/junctions, unknown schema
   fields, invalid paths, out-of-closure imports, ambiguous import syntax,
   missing exports, version mismatch, and unhealthy Core authority.
7. The builder rejects required source files reached through symlinks or
   junctions before reading or importing them.
8. The verifier rejects `releaseEligible:false` unless local inspection
   explicitly passes `--allow-non-release`.

1. 雜湊前一律正規化為 UTF-8/LF，避免 Windows 與 Linux 產生不同 payload。
2. 每個 payload 檔案都有獨立 SHA-256 與 byte count。
3. Artifact digest 會綁定 repository、source commit、dirty/release 狀態、格式、
   policy digest、Core/contract 版本、entrypoint、exports、authority report 與
   有序檔案紀錄。
4. `SHA256SUMS` 同時綁定所有 payload 與 `manifest.json`。
5. 驗證時必須由 artifact 外部提供 expected digest；不能把 artifact 自己宣稱的
   digest 當成信任根。
6. 未知檔案、symlink/junction、未知 schema 欄位、非法路徑、閉包外 import、
   模糊 import 語法、缺少 export、版本錯誤或不合格 authority 一律拒絕。
7. Builder 在讀取或 import 前，會拒絕任何經 symlink/junction 抵達的來源檔。
8. `releaseEligible:false` 預設拒絕；只有本機檢查可以明示
   `--allow-non-release`。

## Release eligibility / 發行資格

The normal builder fails when the Git worktree is dirty. `--allow-dirty` can
produce a local inspection candidate, but the manifest is permanently marked:

```json
{
  "sourceDirty": true,
  "releaseEligible": false
}
```

Only a clean, reviewed commit can produce `releaseEligible:true`. A dirty
candidate digest must never be copied into HMAX production configuration.

一般 builder 遇到 dirty Git worktree 會直接失敗。`--allow-dirty` 只能產生本機
檢查候選，而且 manifest 必須永久標示 `releaseEligible:false`。只有乾淨、已審查
的 commit 可以產生 `releaseEligible:true`；dirty candidate digest 絕不可寫入
HMAX production 設定。

## Commands / 指令

```bash
npm run test:release-artifact
npm run check:core-artifact
npm run build:core-artifact
```

Local dirty-tree inspection only / 僅供 dirty tree 本機檢查：

```bash
RAPHAEL_RELEASE_ALLOW_DIRTY=1 npm run check:core-artifact
node scripts/build-core-artifact.mjs --allow-dirty --output <empty-directory>
```

Pinned verification / 固定 digest 驗證：

```bash
node scripts/verify-core-artifact.mjs \
  --artifact <artifact-directory> \
  --expected-digest sha256:<approved-digest> \
  --expected-core-version 0.2.1-safety-closure-v2 \
  --expected-contract-version 1.0.0-draft.1
```

`--allow-non-release` is for local inspection only and is forbidden in an HMAX
production start command.

`--allow-non-release` 只允許本機檢查，禁止出現在 HMAX production 啟動指令。

## Clean-release evidence / 乾淨發行證據

The final clean digest remains pending until this package is committed. The
digest includes `sourceCommit`, so a pre-commit dirty digest is intentionally
not reusable. After commit, the same clean commit must be built twice in
separate empty directories and produce identical manifests, sums, and digest.

最終 clean digest 必須等本包 commit 後才能產生，因為 digest 包含
`sourceCommit`。因此 pre-commit dirty digest 刻意不可重用。Commit 後必須從同一
乾淨 commit 在兩個空目錄重建，並證明 manifest、SHA256SUMS 與 digest 完全一致。

Evidence must record separately:

- artifact regression result;
- full engine/parity/autonomy result;
- Nexus sealed holdout hard gates and machine flags;
- human blind-review status;
- HMAX verified-load result;
- source commit and clean digest;
- publication, deployment, and live-path status.

證據必須分開記錄 artifact regression、完整 engine/parity/autonomy、Nexus sealed
holdout、真人盲測、HMAX verified load、source commit/clean digest，以及
publication/deployment/live-path 狀態，不得混成一個「已上線」結論。

## Stop conditions / 停止條件

- Dirty source produces `releaseEligible:true`.
- Rebuilding the same clean commit changes any byte or digest.
- A modified, unknown, symlinked, or out-of-closure file passes verification.
- Manifest/policy accepts unknown fields or forged authority.
- Exported, manifest, and health Core/contract versions disagree.
- HMAX loads without an operator-owned digest pin.
- Artifact content includes transcripts, memories, secrets, model weights,
  tools, network clients, or game mutation code.
- GitHub source, a CI artifact, or a container is called production without
  reviewed commit, digest, CI evidence, and explicit human approval.

任一條件成立都必須停止發行；不得以本機測試或 GitHub 上已有程式碼為理由繞過。

## Remaining gates / 尚未完成的門檻

1. Complete implementation and local negative tests on the clean-rebase branch.
2. Commit the package, then generate and repeat-check the clean digest.
3. Verify HMAX loads only the pinned artifact and fails closed on mismatch.
4. Publish through a separately approved GitHub Release/container provenance
   workflow.
5. Complete security, privacy, psychological-safety, and Owner review.
6. Only after the Nexus shadow-client and canary gates may hosted speech be
   considered for the live Soul Talk path.

1. 在 clean-rebase branch 完成實作與本機負向測試。
2. Commit 後產生 clean digest，並重建確認一致。
3. 驗證 HMAX 只載入 pinned artifact，digest 不符時 fail closed。
4. 另行核准 GitHub Release/container provenance 發佈流程。
5. 完成 security、privacy、心理安全與 Owner review。
6. Nexus shadow client 與 canary 通過後，才能評估正式心語 hosted speech。
