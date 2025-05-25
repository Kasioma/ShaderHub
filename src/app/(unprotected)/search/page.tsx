"use client";
import ObjectGrid from "@/components/ObjectGrid";
import { useSearchParams } from "next/navigation";

export default function Page() {
  const searchParams = useSearchParams();
  const query = searchParams.get("query") ?? "";
  return <ObjectGrid query={query} />;
}
