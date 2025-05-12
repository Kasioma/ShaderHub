"use client";

import { useTRPC } from "@/utilities/trpc";
import type { Direction } from "@/utilities/types";
import { useInfiniteQuery } from "@tanstack/react-query";
import JSZip from "jszip";
import { useEffect, useState } from "react";

type ObjectType = {
  id: string;
  name: string;
  userId: string;
  createdAt: number;
};

type ThumbnailObject = {
  id: string;
  url: string;
};

export default function ObjectGrid() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const trpc = useTRPC();
  const [cursor, setCursor] = useState<number | null>(null);
  const [direction, setDirection] = useState<Direction>("forward");
  const [currentObjects, setCurrentObjects] = useState<ObjectType[]>([]);
  const [thumbnails, setThumbnails] = useState<Map<string, ThumbnailObject[]>>(
    new Map(),
  );
  const [pageIndex, setPageIndex] = useState(0);

  const {
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
    data,
  } = useInfiniteQuery(
    trpc.main.getInfiniteObjects.infiniteQueryOptions(
      {
        limit: 1,
        cursor: undefined,
        direction,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? null,
        getPreviousPageParam: (firstPage) => firstPage.prevCursor ?? null,
        staleTime: 5 * 60 * 1000,
      },
    ),
  );

  useEffect(() => {
    if (!data) return;

    const page = data.pages[pageIndex];
    console.log(page);
    setCurrentObjects(page?.query ?? []);
  }, [data, pageIndex]);

  useEffect(() => {
    const fetchData = async () => {
      const queryKey = currentObjects.map((obj) => obj.id).join(",");
      if (thumbnails.has(queryKey)) return;

      const APIInputData = new FormData();
      currentObjects.forEach((obj) =>
        APIInputData.append("thumbnails", obj.id),
      );

      const res = await fetch(`${baseUrl}/api/filestorage/thumbnail/query`, {
        method: "POST",
        body: APIInputData,
      });

      if (!res.ok) {
        console.error("Error fetching thumbnails");
        return;
      } else {
        const zipBlob = await res.blob();
        const zip = await JSZip.loadAsync(zipBlob);

        const thumbnails: ThumbnailObject[] = [];

        for (const [id, file] of Object.entries(zip.files)) {
          if (!file.dir) {
            const blob = await file.async("blob");
            const url = URL.createObjectURL(blob);
            thumbnails.push({ id, url });
          }
        }

        setThumbnails((prev) => {
          const updated = new Map(prev);
          updated.set(queryKey, thumbnails);
          return updated;
        });
      }
    };

    if (currentObjects.length > 0) {
      fetchData().catch(console.error);
    }
  }, [currentObjects, baseUrl, thumbnails]);

  const handleNext = async () => {
    setDirection("forward");
    const last = data?.pages[data.pages.length - 1];
    if (last?.nextCursor) {
      setCursor(last.nextCursor);
      await fetchNextPage();
    }
    setPageIndex((prev) => prev + 1);
  };

  const handlePrevious = async () => {
    if (pageIndex <= 0) return;

    setDirection("backward");
    const first = data?.pages[0];
    if (first?.prevCursor) {
      setCursor(first.prevCursor);
      await fetchPreviousPage();
    }
    setPageIndex((prev) => prev - 1);
  };

  return (
    <section>
      <Objects objects={currentObjects} thumbnails={thumbnails} />
      <div className="mt-4 flex justify-between">
        <button onClick={handlePrevious}>Previous</button>
        <button onClick={handleNext}>Next</button>
      </div>
    </section>
  );
}

type ObjectsProps = {
  objects: ObjectType[];
  thumbnails: Map<string, ThumbnailObject[]>;
};

function Objects({ objects, thumbnails }: ObjectsProps) {
  const queryKey = objects.map((obj) => obj.id).join(",");
  const currentThumbnails = thumbnails.get(queryKey) ?? [];

  return (
    <div className="grid grid-cols-4 gap-4">
      {currentThumbnails.length > 0 ? (
        currentThumbnails.map((thumb) => (
          <img
            key={thumb.id}
            src={thumb.url}
            alt={`Thumbnail for ${thumb.id}`}
            className="h-auto w-full"
          />
        ))
      ) : (
        <p>Loading thumbnails...</p>
      )}
    </div>
  );
}
