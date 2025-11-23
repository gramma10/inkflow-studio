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
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-foreground truncate">Tattoo Studio</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden xs:block">Πρόγραμμα Ραντεβού</p>
            </div>
            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
              {user && (
                <>
                  <div className="text-right hidden md:block">
                    <p className="text-xs text-muted-foreground">Συνδεδεμένος ως</p>
                    <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                      {user.email}
                    </p>
                    {role && (
                      <p className="text-xs text-muted-foreground">
                        {role === "admin" ? "Διαχειριστής" : "Υπάλληλος"}
                      </p>
                    )}
                  </div>
                  {role === "admin" && (
                    <Button variant="outline" size="sm" onClick={() => navigate("/admin/artists")} className="hidden sm:flex">
                      Καλλιτέχνες
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => navigate("/profile")} className="px-2 sm:px-3">
                    <span className="hidden sm:inline">Προφίλ</span>
                    <span className="sm:hidden">👤</span>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={logout} className="px-2 sm:px-3">
                    <span className="hidden sm:inline">Αποσύνδεση</span>
                    <span className="sm:hidden">🚪</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Date Navigation */}
      <div className="sticky top-[57px] sm:top-[73px] z-10 bg-background border-b">
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4">
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 sm:h-10 sm:w-10"
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <h2 className="text-sm sm:text-xl font-semibold min-w-[180px] sm:min-w-[250px] text-center">
              {format(selectedDate, "EEEE, d MMMM yyyy", { locale: el })}
            </h2>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 sm:h-10 sm:w-10"
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            >
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 4-Chair Calendar Grid */}
      <main className="container mx-auto px-2 sm:px-4">
        <ScrollArea className="h-[calc(100vh-130px)] sm:h-[calc(100vh-180px)]">
          <div className="flex gap-2 sm:gap-4 pb-6 pt-2 sm:pt-4">
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
