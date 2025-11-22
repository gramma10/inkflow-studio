import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useChairs } from "@/hooks/useChairs";
import { useAppointments } from "@/hooks/useAppointments";
import { ChairColumn } from "@/components/ChairColumn";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, addDays } from "date-fns";
import { el } from "date-fns/locale";

const Index = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();
  const { user, role, loading, logout } = useAuth();
  const { data: chairs, isLoading: chairsLoading } = useChairs();
  const { data: appointments, isLoading: appointmentsLoading } = useAppointments(selectedDate);

  if (!loading && !user) {
    navigate("/auth", { replace: true });
    return null;
  }

  if (loading || chairsLoading || appointmentsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Φόρτωση...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Tattoo Studio</h1>
              <p className="text-sm text-muted-foreground">Πρόγραμμα Ραντεβού</p>
            </div>
            <div className="flex items-center gap-3">
              {user && (
                <>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-muted-foreground">Συνδεδεμένος ως</p>
                    <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                      {user.email}
                    </p>
                    {role && (
                      <p className="text-xs text-muted-foreground">
                        {role === "employee" ? "Υπάλληλος" : role === "admin" ? "Διαχειριστής" : "Άλλος"}
                      </p>
                    )}
                  </div>
                  {role === "admin" && (
                    <Button variant="outline" size="sm" onClick={() => navigate("/admin/artists")}>
                      Καλλιτέχνες
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => navigate("/profile")}>
                    Προφίλ
                  </Button>
                  <Button variant="ghost" size="sm" onClick={logout}>
                    Αποσύνδεση
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Date Navigation */}
      <div className="sticky top-[73px] z-10 bg-background border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold min-w-[250px] text-center">
              {format(selectedDate, "EEEE, d MMMM yyyy", { locale: el })}
            </h2>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 4-Chair Calendar Grid */}
      <main className="container mx-auto px-4">
        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="flex gap-4 pb-6 pt-4">
            {chairs?.map((chair) => {
              const chairAppointments = appointments?.filter(
                (apt) => apt.chair_id === chair.id
              ) || [];
              
              return (
                <ChairColumn
                  key={chair.id}
                  chair={chair}
                  appointments={chairAppointments}
                  selectedDate={selectedDate}
                />
              );
            })}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
};

export default Index;
