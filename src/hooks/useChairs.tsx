import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Chair } from "@/types/database";

export const useChairs = () => {
  return useQuery({
    queryKey: ["chairs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chairs")
        .select("*")
        .order("id");
      
      if (error) throw error;
      return data as Chair[];
    },
  });
};
