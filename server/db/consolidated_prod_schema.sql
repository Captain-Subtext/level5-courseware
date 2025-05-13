-- =======================================================================--
-- == Consolidated Production Database Schema for Cursor Learning (v0.9.0)== --
-- =======================================================================--
-- Version: 0.9.0
-- Combines original schema with subsequent modifications.
-- Run this script in the Supabase SQL Editor for your NEW production project.

BEGIN;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================
-- TABLES
-- =====================

-- Profiles table for essential user information (simplified)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    nickname TEXT,
    avatar_url TEXT,
    avatar_color TEXT,
    email_preferences JSONB DEFAULT '{"contentUpdates": true, "accountChanges": true, "marketing": true}'::JSONB,
    subscription_tier TEXT, -- Added subscription_tier column to match production
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
COMMENT ON TABLE public.profiles IS 'Stores core user profile information, excluding roles and subscriptions.';

-- Modules table to store course modules
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE public.modules IS 'Stores course modules.';

-- Sections table for module sections
CREATE TABLE IF NOT EXISTS public.sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    duration TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE public.sections IS 'Stores sections within course modules.';

-- User Progress table to track user progress on sections
CREATE TABLE IF NOT EXISTS public.user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
    section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    last_visited TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, section_id) -- Use standard UNIQUE constraint for new tables
);
COMMENT ON TABLE public.user_progress IS 'Tracks user completion progress for each section.';

-- Add CONCURRENTLY index if table exists and index doesn't (for existing DBs, might fail on fresh DB)
-- NOTE: CONCURRENTLY requires specific permissions and cannot run inside a transaction block if creating from scratch.
-- Consider removing CONCURRENTLY if this script is ONLY for building from scratch.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_progress') THEN
    CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS user_progress_user_section_unique_idx
      ON public.user_progress (user_id, section_id);
  END IF;
END $$;

-- Plans table for Stripe subscription plans
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  interval TEXT NOT NULL, -- 'month', 'year', etc.
  interval_count INTEGER NOT NULL DEFAULT 1,
  stripe_price_id TEXT NOT NULL UNIQUE, -- Price ID must be unique
  stripe_product_id TEXT NOT NULL, -- Product ID associated with the price
  active BOOLEAN NOT NULL DEFAULT true,
  features JSONB,
  plan_type TEXT NOT NULL UNIQUE, -- e.g., 'monthly', 'annual' - must be unique
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE public.plans IS 'Stores details about available Stripe subscription plans.';

-- User Subscriptions table for subscription management
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id TEXT PRIMARY KEY, -- Stripe Subscription ID (e.g., sub_...)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE, -- Ensure one subscription row per user
    plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL, -- Link to the plan details
    stripe_customer_id TEXT UNIQUE NOT NULL, -- Unique Stripe Customer ID
    status TEXT NOT NULL, -- From Stripe (e.g., active, trialing, past_due, canceled, incomplete, incomplete_expired, unpaid)
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    trial_start TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE public.subscriptions IS 'Stores user subscription status, linked to Stripe data and plans.';

-- Payments table for tracking payments
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY, -- Stripe Invoice ID or Payment Intent ID (e.g., in_..., pi_...)
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subscription_id TEXT REFERENCES public.subscriptions(id) ON DELETE SET NULL, -- Link to subscription if applicable
    stripe_customer_id TEXT, -- Store customer ID for easier lookup
    amount DECIMAL,
    amount_received DECIMAL, -- Store amount actually received
    currency TEXT,
    status TEXT, -- From Stripe (e.g., succeeded, requires_payment_method, processing, failed)
    payment_method_types TEXT[], -- Store payment method types used
    billing_reason TEXT, -- e.g., subscription_create, subscription_cycle
    invoice_pdf TEXT, -- URL to Stripe invoice PDF
    hosted_invoice_url TEXT, -- URL to Stripe hosted invoice page
    paid_at TIMESTAMP WITH TIME ZONE, -- Timestamp when payment succeeded
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP -- Use this for payment status changes
);
COMMENT ON TABLE public.payments IS 'Stores history of payment attempts and invoices from Stripe.';

