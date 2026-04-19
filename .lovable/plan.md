
Small, focused refactor. No new dependencies, no DB changes.

### 1. Remove "Manager view" pill from Customer Dashboard (`src/routes/index.tsx`)
Delete the slate-blue "Manager view" `<Link to="/manager">` pill in the header. The sign-out button stays as the only header control.

### 2. New Manager Login screen (`src/routes/manager.login.tsx` — new file)
Slate/blue themed page (wrapped in `.manager-theme`) matching the manager portal aesthetic. Fields:
- **Name** (text)
- **Store Name** (text, required)
- **Email** (email, required)
- "Sign In" button → `navigate({ to: "/manager/$storeName", params: { storeName: storeName.trim() } })`
- "← Back to Customer App" link → `/auth`

No real auth, no Supabase calls — pure demo flow per the brief.

### 3. Replace `/manager` redirect with login redirect (`src/routes/manager.tsx`)
Currently redirects to a hardcoded first store (`MOCK_STORES[0].name` = "ALDI"). Change it to redirect to `/manager/login` so there's no static store route. This satisfies "remove the static /manager/aldi route" — the dashboard is now only reachable via the login form's typed store name.

### 4. Update auth screen link (`src/routes/auth.tsx`)
Change the "Store Manager Portal" `<Link>` from `to="/manager"` → `to="/manager/login"`. Copy stays the same ("For business — Store Manager Portal").

### 5. Manager Dashboard header cleanup (`src/routes/manager.$storeName.tsx`)
- Rename the existing "Customer View" back-button to **"Logout"** with a `LogOut` icon, pointing to `/auth` (returns to main login screen as requested).
- Keep the store-switcher dropdown so managers can still browse other mock stores once inside.
- Theme stays scoped via the existing `.manager-theme` wrapper — no change needed; it's already locked to manager routes only.

### Files touched
- `src/routes/index.tsx` — remove Manager view pill
- `src/routes/manager.login.tsx` — **new**, slate-themed login form
- `src/routes/manager.tsx` — redirect to `/manager/login` instead of a hardcoded store
- `src/routes/auth.tsx` — update portal link target to `/manager/login`
- `src/routes/manager.$storeName.tsx` — swap "Customer View" button for "Logout" → `/auth`

Route tree regenerates automatically; no manual edits to `routeTree.gen.ts`.
