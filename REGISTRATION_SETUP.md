# GreenCrew Registration Setup & Troubleshooting

## Quick Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` file with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NODE_ENV=development
   ```

3. **Database Setup**
   Run the SQL schema in your Supabase dashboard:
   ```bash
   # Copy and paste the contents of supabase/schema.sql into your Supabase SQL editor
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## Troubleshooting Registration Issues

### 1. Check Environment Setup
Visit: `http://localhost:3000/api/debug/setup`

This will validate:
- ✅ Environment variables are configured
- ✅ Supabase keys are present and valid length
- ✅ Development mode is active

### 2. Verify Database Schema
Visit: `http://localhost:3000/api/debug/schema`

This will check:
- ✅ All required tables exist
- ✅ Foreign key constraints are working
- ✅ Row Level Security is enabled

### 3. Test Health Check
Visit: `http://localhost:3000/api/health`

This will verify:
- ✅ Database connection is working
- ✅ Basic queries can be executed

### 4. Debug Registration Flow

#### Enable Console Logging
The registration process includes detailed console logging. Check your browser's developer console for:
- 📤 Registration data being sent
- 👤 Auth user creation status
- 👥 Profile creation attempts
- ❌ Specific error details

#### Common Error Messages and Solutions

**"profile creation failed, insert or update on table profiles violates foreign key constraint"**
- **Cause**: Auth user not fully committed to database before profile creation
- **Solution**: The new API route includes retry logic and delays to handle this
- **Check**: Verify your Supabase service role key has proper permissions

**"Failed to create user account - no user returned"**
- **Cause**: Supabase auth signup failed
- **Solution**: Check email format, password requirements, and Supabase project settings
- **Check**: Verify NEXT_PUBLIC_SUPABASE_ANON_KEY is correct

**"Authentication failed: [error message]"**
- **Cause**: Various auth-related issues
- **Solution**: Check Supabase auth settings, email confirmation requirements
- **Check**: Ensure auth is enabled in your Supabase project

### 5. Test Registration Manually

#### Golf Course Registration
```javascript
// In browser console:
const testGolfCourse = {
  email: "test-golf@example.com",
  password: "TestPassword123!",
  full_name: "Test Golf Course",
  user_type: "golf_course",
  course_name: "Test Golf Course",
  course_type: "public",
  address: "123 Test St, Test City, TC 12345"
}

fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testGolfCourse)
}).then(r => r.json()).then(console.log)
```

#### Professional Registration
```javascript
// In browser console:
const testProfessional = {
  email: "test-pro@example.com",
  password: "TestPassword123!",
  full_name: "Test Professional",
  user_type: "professional",
  experience_level: "intermediate",
  specializations: ["greenskeeping", "equipment_operation"],
  travel_radius: 25,
  hourly_rate: 25.00
}

fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testProfessional)
}).then(r => r.json()).then(console.log)
```

### 6. Check User Creation Status

After attempting registration, check if the user was created:
```javascript
// Replace USER_ID with the ID from registration response
fetch('/api/debug/auth-users?user_id=USER_ID')
  .then(r => r.json())
  .then(console.log)
```

## Database Schema Verification

Ensure these tables exist in your Supabase database:

1. **profiles** - Main user profiles (references auth.users)
2. **golf_course_profiles** - Golf course specific data
3. **professional_profiles** - Professional specific data
4. **jobs** - Job postings
5. **applications** - Job applications

### Key Foreign Key Relationships
- `profiles.id` → `auth.users.id`
- `golf_course_profiles.profile_id` → `profiles.id`
- `professional_profiles.profile_id` → `profiles.id`

## Registration Flow (Fixed)

The improved registration flow now properly handles email confirmation:

1. **Email Confirmation Detection**: Checks if email confirmation is required after user creation
2. **User Existence Verification**: Verifies user exists in auth.users before creating profile
3. **Metadata Storage**: Stores complete registration data in user metadata for later use
4. **Webhook Integration**: Automatic profile completion when email is confirmed
5. **Manual Completion**: Fallback endpoint for manual profile completion
6. **Comprehensive Logging**: Detailed debugging information at each step
7. **Retry Logic**: Robust retry mechanisms with exponential backoff
8. **Error Handling**: Specific error codes and detailed error messages

## Monitoring

### Development Tools
- `/api/debug/setup` - Environment validation
- `/api/debug/schema` - Database schema check
- `/api/debug/auth-users` - User verification
- `/api/health` - Basic health check

### New Registration Endpoints
- `/api/auth/register` - Main registration endpoint (improved with email fix)
- `/api/auth/complete-profile` - Complete profile after email confirmation
- `/api/auth/webhook` - Supabase auth webhook handler
- `/api/debug/email-config` - Email configuration checker (dev only)
- `/api/auth/resend-confirmation` - Resend confirmation emails (dev only)

### Production Considerations
- Remove all `/api/debug/*` endpoints
- Disable console logging
- Set `NODE_ENV=production`
- Enable proper error monitoring

## Common Issues & Solutions

### Issue: "User already registered" but can't log in
**Solution**: Check email confirmation settings in Supabase Auth

### Issue: Profile creation works but role-specific profile fails
**Solution**: Check RLS policies on golf_course_profiles and professional_profiles tables

### Issue: Foreign key constraint errors persist
**Solution**: 
1. Verify Supabase service role key permissions
2. Check if auth.users table is accessible
3. Ensure proper database schema deployment

### Issue: Registration succeeds but user can't log in
**Solution**: Check email confirmation requirements in Supabase Auth settings

### Issue: "Email confirmation required" message
**Solution**: This is normal if email confirmation is enabled. Users must:
1. Check their email for a confirmation link
2. Click the link to confirm their email
3. Try logging in again (profile will be auto-created via webhook)

### Issue: Profile not created after email confirmation
**Solutions**: 
1. Check if webhook is properly configured in Supabase
2. Manually complete profile using `/api/auth/complete-profile`
3. Use browser console helpers: `completeUserProfile(data)`

### Issue: Email confirmations not being sent
**Solutions**:
1. Check email configuration: Visit `/api/debug/email-config`
2. Test email functionality: Run `testEmailFunctionality()` in browser console
3. Verify Supabase Auth settings (see guide below)
4. Test email resend: `fetch("/api/auth/resend-confirmation", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({email: "test@example.com"})})`

### Supabase Auth Email Configuration Checklist
1. **Go to Supabase Dashboard → Authentication → Settings**
2. **Check Email Confirmation Settings:**
   - ✅ "Enable email confirmations" should be enabled
   - ✅ "Confirmation URL" should be: `https://yourdomain.com/auth/callback`
3. **Check Email Templates:**
   - ✅ "Confirm signup" template should be active
   - ✅ Templates should not be disabled
4. **Check SMTP Settings:**
   - ✅ If using custom SMTP, verify configuration
   - ✅ If using Supabase default, ensure it's not disabled
5. **Check Site URL:**
   - ✅ Should match your domain (production) or localhost (development)

### Manual Profile Completion
If automatic profile creation via webhook fails, use the browser console:

```javascript
// Check user status first
checkUserStatus("USER_ID_FROM_REGISTRATION")

// Complete profile manually
completeUserProfile({
  user_id: "USER_ID_HERE",
  user_type: "golf_course", // or "professional" 
  full_name: "User Name",
  email: "user@example.com",
  course_data: { // for golf courses
    course_name: "Course Name", 
    course_type: "public",
    address: "123 Course St"
  }
  // OR professional_data for professionals
})
```

For additional help, check the browser console for detailed error logs during registration attempts.
