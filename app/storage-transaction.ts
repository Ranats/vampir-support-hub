export type StorageWriter = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function replaceStorageValues(
  storage: StorageWriter,
  values: ReadonlyMap<string, string | null>,
) {
  const previousValues = new Map(
    [...values.keys()].map((key) => [key, storage.getItem(key)]),
  );

  try {
    for (const [key, value] of values) {
      if (value === null) storage.removeItem(key);
      else storage.setItem(key, value);
    }
  } catch (storageError) {
    for (const [key, value] of previousValues) {
      try {
        if (value === null) storage.removeItem(key);
        else storage.setItem(key, value);
      } catch {
        // Keep rolling back the remaining keys and preserve the original error.
      }
    }
    throw storageError;
  }
}
