import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import PreviewModel from "./PreviewModel";
import { useObjectModal } from "@/context/objectProvider";
import {
  Bookmark,
  CircleUserRound,
  Download,
  Star,
  Tag,
  X,
} from "lucide-react";
import Image from "next/image";
import { cn, downloadZip, unzipFiles } from "@/utilities/utils";
import type { ParsedModelProps, ViewType } from "@/utilities/types";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "@/utilities/trpc";
import { toast } from "./toaster/use-toast";

type Props = {
  modelBlob: Blob;
  objectId: string;
  title: string;
  username: string;
  userId: string;
  onClose: () => void;
};

export default function ModelModal({
  modelBlob,
  objectId,
  title,
  username,
  userId,
  onClose,
}: Props) {
  const trpc = useTRPC();
  const { objectModal } = useObjectModal();
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState("#000000");
  const [parsedObject, setParsedObject] = useState<ParsedModelProps | null>(
    null,
  );
  const [favourite, setFavourite] = useState(false);
  const [initialCheckedTags, setInitialCheckedTags] = useState<
    Record<string, boolean>
  >({});
  const [checkedTags, setCheckedTags] = useState<Record<string, boolean>>({});
  const [view, setView] = useState<ViewType>("details");
  const { data: objectData } = useQuery(
    trpc.main.getObjectInformation.queryOptions({ objectId: objectId }),
  );

  const { data: collectionsData } = useQuery(
    trpc.main.getAllUserCollections.queryOptions({ objectId: objectId }),
  );

  const mutationOptions = {
    onError(error: { message: string }) {
      toast({
        variant: "destructive",
        title: "Server error",
        description: error.message,
      });
    },
  };

  const favouriteMutation = useMutation(
    trpc.main.toggleFavouriteTag.mutationOptions(mutationOptions),
  );

  const addToCollectionMutation = useMutation(
    trpc.main.addToCollection.mutationOptions(mutationOptions),
  );

  const createCollectionMutation = useMutation(
    trpc.main.createCollection.mutationOptions(mutationOptions),
  );

  useEffect(() => {
    if (objectData?.favourite) setFavourite(true);
  }, [objectData]);

  useEffect(() => {
    const fetchPicture = async () => {
      try {
        const res = await fetch(`/api/clerk/picture?userId=${userId}`);
        const data: string = (await res.json()) as string;
        if (data) {
          setProfilePic(data);
        }
      } catch (err) {
        console.error("Error fetching picture", err);
      }
    };

    if (userId) {
      fetchPicture().catch(console.error);
    }
  }, [userId]);

  useEffect(() => {
    if (!modelBlob) return;
    async function parseModel() {
      const unzipped = await unzipFiles(modelBlob);
      if (!unzipped) return;
      setParsedObject(unzipped);
    }
    parseModel().catch(console.error);
  }, [modelBlob]);

  useEffect(() => {
    const initialState: Record<string, boolean> = {};
    collectionsData?.usedTags.forEach((tag) => {
      const isChecked = collectionsData?.objectTags.some(
        (objectTag) => objectTag.tagId === tag.tagId,
      );
      if (tag.tagId) initialState[tag.tagId] = isChecked;
    });
    setCheckedTags(initialState);
    setInitialCheckedTags(initialState);
  }, [collectionsData]);

  const handleTextures = (textures: Map<string, Blob>) => {
    const result = new Map<string, string>();
    for (const [key, blob] of textures) {
      const newKey = key.split("/").pop()!;
      result.set(newKey, URL.createObjectURL(blob));
    }
    return result;
  };

  const MemoizedModel = useMemo(() => {
    if (!parsedObject) return null;

    return (
      <PreviewModel
        fileType={parsedObject.fileType}
        fileUrl={URL.createObjectURL(parsedObject.fileBlob)}
        fileBinary={URL.createObjectURL(
          parsedObject.kind === "gltf" ? parsedObject.fileBinary : new Blob([]),
        )}
        fileTextures={handleTextures(parsedObject.fileTextures)}
      />
    );
  }, [parsedObject]);

  const handleDownload = () => {
    if (!modelBlob) return;
    downloadZip(modelBlob);
  };

  const handleFavourite = async () => {
    setFavourite(await favouriteMutation.mutateAsync({ objectId }));
  };

  const handleCollection = () => {
    const newView = view === "details" ? "collection" : "details";
    setView(newView);
  };

  const handleChangeTag = (tagId: string) => {
    setCheckedTags((prevState) => ({
      ...prevState,
      [tagId]: !prevState[tagId],
    }));
  };

  const handleAdd = async () => {
    const changes: Record<string, boolean> = {};

    for (const tagId in checkedTags) {
      if (
        checkedTags[tagId] !== undefined &&
        checkedTags[tagId] !== initialCheckedTags[tagId]
      ) {
        changes[tagId] = checkedTags[tagId]!;
      }
    }
    await addToCollectionMutation.mutateAsync({
      objectId,
      checkedTags: changes,
    });
  };

  const handleCreate = async () => {
    if (!tagName.trim()) return;

    await createCollectionMutation.mutateAsync({
      objectId,
      tagName,
      tagColor,
    });

    setView("collection");
  };

  const handleCreateView = () => {
    setView("create");
  };

  return objectModal ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[75vh] min-h-[50vh] w-[60vw] overflow-y-auto rounded-xl bg-secondary p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex w-4/6 flex-col gap-1 text-xl text-primary">
          {parsedObject && (
            <div className="relative h-full">
              <Canvas className="h-full w-full rounded-md border-2 border-primary">
                <directionalLight position={[5, 5, 5]} intensity={1} />
                <ambientLight intensity={0.5} />
                <PerspectiveCamera
                  makeDefault
                  position={[10, 10, 10]}
                  fov={45}
                />
                {MemoizedModel}
                <OrbitControls target0={[0, 0, 0]} />
              </Canvas>
            </div>
          )}
          <div className="mt-3 flex flex-row items-center justify-between gap-3 text-text">
            <div className="flex items-center gap-3">
              <ProfilePicture imageUrl={profilePic} />
              <h2>{username} -</h2>
              <h2>{title}</h2>
              <p></p>
            </div>
            <div className="flex gap-3">
              <div className="h-6 w-6">
                <Download
                  className="h-5 w-5 cursor-pointer"
                  onClick={() => handleDownload()}
                />
              </div>
              <div
                onClick={() => handleFavourite()}
                className={cn(
                  "flex h-6 w-6 cursor-pointer items-center justify-center rounded-full",
                  {
                    "bg-[#FFB900]": favourite,
                  },
                )}
              >
                <Star className="h-5 w-5 cursor-pointer" />
              </div>
              <div onClick={() => handleCollection()} className="h-6 w-6 ">
                <Bookmark className="h-5 w-5 cursor-pointer" />
              </div>
            </div>
          </div>
        </div>
        {view === "details" && (
          <div className="relative flex w-2/6 flex-col items-center justify-center gap-10">
            <div className="flex w-[90%] flex-col items-center gap-2">
              <h3 className="bold text-xl">Tags</h3>
              <TagList tags={objectData?.tags ?? []} />
            </div>
            <div className="flex w-[90%] flex-col items-center gap-2">
              <h3 className="bold text-xl">Attributes</h3>
              <AttributeList attributes={objectData?.attributes ?? []} />
            </div>
          </div>
        )}
        {view === "collection" && (
          <div className="relative flex w-2/6 flex-col items-center justify-center gap-10">
            <CollectionList
              usedTags={collectionsData?.usedTags ?? []}
              checkedTags={checkedTags}
              handleChangeTag={handleChangeTag}
              handleAdd={handleAdd}
              handleCreate={handleCreateView}
            />
          </div>
        )}
        {view === "create" && (
          <div className="relative flex w-2/6 flex-col items-center justify-center gap-10">
            <input
              type="text"
              placeholder="Enter tag name"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              className="w-3/4 border-b bg-inherit text-xl outline-none"
            />

            <div className="flex items-center gap-2">
              <label htmlFor="colorPicker" className="text-sm">
                Tag Color:
              </label>
              <input
                type="color"
                id="colorPicker"
                value={tagColor}
                onChange={(e) => setTagColor(e.target.value)}
                className="h-6 w-6 cursor-pointer rounded-full border"
              />
              <span className="text-sm">{tagColor}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setView("collection")}
                className="rounded-full bg-primary px-4 py-1 text-secondary hover:bg-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="flex items-center gap-1 rounded-md border px-4 py-1"
              >
                Create
              </button>
            </div>
          </div>
        )}

        <X
          onClick={onClose}
          className="absolute right-5 top-5 h-5 w-5 cursor-pointer text-text"
        />
      </div>
    </div>
  ) : null;
}

