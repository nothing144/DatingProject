// src/pages/ViewProfilePage.tsx

import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, MapPin } from "lucide-react";

const ViewProfilePage = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error) console.error(error);
        else setProfile(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="text-center mt-20 text-muted-foreground">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="text-center mt-20 text-destructive">Profile not found.</div>;
  }

  const displayImage = profile.avatar_url || "/placeholder.svg";

  return (
    <div className="min-h-screen p-4 bg-background">
      <div className="max-w-md mx-auto">
        <Card className="shadow-md">
          <CardContent className="p-4 space-y-4">
            <div className="text-center">
              <img
                src={displayImage}
                alt={profile.name}
                className="w-32 h-32 rounded-full mx-auto object-cover"
                onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
              />
              <h2 className="text-xl font-bold mt-2">{profile.name}</h2>
              {profile.age && <p className="text-muted-foreground">{profile.age} years old</p>}
              {profile.location && (
                <p className="flex justify-center items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {profile.location}
                </p>
              )}
            </div>

            {profile.shortBio && <p className="text-center text-sm italic">{profile.shortBio}</p>}
            {profile.description && <p className="text-sm">{profile.description}</p>}

            {profile.interests && profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest: string, i: number) => (
                  <Badge key={i} variant="secondary">
                    {interest}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ViewProfilePage;
