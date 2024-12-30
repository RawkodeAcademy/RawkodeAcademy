import { useQuery } from "@tanstack/react-query";
import { actions } from "astro:actions";

export default function LivestreamCounter() {
  const { data } = useQuery({
    queryKey: ["livestreams"],
    staleTime: 10_000,
    queryFn: async () => {
      const { data, error } = await actions.listRooms();

      if (error) {
        throw error;
      }

      return data;
    },
  });

  return <>{data?.length || 0}</>;
}