-- Security Events table for security logging
CREATE TABLE IF NOT EXISTS public.security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address TEXT,
    details JSONB,
    severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE public.security_events IS 'Logs security-related events within the application.';

-- Config table for system configuration
CREATE TABLE IF NOT EXISTS public.config (
    key TEXT PRIMARY KEY, -- Use key as primary key directly
    value TEXT,
    description TEXT, -- Added description for clarity
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE public.config IS 'Stores system-wide configuration settings.';

-- User Bookmarks table
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    section_id UUID REFERENCES public.sections(id) ON DELETE CASCADE NOT NULL,
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT, -- Optional notes for bookmark
    UNIQUE (user_id, section_id), -- Combined unique constraint
    UNIQUE (user_id, module_id)  -- Added unique constraint for user/module combo
);
COMMENT ON TABLE public.user_bookmarks IS 'Stores user bookmarks for specific course sections or modules.';

-- Add CONCURRENTLY index if table exists and index doesn't (for existing DBs, might fail on fresh DB)
-- NOTE: CONCURRENTLY requires specific permissions and cannot run inside a transaction block if creating from scratch.
-- Consider removing CONCURRENTLY if this script is ONLY for building from scratch.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_bookmarks') THEN
    -- Index for user_id, section_id constraint (if needed explicitly beyond UNIQUE)
    CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS user_bookmarks_user_section_unique_idx
      ON public.user_bookmarks (user_id, section_id);

    -- Index for user_id, module_id constraint (if needed explicitly beyond UNIQUE)
    CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS user_bookmarks_user_module_unique_idx
      ON public.user_bookmarks (user_id, module_id);
  END IF;
END $$;


-- =====================
-- FUNCTIONS
-- =====================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
COMMENT ON FUNCTION public.update_timestamp() IS 'Generic function to update the updated_at timestamp on row update.';

-- Function to handle new user registration (Combined version)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_name TEXT;
BEGIN
  -- Extract username from email as default name if full_name not provided
  default_name := split_part(NEW.email, '@', 1);

  INSERT INTO public.profiles (id, full_name, avatar_url, nickname, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', default_name),
    NEW.raw_user_meta_data->>'avatar_url', -- Include avatar_url
    COALESCE(NEW.raw_user_meta_data->>'nickname', default_name), -- Set nickname initially
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Avoid error if profile somehow exists

  -- Log successful profile creation minimally
  BEGIN
      INSERT INTO public.security_events (event_type, user_id, details, severity)
      VALUES ('profile_created', NEW.id, jsonb_build_object('email', NEW.email), 'info');
  EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '[handle_new_user] Failed to log profile_created event for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function to create a user profile upon new auth.users creation.';


-- Function to check if current user is admin by email
CREATE OR REPLACE FUNCTION public.is_admin_by_email()
RETURNS boolean AS $$
DECLARE
  user_email TEXT;
  admin_email TEXT := 'admin@example.com'; -- Define admin email here
BEGIN
  -- Check if the claim exists and is not null before accessing it
  SELECT nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'email', '')::text INTO user_email;
  RETURN user_email = admin_email;
EXCEPTION
  -- Handle potential errors if the claim doesn't exist or is not valid JSON
  WHEN others THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE; -- Use STABLE as it doesn't modify DB but depends on request context
COMMENT ON FUNCTION public.is_admin_by_email() IS 'Checks if the authenticated user email matches the hardcoded admin email.';