type ProfilePictureProps = {
  imageUrl: string | null;
};

const ProfilePicture = ({ imageUrl }: ProfilePictureProps) => {
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

type TagType = {
  id: string;
  name: string;
  colour: string;
};

function TagList({ tags }: { tags: TagType[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.length > 0
        ? tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-2 rounded-md bg-secondary p-2"
            >
              <Tag style={{ color: tag.colour }} />
              <p style={{ color: tag.colour }}>{tag.name}</p>
            </div>
          ))
        : null}
    </div>
  );
}

type AttributeType = {
  id: string;
  name: string;
  value: string;
};

function AttributeList({ attributes }: { attributes: AttributeType[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {attributes.length > 0
        ? attributes.map((attribute) => (
            <div
              key={attribute.id}
              className="flex items-center gap-2 rounded-md bg-secondary p-2"
            >
              <p>{attribute.name} :</p>
              <p>{attribute.value}</p>
            </div>
          ))
        : null}
    </div>
  );
}

type CollectionTags = {
  tagId: string | null;
  tagName: string | null;
};

type CollectionListProps = {
  usedTags: CollectionTags[];
  checkedTags: Record<string, boolean>;
  handleChangeTag: (tagId: string) => void;
  handleAdd: () => void;
  handleCreate: () => void;
};

function CollectionList({
  usedTags,
  checkedTags,
  handleChangeTag,
  handleAdd,
  handleCreate,
}: CollectionListProps) {
  return (
    <div className="flex flex-col justify-between gap-2">
      <div className="max-h-[300px] overflow-y-auto rounded-md border p-2">
        {usedTags.length > 0 ? (
          usedTags.map((usedTag) => (
            <label
              key={usedTag.tagId}
              className="flex items-center gap-2 rounded p-1"
            >
              <input
                type="checkbox"
                checked={checkedTags[usedTag.tagId ?? ""]}
                onChange={() => handleChangeTag(usedTag.tagId ?? "")}
              />
              <span>{usedTag.tagName}</span>
            </label>
          ))
        ) : (
          <p className="text-sm">No tags available</p>
        )}
      </div>

      {usedTags.length > 0 && (
        <div className="flex gap-2">
          <button
            className="rounded-full bg-primary px-4 py-1 text-secondary hover:bg-primary"
            onClick={handleAdd}
          >
            Add
          </button>
          <button
            className="flex items-center gap-1 rounded-md border px-4 py-1"
            onClick={handleCreate}
          >
            <span>Create</span>
          </button>
        </div>
      )}
    </div>
  );
}
