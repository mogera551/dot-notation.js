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