-- Function to record security events
CREATE OR REPLACE FUNCTION public.record_security_event(
  p_event_type text,
  p_user_id uuid,
  p_details jsonb DEFAULT NULL, -- Make details optional
  p_severity text DEFAULT 'info', -- Default severity to info
  p_ip_address text DEFAULT NULL -- Add IP address
)
RETURNS void AS $$ -- Return void as we don't need the ID typically
BEGIN
  INSERT INTO public.security_events (event_type, user_id, ip_address, details, severity, created_at)
  VALUES (p_event_type, p_user_id, p_ip_address, p_details, p_severity, NOW());
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[record_security_event] Failed to log event type % for user %: %', p_event_type, p_user_id, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION public.record_security_event(text, uuid, jsonb, text, text) IS 'Logs a security event to the security_events table.';


-- Function to handle auth events (UPDATED version)
CREATE OR REPLACE FUNCTION public.handle_auth_events()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- We already log profile creation in handle_new_user
  -- IF TG_OP = 'INSERT' THEN
    -- PERFORM public.record_security_event('user_signup', NEW.id, jsonb_build_object('email', NEW.email), 'info');
  IF TG_OP = 'UPDATE' THEN
    IF OLD.encrypted_password IS DISTINCT FROM NEW.encrypted_password THEN
      -- Explicitly provide p_details as NULL::jsonb to resolve ambiguity
      PERFORM public.record_security_event(
          p_event_type := 'password_changed',
          p_user_id := NEW.id,
          p_details := NULL::jsonb, -- Explicitly provide default
          p_severity := 'info'
          -- p_ip_address can be added if available from request context (more complex)
      );
    END IF;
    IF OLD.email IS DISTINCT FROM NEW.email THEN
      -- Explicitly provide p_details for consistency
      PERFORM public.record_security_event(
          p_event_type := 'email_changed',
          p_user_id := NEW.id,
          p_details := jsonb_build_object('old_email', OLD.email, 'new_email', NEW.email), -- Provide actual details
          p_severity := 'warning'
          -- p_ip_address can be added if available from request context
      );
    END IF;
    -- Add other events if needed (e.g., phone number change)
  END IF;
  RETURN NEW; -- Return value is ignored for AFTER triggers but required syntax
END;
$function$;
COMMENT ON FUNCTION public.handle_auth_events() IS 'Trigger function to log significant changes to auth.users (e.g., password, email).';


-- Function to get content backup (Unchanged)
CREATE OR REPLACE FUNCTION public.get_content_backup()
RETURNS jsonb AS $$
DECLARE
  modules_json JSONB;
  sections_json JSONB;
  result JSONB;
BEGIN
  SELECT jsonb_agg(m ORDER BY m.order_index) FROM public.modules m INTO modules_json;
  SELECT jsonb_agg(s ORDER BY m.order_index, s.order_index)
    FROM public.sections s JOIN public.modules m ON s.module_id = m.id
    INTO sections_json;
  result := jsonb_build_object(
    'version', '1.0',
    'timestamp', to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'modules', COALESCE(modules_json, '[]'::jsonb),
    'sections', COALESCE(sections_json, '[]'::jsonb)
  );
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
COMMENT ON FUNCTION public.get_content_backup() IS 'Returns a JSONB object containing all modules and sections for backup.';

-- Function to restore content from backup (Unchanged)
CREATE OR REPLACE FUNCTION public.restore_content_transaction(backup_data jsonb)
RETURNS void AS $$
DECLARE
  module_record RECORD;
  section_record RECORD;
  old_module_id UUID;
  new_module_id UUID;
  module_id_map JSONB := '{}'::jsonb;
