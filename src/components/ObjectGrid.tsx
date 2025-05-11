"use client";

import { useTRPC } from "@/utilities/trpc";
import { ThumbnailsResponseSchema } from "@/utilities/zod/parsers";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Image from "next/image";
import JSZip from "jszip";

type MetadataObject = {
  id: string;
  name: string;
  userId: string;
};

type ThumbnailObject = {
  id: string;
  url: string;
};

export default function ObjectGrid() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const trpc = useTRPC();
  const [page, setPage] = useState(1);
  const [metadata, setMetadata] = useState<MetadataObject[]>([]);
  const [thumbnails, setThumbnails] = useState<Map<number, ThumbnailObject[]>>(
    new Map(),
  );
  const newMetadata = useQuery(trpc.main.queryInitialObjects.queryOptions());

  useEffect(() => {
    const fetchData = async () => {
      if (!newMetadata.data) return;
      setMetadata((prev) => [...prev, ...newMetadata.data]);

      const APIInputData = new FormData();
      newMetadata.data.forEach((obj) =>
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
          updated.set(page, thumbnails);
          return updated;
        });
      }
    };

    fetchData().catch((err) => console.error(err));
  }, [page, baseUrl, newMetadata.data]);

  return (
    <div>
      {thumbnails.get(page)?.map((thumb) => (
        <div key={thumb.id}>
          <Image
            src={thumb.url}
            alt={`Thumbnail ${thumb.id}`}
            width={100}
            height={100}
          />
          <p>{thumb.id}</p>
        </div>
      ))}
    </div>
  );
}
