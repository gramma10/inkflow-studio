import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useChairs } from "@/hooks/useChairs";
import { useArtists } from "@/hooks/useArtists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { format } from "date-fns";

const appointmentSchema = z.object({
  client_name: z.string().min(1, "Το όνομα πελάτη είναι υποχρεωτικό"),
  artist_id: z.string().min(1, "Επιλέξτε καλλιτέχνη"),
  chair_id: z.string().min(1, "Επιλέξτε καρέκλα"),
  date: z.string().min(1, "Η ημερομηνία είναι υποχρεωτική"),
  time: z.string().min(1, "Η ώρα είναι υποχρεωτική"),
  duration: z.string().min(1, "Επιλέξτε διάρκεια"),
  service: z.string().optional(),
  color: z.string().optional(),
  price: z.string().optional(),
  description: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  selectedDate?: Date;
  selectedTime?: Date;
  selectedChairId?: number;
  appointment?: any;
  onSuccess?: () => void;
}

export const AppointmentForm = ({ selectedDate, selectedTime, selectedChairId, appointment, onSuccess }: AppointmentFormProps) => {
  const { user, role } = useAuth();
  const { data: chairs } = useChairs();
  const { data: artists } = useArtists();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userArtistId, setUserArtistId] = useState<string | null>(null);

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: appointment ? {
      client_name: appointment.client_name || "",
      artist_id: appointment.artist_id || "",
      chair_id: appointment.chair_id?.toString() || "",
      date: format(new Date(appointment.start_time), "yyyy-MM-dd"),
      time: format(new Date(appointment.start_time), "HH:mm"),
      duration: ((new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime()) / 60000).toString(),
      service: appointment.service || "",
      color: appointment.color || "#8B5CF6",
      price: appointment.price?.toString() || "",
      description: appointment.description || "",
    } : {
      client_name: "",
      artist_id: "",
      chair_id: selectedChairId?.toString() || "",
      date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      time: selectedTime ? format(selectedTime, "HH:mm") : "10:00",
      duration: "60",
      service: "",
      color: "#8B5CF6",
      price: "",
      description: "",
    },
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("artist_id")
        .eq("id", user.id)
        .maybeSingle();
      
      if (data?.artist_id) {
        setUserArtistId(data.artist_id);
        // Auto-set artist_id for employees when creating new appointment
        if (role === "employee" && !appointment) {
          form.setValue("artist_id", data.artist_id);
        }
      }
    };
    
    fetchUserProfile();
  }, [user, role, appointment, form]);

  const saveAppointment = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      const startTime = new Date(`${data.date}T${data.time}`);
      const endTime = new Date(startTime.getTime() + parseInt(data.duration) * 60000);

      const appointmentData = {
        client_name: data.client_name,
        artist_id: data.artist_id,
        chair_id: parseInt(data.chair_id),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        service: data.service || null,
        color: data.color || "#8B5CF6",
        price: data.price ? parseFloat(data.price) : null,
        description: data.description || null,
      };

      if (appointment) {
        const { error } = await supabase
          .from("appointments")
          .update(appointmentData)
          .eq("id", appointment.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("appointments")
          .insert(appointmentData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success(appointment ? "Το ραντεβού ενημερώθηκε επιτυχώς!" : "Το ραντεβού δημιουργήθηκε επιτυχώς!");
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      if (error.message?.includes("ήδη κρατημένη")) {
        toast.error("Αυτή η ώρα είναι ήδη κρατημένη για αυτή την καρέκλα.");
      } else {
        toast.error(appointment ? "Σφάλμα κατά την ενημέρωση του ραντεβού" : "Σφάλμα κατά τη δημιουργία του ραντεβού");
      }
    },
  });

  const onSubmit = async (data: AppointmentFormData) => {
    setIsSubmitting(true);
    await saveAppointment.mutateAsync(data);
    setIsSubmitting(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="client_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Όνομα Πελάτη</FormLabel>
              <FormControl>
                <Input placeholder="Εισάγετε όνομα" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="artist_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Καλλιτέχνης</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={role !== "admin"}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Επιλέξτε καλλιτέχνη" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {artists?.map((artist) => (
                    <SelectItem key={artist.id} value={artist.id}>
                      {artist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="chair_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Καρέκλα</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={!!selectedChairId}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Επιλέξτε καρέκλα" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {chairs?.map((chair) => (
                    <SelectItem key={chair.id} value={chair.id.toString()}>
                      {chair.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="service"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Υπηρεσία</FormLabel>
              <FormControl>
                <Input placeholder="π.χ. Τατουάζ, Piercing" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Χρώμα</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input type="color" {...field} className="w-20 h-10" />
                </FormControl>
                <div className="flex gap-1 flex-wrap flex-1">
                  {["#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#EF4444"].map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="w-8 h-8 rounded border-2 border-border hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => field.onChange(color)}
                    />
                  ))}
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ημερομηνία</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ώρα Έναρξης</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Διάρκεια</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Επιλέξτε διάρκεια" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="30">30 λεπτά</SelectItem>
                  <SelectItem value="60">60 λεπτά</SelectItem>
                  <SelectItem value="90">90 λεπτά</SelectItem>
                  <SelectItem value="120">120 λεπτά</SelectItem>
                  <SelectItem value="180">180 λεπτά</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Τιμή (€)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="0.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Περιγραφή</FormLabel>
              <FormControl>
                <Textarea placeholder="Προσθέστε σημειώσεις..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Δημιουργία..." : "Δημιουργία Ραντεβού"}
        </Button>
      </form>
    </Form>
  );
};
