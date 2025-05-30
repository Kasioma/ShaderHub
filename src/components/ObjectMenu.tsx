"use client";
import { useEffect, useState } from "react";
import { ProfilePicture } from "./ProfilePicture";
import { Bookmark, Download, Star } from "lucide-react";
import { cn, downloadZip } from "@/utilities/utils";
import { toast } from "./toaster/use-toast";
import { useTRPC } from "@/utilities/trpc";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useCollection } from "@/context/collectionProvider";
import { Portal } from "./Portal";
import type { ViewType } from "@/utilities/types";
import CollectionList from "./CollectionList";

type Props = {
  tagName: string;
  userId: string;
  uploaderId: string;
  objectId: string;
  objectName: string;
  zip: Blob | null;
};

export default function ObjectMenu({
  tagName,
  userId,
  uploaderId,
  objectId,
  objectName,
  zip,
}: Props) {
  const { collection, setCollection } = useCollection();
  const trpc = useTRPC();
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [favourite, setFavourite] = useState(false);
  const [tagColor, setTagColor] = useState("#000000");
  const [newTagName, setNewTagName] = useState("");
  const [view, setView] = useState<ViewType>("collection");

  const [initialCheckedTags, setInitialCheckedTags] = useState<
    Record<string, boolean>
  >({});
  const [checkedTags, setCheckedTags] = useState<Record<string, boolean>>({});

  const { data: favouriteData } = useQuery(
    trpc.library.getFavourite.queryOptions({ objectId: objectId }),
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
    if (uploaderId === "Unknown") return;
    const fetchPicture = async () => {
      try {
        const res = await fetch(`/api/clerk/picture?userId=${uploaderId}`);
        const data: string = (await res.json()) as string;
        if (data) {
          setProfilePic(data);
        }
      } catch (err) {
        console.error("Error fetching picture", err);
      }
    };

    if (uploaderId) {
      fetchPicture().catch(console.error);
    }
  }, [uploaderId]);

  useEffect(() => {
    if (favouriteData) setFavourite(favouriteData);
  }, [favouriteData]);

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

  const handleDownload = () => {
    if (!zip) return;
    downloadZip(zip);
  };

  const handleFavourite = async () => {
    setFavourite(await favouriteMutation.mutateAsync({ objectId }));
  };

  const handleCollection = () => {
    setCollection(!collection);
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
    if (!newTagName.trim()) return;

    await createCollectionMutation.mutateAsync({
      objectId,
      tagName: newTagName,
      tagColor,
    });

    setView("collection");
  };

  const handleCreateView = () => {
    setView("create");
  };

  const handleSetView = (view: ViewType) => {
    setView(view);
  };

  const handleSetTagColor = (color: string) => {
    setTagColor(color);
  };

  return (
    <>
      {userId === uploaderId ? (
        <div>
          <div>
            <ProfilePicture imageUrl={profilePic} />
            <h2>{objectName}</h2>
          </div>
          <h2>{tagName}</h2>
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
          {collection && (
            <Portal>
              <CollectionMenu
                usedTags={collectionsData?.usedTags ?? []}
                checkedTags={checkedTags}
                view={view}
                tagColor={tagColor}
                newTagName={newTagName}
                handleCreate={handleCreate}
                handleSetTagColor={handleSetTagColor}
                handleSetView={handleSetView}
                handleChangeTag={handleChangeTag}
                handleAdd={handleAdd}
                handleCreateView={handleCreateView}
                onClose={handleCollection}
              />
            </Portal>
          )}
        </div>
      ) : (
        <div></div>
      )}
    </>
  );
}

type CollectionTags = {
  tagId: string | null;
  tagName: string | null;
};

type CollectionMenuProps = {
  usedTags: CollectionTags[];
  checkedTags: Record<string, boolean>;
  view: ViewType;
  tagColor: string;
  newTagName: string;
  handleCreate: () => void;
  handleSetTagColor: (color: string) => void;
  handleSetView: (view: ViewType) => void;
  handleChangeTag: (tagId: string) => void;
  handleAdd: () => void;
  handleCreateView: () => void;
  onClose: () => void;
};

function CollectionMenu({
  usedTags,
  checkedTags,
  view,
  tagColor,
  newTagName,
  handleCreate,
  handleSetTagColor,
  handleSetView,
  handleChangeTag,
  handleAdd,
  handleCreateView,
  onClose,
}: CollectionMenuProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="absolute z-50 h-screen w-screen bg-[rgba(14,20,36,0.6)] backdrop-blur-sm"></div>

      <div
        className="relative z-50 max-h-[80vh] w-full max-w-md overflow-y-auto rounded-md bg-secondary p-4 shadow-xl"
        onClick={onClose}
      >
        <div onClick={(e) => e.stopPropagation()}>
          <div className="mb-4 flex items-center gap-2 border-b pb-2">
            <Bookmark className="h-4 w-4" />
            <span className="text-lg font-semibold">Collection</span>
          </div>

          {view === "collection" && (
            <CollectionList
              usedTags={usedTags}
              checkedTags={checkedTags}
              handleChangeTag={handleChangeTag}
              handleAdd={handleAdd}
              handleCreate={handleCreate}
            />
          )}
          {view === "create" && (
            <div className="relative flex w-2/6 flex-col items-center justify-center gap-10">
              <input
                type="text"
                placeholder="Enter tag name"
                value={newTagName}
                onChange={(e) => handleChangeTag(e.target.value)}
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
                  onChange={(e) => handleSetTagColor(e.target.value)}
                  className="h-6 w-6 cursor-pointer rounded-full border"
                />
                <span className="text-sm">{tagColor}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleSetView("collection")}
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
        </div>
      </div>
    </div>
  );
}
