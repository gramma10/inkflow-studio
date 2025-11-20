import { useState } from "react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { useAppointments } from "@/hooks/useAppointments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const DailySchedule = () => {
  const [selectedDate] = useState(new Date());
  const { data: appointments, isLoading } = useAppointments(selectedDate);
  const { role } = useAuth();
  const isEmployee = role === "employee";

  if (isLoading) {
    return <div>Φόρτωση...</div>;
  }

  const totalRevenue = appointments?.reduce((sum, apt) => sum + (apt.price || 0), 0) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Πρόγραμμα Ημέρας
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          {format(selectedDate, "EEEE, d MMMM yyyy", { locale: el })}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">Σύνολο Ραντεβού</p>
            <p className="text-2xl font-bold">{appointments?.length || 0}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Έσοδα Ημέρας</p>
            <p className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</p>
          </div>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {appointments?.map((appointment) => (
              <Card key={appointment.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="font-semibold">{appointment.client_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.artists.name}
                    </p>
                    {appointment.description && (
                      <p className="text-sm text-muted-foreground">
                        {appointment.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant="outline">
                      {format(new Date(appointment.start_time), "HH:mm")} -{" "}
                      {format(new Date(appointment.end_time), "HH:mm")}
                    </Badge>
                    {appointment.price && (
                      <p className="text-sm font-semibold">€{appointment.price}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            {(!appointments || appointments.length === 0) && (
              <div className="text-center text-muted-foreground py-8">
                Δεν υπάρχουν ραντεβού για σήμερα
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
