# Example block template — cfx-mongodb

Use in `docs/examples/lua/*.md` and `docs/examples/typescript/*.md`.  
**Duplicate structure in both languages** — only syntax differs.

---

## Per export (snippets / use-cases reference)

### Markdown header

```markdown
### `exportName`

**What this does:** [One sentence: what the consumer achieves — e.g. load one account row by license.]

**Steps:**

1. [First action — e.g. Build filter from server-known identifier.]
2. [Second — e.g. Call export and check success.]
3. [Third — e.g. Branch on data nil vs error.]

**When to use:** [Optional — find vs findById vs findAll.]
```

### Lua code block

```lua
-- Step 2: call export
local result = exports['cfx-mongodb']:find('accounts', {
  identifier = 'license:abc123',
})

-- Step 3: handle envelope
if not result.success then
  print('Error:', result.error)
elseif result.data == nil then
  print('Not found')
else
  print('OK:', result.data.identifier)
end
```

### TypeScript code block

```typescript
// Step 2: call export
const result = await exports["cfx-mongodb"].find("accounts", {
  identifier: "license:abc123",
});

// Step 3: handle envelope
if (!result.success) {
  console.error(result.error);
} else if (result.data === null) {
  console.log("Not found");
} else {
  console.log("OK:", result.data.identifier);
}
```

---

## Per FiveM flow (use-cases.md)

```markdown
## Flow X — Short title

**Goal:** [One line outcome.]

**What happens:**

1. [Trigger — e.g. playerConnecting.]
2. [DB operation — e.g. find or insert account.]
3. [Outcome — e.g. store identifier in state.]
4. [Optional fourth step.]

See also: [sample-resource/server/accounts.lua](../../sample-resource/server/accounts.lua).

[Lua code block — full function or handler]
```

Add matching flow in `typescript/use-cases.md` with `async`/`await` and link to same sample-resource for architecture.

---

## Per query operator (queries.md)

```markdown
### 3.N Operator name

**What this does:** [What question this answers in game terms — e.g. “all police or EMS jobs”.]

**Steps:**

1. [Build filter table with bracket keys in Lua.]
2. [Pass to findAll with limit.]
3. [Iterate result.data.]

```lua
-- code
```

---

## Per pattern (patterns.md)

```markdown
## N. Pattern name

**What this does:** [Why this exists — e.g. cfx-mongodb connects before your resource starts.]

```lua
-- minimal pattern
```

**What this does (follow-up):** [Optional second block explanation.]
```

---

## Anti-patterns (do not)

- Code without **What this does**
- Lua-only section in `typescript/` files (except “see Lua doc” link + TS code)
- New top-level folders under `examples/` without updating `examples/README.md`
- Documenting `getDb` for normal gameplay resources without Advanced warning
