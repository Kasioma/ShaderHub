import { CircleUserRound } from "lucide-react";
import Image from "next/image";

type ProfilePictureProps = {
  imageUrl: string | null;
};

export const ProfilePicture = ({ imageUrl }: ProfilePictureProps) => {
  if (!imageUrl) {
    return <CircleUserRound className="h-[40px] w-[40px]" />;
  }

  return (
    <Image
      src={imageUrl}
      alt="Profile Picture"
      width={40}
      height={40}
      className="rounded-full"
    />
  );
};
