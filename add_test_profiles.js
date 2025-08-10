// Script to add test profiles to Supabase database
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ljjyipvvxmduvxoyzvhf.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqanlpcHZ2eG1kdXZ4b3l6dmhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NDcxNzMsImV4cCI6MjA2OTUyMzE3M30.fWaVeL9482grgbXGcwYQu-ehDV5L3xyG-vix8Os8hno";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const testProfiles = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Aisha Sharma',
    username: 'aisha_s',
    age: 20,
    location: 'Bhubaneswar, Odisha',
    description: 'Computer Science student who loves coding and music. Looking for someone to share adventures with!',
    shortBio: 'Coding enthusiast, music lover, and adventure seeker 🎵💻✨',
    interests: ['Programming', 'Music', 'Photography', 'Dancing', 'Reading', 'Travel'],
    avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b62b8e3d?w=400&h=400&fit=crop&crop=face',
    email: 'aisha@example.com'
  },
  {
    id: '22222222-2222-2222-2222-222222222222', 
    name: 'Rohan Kumar',
    username: 'rohan_k',
    age: 21,
    location: 'Bhubaneswar, Odisha',
    description: 'Engineering student passionate about technology and sports. Love playing cricket and exploring new places!',
    shortBio: 'Tech geek by day, cricket player by evening 🏏⚡',
    interests: ['Cricket', 'Technology', 'Gaming', 'Movies'],
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    email: 'rohan@example.com'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Priya Patel', 
    username: 'priya_p',
    age: 19,
    location: 'Bhubaneswar, Odisha',
    description: 'Art student who loves painting and creative expression. Always looking for inspiration in everyday moments.',
    shortBio: 'Artist painting her way through college life 🎨🌈',
    interests: ['Art', 'Painting', 'Literature', 'Yoga', 'Nature'],
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
    email: 'priya@example.com'
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Vikram Singh',
    username: 'vikram_s', 
    age: 22,
    location: 'Bhubaneswar, Odisha',
    description: 'Final year mechanical engineering student. Love working with machines and building cool stuff!',
    shortBio: 'Building the future, one gear at a time ⚙️🔧',
    interests: ['Engineering', 'Robotics', 'Basketball', 'Cooking'],
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
    email: 'vikram@example.com'
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Ananya Das',
    username: 'ananya_d',
    age: 20, 
    location: 'Bhubaneswar, Odisha',
    description: 'Economics major with a passion for social work and community development. Love discussing current affairs!',
    shortBio: 'Changing the world one conversation at a time 🌍💪',
    interests: ['Economics', 'Social Work', 'Debate', 'Volunteering', 'Books'],
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
    email: 'ananya@example.com'  
  }
];

async function addTestProfiles() {
  console.log('Adding test profiles to database...');
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert(testProfiles);

    if (error) {
      console.error('Error adding profiles:', error);
    } else {
      console.log('✅ Test profiles added successfully!');
      console.log(`Added ${testProfiles.length} profiles`);
    }
  } catch (err) {
    console.error('❌ Failed to add profiles:', err);
  }
}

addTestProfiles();