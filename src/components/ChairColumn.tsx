import { useState } from "react";
import { format, setHours, setMinutes } from "date-fns";
import { el } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppointmentForm } from "@/components/AppointmentForm";
import { AppointmentDetail } from "@/components/AppointmentDetail";
import type { Chair, AppointmentWithArtist } from "@/types/database";
import { useAuth } from "@/contexts/AuthContext";

interface ChairColumnProps {
  chair: Chair;
  appointments: AppointmentWithArtist[];
  selectedDate: Date;
}

export const ChairColumn = ({ chair, appointments, selectedDate }: ChairColumnProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date | undefined>();
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithArtist | null>(null);
  const { role } = useAuth();

  // Only show working hours
  const workingHours = Array.from(
    { length: chair.end_hour - chair.start_hour },
    (_, i) => chair.start_hour + i
  );
  const totalWorkingHours = chair.end_hour - chair.start_hour;

  const getAppointmentStyle = (appointment: AppointmentWithArtist) => {
    const start = new Date(appointment.start_time);
    const end = new Date(appointment.end_time);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const duration = endMinutes - startMinutes;
    
    // Calculate position relative to start_hour
    const offsetMinutes = startMinutes - (chair.start_hour * 60);
    const top = (offsetMinutes / 60) * 80; // 80px per hour
    const height = (duration / 60) * 80;
    
    return {
      top: `${top}px`,
      height: `${height}px`,
      backgroundColor: appointment.color || '#8B5CF6',
    };
  };

  const handleSlotClick = (hour: number) => {
    if (role !== "employee" && role !== "admin") return;
    
    const time = setMinutes(setHours(selectedDate, hour), 0);
    setSelectedTime(time);
    setIsFormOpen(true);
  };

  return (
    <>
      <div className="flex-1 min-w-[80px] sm:min-w-[200px]">
        <div className="sticky top-0 z-10 bg-background border-b border-border p-1.5 sm:p-3">
          <h3 className="font-semibold text-xs sm:text-base text-foreground truncate">{chair.name}</h3>
        </div>
        
        <div className="relative" style={{ height: `${totalWorkingHours * 80}px` }}>
          {/* Hour lines - only working hours */}
          {workingHours.map((hour, index) => (
            <div
              key={hour}
              className="absolute w-full border-t border-border bg-background hover:bg-accent/50 cursor-pointer transition-colors"
              style={{ 
                top: `${index * 80}px`, 
                height: '80px',
              }}
              onClick={() => handleSlotClick(hour)}
            >
              <span className="absolute left-1 sm:left-2 top-1 text-[10px] sm:text-xs text-muted-foreground">
                {hour}:00
              </span>
              {/* 30-minute line */}
              <div className="absolute top-10 w-full border-t border-dashed border-border/50" />
            </div>
          ))}
          
          {/* Appointments */}
          {appointments.map((appointment) => {
            const style = getAppointmentStyle(appointment);
            return (
              <Card
                key={appointment.id}
                className="absolute left-0.5 sm:left-1 right-0.5 sm:right-1 p-1.5 sm:p-2 cursor-pointer shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                style={{
                  top: style.top,
                  height: style.height,
                  backgroundColor: style.backgroundColor,
                  color: 'white',
                  border: 'none',
                }}
                onClick={() => setSelectedAppointment(appointment)}
              >
                <div className="text-xs sm:text-sm font-medium truncate">
                  {role === "employee" || role === "admin" ? appointment.client_name : "Κλεισμένο"}
                </div>
                {appointment.service && (
                  <div className="text-[10px] sm:text-xs opacity-90 truncate">{appointment.service}</div>
                )}
                <div className="text-[10px] sm:text-xs opacity-75">
                  {format(new Date(appointment.start_time), 'HH:mm', { locale: el })} - {format(new Date(appointment.end_time), 'HH:mm', { locale: el })}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Νέο Ραντεβού - {chair.name}</DialogTitle>
          </DialogHeader>
          <AppointmentForm 
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            selectedChairId={chair.id}
            onSuccess={() => setIsFormOpen(false)} 
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Λεπτομέρειες Ραντεβού</DialogTitle>
          </DialogHeader>
          {selectedAppointment && (
            <AppointmentDetail 
              appointment={selectedAppointment}
              onClose={() => setSelectedAppointment(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
