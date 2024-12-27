import { useQuery } from "@tanstack/react-query";
import { actions } from "astro:actions";

export default function ActiveLivestreamPage() {
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

  return (
    <ul className="my-6 ml-6 list-disc [&>li]:mt-2">
      {data?.map((room) => <li key={room.id}>{room.name}</li>)}
    </ul>
  );
}
