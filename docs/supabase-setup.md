# Supabase CLI Project Setup & Migration Guide

This guide outlines how to configure the local Supabase environment and link it to the remote cloud server project safely without hardcoding API keys in your repository.

---

## 1. Prerequisites
Ensure you have the Supabase CLI installed on your system. If not, install it using npm or scoop:
```bash
# via npm
npm install -g supabase

# via Scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

---

## 2. CLI Authentication & Init
Authenticate your CLI tool against your Supabase account:
```bash
supabase login
```
This opens a browser window requesting authorization. Copy the generated API access token back into the terminal prompts.

Initialize the project locally:
```bash
# Initialize inside the root workspace folder
supabase init
```
This generates a local configuration directory `./supabase/`.

---

## 3. Link Remote Project
Link this local repository folder to the live cloud database instance `teqqksjqtrrfmytauzou`:
```bash
supabase link --project-ref teqqksjqtrrfmytauzou
```
You will be prompted to supply the Database password configured during project initialization.

---

## 4. Run Migrations
To push local migration files (`./supabase/migrations/`) to your remote cloud database instance:
```bash
# Pull remote database schema status (optional check)
supabase db pull

# Apply local schemas and RLS tables directly to remote Supabase
supabase db push
```

To seed the initial exercises, challenges, and tiers data:
```bash
# Apply SQL seeds directly to your linked cloud instance database
supabase db reset
```

---

## 5. Security Warning
> [!CAUTION]
> **Never commit `.env` files or hardcode credentials.** 
> Always maintain keys within `.env` parameters using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. These keys are excluded from git by the `.gitignore` rules.
