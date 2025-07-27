-- Reset the password for the existing user
UPDATE auth.users 
SET encrypted_password = crypt('Themanthathadkilledme123!', gen_salt('bf'))
WHERE email = 'andymelvin56@gmail.com';