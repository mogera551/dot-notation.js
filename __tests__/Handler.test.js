import Handler from "../src/Handler.js";

test('Handler stackIndexes', () => {
  const handler = new Handler;
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

test('Handler getByPathNames object', () => {
  const handler = new Handler;
  const target = {
    'aaa' : {
      'bbb': {
        'ccc': 100
      }
    }
  };
  const proxy = new Proxy(target, handler);
  expect(handler.getByPathNames(target, ["aaa", "bbb", "ccc"], proxy)).toBe(100);
  expect(handler.getByPathNames(target, ["aaa", "bbb"], proxy)).toEqual({ccc:100});
  expect(handler.getByPathNames(target, ["aaa"], proxy)).toEqual({bbb:{ccc:100}});
});

test('Handler getByPathNames list', () => {
  const handler = new Handler;
  const target = {
    'list' : [
      { aaa:100, bbb:200 },
      { aaa:101, bbb:201 },
      { aaa:102, bbb:202 },
      { aaa:103, bbb:203 },
      { aaa:104, bbb:204 },
    ]
  };
  const proxy = new Proxy(target, handler);
  expect(handler.getByPathNames(target, ["list", "0", "aaa"], proxy)).toBe(100);
  expect(handler.getByPathNames(target, ["list", "0", "bbb"], proxy)).toBe(200);
  expect(handler.getByPathNames(target, ["list", "2", "aaa"], proxy)).toBe(102);
  expect(handler.getByPathNames(target, ["list", "2", "bbb"], proxy)).toBe(202);
  expect(handler.getByPathNames(target, ["list", "4", "aaa"], proxy)).toBe(104);
  expect(handler.getByPathNames(target, ["list", "4", "bbb"], proxy)).toBe(204);
  handler.stackIndexes.push([0]);
  expect(handler.getByPathNames(target, ["list", "*", "aaa"], proxy)).toBe(100);
  expect(handler.getByPathNames(target, ["list", "*", "bbb"], proxy)).toBe(200);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([2]);
  expect(handler.getByPathNames(target, ["list", "*", "aaa"], proxy)).toBe(102);
  expect(handler.getByPathNames(target, ["list", "*", "bbb"], proxy)).toBe(202);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([4]);
  expect(handler.getByPathNames(target, ["list", "*", "aaa"], proxy)).toBe(104);
  expect(handler.getByPathNames(target, ["list", "*", "bbb"], proxy)).toBe(204);
  handler.stackIndexes.pop();
});

test('Handler getByPathNames muti level list ', () => {
  const handler = new Handler;
  const target = {
    'list' : [
      [ 100, 200, 300 ],
      [ 101, 201 ],
      [ 102, 202, 302, 402 ],
    ]
  };
  const proxy = new Proxy(target, handler);
  expect(handler.getByPathNames(target, ["list", "0"], proxy)).toEqual([100,200,300]);
  expect(handler.getByPathNames(target, ["list", "1"], proxy)).toEqual([101,201]);
  expect(handler.getByPathNames(target, ["list", "2"], proxy)).toEqual([102,202,302,402]);
  expect(handler.getByPathNames(target, ["list", "0", "0"], proxy)).toBe(100);
  expect(handler.getByPathNames(target, ["list", "0", "1"], proxy)).toBe(200);
  expect(handler.getByPathNames(target, ["list", "0", "2"], proxy)).toBe(300);
  expect(handler.getByPathNames(target, ["list", "1", "0"], proxy)).toBe(101);
  expect(handler.getByPathNames(target, ["list", "1", "1"], proxy)).toBe(201);
  expect(handler.getByPathNames(target, ["list", "2", "0"], proxy)).toBe(102);
  expect(handler.getByPathNames(target, ["list", "2", "1"], proxy)).toBe(202);
  expect(handler.getByPathNames(target, ["list", "2", "2"], proxy)).toBe(302);
  expect(handler.getByPathNames(target, ["list", "2", "3"], proxy)).toBe(402);
  handler.stackIndexes.push([0]);
  expect(handler.getByPathNames(target, ["list", "*"], proxy)).toEqual([100,200,300]);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([1]);
  expect(handler.getByPathNames(target, ["list", "*"], proxy)).toEqual([101,201]);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([2]);
  expect(handler.getByPathNames(target, ["list", "*"], proxy)).toEqual([102,202,302,402]);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([0, 0]);
  expect(handler.getByPathNames(target, ["list", "*", "*"], proxy)).toBe(100);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([0, 1]);
  expect(handler.getByPathNames(target, ["list", "*", "*"], proxy)).toBe(200);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([0, 2]);
  expect(handler.getByPathNames(target, ["list", "*", "*"], proxy)).toBe(300);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([1, 0]);
  expect(handler.getByPathNames(target, ["list", "*", "*"], proxy)).toBe(101);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([1, 1]);
  expect(handler.getByPathNames(target, ["list", "*", "*"], proxy)).toBe(201);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([2, 0]);
  expect(handler.getByPathNames(target, ["list", "*", "*"], proxy)).toBe(102);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([2, 1]);
  expect(handler.getByPathNames(target, ["list", "*", "*"], proxy)).toBe(202);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([2, 2]);
  expect(handler.getByPathNames(target, ["list", "*", "*"], proxy)).toBe(302);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([2, 3]);
  expect(handler.getByPathNames(target, ["list", "*", "*"], proxy)).toBe(402);
  handler.stackIndexes.pop();
});

test('Handler setByPathNames object', () => {
  const handler = new Handler;
  const target = {
    'aaa' : {
      'bbb': {
        'ccc': 100
      }
    }
  };
  const proxy = new Proxy(target, handler);
  handler.setByPathNames(target, ["aaa", "bbb", "ccc"], 200, proxy);
  expect(handler.getByPathNames(target, ["aaa", "bbb", "ccc"], proxy)).toBe(200);
  handler.setByPathNames(target, ["aaa", "bbb"], { CCC:300 }, proxy);
  expect(handler.getByPathNames(target, ["aaa", "bbb"], proxy)).toEqual({CCC:300});
  handler.setByPathNames(target, ["aaa"], { BBB: { CCC:400 } }, proxy);
  expect(handler.getByPathNames(target, ["aaa"], proxy)).toEqual({ BBB: { CCC:400 } });
});

test('Handler setByPathNames list', () => {
  const handler = new Handler;
  const target = {
    'list' : [
      { aaa:100, bbb:200 },
      { aaa:101, bbb:201 },
      { aaa:102, bbb:202 },
      { aaa:103, bbb:203 },
      { aaa:104, bbb:204 },
    ],
    'list2' : [
      100, 200, 300, 400, 500
    ]
  };
  const proxy = new Proxy(target, handler);
  handler.setByPathNames(target, ["list", "0", "aaa"], 500, proxy);
  expect(handler.getByPathNames(target, ["list", "0", "aaa"], proxy)).toBe(500);
  handler.setByPathNames(target, ["list", "0", "bbb"], 1200, proxy);
  expect(handler.getByPathNames(target, ["list", "0", "bbb"], proxy)).toBe(1200);
  handler.setByPathNames(target, ["list", "2", "aaa"], 502, proxy);
  expect(handler.getByPathNames(target, ["list", "2", "aaa"], proxy)).toBe(502);
  handler.setByPathNames(target, ["list", "2", "bbb"], 1202, proxy);
  expect(handler.getByPathNames(target, ["list", "2", "bbb"], proxy)).toBe(1202);
  handler.setByPathNames(target, ["list", "4", "aaa"], 504, proxy);
  expect(handler.getByPathNames(target, ["list", "4", "aaa"], proxy)).toBe(504);
  handler.setByPathNames(target, ["list", "4", "bbb"], 1204, proxy);
  expect(handler.getByPathNames(target, ["list", "4", "bbb"], proxy)).toBe(1204);
  handler.stackIndexes.push([0]);
  handler.setByPathNames(target, ["list", "*", "aaa"], 555, proxy);
  expect(handler.getByPathNames(target, ["list", "*", "aaa"], proxy)).toBe(555);
  handler.setByPathNames(target, ["list", "*", "bbb"], 5555, proxy);
  expect(handler.getByPathNames(target, ["list", "*", "bbb"], proxy)).toBe(5555);
  expect(handler.getByPathNames(target, ["list", "0", "aaa"], proxy)).toBe(555);
  expect(handler.getByPathNames(target, ["list", "0", "bbb"], proxy)).toBe(5555);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([2]);
  handler.setByPathNames(target, ["list", "*", "aaa"], 666, proxy);
  expect(handler.getByPathNames(target, ["list", "*", "aaa"], proxy)).toBe(666);
  handler.setByPathNames(target, ["list", "*", "bbb"], 6666, proxy);
  expect(handler.getByPathNames(target, ["list", "*", "bbb"], proxy)).toBe(6666);
  expect(handler.getByPathNames(target, ["list", "2", "aaa"], proxy)).toBe(666);
  expect(handler.getByPathNames(target, ["list", "2", "bbb"], proxy)).toBe(6666);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([4]);
  handler.setByPathNames(target, ["list", "*", "aaa"], 777, proxy);
  expect(handler.getByPathNames(target, ["list", "*", "aaa"], proxy)).toBe(777);
  handler.setByPathNames(target, ["list", "*", "bbb"], 7777, proxy);
  expect(handler.getByPathNames(target, ["list", "*", "bbb"], proxy)).toBe(7777);
  expect(handler.getByPathNames(target, ["list", "4", "aaa"], proxy)).toBe(777);
  expect(handler.getByPathNames(target, ["list", "4", "bbb"], proxy)).toBe(7777);
  handler.stackIndexes.pop();

  handler.stackIndexes.push([0]);
  handler.setByPathNames(target, ["list2", "*"], 1001, proxy);
  expect(handler.getByPathNames(target, ["list2", "*"], proxy)).toBe(1001);
  expect(handler.getByPathNames(target, ["list2", "0"], proxy)).toBe(1001);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([2]);
  handler.setByPathNames(target, ["list2", "*"], 3001, proxy);
  expect(handler.getByPathNames(target, ["list2", "*"], proxy)).toBe(3001);
  expect(handler.getByPathNames(target, ["list2", "2"], proxy)).toBe(3001);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([4]);
  handler.setByPathNames(target, ["list2", "*"], 5001, proxy);
  expect(handler.getByPathNames(target, ["list2", "*"], proxy)).toBe(5001);
  expect(handler.getByPathNames(target, ["list2", "4"], proxy)).toBe(5001);
  handler.stackIndexes.pop();

  handler.stackIndexes.push([1]);
  handler.setByPathNames(target, ["list2", "*"], 2001, proxy);
  handler.stackIndexes.push([3]);
  handler.setByPathNames(target, ["list2", "*"], 4001, proxy);
  expect(handler.getByPathNames(target, ["list2", "*"], proxy)).toBe(4001);
  expect(handler.getByPathNames(target, ["list2", "3"], proxy)).toBe(4001);
  handler.stackIndexes.pop();
  expect(handler.getByPathNames(target, ["list2", "*"], proxy)).toBe(2001);
  expect(handler.getByPathNames(target, ["list2", "1"], proxy)).toBe(2001);
  handler.stackIndexes.pop();
});

test('Handler get object, primitive', () => {
  const handler = new Handler;
  const target = {
    'aaa' : {
      'bbb': {
        'ccc': 100
      }
    },
    'ddd':200
  };
  const proxy = new Proxy(target, handler);
  expect(handler.get(target, "aaa.bbb.ccc", proxy)).toBe(100);
  expect(handler.get(target, "ddd", proxy)).toBe(200);
});

test('Handler get list', () => {
  const handler = new Handler;
  const target = {
    'list' : [
      { aaa:100, bbb:200 },
      { aaa:101, bbb:201 },
      { aaa:102, bbb:202 },
      { aaa:103, bbb:203 },
      { aaa:104, bbb:204 },
    ]
  };
  const proxy = new Proxy(target, handler);
  expect(handler.get(target, "list.0.aaa", proxy)).toBe(100);
  expect(handler.get(target, "list.0.bbb", proxy)).toBe(200);
  expect(handler.get(target, "list.2.aaa", proxy)).toBe(102);
  expect(handler.get(target, "list.2.bbb", proxy)).toBe(202);
  expect(handler.get(target, "list.4.aaa", proxy)).toBe(104);
  expect(handler.get(target, "list.4.bbb", proxy)).toBe(204);
  handler.stackIndexes.push([0]);
  expect(handler.get(target, "list.*.aaa", proxy)).toBe(100);
  expect(handler.get(target, "list.*.bbb", proxy)).toBe(200);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([2]);
  expect(handler.get(target, "list.*.aaa", proxy)).toBe(102);
  expect(handler.get(target, "list.*.bbb", proxy)).toBe(202);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([4]);
  expect(handler.get(target, "list.*.aaa", proxy)).toBe(104);
  expect(handler.get(target, "list.*.bbb", proxy)).toBe(204);
  handler.stackIndexes.pop();
});

test('Handler set list', () => {
  const handler = new Handler;
  const target = {
    'list' : [
      { aaa:100, bbb:200 },
      { aaa:101, bbb:201 },
      { aaa:102, bbb:202 },
      { aaa:103, bbb:203 },
      { aaa:104, bbb:204 },
    ],
    'list2' : [
      100, 200, 300, 400, 500
    ]
  };
  const proxy = new Proxy(target, handler);
  handler.set(target, "list.0.aaa", 500, proxy);
  expect(handler.get(target, "list.0.aaa", proxy)).toBe(500);
  handler.set(target, "list.0.bbb", 1200, proxy);
  expect(handler.get(target, "list.0.bbb", proxy)).toBe(1200);
  handler.set(target, "list.2.aaa", 502, proxy);
  expect(handler.get(target, "list.2.aaa", proxy)).toBe(502);
  handler.set(target, "list.2.bbb", 1202, proxy);
  expect(handler.get(target, "list.2.bbb", proxy)).toBe(1202);
  handler.set(target, "list.4.aaa", 504, proxy);
  expect(handler.get(target, "list.4.aaa", proxy)).toBe(504);
  handler.set(target, "list.4.bbb", 1204, proxy);
  expect(handler.get(target, "list.4.bbb", proxy)).toBe(1204);
  handler.stackIndexes.push([0]);
  handler.set(target, "list.*.aaa", 555, proxy);
  expect(handler.get(target, "list.*.aaa", proxy)).toBe(555);
  handler.set(target, "list.*.bbb", 5555, proxy);
  expect(handler.get(target, "list.*.bbb", proxy)).toBe(5555);
  expect(handler.get(target, "list.0.aaa", proxy)).toBe(555);
  expect(handler.get(target, "list.0.bbb", proxy)).toBe(5555);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([2]);
  handler.set(target, "list.*.aaa", 666, proxy);
  expect(handler.get(target, "list.*.aaa", proxy)).toBe(666);
  handler.set(target, "list.*.bbb", 6666, proxy);
  expect(handler.get(target, "list.*.bbb", proxy)).toBe(6666);
  expect(handler.get(target, "list.2.aaa", proxy)).toBe(666);
  expect(handler.get(target, "list.2.bbb", proxy)).toBe(6666);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([4]);
  handler.set(target, "list.*.aaa", 777, proxy);
  expect(handler.get(target, "list.*.aaa", proxy)).toBe(777);
  handler.set(target, "list.*.bbb", 7777, proxy);
  expect(handler.get(target, "list.*.bbb", proxy)).toBe(7777);
  expect(handler.get(target, "list.4.aaa", proxy)).toBe(777);
  expect(handler.get(target, "list.4.bbb", proxy)).toBe(7777);
  handler.stackIndexes.pop();

  handler.stackIndexes.push([0]);
  handler.set(target, "list2.*", 1001, proxy);
  expect(handler.get(target, "list2.*", proxy)).toBe(1001);
  expect(handler.get(target, "list2.0", proxy)).toBe(1001);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([2]);
  handler.set(target, "list2.*", 3001, proxy);
  expect(handler.get(target, "list2.*", proxy)).toBe(3001);
  expect(handler.get(target, "list2.2", proxy)).toBe(3001);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([4]);
  handler.set(target, "list2.*", 5001, proxy);
  expect(handler.get(target, "list2.*", proxy)).toBe(5001);
  expect(handler.get(target, "list2.4", proxy)).toBe(5001);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([1]);
  handler.set(target, "list2.*", 2001, proxy);
  handler.stackIndexes.push([3]);
  handler.set(target, "list2.*", 4001, proxy);
  expect(handler.get(target, "list2.*", proxy)).toBe(4001);
  expect(handler.get(target, "list2.3", proxy)).toBe(4001);
  handler.stackIndexes.pop();
  expect(handler.get(target, "list2.*", proxy)).toBe(2001);
  expect(handler.get(target, "list2.1", proxy)).toBe(2001);
  handler.stackIndexes.pop();
});

test('Handler setByPathNames multi level list ', () => {
  const handler = new Handler;
  const target = {
    'list' : [
      [ 100, 200, 300 ],
      [ 101, 201 ],
      [ 102, 202, 302, 402 ],
    ],
    'list2' : [
      [ 10000, 20000, 30000 ],
      [ 10001, 20001 ],
      [ 10002, 20002, 30002, 40002 ],
    ],
  };
  const proxy = new Proxy(target, handler);
  handler.setByPathNames(target, ["list", "0"], [1000,2000,3000], proxy);
  expect(handler.getByPathNames(target, ["list", "0"], proxy)).toEqual([1000,2000,3000]);
  handler.setByPathNames(target, ["list", "1"], [1001,2001], proxy)
  expect(handler.getByPathNames(target, ["list", "1"], proxy)).toEqual([1001,2001]);
  handler.setByPathNames(target, ["list", "2"], [1002,2002,3002,4002], proxy)
  expect(handler.getByPathNames(target, ["list", "2"], proxy)).toEqual([1002,2002,3002,4002]);
  handler.setByPathNames(target, ["list", "0", "0"], 10010, proxy);
  expect(handler.getByPathNames(target, ["list", "0", "0"], proxy)).toBe(10010);
  handler.setByPathNames(target, ["list", "0", "1"], 20010, proxy);
  expect(handler.getByPathNames(target, ["list", "0", "1"], proxy)).toBe(20010);
  handler.setByPathNames(target, ["list", "0", "2"], 30010, proxy);
  expect(handler.getByPathNames(target, ["list", "0", "2"], proxy)).toBe(30010);
  handler.setByPathNames(target, ["list", "1", "0"], 10011, proxy);
  expect(handler.getByPathNames(target, ["list", "1", "0"], proxy)).toBe(10011);
  handler.setByPathNames(target, ["list", "1", "1"], 20011, proxy);
  expect(handler.getByPathNames(target, ["list", "1", "1"], proxy)).toBe(20011);
  handler.setByPathNames(target, ["list", "2", "0"], 10012, proxy);
  expect(handler.getByPathNames(target, ["list", "2", "0"], proxy)).toBe(10012);
  handler.setByPathNames(target, ["list", "2", "1"], 20012, proxy);
  expect(handler.getByPathNames(target, ["list", "2", "1"], proxy)).toBe(20012);
  handler.setByPathNames(target, ["list", "2", "2"], 30012, proxy);
  expect(handler.getByPathNames(target, ["list", "2", "2"], proxy)).toBe(30012);
  handler.setByPathNames(target, ["list", "2", "3"], 40012, proxy);
  expect(handler.getByPathNames(target, ["list", "2", "3"], proxy)).toBe(40012);
  handler.stackIndexes.push([0]);
  handler.setByPathNames(target, ["list", "*"], [1005,2005,3005], proxy);
  expect(handler.getByPathNames(target, ["list", "*"], proxy)).toEqual([1005,2005,3005]);
  expect(handler.getByPathNames(target, ["list", "0"], proxy)).toEqual([1005,2005,3005]);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([1]);
  handler.setByPathNames(target, ["list", "*"], [1006,2006], proxy);
  expect(handler.getByPathNames(target, ["list", "*"], proxy)).toEqual([1006,2006]);
  expect(handler.getByPathNames(target, ["list", "1"], proxy)).toEqual([1006,2006]);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([2]);
  handler.setByPathNames(target, ["list", "*"], [1007,2007,3007,4007], proxy);
  expect(handler.getByPathNames(target, ["list", "*"], proxy)).toEqual([1007,2007,3007,4007]);
  expect(handler.getByPathNames(target, ["list", "2"], proxy)).toEqual([1007,2007,3007,4007]);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([0, 0]);
  handler.setByPathNames(target, ["list", "*", "*"], 100001, proxy);
  expect(handler.getByPathNames(target, ["list", "*", "*"], proxy)).toBe(100001);
  expect(handler.getByPathNames(target, ["list", "0", "0"], proxy)).toBe(100001);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([0, 1]);
  handler.setByPathNames(target, ["list", "*", "*"], 200001, proxy);
  expect(handler.getByPathNames(target, ["list", "*", "*"], proxy)).toBe(200001);
  expect(handler.getByPathNames(target, ["list", "0", "1"], proxy)).toBe(200001);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([0, 2]);
  handler.setByPathNames(target, ["list", "*", "*"], 300001, proxy);
  expect(handler.getByPathNames(target, ["list", "*", "*"], proxy)).toBe(300001);
  expect(handler.getByPathNames(target, ["list", "0", "2"], proxy)).toBe(300001);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([1, 0]);
  handler.setByPathNames(target, ["list", "*", "*"], 100002, proxy);
  expect(handler.getByPathNames(target, ["list", "*", "*"], proxy)).toBe(100002);
  expect(handler.getByPathNames(target, ["list", "1", "0"], proxy)).toBe(100002);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([1, 1]);
  handler.setByPathNames(target, ["list", "*", "*"], 200002, proxy);
  expect(handler.getByPathNames(target, ["list", "*", "*"], proxy)).toBe(200002);
  expect(handler.getByPathNames(target, ["list", "1", "1"], proxy)).toBe(200002);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([2, 0]);
  handler.setByPathNames(target, ["list", "*", "*"], 100003, proxy);
  expect(handler.getByPathNames(target, ["list", "*", "*"], proxy)).toBe(100003);
  expect(handler.getByPathNames(target, ["list", "2", "0"], proxy)).toBe(100003);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([2, 1]);
  handler.setByPathNames(target, ["list", "*", "*"], 200003, proxy);
  expect(handler.getByPathNames(target, ["list", "*", "*"], proxy)).toBe(200003);
  expect(handler.getByPathNames(target, ["list", "2", "1"], proxy)).toBe(200003);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([2, 2]);
  handler.setByPathNames(target, ["list", "*", "*"], 300003, proxy);
  expect(handler.getByPathNames(target, ["list", "*", "*"], proxy)).toBe(300003);
  expect(handler.getByPathNames(target, ["list", "2", "2"], proxy)).toBe(300003);
  handler.stackIndexes.pop();
  handler.stackIndexes.push([2, 3]);
  handler.setByPathNames(target, ["list", "*", "*"], 400003, proxy);
  expect(handler.getByPathNames(target, ["list", "*", "*"], proxy)).toBe(400003);
  expect(handler.getByPathNames(target, ["list", "2", "3"], proxy)).toBe(400003);
  handler.stackIndexes.pop();
});

test('Handler constructor', () => {
  const handler = new Handler;
  expect(handler.definedProperties).toBe(undefined);
  expect(handler.setOfDefinedProperties).toBe(undefined);
  expect(handler.definedPropertyNames).toBe(undefined);

  const handler2 = new Handler([]);
  expect(handler2.definedProperties).toEqual([]);
  expect(handler2.setOfDefinedProperties instanceof Set).toBe(true);
  expect(Array.from(handler2.setOfDefinedProperties)).toEqual([]);
  expect(handler2.definedPropertyNames instanceof Array).toBe(true);
  expect(Array.from(handler2.definedPropertyNames)).toEqual([]);

  const handler3 = new Handler(["aaa"]);
  expect(handler3.definedProperties).toEqual(["aaa"]);
  expect(handler3.setOfDefinedProperties instanceof Set).toBe(true);
  expect(Array.from(handler3.setOfDefinedProperties)).toEqual(["aaa"]);
  expect(handler3.definedPropertyNames instanceof Array).toBe(true);

  const handler4 = new Handler(["aaa", "bbb", "aaa"]);
  expect(handler4.definedProperties).toEqual(["aaa", "bbb", "aaa"]);
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
    }
  };
  const handler = new Handler([
    "list", "list.*", "list.*.value", "list.*.double"
  ]);
  const proxy = new Proxy(target, handler);

  expect(handler.get(target, "list.0.double", proxy)).toBe(200);
  expect(handler.get(target, "list.1.double", proxy)).toBe(400);
  expect(handler.get(target, "list.2.double", proxy)).toBe(600);

  handler.set(target, "list.0.double", 100, proxy);
  expect(handler.get(target, "list.0.double", proxy)).toBe(100);
});