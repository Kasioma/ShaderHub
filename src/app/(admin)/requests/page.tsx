"use client";
import RequestList from "@/components/RequestList";
import { useTRPC } from "@/utilities/trpc";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function Page() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data } = useQuery(trpc.requests.getRequests.queryOptions());

  const refetchRequests = async () => {
    await queryClient.invalidateQueries({
      queryKey: trpc.requests.getRequests.queryKey(),
    });
  };

  return (
    <section>
      <RequestList data={data ?? []} refetch={refetchRequests} />
    </section>
  );
}
