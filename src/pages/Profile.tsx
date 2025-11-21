import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useArtists } from "@/hooks/useArtists";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { toast } from "sonner";
import { ArrowLeft, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const profileSchema = z.object({
  display_name: z
    .string()
    .trim()
    .max(100, "Το όνομα εμφάνισης πρέπει να είναι έως 100 χαρακτήρες")
    .optional(),
  artist_id: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileData {
  id: string;
  email: string | null;
  display_name: string | null;
  artist_id: string | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, role, loading: authLoading } = useAuth();
  const { data: artists, isLoading: artistsLoading } = useArtists();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      display_name: "",
      artist_id: "none",
    },
  });

  useEffect(() => {
    document.title = "Προφίλ | Tattoo Studio";
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching profile:", error);
          toast.error("Αποτυχία φόρτωσης προφίλ");
          return;
        }

        if (data) {
          setProfile(data);
          form.reset({
            display_name: data.display_name || "",
            artist_id: data.artist_id || "none",
          });
        }
      } catch (error) {
        console.error("Unexpected error:", error);
        toast.error("Απροσδόκητο σφάλμα");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      void fetchProfile();
    }
  }, [user, form]);

  const handleSubmit = async (values: ProfileFormData) => {
    if (!user) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: values.display_name?.trim() || null,
          artist_id: values.artist_id === "none" ? null : values.artist_id || null,
        })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating profile:", error);
        toast.error("Αποτυχία ενημέρωσης προφίλ");
        return;
      }

      toast.success("Το προφίλ ενημερώθηκε επιτυχώς");

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              display_name: values.display_name?.trim() || null,
              artist_id: values.artist_id === "none" ? null : values.artist_id || null,
            }
          : null,
      );
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("Απροσδόκητο σφάλμα");
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Φόρτωση...</p>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const selectedArtist = artists?.find((a) => a.id === form.watch("artist_id"));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Πίσω
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Προφίλ Χρήστη</CardTitle>
                <CardDescription>
                  Διαχειριστείτε τα στοιχεία του προφίλ σας
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Email</div>
              <div className="text-base text-foreground">{profile.email}</div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Ρόλος</div>
              <div>
                <Badge variant="secondary">
                  {role === "employee"
                    ? "Υπάλληλος / Καλλιτέχνης"
                    : role === "other"
                      ? "Άλλος"
                      : "Μη ορισμένος"}
                </Badge>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Όνομα Εμφάνισης</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="π.χ. Γιάννης Παπαδόπουλος"
                          maxLength={100}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Το όνομα που θα εμφανίζεται στην εφαρμογή
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {role === "employee" && (
                  <FormField
                    control={form.control}
                    name="artist_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Σύνδεση με Καλλιτέχνη</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={artistsLoading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Επιλέξτε καλλιτέχνη" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Κανένας</SelectItem>
                            {artists?.map((artist) => (
                              <SelectItem key={artist.id} value={artist.id}>
                                {artist.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Συνδέστε το προφίλ σας με έναν καλλιτέχνη του studio
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {role === "employee" && selectedArtist && (
                  <div className="rounded-lg bg-muted/50 p-4 space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Επιλεγμένος Καλλιτέχνης
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedArtist.name}</p>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isSaving}>
                  {isSaving ? "Αποθήκευση..." : "Αποθήκευση Αλλαγών"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;
