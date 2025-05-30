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

export default function CollectionList({
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
