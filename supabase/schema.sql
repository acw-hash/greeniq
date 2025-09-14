-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  user_type text CHECK (user_type IN ('golf_course', 'professional', 'admin')),
  full_name text,
  email text,
  phone text,
  location point,
  is_verified boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Golf course profiles
CREATE TABLE golf_course_profiles (
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  course_name text NOT NULL,
  course_type text CHECK (course_type IN ('public', 'private', 'resort', 'municipal')),
  address text NOT NULL,
  description text,
  facilities jsonb DEFAULT '{}',
  preferred_qualifications text[] DEFAULT '{}',
  stripe_account_id text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Professional profiles
CREATE TABLE professional_profiles (
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  bio text,
  experience_level text CHECK (experience_level IN ('entry', 'intermediate', 'expert')),
  specializations text[] DEFAULT '{}',
  equipment_skills text[] DEFAULT '{}',
  hourly_rate decimal(10,2),
  travel_radius integer DEFAULT 25,
  rating decimal(3,2) DEFAULT 0,
  total_jobs integer DEFAULT 0,
  stripe_account_id text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Jobs
CREATE TABLE jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  job_type text NOT NULL,
  location point NOT NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone,
  hourly_rate decimal(10,2) NOT NULL,
  required_certifications text[] DEFAULT '{}',
  required_experience text,
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  urgency_level text DEFAULT 'normal' CHECK (urgency_level IN ('normal', 'high', 'emergency')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Applications
CREATE TABLE applications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  message text,
  proposed_rate decimal(10,2),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  applied_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(job_id, professional_id)
);

-- Messages
CREATE TABLE messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Reviews
CREATE TABLE reviews (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  overall_rating integer CHECK (overall_rating >= 1 AND overall_rating <= 5),
  quality_rating integer CHECK (quality_rating >= 1 AND quality_rating <= 5),
  communication_rating integer CHECK (communication_rating >= 1 AND communication_rating <= 5),
  punctuality_rating integer CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(job_id, reviewer_id, reviewee_id)
);

-- Certifications
CREATE TABLE certifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  certification_type text NOT NULL,
  issuing_organization text NOT NULL,
  issue_date date,
  expiry_date date,
  document_url text,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Payments
CREATE TABLE payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  payer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  payee_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  platform_fee decimal(10,2) NOT NULL,
  stripe_payment_intent_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Notifications
CREATE TABLE notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}',
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE golf_course_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, users can update own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Golf course profiles
CREATE POLICY "Golf course profiles are viewable by everyone" ON golf_course_profiles
  FOR SELECT USING (true);

CREATE POLICY "Golf courses can update own profile" ON golf_course_profiles
  FOR UPDATE USING (
    profile_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'golf_course')
  );

CREATE POLICY "Golf courses can insert own profile" ON golf_course_profiles
  FOR INSERT WITH CHECK (
    profile_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'golf_course')
  );

-- Professional profiles
CREATE POLICY "Professional profiles are viewable by everyone" ON professional_profiles
  FOR SELECT USING (true);

CREATE POLICY "Professionals can update own profile" ON professional_profiles
  FOR UPDATE USING (
    profile_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'professional')
  );

CREATE POLICY "Professionals can insert own profile" ON professional_profiles
  FOR INSERT WITH CHECK (
    profile_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'professional')
  );

-- Jobs: Public read, golf courses can create/update own
CREATE POLICY "Jobs are viewable by everyone" ON jobs
  FOR SELECT USING (true);

CREATE POLICY "Golf courses can create jobs" ON jobs
  FOR INSERT WITH CHECK (
    auth.uid() = course_id AND 
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'golf_course')
  );

CREATE POLICY "Golf courses can update own jobs" ON jobs
  FOR UPDATE USING (auth.uid() = course_id);

-- Applications: Viewable by job poster and applicant
CREATE POLICY "Applications viewable by involved parties" ON applications
  FOR SELECT USING (
    auth.uid() = professional_id OR 
    auth.uid() IN (SELECT course_id FROM jobs WHERE id = job_id)
  );

