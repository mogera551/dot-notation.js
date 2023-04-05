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
