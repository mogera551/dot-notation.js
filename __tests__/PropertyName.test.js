import { PropertyName } from "../src/PropertyName.js";

test('PropertyName ""', () => {
  const propertyName = new PropertyName("");
  expect(propertyName.name).toBe("");
  expect(propertyName.pathNames).toEqual([ "" ]);
  expect(propertyName.parentPathNames).toEqual([]);
  expect(propertyName.parentPath).toBe("");
  expect(propertyName.parentPaths).toEqual([]);
  expect(Array.from(propertyName.setOfParentPaths)).toEqual([]);
  expect(propertyName.lastPathName).toBe("");
  expect(propertyName.regexp instanceof RegExp).toBe(true);
  expect(propertyName.regexp.source).toBe("^$");
  expect(propertyName.level).toBe(0);
  expect(propertyName.isPrimitive).toBe(true);
});

test('PropertyName "aaa"', () => {
  const propertyName = new PropertyName("aaa");
  expect(propertyName.name).toBe("aaa");
  expect(propertyName.pathNames).toEqual([ "aaa" ]);
  expect(propertyName.parentPathNames).toEqual([]);
  expect(propertyName.parentPath).toBe("");
  expect(propertyName.parentPaths).toEqual([]);
  expect(Array.from(propertyName.setOfParentPaths)).toEqual([]);
  expect(propertyName.lastPathName).toBe("aaa")
  expect(propertyName.regexp instanceof RegExp).toBe(true);
  expect(propertyName.regexp.source).toBe("^aaa$");
  expect(propertyName.level).toBe(0);
  expect(propertyName.isPrimitive).toBe(true);
  expect(propertyName.nearestWildcardProp).toBe(undefined);
  expect(propertyName.nearestWildcardParentProp).toBe(undefined);
});

test('PropertyName "aaa.bbb"', () => {
  const propertyName = new PropertyName("aaa.bbb");
  expect(propertyName.name).toBe("aaa.bbb");
  expect(propertyName.pathNames).toEqual([ "aaa", "bbb" ]);
  expect(propertyName.parentPathNames).toEqual([ "aaa" ]);
  expect(propertyName.parentPath).toBe("aaa");
  expect(propertyName.parentPaths).toEqual(["aaa"]);
  expect(Array.from(propertyName.setOfParentPaths)).toEqual(["aaa"]);
  expect(propertyName.lastPathName).toBe("bbb")
  expect(propertyName.regexp instanceof RegExp).toBe(true);
  expect(propertyName.regexp.source).toBe("^aaa\\.bbb$");
  expect(propertyName.level).toBe(0);
  expect(propertyName.isPrimitive).toBe(false);
  expect(propertyName.nearestWildcardProp).toBe(undefined);
  expect(propertyName.nearestWildcardParentProp).toBe(undefined);
});

test('PropertyName "aaa.bbb.ccc"', () => {
  const propertyName = new PropertyName("aaa.bbb.ccc");
  expect(propertyName.name).toBe("aaa.bbb.ccc");
  expect(propertyName.pathNames).toEqual([ "aaa", "bbb", "ccc" ]);
  expect(propertyName.parentPathNames).toEqual([ "aaa", "bbb" ]);
  expect(propertyName.parentPath).toBe("aaa.bbb");
  expect(propertyName.parentPaths).toEqual(["aaa", "aaa.bbb"]);
  expect(Array.from(propertyName.setOfParentPaths)).toEqual(["aaa", "aaa.bbb"]);
  expect(propertyName.lastPathName).toBe("ccc");
  expect(propertyName.regexp instanceof RegExp).toBe(true);
  expect(propertyName.regexp.source).toBe("^aaa\\.bbb\\.ccc$");
  expect(propertyName.level).toBe(0);
  expect(propertyName.isPrimitive).toBe(false);
  expect(propertyName.nearestWildcardProp).toBe(undefined);
  expect(propertyName.nearestWildcardParentProp).toBe(undefined);
});

test('PropertyName "aaa.*"', () => {
  const propertyName = new PropertyName("aaa.*");
  expect(propertyName.name).toBe("aaa.*");
  expect(propertyName.pathNames).toEqual([ "aaa", "*" ]);
  expect(propertyName.parentPathNames).toEqual([ "aaa" ]);
  expect(propertyName.parentPath).toBe("aaa");
  expect(propertyName.parentPaths).toEqual(["aaa"]);
  expect(Array.from(propertyName.setOfParentPaths)).toEqual(["aaa"]);
  expect(propertyName.lastPathName).toBe("*")
  expect(propertyName.regexp instanceof RegExp).toBe(true);
  expect(propertyName.regexp.source).toBe("^aaa\\.([0-9a-zA-Z_]*)$");
  expect(propertyName.level).toBe(1);
  expect(propertyName.isPrimitive).toBe(false);
  expect(propertyName.nearestWildcardName).toBe("aaa.*");
  expect(propertyName.nearestWildcardParentName).toBe("aaa");
});

