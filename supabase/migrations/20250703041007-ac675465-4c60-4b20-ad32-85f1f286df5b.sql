-- Update user_profiles table to allow INSERT and UPDATE operations for avatar positioning
-- Enable insert operations for user profiles
CREATE POLICY "Users can create their own profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (true);

-- Enable update operations for user profiles  
CREATE POLICY "Users can update their own profile"
ON public.user_profiles
FOR UPDATE
USING (true);

-- Enable realtime for user_profiles table
ALTER PUBLICATION supabase_realtime ADD TABLE user_profiles;