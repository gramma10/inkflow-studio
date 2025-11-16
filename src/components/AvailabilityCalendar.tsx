import { useState } from "react";
import { format, addDays, startOfDay } from "date-fns";
import { el } from "date-fns/locale";
import { useAppointments } from "@/hooks/useAppointments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AppointmentForm } from "./AppointmentForm";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

export const AvailabilityCalendar = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const { data: appointments } = useAppointments(selectedDate);

  const hours = Array.from({ length: 12 }, (_, i) => i + 10); // 10:00 - 21:00

  const getChairAvailability = (hour: number) => {
    const timeSlot = new Date(selectedDate);
    timeSlot.setHours(hour, 0, 0, 0);
    const nextHour = new Date(timeSlot);
    nextHour.setHours(hour + 1, 0, 0, 0);

    const overlapping = appointments?.filter((apt) => {
      const aptStart = new Date(apt.start_time);
      const aptEnd = new Date(apt.end_time);
      return (aptStart < nextHour && aptEnd > timeSlot);
    }) || [];

    return 4 - overlapping.length;
  };

  const getAvailabilityColor = (available: number) => {
    if (available >= 2) return "bg-success/20 hover:bg-success/30 border-success/40";
    if (available === 1) return "bg-warning/20 hover:bg-warning/30 border-warning/40";
    return "bg-danger/20 hover:bg-danger/30 border-danger/40";
  };

  const handleTimeSlotClick = (hour: number) => {
    const available = getChairAvailability(hour);
    if (available > 0) {
      setSelectedTime(`${hour.toString().padStart(2, '0')}:00`);
      setIsFormOpen(true);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Διαθεσιμότητα Καρεκλών</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-normal min-w-[150px] text-center">
              {format(selectedDate, "d MMMM yyyy", { locale: el })}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {hours.map((hour) => {
          const available = getChairAvailability(hour);
          const colorClass = getAvailabilityColor(available);
          
          return (
            <button
              key={hour}
              onClick={() => handleTimeSlotClick(hour)}
              disabled={available === 0}
              className={`w-full p-4 rounded-lg border-2 transition-colors ${colorClass} ${
                available === 0 ? "cursor-not-allowed opacity-60" : "cursor-pointer"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  {hour.toString().padStart(2, '0')}:00 - {(hour + 1).toString().padStart(2, '0')}:00
                </span>
                <span className="text-sm font-semibold">
                  Διαθέσιμες: {available} / 4
                </span>
              </div>
            </button>
          );
        })}

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Προσθήκη Ραντεβού</DialogTitle>
            </DialogHeader>
            <AppointmentForm
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onSuccess={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
