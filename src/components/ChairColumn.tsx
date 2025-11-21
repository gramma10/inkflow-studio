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

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const ChairColumn = ({ chair, appointments, selectedDate }: ChairColumnProps) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<Date | undefined>();
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithArtist | null>(null);
  const { role } = useAuth();

  const getAppointmentStyle = (appointment: AppointmentWithArtist) => {
    const start = new Date(appointment.start_time);
    const end = new Date(appointment.end_time);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const duration = endMinutes - startMinutes;
    
    const top = (startMinutes / 60) * 80; // 80px per hour
    const height = (duration / 60) * 80;
    
    return {
      top: `${top}px`,
      height: `${height}px`,
      backgroundColor: appointment.color || '#8B5CF6',
    };
  };

  const handleSlotClick = (hour: number) => {
    if (role !== "employee") return;
    if (hour < chair.start_hour || hour >= chair.end_hour) return;
    
    const time = setMinutes(setHours(selectedDate, hour), 0);
    setSelectedTime(time);
    setIsFormOpen(true);
  };

  const isWorkingHour = (hour: number) => {
    return hour >= chair.start_hour && hour < chair.end_hour;
  };

  return (
    <>
      <div className="flex-1 min-w-[200px]">
        <div className="sticky top-0 z-10 bg-background border-b border-border p-3">
          <h3 className="font-semibold text-foreground">{chair.name}</h3>
        </div>
        
        <div className="relative" style={{ height: `${24 * 80}px` }}>
          {/* Hour lines */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className={`absolute w-full border-t border-border transition-colors ${
                isWorkingHour(hour) 
                  ? 'bg-background hover:bg-accent/50 cursor-pointer' 
                  : 'bg-muted/30'
              }`}
              style={{ 
                top: `${hour * 80}px`, 
                height: '80px',
              }}
              onClick={() => handleSlotClick(hour)}
            >
              <span className="absolute left-2 top-1 text-xs text-muted-foreground">
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
                className="absolute left-1 right-1 p-2 cursor-pointer shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                style={{
                  top: style.top,
                  height: style.height,
                  backgroundColor: style.backgroundColor,
                  color: 'white',
                  border: 'none',
                }}
                onClick={() => setSelectedAppointment(appointment)}
              >
                <div className="text-sm font-medium truncate">
                  {role === "employee" ? appointment.client_name : "Κλεισμένο"}
                </div>
                {appointment.service && (
                  <div className="text-xs opacity-90 truncate">{appointment.service}</div>
                )}
                <div className="text-xs opacity-75">
                  {format(new Date(appointment.start_time), 'HH:mm', { locale: el })} - {format(new Date(appointment.end_time), 'HH:mm', { locale: el })}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Νέο Ραντεβού - {chair.name}</DialogTitle>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Λεπτομέρειες Ραντεβού</DialogTitle>
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
