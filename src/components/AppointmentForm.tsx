import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
  date: z.string().min(1, "Η ημερομηνία είναι υποχρεωτική"),
  time: z.string().min(1, "Η ώρα είναι υποχρεωτική"),
  duration: z.string().min(1, "Επιλέξτε διάρκεια"),
  price: z.string().optional(),
  description: z.string().optional(),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  selectedDate?: Date;
  selectedTime?: string;
  onSuccess?: () => void;
}

export const AppointmentForm = ({ selectedDate, selectedTime, onSuccess }: AppointmentFormProps) => {
  const { data: artists } = useArtists();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      client_name: "",
      artist_id: "",
      date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      time: selectedTime || "10:00",
      duration: "60",
      price: "",
      description: "",
    },
  });

  const createAppointment = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      const startTime = new Date(`${data.date}T${data.time}`);
      const endTime = new Date(startTime.getTime() + parseInt(data.duration) * 60000);

      const { error } = await supabase.from("appointments").insert({
        client_name: data.client_name,
        artist_id: data.artist_id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        price: data.price ? parseFloat(data.price) : null,
        description: data.description || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Το ραντεβού δημιουργήθηκε επιτυχώς!");
      form.reset();
      onSuccess?.();
    },
    onError: (error: any) => {
      if (error.message?.includes("Δεν υπάρχουν διαθέσιμες καρέκλες")) {
        toast.error("Δεν υπάρχουν διαθέσιμες καρέκλες για αυτή την ώρα.");
      } else {
        toast.error("Σφάλμα κατά τη δημιουργία του ραντεβού");
      }
    },
  });

  const onSubmit = async (data: AppointmentFormData) => {
    setIsSubmitting(true);
    await createAppointment.mutateAsync(data);
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
              <Select onValueChange={field.onChange} value={field.value}>
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
