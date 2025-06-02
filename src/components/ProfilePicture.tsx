import { CircleUserRound } from "lucide-react";
import Image from "next/image";

type ProfilePictureProps = {
  imageUrl: string | null;
  width?: number;
  height?: number;
};

export const ProfilePicture = ({
  imageUrl,
  width,
  height,
}: ProfilePictureProps) => {
  if (!imageUrl) {
    return <CircleUserRound className="h-[40px] w-[40px]" />;
  }

  return (
    <Image
      src={imageUrl}
      alt="Profile Picture"
      width={width ?? 40}
      height={height ?? 40}
      className="rounded-full"
    />
  );
};
