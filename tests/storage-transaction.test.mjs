import assert from "node:assert/strict";
import test from "node:test";

import { replaceStorageValues } from "../app/storage-transaction.ts";

function memoryStorage(initial = {}, failOnKey = null) {
  const values = new Map(Object.entries(initial));
  let failureEnabled = Boolean(failOnKey);
  return {
    values,
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      if (failureEnabled && key === failOnKey) {
        failureEnabled = false;
        throw new Error("quota");
      }
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test("replaces all requested values and supports removal", () => {
  const storage = memoryStorage({ keep: "old", remove: "old" });
  replaceStorageValues(storage, new Map([
    ["keep", "new"],
    ["remove", null],
  ]));

  assert.deepEqual(Object.fromEntries(storage.values), { keep: "new" });
});

test("rolls back every changed value when one write fails", () => {
  const storage = memoryStorage({ first: "old", second: "old" }, "second");
  assert.throws(() => replaceStorageValues(storage, new Map([
    ["first", "new"],
    ["second", "new"],
  ])), /quota/);

  assert.deepEqual(Object.fromEntries(storage.values), {
    first: "old",
    second: "old",
  });
});