BEGIN
  FOR module_record IN SELECT * FROM jsonb_to_recordset(backup_data->'modules') AS x(id UUID, title TEXT, description TEXT, order_index INTEGER, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ) LOOP
    old_module_id := module_record.id;
    INSERT INTO public.modules (title, description, order_index, created_at, updated_at)
    VALUES (module_record.title, module_record.description, module_record.order_index, COALESCE(module_record.created_at, NOW()), NOW())
    RETURNING id INTO new_module_id;
    module_id_map := module_id_map || jsonb_build_object(old_module_id::text, new_module_id);
  END LOOP;
  FOR section_record IN SELECT * FROM jsonb_to_recordset(backup_data->'sections') AS x(id UUID, module_id UUID, title TEXT, content TEXT, duration TEXT, order_index INTEGER, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ) LOOP
    new_module_id := (module_id_map->>section_record.module_id::text)::UUID;
    IF new_module_id IS NOT NULL THEN
      INSERT INTO public.sections (module_id, title, content, duration, order_index, created_at, updated_at)
      VALUES (new_module_id, section_record.title, section_record.content, section_record.duration, section_record.order_index, COALESCE(section_record.created_at, NOW()), NOW());
    ELSE
       RAISE WARNING '[restore_content_transaction] Skipping section % (%) due to missing module mapping for old module ID %', section_record.title, section_record.id, section_record.module_id;
    END IF;
  END LOOP;
  RAISE NOTICE 'Content restoration complete';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION public.restore_content_transaction(jsonb) IS 'Restores modules and sections from a JSONB backup, creating new IDs and mapping relationships.';


-- Function to get plan ID by plan_type (Unchanged)
CREATE OR REPLACE FUNCTION public.get_plan_id_by_type(p_plan_type TEXT)
RETURNS UUID AS $$
DECLARE
  v_plan_id UUID;
BEGIN
  SELECT id INTO v_plan_id FROM public.plans WHERE plan_type = p_plan_type AND active = true LIMIT 1;
  RETURN v_plan_id;
END;
$$ LANGUAGE plpgsql STABLE;
COMMENT ON FUNCTION public.get_plan_id_by_type(text) IS 'Retrieves the UUID of an active plan based on its type (e.g., monthly, annual).';

-- Function to search content by term
CREATE OR REPLACE FUNCTION public.search_content(search_term text)
 RETURNS SETOF public.modules -- Return type modules
 LANGUAGE sql
 STABLE
AS $function$
  WITH matched_sections AS (
    SELECT DISTINCT module_id
    FROM sections
    WHERE 
      title ILIKE '%' || search_term || '%' 
      OR content ILIKE '%' || search_term || '%'
  )
  SELECT m.*
  FROM modules m
  LEFT JOIN matched_sections ms ON m.id = ms.module_id
  WHERE
    m.title ILIKE '%' || search_term || '%'
    OR m.description ILIKE '%' || search_term || '%'
    OR ms.module_id IS NOT NULL
  ORDER BY m.order_index;
$function$;
COMMENT ON FUNCTION public.search_content(text) IS 'Searches modules and sections for content matching the search term.';

-- Function to count total users in the system
CREATE OR REPLACE FUNCTION public.count_total_users()
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*) FROM auth.users;
$$;
COMMENT ON FUNCTION public.count_total_users() IS 'Returns the total number of users in the system.';

-- =====================
-- TRIGGERS
-- =====================

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to log auth events (Uses UPDATED function)
DROP TRIGGER IF EXISTS handle_auth_events ON auth.users; -- Drop old name if exists
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated -- Use consistent naming
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_events(); -- Executes the updated function

-- Triggers to automatically update the updated_at column for relevant tables
DROP TRIGGER IF EXISTS update_profiles_timestamp ON public.profiles;
CREATE TRIGGER update_profiles_timestamp BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_modules_timestamp ON public.modules;
CREATE TRIGGER update_modules_timestamp BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_sections_timestamp ON public.sections;
CREATE TRIGGER update_sections_timestamp BEFORE UPDATE ON public.sections FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_user_progress_timestamp ON public.user_progress;
CREATE TRIGGER update_user_progress_timestamp BEFORE UPDATE ON public.user_progress FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_subscriptions_timestamp ON public.subscriptions;
CREATE TRIGGER update_subscriptions_timestamp BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_payments_timestamp ON public.payments;
CREATE TRIGGER update_payments_timestamp BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_config_timestamp ON public.config;
CREATE TRIGGER update_config_timestamp BEFORE UPDATE ON public.config FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_plans_timestamp ON public.plans;
CREATE TRIGGER update_plans_timestamp BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

