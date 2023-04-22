import { Handler } from "../src/Handler.js";
import { Symbols } from "../src/Const.js"
import { PropertyName } from "../src/PropertyName.js";

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
  expect(handler.get(target, "$1", proxy)).toBe(1);
  expect(handler.get(target, "$2", proxy)).toBe(2);
  expect(handler.get(target, "$3", proxy)).toBe(3);
  handler.stackIndexes.pop();
  expect(handler.lastIndexes).toEqual([1,2]);
  expect(handler.get(target, "$1", proxy)).toBe(1);
  expect(handler.get(target, "$2", proxy)).toBe(2);
  expect(handler.get(target, "$3", proxy)).toBe(undefined);
  handler.stackIndexes.pop();
  expect(handler.lastIndexes).toEqual([1]);
  handler.stackIndexes.pop();
  expect(handler.lastIndexes).toBe(undefined);
  expect(handler.get(target, "$1", proxy)).toBe(undefined);
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

  expect(() => handler.get(target, "ggg", proxy)).toThrow();
  expect(() => handler.get(target, "ccc.ggg", proxy)).toThrow();
  expect(handler.getByPropertyName(target, { propName:PropertyName.create("ggg") }, proxy)).toBe(undefined);

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

  handler.set(target, "list.0.value", 100, proxy);
  expect(handler.get(target, "list.0.value", proxy)).toBe(100);

  const getfunc = handler.get(target, Symbols.directlyGet, proxy);
  expect(getfunc instanceof Function).toBe(true);
  expect(Reflect.apply(getfunc, proxy, ["list.*.value", [0]])).toBe(100);
  expect(() => Reflect.apply(getfunc, proxy, ["list.*.value2", [0]])).toThrow();

  const setfunc = handler.get(target, Symbols.directlySet, proxy);
  expect(setfunc instanceof Function).toBe(true);
  Reflect.apply(setfunc, proxy, ["list.*.value", [0], 250]);
  expect(Reflect.apply(getfunc, proxy, ["list.*.value", [0]])).toBe(250);
  expect(() => Reflect.apply(setfunc, proxy, ["list.*.value2", [0]])).toThrow();
});

test('Proxy defined property, class', () => {
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

  expect(proxy["list.0.double"]).toBe(200);
  expect(proxy["list.1.double"]).toBe(400);
  expect(proxy["list.2.double"]).toBe(600);

  proxy["list.0.double"] = 100;
  expect(proxy["list.0.double"]).toBe(100);

  proxy["list.0.triple"] = 300;
  expect(proxy["list.0.triple"]).toBe(300);

  proxy["list.0.value"] = 100;
  expect(proxy["list.0.value"]).toBe(100);

  expect(proxy[Symbols.directlyGet]("list.*.value", [0])).toBe(100);
  expect(() => proxy[Symbols.directlyGet]("list.*.value2", [0])).toThrow();

  proxy[Symbols.directlySet]("list.*.value", [0], 250);
  expect(proxy[Symbols.directlyGet]("list.*.value", [0])).toBe(250);
  expect(() => proxy[Symbols.directlySet]("list.*.value2", [0], 250)).toThrow();
});

test('Handler get @property', () => {
  const targetClass = class {
    list = [
      { name:"aaa", value:100 }, 
      { name:"bbb", value:200 }, 
      { name:"ccc", value:300 }
    ];
    list2 = [
      [1,2,3 ],
      [11,22,33 ],
      [111,222,333 ],
    ]
  } 
  const handler = new Handler([
    "list", "list.*", "list.*.value", "list.*.name", "list2", "list2.*", "list2.*.*"
  ]);
  const target = new targetClass;
  const proxy = new Proxy(target, handler);

  expect(handler.get(target, "@list.*.value", proxy)).toEqual([100,200,300]);
  expect(handler.get(target, "@list.*.name", proxy)).toEqual(["aaa","bbb","ccc"]);
  expect(() => handler.get(target, "@list.*.value2", proxy)).toThrow();
  handler.stackIndexes.push([1]);
  expect(handler.get(target, "@list2.*.*", proxy)).toEqual([11,22,33]);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([2,0]);
  expect(handler.get(target, "@list2.*.*", proxy)).toEqual([111,222,333]);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([]);
  expect(() => handler.get(target, "@list2.*.*", proxy)).toThrow();
  handler.stackIndexes.pop();
  handler.stackIndexes.push([]);
  expect(() => handler.get(target, "@list2", proxy)).toThrow();
  handler.stackIndexes.pop();
});

test('Handler set @property', () => {
  const targetClass = class {
    list = [
      { name:"aaa", value:100 }, 
      { name:"bbb", value:200 }, 
      { name:"ccc", value:300 }
    ];
    list2 = [
      [1,2,3 ],
      [11,22,33 ],
      [111,222,333 ],
    ]
  } 
  const handler = new Handler([
    "list", "list.*", "list.*.value", "list.*.name", "list2", "list2.*", "list2.*.*"
  ]);
  const target = new targetClass;
  const proxy = new Proxy(target, handler);

  handler.set(target, "@list.*.value", [101,201,301], proxy);
  expect(handler.get(target, "@list.*.value", proxy)).toEqual([101,201,301]);
  handler.set(target, "@list.*.name", ["aaaa","bbbb","cccc"], proxy)
  expect(handler.get(target, "@list.*.name", proxy)).toEqual(["aaaa","bbbb","cccc"]);
  expect(() => handler.set(target, "@list.*.value2", [100], proxy)).toThrow();
  expect(() => handler.set(target, "@list.*.value", [100], proxy)).toThrow();
  expect(() => handler.set(target, "@list.*.value", [100,200,300,400], proxy)).toThrow();
  handler.stackIndexes.push([1]);
  handler.set(target, "@list2.*.*", [1.1,2.2,3.3], proxy);
  expect(handler.get(target, "@list2.*.*", proxy)).toEqual([1.1,2.2,3.3]);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([2,0]);
  handler.set(target, "@list2.*.*", [1.11,2.22,3.33], proxy);
  expect(handler.get(target, "@list2.*.*", proxy)).toEqual([1.11,2.22,3.33]);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([2,0]);
  handler.set(target, "@list2.*.*", [1.11,2.22,3.33,4.44,5.55], proxy);
  expect(handler.get(target, "@list2.*.*", proxy)).toEqual([1.11,2.22,3.33,4.44,5.55]);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([2,0]);
  handler.set(target, "@list2.*.*", [1.11,2.22], proxy);
  expect(handler.get(target, "@list2.*.*", proxy)).toEqual([1.11,2.22]);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([]);
  expect(() => handler.set(target, "@list2.*.*", [], proxy)).toThrow();
  handler.stackIndexes.pop();
  handler.stackIndexes.push([]);
  expect(() => handler.set(target, "@list2", [], proxy)).toThrow();
  handler.stackIndexes.pop();
});

