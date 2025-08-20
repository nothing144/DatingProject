// Script to create test profiles for pagination testing
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://ljjyipvvxmduvxoyzvhf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqanlpcHZ2eG1kdXZ4b3l6dmhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NDcxNzMsImV4cCI6MjA2OTUyMzE3M30.fWaVeL9482grgbXGcwYQu-ehDV5L3xyG-vix8Os8hno";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const sampleProfiles = [
  {
    id: "test-user-1",
    name: "Alice Johnson",
    username: "alice_j",
    age: 20,
    location: "Bhubaneswar, Odisha",
    description: "Computer Science student at ITER. Love coding, music, and chai!",
    shortBio: "CS student who codes and drinks chai ☕",
    interests: ["Programming", "Music", "Photography", "Reading"],
    avatar_url: "https://ui-avatars.com/api/?name=Alice+Johnson&background=ff6b9d&color=fff&size=400"
  },
  {
    id: "test-user-2", 
    name: "Ravi Kumar",
    username: "ravi_k",
    age: 21,
    location: "Bhubaneswar, Odisha",
    description: "Mechanical Engineering student. Love bikes, travel, and good food.",
    shortBio: "Mech engineer with wanderlust 🏍️",
    interests: ["Travel", "Bikes", "Food", "Movies"],
    avatar_url: "https://ui-avatars.com/api/?name=Ravi+Kumar&background=4285f4&color=fff&size=400"
  },
  {
    id: "test-user-3",
    name: "Priya Sharma", 
    username: "priya_s",
    age: 19,
    location: "Bhubaneswar, Odisha", 
    description: "Electronics student passionate about technology and art.",
    shortBio: "Tech enthusiast and artist 🎨",
    interests: ["Technology", "Art", "Dancing", "Books"],
    avatar_url: "https://ui-avatars.com/api/?name=Priya+Sharma&background=34a853&color=fff&size=400"
  },
  {
    id: "test-user-4",
    name: "Amit Patel",
    username: "amit_p", 
    age: 22,
    location: "Bhubaneswar, Odisha",
    description: "Final year IT student. Cricket enthusiast and movie buff.",
    shortBio: "IT student who loves cricket 🏏",
    interests: ["Cricket", "Movies", "Gaming", "Tech"],
    avatar_url: "https://ui-avatars.com/api/?name=Amit+Patel&background=ea4335&color=fff&size=400"
  },
  {
    id: "test-user-5",
    name: "Sneha Reddy",
    username: "sneha_r",
    age: 20,
    location: "Bhubaneswar, Odisha",
    description: "Biotech student interested in research and social work.",
    shortBio: "Biotech researcher and social worker 🧬",
    interests: ["Research", "Social Work", "Reading", "Yoga"],
    avatar_url: "https://ui-avatars.com/api/?name=Sneha+Reddy&background=fbbc04&color=fff&size=400"
  }
];

// Create additional profiles to test pagination (total 25 profiles)
for (let i = 6; i <= 25; i++) {
  const names = [
    "Arjun Singh", "Kavya Nair", "Rohit Gupta", "Ananya Das", "Vikram Rao",
    "Ishita Jain", "Karan Mehta", "Pooja Agarwal", "Siddharth Verma", "Ritika Bhatt",
    "Aditya Sharma", "Nisha Pandey", "Rahul Tiwari", "Sakshi Dubey", "Varun Joshi",
    "Divya Malhotra", "Harsh Bansal", "Shruti Kapoor", "Gaurav Sinha", "Megha Goyal"
  ];
  
  const interests = [
    ["Music", "Dance", "Travel", "Food"],
    ["Sports", "Gaming", "Tech", "Movies"], 
    ["Reading", "Writing", "Art", "Photography"],
    ["Coding", "AI", "Robotics", "Science"],
    ["Fitness", "Yoga", "Health", "Nature"]
  ];
  
  const locations = [
    "Bhubaneswar, Odisha", "Cuttack, Odisha", "Berhampur, Odisha", 
    "Rourkela, Odisha", "Sambalpur, Odisha"
  ];
  
  const name = names[(i - 6) % names.length];
  const firstName = name.split(' ')[0];
  
  sampleProfiles.push({
    id: `test-user-${i}`,
    name: name,
    username: `${firstName.toLowerCase()}_${i}`,
    age: 18 + (i % 5),
    location: locations[i % locations.length],
    description: `Engineering student at ITER. Passionate about learning and making new connections.`,
    shortBio: `${name.split(' ')[1]} student at ITER ⚡`,
    interests: interests[i % interests.length],
    avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=400`
  });
}

async function createTestProfiles() {
  console.log("Creating test profiles...");
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(sampleProfiles, { onConflict: 'id' });
      
    if (error) {
      console.error("Error creating profiles:", error);
    } else {
      console.log(`✅ Successfully created ${sampleProfiles.length} test profiles!`);
      console.log("Test profiles ready for pagination testing.");
    }
  } catch (err) {
    console.error("Failed to create profiles:", err);
  }
}

createTestProfiles();