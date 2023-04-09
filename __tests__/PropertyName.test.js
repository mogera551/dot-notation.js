import { PropertyName } from "../src/PropertyName.js";

test('PropertyName ""', () => {
  const propertyName = new PropertyName("");
  expect(propertyName.name).toBe("");
  expect(propertyName.pathNames).toEqual([ "" ]);
  expect(propertyName.parentPathNames).toEqual([]);
  expect(propertyName.parentPath).toBe("");
  expect(propertyName.lastPathName).toBe("");
  expect(propertyName.regexp instanceof RegExp).toBe(true);
  expect(propertyName.regexp.source).toBe("^$");
  expect(propertyName.level).toBe(0);
});

test('PropertyName "aaa"', () => {
  const propertyName = new PropertyName("aaa");
  expect(propertyName.name).toBe("aaa");
  expect(propertyName.pathNames).toEqual([ "aaa" ]);
  expect(propertyName.parentPathNames).toEqual([]);
  expect(propertyName.parentPath).toBe("");
  expect(propertyName.lastPathName).toBe("aaa")
  expect(propertyName.regexp instanceof RegExp).toBe(true);
  expect(propertyName.regexp.source).toBe("^aaa$");
  expect(propertyName.level).toBe(0);
});

test('PropertyName "aaa.bbb"', () => {
  const propertyName = new PropertyName("aaa.bbb");
  expect(propertyName.name).toBe("aaa.bbb");
  expect(propertyName.pathNames).toEqual([ "aaa", "bbb" ]);
  expect(propertyName.parentPathNames).toEqual([ "aaa" ]);
  expect(propertyName.parentPath).toBe("aaa");
  expect(propertyName.lastPathName).toBe("bbb")
  expect(propertyName.regexp instanceof RegExp).toBe(true);
  expect(propertyName.regexp.source).toBe("^aaa\\.bbb$");
  expect(propertyName.level).toBe(0);
});

test('PropertyName "aaa.bbb.ccc"', () => {
  const propertyName = new PropertyName("aaa.bbb.ccc");
  expect(propertyName.name).toBe("aaa.bbb.ccc");
  expect(propertyName.pathNames).toEqual([ "aaa", "bbb", "ccc" ]);
  expect(propertyName.parentPathNames).toEqual([ "aaa", "bbb" ]);
  expect(propertyName.parentPath).toBe("aaa.bbb");
  expect(propertyName.lastPathName).toBe("ccc")
  expect(propertyName.regexp instanceof RegExp).toBe(true);
  expect(propertyName.regexp.source).toBe("^aaa\\.bbb\\.ccc$");
  expect(propertyName.level).toBe(0);
});

test('PropertyName "aaa.*"', () => {
  const propertyName = new PropertyName("aaa.*");
  expect(propertyName.name).toBe("aaa.*");
  expect(propertyName.pathNames).toEqual([ "aaa", "*" ]);
  expect(propertyName.parentPathNames).toEqual([ "aaa" ]);
  expect(propertyName.parentPath).toBe("aaa");
  expect(propertyName.lastPathName).toBe("*")
  expect(propertyName.regexp instanceof RegExp).toBe(true);
  expect(propertyName.regexp.source).toBe("^aaa\\.([0-9a-zA-Z_]*)$");
  expect(propertyName.level).toBe(1);
});

test('PropertyName "aaa.*.ccc"', () => {
  const propertyName = new PropertyName("aaa.*.ccc");
  expect(propertyName.name).toBe("aaa.*.ccc");
  expect(propertyName.pathNames).toEqual([ "aaa", "*", "ccc" ]);
  expect(propertyName.parentPathNames).toEqual([ "aaa", "*" ]);
  expect(propertyName.parentPath).toBe("aaa.*");
  expect(propertyName.lastPathName).toBe("ccc")
  expect(propertyName.regexp instanceof RegExp).toBe(true);
  expect(propertyName.regexp.source).toBe("^aaa\\.([0-9a-zA-Z_]*)\\.ccc$");
  expect(propertyName.level).toBe(1);
});

test('PropertyName "aaa.*.ccc.*"', () => {
  const propertyName = new PropertyName("aaa.*.ccc.*");
  expect(propertyName.name).toBe("aaa.*.ccc.*");
  expect(propertyName.pathNames).toEqual([ "aaa", "*", "ccc", "*" ]);
  expect(propertyName.parentPathNames).toEqual([ "aaa", "*", "ccc" ]);
  expect(propertyName.parentPath).toBe("aaa.*.ccc");
  expect(propertyName.lastPathName).toBe("*")
  expect(propertyName.regexp instanceof RegExp).toBe(true);
  expect(propertyName.regexp.source).toBe("^aaa\\.([0-9a-zA-Z_]*)\\.ccc\\.([0-9a-zA-Z_]*)$");
  expect(propertyName.level).toBe(2);
});

test('PropertyName.create "aaa"', () => {
  expect(PropertyName.propertyNameByName.get("aaa")).toBe(undefined);
  const propertyName = PropertyName.create("aaa");
  expect(propertyName instanceof PropertyName).toBe(true);
  expect(PropertyName.propertyNameByName.get("aaa")).toBe(propertyName);
  const propertyName2 = PropertyName.create("aaa");
  expect(propertyName2).toBe(propertyName);
});
