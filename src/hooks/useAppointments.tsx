import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppointmentWithArtist } from "@/types/database";

export const useAppointments = (date?: Date) => {
  return useQuery({
    queryKey: ["appointments", date?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from("appointments")
        .select(`
          *,
          artists (*)
        `)
        .order("start_time");

      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        query = query
          .gte("start_time", startOfDay.toISOString())
          .lte("start_time", endOfDay.toISOString());
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as AppointmentWithArtist[];
    },
  });
};
