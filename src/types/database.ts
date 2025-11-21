export interface Artist {
  id: string;
  name: string;
  created_at: string;
}

export interface Chair {
  id: number;
  name: string;
  start_hour: number;
  end_hour: number;
  created_at: string;
}

export interface Appointment {
  id: string;
  artist_id: string;
  chair_id: number;
  client_name: string;
  start_time: string;
  end_time: string;
  price: number | null;
  description: string | null;
  service: string | null;
  color: string | null;
  created_at: string;
}

export interface AppointmentWithArtist extends Appointment {
  artists: Artist;
}
