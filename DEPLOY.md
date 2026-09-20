# Putting the shop online

Once this is deployed, your inventory lives in one database and every device
you sign into sees the same shelf. Add a product on a laptop, it is on your
phone; sell one, the count drops everywhere at once.

Three accounts, all free at this size. Budget half an hour.

---

## 1. Neon — the database

This is the part that makes inventory shared. Without it the app keeps its
catalogue in a file on one machine, which is fine for trying things out and
useless for a shop.

1. Sign up at **neon.tech** and create a project. Any region near you.
2. On the project dashboard, copy the **connection string**. It looks like
   `postgresql://user:password@ep-something.aws.neon.tech/neondb?sslmode=require`.
3. Keep it somewhere for a minute — it is a password, so not in a chat or a
   commit.

## 2. Resend — the sign-in emails

Sign-in is an emailed link, so without a mail provider nobody can sign in,
including you. In production the app refuses rather than telling you to check
an inbox nothing was sent to.

1. Sign up at **resend.com**.
2. **Domains → Add domain**, and add the domain you will send from. Resend
   gives you DNS records to paste into your registrar. Verification usually
   takes a few minutes.
3. **API Keys → Create**, and copy the key (`re_…`).

If you do not have a domain yet, Resend lets you send from their test domain to
your own address only. Enough to get yourself signed in and adding stock; not
enough for customers.

## 3. Vercel — the hosting

1. Sign up at **vercel.com** with GitHub.
2. **Add New → Project**, pick `sammaples/Blind-Box-App`.
   `claude/blind-box-collectibles-app-cwj3e8` is the repo's default branch, so
   that is what deploys. Nothing to choose.
3. Leave the framework and build settings alone — Next.js is detected, and
   `vercel-build` runs the migrations before the build.
4. Before clicking Deploy, open **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | the Neon connection string |
   | `AUTH_SECRET` | 64 random hex characters — `openssl rand -hex 32` |
   | `ADMIN_EMAILS` | `sammaples@me.com` |
   | `RESEND_API_KEY` | the `re_…` key |
   | `EMAIL_FROM` | `Blind Box <hello@yourdomain.com>` — on the verified domain |

   No terminal handy for `AUTH_SECRET`? In any browser console:

   ```js
   crypto.getRandomValues(new Uint8Array(32))
     .reduce((s, b) => s + b.toString(16).padStart(2, "0"), "")
   ```

   Without a verified domain, `EMAIL_FROM` can be
   `Blind Box <onboarding@resend.dev>`, which Resend will only deliver to the
   address the Resend account itself was opened with. That address has to be
   one of `ADMIN_EMAILS` or you cannot sign in.

5. Deploy.

The build runs the database migrations before it builds the app, so the schema
is in place by the time anything needs it. You do not have to run `npm run
migrate` by hand.

---

## Checking before you deploy

From a local clone, with the same values in your shell:

```bash
npm run preflight
```

It reports on each variable, connects to the database, and tells you whether
the schema is present and up to date. Every one of those fails at a different
unhelpful moment otherwise — a missing `DATABASE_URL` as a stack trace about a
file path, an unmigrated database as a 500 on the home page.

## First run

1. Open `https://your-app.vercel.app/admin`.
2. Enter the address you put in `ADMIN_EMAILS`. A real email arrives now, not a
   link on screen — that only happens in development.
3. Open the link. You land in the console.
4. **Catalogue → + Add product** and add your first real piece.
5. Open the same URL on your phone, sign in with the same address, and it is
   there.

## What is still stubbed

**Payments.** `src/lib/payments.ts` always succeeds and charges nothing. You
can deploy today and take orders, and no money will move. `npm run preflight`
warns about this every time until it is replaced.

When it is replaced, the reservation should move to the payment webhook. Right
now the piece is drawn *before* the charge is confirmed, so a declined card
still takes a unit off the shelf — and on a one-of-one chase, that is the unit.

## Preview deployments

Every branch you push gets its own URL, and every pull request gets a comment
linking to it. That is on by default once the project exists — there is no
switch to find. What needs deciding is which database those previews talk to.

**A preview build is a production build.** Vercel builds previews with
`NODE_ENV=production`, and this app changes behaviour on exactly that: the JSON
file backend refuses to start, sign-in refuses without a live mail provider,
and the admin console refuses without `ADMIN_EMAILS`. A preview with no
variables of its own does not degrade gracefully, it fails to boot.

**Give Preview its own database.** In the Vercel dashboard each variable is
scoped to Production, Preview and Development separately. If `DATABASE_URL` is
scoped to all three, every branch you push is pointed at the real shop: a
preview can sell a unit off the real shelf, and on a one-of-one chase that is
the unit. Neon branches a database in a few seconds and it costs nothing, so:

1. In Neon, **Branches → New branch** off `main`. Copy its connection string.
2. In Vercel, **Settings → Environment Variables**, and add a *second*
   `DATABASE_URL` scoped to **Preview** only, with the branch's string. Edit
   the existing one so it is scoped to **Production** only.
3. Do the same for `AUTH_SECRET` if you want preview sessions to be separate
   from real ones — a different secret simply means a session from one does not
   work on the other.
4. `ADMIN_EMAILS`, `RESEND_API_KEY` and `EMAIL_FROM` can be the same in both.
   Mail sent from a preview is real mail, so it is worth knowing that a sign-in
   link from a branch build looks identical to one from the real shop.

The branch database starts as a copy of whatever `main` held when you branched
it, migrations and all, and the preview build runs any new migrations against
it. A schema change gets exercised on a preview before it touches the shop.

**Looking at a branch without any of this.** A preview is the only way to see
the real app with real data, but it is not the only way to see a change. For
something purely visual — an animation, a layout — `npm run preview:box` builds
a standalone page from the running app with no deploy at all, and the README
covers it.

## Changing things later

Push to the branch Vercel is watching and it redeploys. Add a migration and the
build applies it. Environment variables change in the Vercel dashboard, and
need a redeploy to take effect.