DROP TRIGGER IF EXISTS update_user_bookmarks_timestamp ON public.user_bookmarks; -- Add for bookmarks
CREATE TRIGGER update_user_bookmarks_timestamp BEFORE UPDATE ON public.user_bookmarks FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();


-- ==========================
-- PERMISSIONS
-- ==========================

-- Grant necessary permissions for functions/triggers
GRANT INSERT ON TABLE public.security_events TO supabase_auth_admin;
-- Add other grants if necessary (e.g., if functions need specific permissions)


-- ==========================
-- ROW LEVEL SECURITY (RLS)
-- ==========================
-- Standardized approach:
-- - Use auth.uid() for ownership checks.
-- - Use is_admin_by_email() or auth.role() = 'service_role' for admin/system checks.
-- - Default Deny: Ensure RLS is enabled on all tables.

-- Helper function alias for readability in policies
CREATE OR REPLACE FUNCTION public.is_authenticated() RETURNS boolean AS $$ SELECT auth.role() = 'authenticated'; $$ LANGUAGE sql STABLE;
CREATE OR REPLACE FUNCTION public.is_service_role() RETURNS boolean AS $$ SELECT auth.role() = 'service_role'; $$ LANGUAGE sql STABLE;
CREATE OR REPLACE FUNCTION public.current_user_id() RETURNS uuid AS $$ SELECT auth.uid(); $$ LANGUAGE sql STABLE;


-- Enable RLS on all relevant tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;


-- == Profiles Policies ==
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.profiles;
CREATE POLICY "Allow users to read their own profile" ON public.profiles FOR SELECT USING (current_user_id() = id);

DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
CREATE POLICY "Allow users to update their own profile" ON public.profiles FOR UPDATE USING (current_user_id() = id);

DROP POLICY IF EXISTS "Allow admin full access to profiles" ON public.profiles;
CREATE POLICY "Allow admin full access to profiles" ON public.profiles FOR ALL USING (public.is_admin_by_email()) WITH CHECK (public.is_admin_by_email()); -- Specify schema

DROP POLICY IF EXISTS "Allow service_role full access to profiles" ON public.profiles;
CREATE POLICY "Allow service_role full access to profiles" ON public.profiles FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role()); -- Specify schema


-- == Modules & Sections Policies ==
DROP POLICY IF EXISTS "Allow authenticated users read access to modules" ON public.modules;
CREATE POLICY "Allow authenticated users read access to modules" ON public.modules FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated users read access to sections" ON public.sections;
CREATE POLICY "Allow authenticated users read access to sections" ON public.sections FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow admin full access to modules" ON public.modules;
CREATE POLICY "Allow admin full access to modules" ON public.modules FOR ALL USING (public.is_admin_by_email()) WITH CHECK (public.is_admin_by_email()); -- Specify schema

DROP POLICY IF EXISTS "Allow admin full access to sections" ON public.sections;
CREATE POLICY "Allow admin full access to sections" ON public.sections FOR ALL USING (public.is_admin_by_email()) WITH CHECK (public.is_admin_by_email()); -- Specify schema

DROP POLICY IF EXISTS "Allow service_role full access to content" ON public.modules;
CREATE POLICY "Allow service_role full access to content" ON public.modules FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role()); -- Specify schema
DROP POLICY IF EXISTS "Allow service_role full access to content sections" ON public.sections;
CREATE POLICY "Allow service_role full access to content sections" ON public.sections FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role()); -- Specify schema


-- == User Progress Policies ==
DROP POLICY IF EXISTS "Allow users to manage their own progress" ON public.user_progress;
CREATE POLICY "Allow users to manage their own progress" ON public.user_progress FOR ALL USING (current_user_id() = user_id) WITH CHECK (current_user_id() = user_id);

