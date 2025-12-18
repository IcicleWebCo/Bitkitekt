/*
  # Fix profile creation trigger

  1. Problem
    - The handle_new_user() function exists but the trigger wasn't created
    - This causes profiles to not be created when users sign up
    - Results in loading timeouts as the app waits for profiles that don't exist

  2. Solution
    - Create the trigger on auth.users table
    - Trigger fires AFTER INSERT on new user creation
    - Automatically creates a profile for each new user

  3. Security
    - Function already has SECURITY DEFINER to run with elevated privileges
    - This allows it to insert into the profiles table even though the trigger runs in auth schema
*/

-- Drop the trigger if it exists (in case it was partially created)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
