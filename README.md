# MediCore — Hospital Management System

A complete, professional Hospital Management System built with Next.js 16 + Supabase.

## Modules

- **Dashboard** — Real-time stats (patients, doctors, beds, revenue, alerts)
- **Patients** — Registration, search, full patient profiles
- **Doctors** — Doctor management with specialization + availability
- **Appointments** — Booking, status tracking, double-booking prevention
- **Beds & Wards** — Visual bed map, status tracking, auto-update on admission
- **Pharmacy** — Medicine inventory, stock alerts, expiry warnings
- **Laboratory** — Test requests, sample tracking, results
- **Billing** — Invoices, payments, revenue tracking

## Setup

1. `npm install`
2. Copy `.env.example` → `.env` and fill in Supabase keys
3. Run `supabase/schema.sql` in Supabase SQL Editor (creates all tables + seed data)
4. `npm run dev`

## Tech Stack

- Next.js 16 + TypeScript
- Tailwind CSS 4
- Supabase (PostgreSQL + Auth)
- Lucide icons
