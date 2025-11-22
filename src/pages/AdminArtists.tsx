import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, User } from "lucide-react";

interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  artist_id: string | null;
  artists?: {
    id: string;
    name: string;
  } | null;
}

const AdminArtists = () => {
  const navigate = useNavigate();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && (!user || role !== "admin")) {
      navigate("/", { replace: true });
    }
  }, [user, role, loading, navigate]);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          display_name,
          artist_id,
          artists (
            id,
            name
          )
        `)
        .order("email");
      
      if (error) throw error;
      return data as Profile[];
    },
    enabled: role === "admin",
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Φόρτωση...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Προφίλ Καλλιτεχνών</h1>
              <p className="text-sm text-muted-foreground">Προβολή όλων των καλλιτεχνών και των προφίλ τους</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profiles?.map((profile) => (
            <Card key={profile.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {profile.display_name || "Χωρίς όνομα"}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {profile.email || "Χωρίς email"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Καλλιτέχνης:</span>
                    <span className="font-medium">
                      {profile.artists?.name || "Δεν έχει οριστεί"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {!profiles || profiles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Δεν βρέθηκαν προφίλ</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminArtists;