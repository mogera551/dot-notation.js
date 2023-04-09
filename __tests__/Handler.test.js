import { Handler } from "../src/Handler.js";

test('Handler stackIndexes', () => {
  const handler = new Handler([]);
  const target = {};
  const proxy = new Proxy(target, handler);
  expect(handler.stackIndexes).toEqual([]);
  handler.stackIndexes.push([1]);
  expect(handler.lastIndexes).toEqual([1]);
  handler.stackIndexes.push([1,2]);
  expect(handler.lastIndexes).toEqual([1,2]);
  handler.stackIndexes.push([1,2,3]);
  expect(handler.lastIndexes).toEqual([1,2,3]);
  handler.stackIndexes.pop();
  expect(handler.lastIndexes).toEqual([1,2]);
  handler.stackIndexes.pop();
  expect(handler.lastIndexes).toEqual([1]);
  handler.stackIndexes.pop();
  expect(handler.lastIndexes).toBe(undefined);
});

test('Handler constructor', () => {
  expect(()=> new Handler).toThrow();

  const handler2 = new Handler([]);
  expect(handler2.setOfDefinedProperties instanceof Set).toBe(true);
  expect(Array.from(handler2.setOfDefinedProperties)).toEqual([]);
  expect(handler2.definedPropertyNames instanceof Array).toBe(true);
  expect(Array.from(handler2.definedPropertyNames)).toEqual([]);
  expect(handler2.matchByName instanceof Map).toBe(true);

  const handler3 = new Handler(["aaa"]);
  expect(handler3.setOfDefinedProperties instanceof Set).toBe(true);
  expect(Array.from(handler3.setOfDefinedProperties)).toEqual(["aaa"]);
  expect(handler3.definedPropertyNames instanceof Array).toBe(true);

  const handler4 = new Handler(["aaa", "bbb", "aaa"]);
  expect(handler4.setOfDefinedProperties instanceof Set).toBe(true);
  expect(Array.from(handler4.setOfDefinedProperties)).toEqual(["aaa", "bbb"]);
  expect(handler4.definedPropertyNames instanceof Array).toBe(true);
});

test('Handler defined property', () => {
  const target = {
    "aaa": 1,
    "bbb": [ 100, 200, 300 ],
    "ccc": { ddd:111, eee:222 }
  };
  const handler = new Handler([
    "aaa", "bbb", "bbb.*", "ccc", "ccc.ddd", "ccc.eee", "ccc.fff"
  ]);
  const proxy = new Proxy(target, handler);

  expect(handler.get(target, "aaa", proxy)).toBe(1);
  expect(handler.get(target, "bbb", proxy)).toEqual([100,200,300]);
  expect(handler.get(target, "bbb.0", proxy)).toBe(100);
  expect(handler.get(target, "bbb.1", proxy)).toBe(200);
  expect(handler.get(target, "bbb.2", proxy)).toBe(300);
  expect(handler.get(target, "ccc", proxy)).toEqual({ ddd:111, eee:222 });
  expect(handler.get(target, "ccc.ddd", proxy)).toBe(111);
  expect(handler.get(target, "ccc.eee", proxy)).toBe(222);
  expect(() => handler.get(target, "AAA", proxy)).toThrow();

  handler.set(target, "aaa", 2, proxy);
  expect(handler.get(target, "aaa", proxy)).toBe(2);
  handler.set(target, "bbb.0", 101, proxy);
  expect(handler.get(target, "bbb.0", proxy)).toBe(101);
  handler.set(target, "bbb.1", 202, proxy);
  expect(handler.get(target, "bbb.1", proxy)).toBe(202);
  handler.set(target, "bbb.2", 303, proxy);
  expect(handler.get(target, "bbb.2", proxy)).toBe(303);
  handler.set(target, "ccc.ddd", 333, proxy);
  expect(handler.get(target, "ccc.ddd", proxy)).toBe(333);
  handler.set(target, "ccc.eee", 444, proxy);
  expect(handler.get(target, "ccc.eee", proxy)).toBe(444);
  expect(() => handler.set(target, "AAA", 3, proxy)).toThrow();

  handler.set(target, "bbb", [1000,2000,3000,4000], proxy);
  expect(handler.get(target, "bbb", proxy)).toEqual([1000,2000,3000,4000]);
  handler.set(target, "ccc", { ddd:1111, eee:2222, fff:3333 }, proxy);
  expect(handler.get(target, "ccc", proxy)).toEqual({ ddd:1111, eee:2222, fff:3333 });
});

test('Handler defined property', () => {
  const target = {
    "list": [
      {value:100}, {value:200}, {value:300}
    ],
    get "list.*.double"() {
      return this["list.*.value"] * 2;
    },
    set "list.*.double"(value) {
      this["list.*.value"] = value / 2;
    },
    get "list.*.triple"() {
      return this["list.*.value"] * 3;
    },
    set "list.*.triple"(value) {
      this["list.*.value"] = value / 3;
    }
  };
  const handler = new Handler([
    "list", "list.*", "list.*.value", "list.*.double", "list.*.triple"
  ]);
  const proxy = new Proxy(target, handler);

  expect(handler.get(target, "list.0.double", proxy)).toBe(200);
  expect(handler.get(target, "list.1.double", proxy)).toBe(400);
  expect(handler.get(target, "list.2.double", proxy)).toBe(600);

  handler.set(target, "list.0.double", 100, proxy);
  expect(handler.get(target, "list.0.double", proxy)).toBe(100);

  handler.set(target, "list.0.triple", 300, proxy);
  expect(handler.get(target, "list.0.triple", proxy)).toBe(300);
});

test('Handler defined property, class', () => {
  const targetClass = class {
    list = [
      {value:100}, {value:200}, {value:300}
    ];
    get "list.*.double"() {
      return this["list.*.value"] * 2;
    }
    set "list.*.double"(value) {
      this["list.*.value"] = value / 2;
    }
    get "list.*.triple"() {
      return this["list.*.value"] * 3;
    }
    set "list.*.triple"(value) {
      this["list.*.value"] = value / 3;
    }
  } 
  const handler = new Handler([
    "list", "list.*", "list.*.value", "list.*.double", "list.*.triple"
  ]);
  const target = new targetClass;
  const proxy = new Proxy(target, handler);

  expect(handler.get(target, "list.0.double", proxy)).toBe(200);
  expect(handler.get(target, "list.1.double", proxy)).toBe(400);
  expect(handler.get(target, "list.2.double", proxy)).toBe(600);

  handler.set(target, "list.0.double", 100, proxy);
  expect(handler.get(target, "list.0.double", proxy)).toBe(100);

  handler.set(target, "list.0.triple", 300, proxy);
  expect(handler.get(target, "list.0.triple", proxy)).toBe(300);
});