"use client";

type Item = {
  id: string;
  name: string;
  userId: string;
};

type Props = {
  objects: Item[];
};

export default function ObjectGrid({ objects }: Props) {
  console.log(objects);
  return <div>ObjectGrid</div>;
}
