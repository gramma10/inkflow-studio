export interface Artist {
  id: string;
  name: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  artist_id: string;
  client_name: string;
  start_time: string;
  end_time: string;
  price: number | null;
  description: string | null;
  created_at: string;
}

export interface AppointmentWithArtist extends Appointment {
  artists: Artist;
}
