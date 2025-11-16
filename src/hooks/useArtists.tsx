import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Artist } from "@/types/database";

export const useArtists = () => {
  return useQuery({
    queryKey: ["artists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artists")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Artist[];
    },
  });
};
