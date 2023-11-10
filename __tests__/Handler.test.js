import { Handler } from "../src/Handler.js";
import { Symbols } from "../src/Const.js"
import { PropertyName } from "../src/PropertyName.js";

test('Handler stackIndexes', () => {
  const handler = new Handler();
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
  const handler2 = new Handler();
  expect(handler2.matchByName instanceof Map).toBe(true);

});

test('Handler defined property', () => {
  const target = {
    "aaa": 1,
    "bbb": [ 100, 200, 300 ],
    "ccc": { ddd:111, eee:222 }
  };
  const handler = new Handler();
  const proxy = new Proxy(target, handler);

  expect(handler.get(target, "aaa", proxy)).toBe(1);
  expect(handler.get(target, "bbb", proxy)).toEqual([100,200,300]);
  expect(handler.get(target, "bbb.0", proxy)).toBe(100);
  expect(handler.get(target, "bbb.1", proxy)).toBe(200);
  expect(handler.get(target, "bbb.2", proxy)).toBe(300);
  expect(handler.get(target, "ccc", proxy)).toEqual({ ddd:111, eee:222 });
  expect(handler.get(target, "ccc.ddd", proxy)).toBe(111);
  expect(handler.get(target, "ccc.eee", proxy)).toBe(222);
  expect(handler.get(target, "AAA", proxy)).toBe(undefined);

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
  expect(handler.set(target, "AAA", 3, proxy)).toBe(true);
  expect(handler.get(target, "AAA", proxy)).toBe(3);

  handler.set(target, "bbb", [1000,2000,3000,4000], proxy);
  expect(handler.get(target, "bbb", proxy)).toEqual([1000,2000,3000,4000]);
  handler.set(target, "ccc", { ddd:1111, eee:2222, fff:3333 }, proxy);
  expect(handler.get(target, "ccc", proxy)).toEqual({ ddd:1111, eee:2222, fff:3333 });

  expect(handler.get(target, "ggg", proxy)).toBe(undefined);
  expect(handler.get(target, "ccc.ggg", proxy)).toBe(undefined);
  expect(handler.getByPropertyName(target, { propName:PropertyName.create("ggg") }, proxy)).toBe(undefined);

});

test('Handler object, accessor property', () => {
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
  const handler = new Handler();
  const proxy = new Proxy(target, handler);

  expect(handler.get(target, "list.0.double", proxy)).toBe(200);
  expect(handler.get(target, "list.1.double", proxy)).toBe(400);
  expect(handler.get(target, "list.2.double", proxy)).toBe(600);

  handler.set(target, "list.0.double", 100, proxy);
  expect(handler.get(target, "list.0.double", proxy)).toBe(100);

  handler.set(target, "list.0.triple", 300, proxy);
  expect(handler.get(target, "list.0.triple", proxy)).toBe(300);
});

test('Handler class, getFunc, setFunc', () => {
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
  const handler = new Handler();
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
  expect(Reflect.apply(getfunc, proxy, ["list.*.value2", [0]])).toBe(undefined);

  const setfunc = handler.get(target, Symbols.directlySet, proxy);
  expect(setfunc instanceof Function).toBe(true);
  Reflect.apply(setfunc, proxy, ["list.*.value", [0], 250]);
  expect(Reflect.apply(getfunc, proxy, ["list.*.value", [0]])).toBe(250);
  expect(Reflect.apply(setfunc, proxy, ["list.*.value2", [0]])).toBe(true);
});

test('Proxy directlyGet, directlySet', () => {
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
  const handler = new Handler();
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
  expect(proxy[Symbols.directlyGet]("list.*.value2", [0])).toBe(undefined);

  proxy[Symbols.directlySet]("list.*.value", [0], 250);
  expect(proxy[Symbols.directlyGet]("list.*.value", [0])).toBe(250);
  expect(proxy[Symbols.directlySet]("list.*.value2", [0], 255)).toBe(true);
  expect(proxy[Symbols.directlyGet]("list.*.value2", [0])).toBe(255);
  expect(proxy[Symbols.directlySet]("list2.*.value2", [0], 350)).toBe(false);
  expect(proxy[Symbols.directlyGet]("list2.*.value2", [0])).toBe(undefined);
});