test('PropertyName "aaa.*.ccc"', () => {
  const propertyName = new PropertyName("aaa.*.ccc");
  expect(propertyName.name).toBe("aaa.*.ccc");
  expect(propertyName.pathNames).toEqual([ "aaa", "*", "ccc" ]);
  expect(propertyName.parentPathNames).toEqual([ "aaa", "*" ]);
  expect(propertyName.parentPath).toBe("aaa.*");
  expect(propertyName.parentPaths).toEqual(["aaa", "aaa.*"]);
  expect(Array.from(propertyName.setOfParentPaths)).toEqual(["aaa", "aaa.*"]);
  expect(propertyName.lastPathName).toBe("ccc")
  expect(propertyName.regexp instanceof RegExp).toBe(true);
  expect(propertyName.regexp.source).toBe("^aaa\\.([0-9a-zA-Z_]*)\\.ccc$");
  expect(propertyName.level).toBe(1);
  expect(propertyName.isPrimitive).toBe(false);
  expect(propertyName.nearestWildcardName).toBe("aaa.*");
  expect(propertyName.nearestWildcardParentName).toBe("aaa");
});

test('PropertyName "aaa.*.ccc.*"', () => {
  const propertyName = new PropertyName("aaa.*.ccc.*");
  expect(propertyName.name).toBe("aaa.*.ccc.*");
  expect(propertyName.pathNames).toEqual([ "aaa", "*", "ccc", "*" ]);
  expect(propertyName.parentPathNames).toEqual([ "aaa", "*", "ccc" ]);
  expect(propertyName.parentPath).toBe("aaa.*.ccc");
  expect(propertyName.parentPaths).toEqual(["aaa", "aaa.*", "aaa.*.ccc"]);
  expect(Array.from(propertyName.setOfParentPaths)).toEqual(["aaa", "aaa.*", "aaa.*.ccc"]);
  expect(propertyName.lastPathName).toBe("*");
  expect(propertyName.regexp instanceof RegExp).toBe(true);
  expect(propertyName.regexp.source).toBe("^aaa\\.([0-9a-zA-Z_]*)\\.ccc\\.([0-9a-zA-Z_]*)$");
  expect(propertyName.level).toBe(2);
  expect(propertyName.isPrimitive).toBe(false);
  expect(propertyName.nearestWildcardName).toBe("aaa.*.ccc.*");
  expect(propertyName.nearestWildcardParentName).toBe("aaa.*.ccc");
});

test('PropertyName.create "aaa"', () => {
  expect(PropertyName.propertyNameByName.get("aaa")).toBe(undefined);
  const propertyName = PropertyName.create("aaa");
  expect(propertyName instanceof PropertyName).toBe(true);
  expect(PropertyName.propertyNameByName.get("aaa")).toBe(propertyName);
  const propertyName2 = PropertyName.create("aaa");
  expect(propertyName2).toBe(propertyName);
});

test('parse', () => {
  expect(PropertyName.parse("aaa")).toEqual({ 
    propName:PropertyName.create("aaa"), 
    indexes:[] 
  });
  expect(PropertyName.parse("aaa.bbb")).toEqual({ 
    propName:PropertyName.create("aaa.bbb"), 
    indexes:[] 
  });
  expect(PropertyName.parse("aaa.0")).toEqual({ 
    propName:PropertyName.create("aaa.*"), 
    indexes:[ 0 ] 
  });
  expect(PropertyName.parse("aaa.10")).toEqual({ 
    propName:PropertyName.create("aaa.*"), 
    indexes:[ 10 ] 
  });
  expect(PropertyName.parse("aaa.0.bbb")).toEqual({ 
    propName:PropertyName.create("aaa.*.bbb"), 
    indexes:[ 0 ] 
  });
  expect(PropertyName.parse("aaa.0.bbb.2")).toEqual({ 
    propName:PropertyName.create("aaa.*.bbb.*"), 
    indexes:[ 0, 2 ] 
  });
  expect(PropertyName.parse("aaa.0.bbb.2.ccc")).toEqual({ 
    propName:PropertyName.create("aaa.*.bbb.*.ccc"), 
    indexes:[ 0, 2 ] 
  });
  expect(PropertyName.parse("aaa.0.bbb.2.ccc.4")).toEqual({ 
    propName:PropertyName.create("aaa.*.bbb.*.ccc.*"), 
    indexes:[ 0, 2, 4 ] 
  });
  expect(PropertyName.parse("aaa.0.4")).toEqual({ 
    propName:PropertyName.create("aaa.*.*"), 
    indexes:[ 0, 4 ] 
  });
  expect(PropertyName.parse("aaa.0.4.8")).toEqual({ 
    propName:PropertyName.create("aaa.*.*.*"), 
    indexes:[ 0, 4, 8 ] 
  });
});