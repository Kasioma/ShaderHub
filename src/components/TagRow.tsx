"use client";
import { useTRPC } from "@/utilities/trpc";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TagRow({ userId }: { userId: string | null }) {
  const router = useRouter();
  const trpc = useTRPC();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const { data } = useQuery(
    trpc.main.getTagsInformation.queryOptions({ userId: userId ?? "" }),
  );
  const colours = ["#9a7ec8", "#c87e98", "#c87ec1", "#827ec8", "#c87e92"];

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    setAtStart(el.scrollLeft <= 0);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1);
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -200 : 200,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    handleScroll();
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = (tagName: string) => {
    const encodedQuery = encodeURIComponent(tagName);
    router.push(`/search?query=${encodedQuery}`);
  };

  return (
    <div className="relative mx-auto my-10 w-10/12 ">
      {!atStart && (
        <button
          className="absolute left-0 top-1/2 z-50 -translate-y-1/2 rounded-full bg-secondary p-2 opacity-50"
          onClick={() => scroll("left")}
        >
          <ChevronLeft />
        </button>
      )}
      <div
        ref={scrollRef}
        className="scrollbar-hide flex items-center gap-3 overflow-x-auto overflow-y-visible scroll-smooth"
      >
        {data?.map((tag) => {
          return (
            <div key={tag.id}>
              <span
                className="bold block cursor-pointer rounded-md px-3 py-2 text-text"
                style={{
                  backgroundColor: colours[Math.floor(Math.random() * 5)],
                }}
                onClick={() => handleClick(tag.name)}
              >
                {tag.name}
              </span>
            </div>
          );
        })}
        {data?.map((tag) => {
          return (
            <div key={tag.id}>
              <span
                className="bold cursor-pointer rounded-md p-3 text-text"
                style={{
                  backgroundColor: colours[Math.floor(Math.random() * 5)],
                }}
              >
                {tag.name}
              </span>
            </div>
          );
        })}
        {data?.map((tag) => {
          return (
            <div key={tag.id}>
              <span
                className="bold cursor-pointer rounded-md p-3 text-text"
                style={{
                  backgroundColor: colours[Math.floor(Math.random() * 5)],
                }}
              >
                {tag.name}
              </span>
            </div>
          );
        })}
        {data?.map((tag) => {
          return (
            <div key={tag.id}>
              <span
                className="bold cursor-pointer rounded-md p-3 text-text"
                style={{
                  backgroundColor: colours[Math.floor(Math.random() * 5)],
                }}
              >
                {tag.name}
              </span>
            </div>
          );
        })}
        {data?.map((tag) => {
          return (
            <div key={tag.id}>
              <span
                className="bold cursor-pointer rounded-md p-3 text-text"
                style={{
                  backgroundColor: colours[Math.floor(Math.random() * 5)],
                }}
              >
                {tag.name}
              </span>
            </div>
          );
        })}
      </div>
      {!atEnd && (
        <button
          className="absolute right-0 top-1/2 z-50 -translate-y-1/2 rounded-full bg-secondary p-2 opacity-50"
          onClick={() => scroll("right")}
        >
          <ChevronRight />
        </button>
      )}
    </div>
  );
}