test('Handler get @property', () => {
  const sym = Symbol.for("aaa");
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
    ];
    [sym] = 100;
  } 
  const handler = new Handler();
  const target = new targetClass;
  const proxy = new Proxy(target, handler);

  expect(handler.get(target, "@list.*.value", proxy)).toEqual([100,200,300]);
  expect(handler.get(target, "@list.*.name", proxy)).toEqual(["aaa","bbb","ccc"]);
  expect(handler.get(target, "@list.*.value2", proxy)).toEqual([undefined, undefined, undefined]);
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

  expect(handler.get(target, "@@__", proxy)).toEqual(undefined);
  expect(handler.get(target, "constructor", proxy)).toBe(targetClass);
  handler.set(target, "@@__", 1, proxy);
  handler.set(target, "constructor", targetClass, proxy);
  expect(handler.get(target, "@@__", proxy)).toEqual(1);
  expect(handler.get(target, "constructor", proxy)).toBe(targetClass);

  expect(handler.get(target, sym, proxy)).toEqual(100);
  handler.set(target, sym, 200, proxy);
  expect(handler.get(target, sym, proxy)).toEqual(200);
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
  const handler = new Handler();
  const target = new targetClass;
  const proxy = new Proxy(target, handler);

  handler.set(target, "@list.*.value", [101,201,301], proxy);
  expect(handler.get(target, "@list.*.value", proxy)).toEqual([101,201,301]);
  handler.set(target, "@list.*.value", 400, proxy);
  expect(handler.get(target, "@list.*.value", proxy)).toEqual([400,400,400]);
  handler.set(target, "@list.*.name", ["aaaa","bbbb","cccc"], proxy);
  expect(handler.get(target, "@list.*.name", proxy)).toEqual(["aaaa","bbbb","cccc"]);
  handler.set(target, "@list.*.name", "dddd", proxy);
  expect(handler.get(target, "@list.*.name", proxy)).toEqual(["dddd","dddd","dddd"]);
  expect(() => handler.set(target, "@list.*.value2", [100], proxy)).toThrow();
  expect(() => handler.set(target, "@list.*.value", [100], proxy)).toThrow();
  expect(() => handler.set(target, "@list.*.value", [100,200,300,400], proxy)).toThrow();
  handler.stackIndexes.push([1]);
  handler.set(target, "@list2.*.*", [1.1,2.2,3.3], proxy);
  expect(handler.get(target, "@list2.*.*", proxy)).toEqual([1.1,2.2,3.3]);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([1]);
  handler.set(target, "@list2.*.*", 4.4, proxy);
  expect(handler.get(target, "@list2.*.*", proxy)).toEqual([4.4,4.4,4.4]);
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

