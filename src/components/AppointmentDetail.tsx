import { useState } from "react";
import { format } from "date-fns";
import { el } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppointmentForm } from "@/components/AppointmentForm";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { AppointmentWithArtist } from "@/types/database";
import { Pencil, Trash2 } from "lucide-react";

interface AppointmentDetailProps {
  appointment: AppointmentWithArtist;
  onClose: () => void;
}

export const AppointmentDetail = ({ appointment, onClose }: AppointmentDetailProps) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { role } = useAuth();

  const deleteAppointment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("appointments")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({
        title: "Επιτυχία",
        description: "Το ραντεβού διαγράφηκε",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Σφάλμα",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (confirm("Είστε σίγουροι ότι θέλετε να διαγράψετε αυτό το ραντεβού;")) {
      deleteAppointment.mutate(appointment.id);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {(role === "employee" || role === "admin") && (
          <>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Πελάτης</label>
              <p className="text-foreground">{appointment.client_name}</p>
            </div>

            {appointment.service && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Υπηρεσία</label>
                <p className="text-foreground">{appointment.service}</p>
              </div>
            )}
          </>
        )}

        <div>
          <label className="text-sm font-medium text-muted-foreground">Καλλιτέχνης</label>
          <p className="text-foreground">{appointment.artists.name}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">Ημερομηνία & Ώρα</label>
          <p className="text-foreground">
            {format(new Date(appointment.start_time), "PPP 'στις' HH:mm", { locale: el })} - {format(new Date(appointment.end_time), "HH:mm", { locale: el })}
          </p>
        </div>

        {(role === "employee" || role === "admin") && (
          <>
            {appointment.price && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Τιμή</label>
                <p className="text-foreground">{appointment.price}€</p>
              </div>
            )}

            {appointment.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Περιγραφή</label>
                <p className="text-foreground">{appointment.description}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsEditOpen(true)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Επεξεργασία
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                disabled={deleteAppointment.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Διαγραφή
              </Button>
            </div>
          </>
        )}
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Επεξεργασία Ραντεβού</DialogTitle>
          </DialogHeader>
          <AppointmentForm 
            appointment={appointment}
            onSuccess={() => {
              setIsEditOpen(false);
              onClose();
            }} 
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