DROP POLICY IF EXISTS "Allow admin read access to user progress" ON public.user_progress;
CREATE POLICY "Allow admin read access to user progress" ON public.user_progress FOR SELECT USING (public.is_admin_by_email()); -- Specify schema

DROP POLICY IF EXISTS "Allow service_role full access to progress" ON public.user_progress;
CREATE POLICY "Allow service_role full access to progress" ON public.user_progress FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role()); -- Specify schema


-- == Plans Policies ==
DROP POLICY IF EXISTS "Allow public read access to plans" ON public.plans;
CREATE POLICY "Allow public read access to plans" ON public.plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admin full access to plans" ON public.plans;
CREATE POLICY "Allow admin full access to plans" ON public.plans FOR ALL USING (public.is_admin_by_email()) WITH CHECK (public.is_admin_by_email()); -- Specify schema

DROP POLICY IF EXISTS "Allow service_role full access to plans" ON public.plans;
CREATE POLICY "Allow service_role full access to plans" ON public.plans FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role()); -- Specify schema


-- == Subscriptions Policies ==
DROP POLICY IF EXISTS "Allow users to read their own subscription" ON public.subscriptions;
CREATE POLICY "Allow users to read their own subscription" ON public.subscriptions FOR SELECT USING (current_user_id() = user_id);

-- Stripe Webhook handler (service_role) needs insert/update access
DROP POLICY IF EXISTS "Allow service_role full access to subscriptions" ON public.subscriptions;
CREATE POLICY "Allow service_role full access to subscriptions" ON public.subscriptions FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role()); -- Specify schema

DROP POLICY IF EXISTS "Allow admin read access to subscriptions" ON public.subscriptions;
CREATE POLICY "Allow admin read access to subscriptions" ON public.subscriptions FOR SELECT USING (public.is_admin_by_email()); -- Specify schema


-- == Payments Policies ==
DROP POLICY IF EXISTS "Allow users to read their own payments" ON public.payments;
CREATE POLICY "Allow users to read their own payments" ON public.payments FOR SELECT USING (current_user_id() = user_id);

-- Stripe Webhook handler (service_role) needs insert/update access
DROP POLICY IF EXISTS "Allow service_role full access to payments" ON public.payments;
CREATE POLICY "Allow service_role full access to payments" ON public.payments FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role()); -- Specify schema

DROP POLICY IF EXISTS "Allow admin read access to payments" ON public.payments;
CREATE POLICY "Allow admin read access to payments" ON public.payments FOR SELECT USING (public.is_admin_by_email()); -- Specify schema


-- == Security Events Policies ==
-- Only service_role or admin can insert/view
DROP POLICY IF EXISTS "Allow admin/service_role to insert security events" ON public.security_events;
CREATE POLICY "Allow admin/service_role to insert security events" ON public.security_events FOR INSERT WITH CHECK (public.is_admin_by_email() OR public.is_service_role()); -- Specify schema

DROP POLICY IF EXISTS "Allow admin/service_role to view security events" ON public.security_events;
CREATE POLICY "Allow admin/service_role to view security events" ON public.security_events FOR SELECT USING (public.is_admin_by_email() OR public.is_service_role()); -- Specify schema


-- == Config Policies ==
-- Only service_role or admin can manage config
DROP POLICY IF EXISTS "Allow admin/service_role full access to config" ON public.config;
CREATE POLICY "Allow admin/service_role full access to config" ON public.config FOR ALL USING (public.is_admin_by_email() OR public.is_service_role()) WITH CHECK (public.is_admin_by_email() OR public.is_service_role()); -- Specify schema


-- == User Bookmarks Policies ==
DROP POLICY IF EXISTS "Allow users to manage their own bookmarks" ON public.user_bookmarks;
CREATE POLICY "Allow users to manage their own bookmarks" ON public.user_bookmarks FOR ALL USING (current_user_id() = user_id) WITH CHECK (current_user_id() = user_id);