test('Handler array', () => {
  const target = {
    "aaa": [
      [1,2,3],
      [11,22,33],
      [111,222,333],
    ],
  };
  const handler = new Handler();
  const proxy = new Proxy(target, handler);

  expect(handler.get(target, "aaa", proxy)).toEqual([
    [1,2,3],
    [11,22,33],
    [111,222,333],
  ]);
  expect(handler.get(target, "aaa.0", proxy)).toEqual([1,2,3]);
  expect(handler.get(target, "aaa.1", proxy)).toEqual([11,22,33]);
  expect(handler.get(target, "aaa.2", proxy)).toEqual([111,222,333]);
  expect(handler.get(target, "aaa.0.0", proxy)).toBe(1);
  expect(handler.get(target, "aaa.0.1", proxy)).toBe(2);
  expect(handler.get(target, "aaa.0.2", proxy)).toBe(3);
  expect(handler.get(target, "aaa.1.0", proxy)).toBe(11);
  expect(handler.get(target, "aaa.1.1", proxy)).toBe(22);
  expect(handler.get(target, "aaa.1.2", proxy)).toBe(33);
  expect(handler.get(target, "aaa.2.0", proxy)).toBe(111);
  expect(handler.get(target, "aaa.2.1", proxy)).toBe(222);
  expect(handler.get(target, "aaa.2.2", proxy)).toBe(333);
  expect(handler.get(target, "aaa.*.*", proxy)).toBe(undefined);
  expect(handler.get(target, "aaa.0.*", proxy)).toBe(undefined);
  handler.stackIndexes.push([1,2]);
  expect(handler.get(target, "aaa.*.*", proxy)).toBe(33);
  expect(handler.get(target, "aaa.0.*", proxy)).toBe(3);
  expect(handler.get(target, "aaa.1.*", proxy)).toBe(33);
  expect(handler.get(target, "aaa.2.*", proxy)).toBe(333);
  handler.stackIndexes.push([]);
  expect(handler.get(target, "aaa.*.*", proxy)).toBe(undefined);
  expect(handler.get(target, "aaa.0.*", proxy)).toBe(undefined);
  handler.stackIndexes.push([1]);
  expect(handler.get(target, "aaa.*.*", proxy)).toBe(undefined);
  expect(handler.get(target, "aaa.0.*", proxy)).toBe(undefined);

  handler.stackIndexes.splice(0);
  expect(handler.stackIndexes).toEqual([]);

  handler.set(target, "aaa", [[1111,2222,3333], [11111,22222,33333], [111111,222222,333333]], proxy);
  expect(handler.get(target, "aaa", proxy)).toEqual([[1111,2222,3333], [11111,22222,33333], [111111,222222,333333]]);
  handler.set(target, "aaa.0", [1,2,3], proxy);
  expect(handler.get(target, "aaa.0", proxy)).toEqual([1,2,3]);
  handler.set(target, "aaa.1", [11,22,33], proxy);
  expect(handler.get(target, "aaa.1", proxy)).toEqual([11,22,33]);
  handler.set(target, "aaa.2", [111,222,333], proxy);
  expect(handler.get(target, "aaa.2", proxy)).toEqual([111,222,333]);
  handler.set(target, "aaa.0.0", 1111, proxy);
  expect(handler.get(target, "aaa.0.0", proxy)).toBe(1111);
  handler.set(target, "aaa.0.1", 2222, proxy);
  expect(handler.get(target, "aaa.0.1", proxy)).toBe(2222);
  handler.set(target, "aaa.0.2", 3333, proxy);
  expect(handler.get(target, "aaa.0.2", proxy)).toBe(3333);
  handler.set(target, "aaa.1.0", 11111, proxy);
  expect(handler.get(target, "aaa.1.0", proxy)).toBe(11111);
  handler.set(target, "aaa.1.1", 22222, proxy);
  expect(handler.get(target, "aaa.1.1", proxy)).toBe(22222);
  handler.set(target, "aaa.1.2", 33333, proxy);
  expect(handler.get(target, "aaa.1.2", proxy)).toBe(33333);
  handler.set(target, "aaa.2.0", 111111, proxy);
  expect(handler.get(target, "aaa.2.0", proxy)).toBe(111111);
  handler.set(target, "aaa.2.1", 222222, proxy);
  expect(handler.get(target, "aaa.2.1", proxy)).toBe(222222);
  handler.set(target, "aaa.2.2", 333333, proxy);
  expect(handler.get(target, "aaa.2.2", proxy)).toBe(333333);
  handler.set(target, "aaa.*.*", 0, proxy);
  expect(handler.get(target, "aaa", proxy)).toEqual([[1111,2222,3333], [11111,22222,33333], [111111,222222,333333]]);

  handler.stackIndexes.push([1,2]);
  handler.set(target, "aaa.*.*", 33, proxy);
  expect(handler.get(target, "aaa.1.2", proxy)).toBe(33);
  handler.set(target, "aaa.0.*", 3, proxy);
  expect(handler.get(target, "aaa.0.2", proxy)).toBe(3);
  handler.set(target, "aaa.1.*", 31, proxy);
  expect(handler.get(target, "aaa.1.2", proxy)).toBe(31);
  handler.set(target, "aaa.2.*", 333, proxy);
  expect(handler.get(target, "aaa.2.2", proxy)).toBe(333);
});

test("Proxy", () => {
  const proxy = new Proxy({}, new Handler([]));
  expect(proxy[Symbols.isSupportDotNotation]).toBe(true);
});
