import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** School-wide switch for the bus/transport service. Off unless admin turns it on. */
export const TRANSPORT_SETTING_KEY = "transport_enabled";
export const isTransportOn = (value?: string | null) => value === "true";

export const useTransportEnabled = () => {
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    supabase.from("school_settings").select("value").eq("key", TRANSPORT_SETTING_KEY).maybeSingle()
      .then(({ data }) => { setEnabled(isTransportOn(data?.value)); setLoaded(true); });
  }, []);
  return { enabled, loaded, setEnabled };
};