DROP POLICY IF EXISTS "Allow admin read access to user bookmarks" ON public.user_bookmarks;
CREATE POLICY "Allow admin read access to user bookmarks" ON public.user_bookmarks FOR SELECT USING (public.is_admin_by_email()); -- Specify schema

DROP POLICY IF EXISTS "Allow service_role full access to bookmarks" ON public.user_bookmarks;
CREATE POLICY "Allow service_role full access to bookmarks" ON public.user_bookmarks FOR ALL USING (public.is_service_role()) WITH CHECK (public.is_service_role()); -- Specify schema


-- =====================
-- INITIAL DATA SETUP
-- =====================
-- Note: This section assumes no existing data in the target tables.

-- Insert default configuration settings
INSERT INTO public.config (key, value, description)
VALUES
  ('maintenance_mode', 'false', 'Enable/disable site-wide maintenance mode (true/false)'),
  ('site_version', '0.9.0', 'Current deployed version of the application'), -- Updated version
  ('allow_signups', 'true', 'Allow new user registrations (true/false)')
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value, description = EXCLUDED.description, updated_at = NOW();

-- Insert initial course content (Modules & Sections from Script 8)
-- Ensure IDs are unique if running multiple times or adjust ON CONFLICT
INSERT INTO public.modules (id, title, description, order_index, created_at, updated_at)
VALUES
('788e24b4-7835-43b6-83b5-29c839d9195d', 'Module 1: Getting Started', 'Introduction to the platform basics', 1, '2025-04-02T13:23:36.613819+00:00', '2025-04-03T14:29:40.726603+00:00'),
('d0dbca5a-6e3a-44bd-a029-4407701b69c8', 'Module 2: Intermediate Concepts', 'Building on the foundation with more advanced topics', 2, '2025-04-02T13:23:36.613819+00:00', '2025-04-02T13:23:36.613819+00:00'),
('7b33d1cc-cb1c-4a04-aaec-6ff269135f30', 'Module 3: Advanced Features', 'Exploring advanced capabilities and use cases', 3, '2025-04-02T13:23:36.613819+00:00', '2025-04-02T13:23:36.613819+00:00'),
('13d4c182-ff86-4fd5-8ef6-e69822089c4a', 'Module 4: Integrations', 'Connect with external services and systems', 4, '2025-04-02T13:23:36.613819+00:00', '2025-04-04T05:41:40.862012+00:00'),
('e7be8e52-998c-4a42-96b3-d0fee257c7bc', 'Module 5: Best Practices', 'Tips and best practices for optimal results', 5, '2025-04-02T13:23:36.613819+00:00', '2025-04-03T14:29:08.418463+00:00')
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, order_index = EXCLUDED.order_index, updated_at = NOW(); -- Use NOW() for updated_at on conflict

