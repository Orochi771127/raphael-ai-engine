# Raphael Engine Single Sovereign Safety Path V1

## Outcome

All public engine entry points now classify player text through
`core/sovereignSafetyPolicy.js`. The legacy `runRaphaelEngine()` contract keeps
its existing response shape, but `core/safetyPolicy.js` is only a compatibility
projection. It owns no patterns and cannot disagree with `safetyPreflight()`.

Core version: `0.2.2-single-sovereign-v1`

Engine version: `0.2.2`

Turn contract: `1.0.0-draft.1` (unchanged)

## Closed paths

- overdose, active abuse, acute psychosis/mania, substance danger and other
  sovereign terminals cannot fall through the legacy engine path;
- diagnosis, therapist-role, medication, reality-grounding and dependency
  policy terminals use the same deterministic classification and copy;
- support-sensitive disclosure remains conversational but cannot create
  learning, reward, memory or game-action proposals;
- safety/policy/support-sensitive turns do not advance the legacy internal
  needs/conversation state;
- expedition rendering cannot replace a safety or policy terminal;
- Nexus adapter terminals are system-authored and propose no animation;
- the model remains untrusted and no entry point gains memory, game reducer,
  network, tool or persistence authority.

## Compatibility

The legacy `level`, `reason`, `gameplayAllowed`, `memoryAllowed` and
`rewardAllowed` fields remain available. They are derived from the immutable
sovereign result together with `category`, `terminal`, `policyTerminal`,
`networkAllowed` and canonical `reply`.

Existing ownership, exclusivity and romantic-role boundary phrases were moved
into the sovereign dependency route before deleting the duplicate legacy
dictionary. This preserves old consumer behavior without preserving two safety
authorities.

## Verification

- full engine suite: `53/53 PASS`;
- single-sovereign regression: `8/8 PASS`;
- contract/parity: `10/10 PASS` plus `18` sovereign assertions;
- autonomy/absence invariance: `PASS`;
- Nexus adapter probe: `9/9 PASS`;
- direct HMAX critic-port compatibility: `PASS`;
- release artifact attack/reproducibility suite: `10/10 PASS`;
- dirty-candidate artifact check: verified as `releaseEligible:false`, as
  required before commit.

The dirty-candidate digest is test evidence only. A release-eligible digest must
be regenerated from the clean, immutable post-merge main commit before HMAX can
pin it.

## Non-goals

No model was attached, trained or deployed. No player traffic, Soul Talk
cutover, public HMAX ingress, memory database, reward/Growth authority, new
dependency or external provider was enabled. HMAX context closure and its new
digest pin are a separate protected package after this engine PR merges and
post-main CI passes.