CREATE POLICY "Professionals can create applications" ON applications
  FOR INSERT WITH CHECK (auth.uid() = professional_id);

CREATE POLICY "Involved parties can update applications" ON applications
  FOR UPDATE USING (
    auth.uid() = professional_id OR 
    auth.uid() IN (SELECT course_id FROM jobs WHERE id = job_id)
  );

-- Messages: Viewable by job participants
CREATE POLICY "Messages viewable by job participants" ON messages
  FOR SELECT USING (
    auth.uid() = sender_id OR
    auth.uid() IN (
      SELECT course_id FROM jobs WHERE id = job_id
      UNION
      SELECT professional_id FROM applications WHERE job_id = messages.job_id AND status = 'accepted'
    )
  );

CREATE POLICY "Job participants can send messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    (auth.uid() IN (
      SELECT course_id FROM jobs WHERE id = job_id
      UNION
      SELECT professional_id FROM applications WHERE job_id = messages.job_id AND status = 'accepted'
    ))
  );

-- Reviews: Viewable by everyone, created by job participants
CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Job participants can create reviews" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = reviewer_id AND
    (auth.uid() IN (
      SELECT course_id FROM jobs WHERE id = job_id
      UNION
      SELECT professional_id FROM applications WHERE job_id = reviews.job_id AND status = 'accepted'
    ))
  );

-- Certifications: Viewable by professionals and admins
CREATE POLICY "Certifications viewable by owner and admins" ON certifications
  FOR SELECT USING (
    professional_id = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

CREATE POLICY "Professionals can manage own certifications" ON certifications
  FOR ALL USING (professional_id = auth.uid());

-- Payments: Viewable by involved parties
CREATE POLICY "Payments viewable by involved parties" ON payments
  FOR SELECT USING (
    auth.uid() = payer_id OR 
    auth.uid() = payee_id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

-- Notifications: Users can see own notifications
CREATE POLICY "Users can see own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Database functions

-- Function to find jobs within distance
CREATE OR REPLACE FUNCTION jobs_within_distance(
  lat FLOAT,
  lng FLOAT,
  distance_km INT
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  distance_km FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    j.id,
    j.title,
    ST_Distance(
      ST_GeogFromText('POINT(' || lng || ' ' || lat || ')'),
      ST_GeogFromText('POINT(' || ST_X(j.location) || ' ' || ST_Y(j.location) || ')')
    ) / 1000 AS distance_km
  FROM jobs j
  WHERE ST_DWithin(
    ST_GeogFromText('POINT(' || lng || ' ' || lat || ')'),
    ST_GeogFromText('POINT(' || ST_X(j.location) || ' ' || ST_Y(j.location) || ')'),
    distance_km * 1000
  )
  AND j.status = 'open'
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update professional rating
CREATE OR REPLACE FUNCTION update_professional_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE professional_profiles
  SET 
    rating = (
      SELECT AVG(overall_rating)::DECIMAL(3,2)
      FROM reviews
      WHERE reviewee_id = NEW.reviewee_id
    ),
    total_jobs = (
      SELECT COUNT(*)
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      WHERE a.professional_id = NEW.reviewee_id
      AND j.status = 'completed'
    )
  WHERE profile_id = NEW.reviewee_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_after_review
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_professional_rating();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_jobs_location ON jobs USING GIST (location);
CREATE INDEX idx_jobs_status_created ON jobs (status, created_at DESC);
CREATE INDEX idx_jobs_course_id ON jobs (course_id);
CREATE INDEX idx_applications_professional_status ON applications (professional_id, status);
CREATE INDEX idx_applications_job_id ON applications (job_id);
CREATE INDEX idx_messages_job_created ON messages (job_id, created_at DESC);
CREATE INDEX idx_reviews_reviewee ON reviews (reviewee_id);
CREATE INDEX idx_notifications_user_created ON notifications (user_id, created_at DESC);
CREATE INDEX idx_certifications_professional ON certifications (professional_id);