INSERT INTO public.sections (id, module_id, title, content, duration, order_index, created_at, updated_at)
VALUES
('35b58dce-bf64-4aa6-a6b1-37cc82f0d624', '788e24b4-7835-43b6-83b5-29c839d9195d', 'Section 1.1: Introduction', 'Sample content. Replace with your actual course material.', '5 min', 1, '2025-04-02T13:23:36.613819+00:00', '2025-04-02T13:23:36.613819+00:00'),
('3709241a-6710-4162-bb41-93c9e8c62c7e', '788e24b4-7835-43b6-83b5-29c839d9195d', 'Section 1.2: Setup Guide', 'Sample content. Replace with your actual course material.', '10 min', 2, '2025-04-02T13:23:36.613819+00:00', '2025-04-02T13:23:36.613819+00:00'),
('a57e1df4-bfe3-4a0a-b97d-8010d6267398', '788e24b4-7835-43b6-83b5-29c839d9195d', 'Section 1.3: User Interface Basics', 'Sample content. Replace with your actual course material.', '8 min', 3, '2025-04-02T13:23:36.613819+00:00', '2025-04-03T14:35:16.387269+00:00'),
('bb6c055d-6a2c-44f8-9d1f-0ef79bbee289', 'd0dbca5a-6e3a-44bd-a029-4407701b69c8', 'Section 2.1: Foundational Concepts', 'Sample content. Replace with your actual course material.', '12 min', 1, '2025-04-02T13:23:36.613819+00:00', '2025-04-02T13:23:36.613819+00:00'),
('b8b59fb8-6fdd-4ae6-8f23-ef4593190cc6', 'd0dbca5a-6e3a-44bd-a029-4407701b69c8', 'Section 2.2: Best Practices', 'Sample content. Replace with your actual course material.', '15 min', 2, '2025-04-02T13:23:36.613819+00:00', '2025-04-02T13:23:36.613819+00:00'),
('6c5106e2-0d66-43c3-b313-71aa4ab562a0', 'd0dbca5a-6e3a-44bd-a029-4407701b69c8', 'Section 2.3: Common Issues', 'Sample content. Replace with your actual course material.', '10 min', 3, '2025-04-02T13:23:36.613819+00:00', '2025-04-02T13:23:36.613819+00:00'),
('0934720a-f7a9-4365-8eef-1ac494d5698e', 'd0dbca5a-6e3a-44bd-a029-4407701b69c8', 'Section 2.4: Additional Resources', 'Sample content for additional resources.', '5', 4, '2025-04-04T06:03:13.11864+00:00', '2025-04-04T06:03:19.440403+00:00')
ON CONFLICT (id) DO UPDATE SET module_id = EXCLUDED.module_id, title = EXCLUDED.title, content = EXCLUDED.content, duration = EXCLUDED.duration, order_index = EXCLUDED.order_index, updated_at = NOW(); -- Use NOW() for updated_at on conflict

-- Insert initial Stripe plans with UPDATED annual plan details
INSERT INTO public.plans (id, name, description, price, currency, interval, interval_count, stripe_price_id, stripe_product_id, active, features, plan_type)
VALUES
(
  'e18a3e17-d164-4f0a-b913-1f2f7a1d8b3c', -- Use a fixed UUID for 'monthly'
  'Monthly Subscription',
  'Monthly access to all content',
  4.99, 'usd', 'month', 1,
  'price_1R9pVIHpAnnCs9w8RLODukHq', -- <<< REPLACE WITH YOUR ACTUAL STRIPE MONTHLY PRICE ID
  'prod_S3xQSJRHwWVKne', -- <<< REPLACE WITH YOUR ACTUAL STRIPE MONTHLY PRODUCT ID
  true,
  '{"features": ["Access to all modules", "Community Access", "Future updates included"]}'::jsonb,
  'monthly'
),
(
  'f92c5f8a-3e9b-4b1e-8e2a-9e7f1c0a5d4e', -- Use a fixed UUID for 'annual'
  'Annual Subscription',
  'Annual access to all content at a discount',
  44.99, 'usd', 'year', 1,                 -- UPDATED PRICE
  'price_1RBVNnHpAnnCs9w8I7jbJMzC', -- UPDATED STRIPE PRICE ID
  'prod_S5glYOPh3lLw9S', -- UPDATED STRIPE PRODUCT ID
  true,
  '{"features": ["Access to all modules", "PDF downloads available", "Community Access", "Save ~25% vs monthly"]}'::jsonb,
  'annual'
)
ON CONFLICT (stripe_price_id) DO UPDATE -- Use stripe_price_id for conflict checking
SET
  name = EXCLUDED.name, description = EXCLUDED.description, price = EXCLUDED.price, currency = EXCLUDED.currency, interval = EXCLUDED.interval,
  interval_count = EXCLUDED.interval_count, stripe_product_id = EXCLUDED.stripe_product_id, active = EXCLUDED.active, features = EXCLUDED.features,
  plan_type = EXCLUDED.plan_type, updated_at = NOW();


-- Final commit
COMMIT;

-- Notify success
DO $$ BEGIN RAISE NOTICE 'Consolidated production schema (v0.9.0) applied successfully!'; END $$;