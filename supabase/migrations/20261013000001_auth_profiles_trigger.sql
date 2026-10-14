-- Migration: 20261013000001_auth_profiles_trigger.sql
-- Automate sync between Supabase auth.users and public.profiles

-- 1. Trigger function to create or update profile upon auth.users creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    role,
    student_number,
    group_name,
    phone,
    is_active
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'santri'::user_role),
    NEW.raw_user_meta_data->>'student_number',
    COALESCE(NEW.raw_user_meta_data->>'group_name', 'Santri Nurul Falah'),
    NEW.raw_user_meta_data->>'phone',
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    student_number = COALESCE(EXCLUDED.student_number, public.profiles.student_number),
    group_name = COALESCE(EXCLUDED.group_name, public.profiles.group_name),
    updated_at = timezone('utc'::text, now());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing trigger if any and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Ensure INSERT & UPDATE policies on public.profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.current_user_role() IN ('musyrif', 'admin'));
