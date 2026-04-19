# 🚀 Rostify — Setup Guide

## Step 1 — Set Up Supabase Database

1. Go to **supabase.com** and open your Rostify project
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**
4. Open the file `supabase-schema.sql` from this folder
5. Copy ALL the SQL and paste it into the editor
6. Click **Run** (green button)
7. You should see "Success" — your database is ready!

---

## Step 2 — Connect the App to Supabase

1. In Supabase, go to **Settings → API**
2. Copy your **Project URL** (looks like: https://xxxx.supabase.co)
3. Copy your **anon/public key** (long string starting with eyJ...)
4. Open the file `src/lib/supabase.js`
5. Replace:
   - `YOUR_SUPABASE_URL` → paste your Project URL
   - `YOUR_SUPABASE_ANON_KEY` → paste your anon key
6. Save the file

---

## Step 3 — Run on StackBlitz (No Installation Needed)

1. Go to **stackblitz.com**
2. Click **"Start a new project"**
3. Choose **React**
4. Delete all existing files
5. Upload all files from this folder by dragging them in
6. The app will automatically start running!
7. You'll see the Rostify login screen

---

## Step 4 — Create Your Account

1. On the login screen, click **"Sign up free"**
2. Enter your email and password
3. Check your email for a verification link
4. Click the link, then sign in
5. You're in! 🎉

---

## Step 5 — Deploy Live to rostify.com (Free)

1. Go to **vercel.com** and sign up
2. Connect your GitHub account
3. Upload the project to GitHub (or use Vercel CLI)
4. Vercel auto-deploys your app
5. Go to **Settings → Domains**
6. Add **rostify.com**
7. Follow the DNS instructions (point your domain to Vercel)
8. Done — your app is live at rostify.com! 🚀

---

## What's Built

| Feature | Status |
|---------|--------|
| User login & signup | ✅ Real auth via Supabase |
| Add/manage employees | ✅ Real database |
| SIA licence tracking | ✅ With expiry alerts |
| Weekly roster builder | ✅ Manual + AI auto-generate |
| Clock in / clock out | ✅ Real-time tracking |
| Hours calculation | ✅ Automatic |
| Payroll calculation | ✅ Auto from hours × pay rate |
| CSV payroll export | ✅ One click |
| Sites management | ✅ For security companies |
| Incident reports | ✅ With severity levels |
| Audit log | ✅ Every action recorded |
| Data security (RLS) | ✅ Each user sees only their data |

---

## Need Help?

Come back to Claude and describe exactly what you're stuck on — I'll walk you through it step by step!
