import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentForm } from "@/components/AppointmentForm";
import { AvailabilityCalendar } from "@/components/AvailabilityCalendar";
import { DailySchedule } from "@/components/DailySchedule";
import { Plus, Calendar, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const navigate = useNavigate();
  const { user, role, loading, logout } = useAuth();

  useEffect(() => {
    document.title = "Πρόγραμμα | Tattoo Studio";
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth", { replace: true });
    }
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Tattoo Studio</h1>
              <p className="text-sm text-muted-foreground">Διαχείριση Ραντεβού</p>
            </div>
            <div className="flex items-center gap-3">
              {!loading && (
                <>
                  {user && (
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">Συνδεδεμένος ως</p>
                      <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                        {user.email}
                      </p>
                      {role && (
                        <p className="text-xs text-muted-foreground">
                          Ρόλος: {role === "employee" ? "Υπάλληλος / Καλλιτέχνης" : "Άλλος"}
                        </p>
                      )}
                    </div>
                  )}
                  {!user && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/auth")}
                    >
                      Σύνδεση
                    </Button>
                  )}
                  {user && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/profile")}
                      >
                        Προφίλ
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={logout}
                      >
                        Αποσύνδεση
                      </Button>
                    </>
                  )}
                </>
              )}
              {!loading && role === "employee" && (
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Νέο Ραντεβού
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Προσθήκη Ραντεβού</DialogTitle>
                    </DialogHeader>
                    <AppointmentForm onSuccess={() => setIsFormOpen(false)} />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="availability" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="availability" className="gap-2">
              <Clock className="h-4 w-4" />
              Διαθεσιμότητα
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <Calendar className="h-4 w-4" />
              Πρόγραμμα
            </TabsTrigger>
          </TabsList>

          <TabsContent value="availability">
            <AvailabilityCalendar />
          </TabsContent>

          <TabsContent value="schedule">
            <DailySchedule />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
