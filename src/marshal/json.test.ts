import { getQuickJS } from "quickjs-emscripten";
import marshalJSON from "./json";

test("empty object", async () => {
  const vm = (await getQuickJS()).createVm();
  const prototypeCheck = vm.unwrapResult(
    vm.evalCode(`o => Object.getPrototypeOf(o) === Object.prototype`)
  );

  const obj = {};
  const preMarshal = jest.fn((_, a) => a);

  const handle = marshalJSON(vm, obj, preMarshal);
  if (!handle) throw new Error("handle is undefined");

  expect(vm.typeof(handle)).toBe("object");
  expect(preMarshal).toBeCalledTimes(1);
  expect(preMarshal.mock.calls[0][0]).toBe(obj);
  expect(preMarshal.mock.calls[0][1] === handle).toBe(true); // avoid freeze
  expect(
    vm.dump(
      vm.unwrapResult(vm.callFunction(prototypeCheck, vm.undefined, handle))
    )
  ).toBe(true);

  handle.dispose();
  prototypeCheck.dispose();
  vm.dispose();
});

test("normal object", async () => {
  const vm = (await getQuickJS()).createVm();
  const prototypeCheck = vm.unwrapResult(
    vm.evalCode(`o => Object.getPrototypeOf(o) === Object.prototype`)
  );
  const entries = vm.unwrapResult(vm.evalCode(`Object.entries`));

  const obj = { a: 100, b: "hoge" };
  const preMarshal = jest.fn((_, a) => a);

  const handle = marshalJSON(vm, obj, preMarshal);
  if (!handle) throw new Error("handle is undefined");

  expect(vm.typeof(handle)).toBe("object");
  expect(vm.getNumber(vm.getProp(handle, "a"))).toBe(100);
  expect(vm.getString(vm.getProp(handle, "b"))).toBe("hoge");
  expect(preMarshal).toBeCalledTimes(1);
  expect(preMarshal.mock.calls[0][0]).toBe(obj);
  expect(preMarshal.mock.calls[0][1] === handle).toBe(true); // avoid freeze
  expect(
    vm.dump(
      vm.unwrapResult(vm.callFunction(prototypeCheck, vm.undefined, handle))
    )
  ).toBe(true);
  const e = vm.unwrapResult(vm.callFunction(entries, vm.undefined, handle));
  expect(vm.dump(e)).toEqual([
    ["a", 100],
    ["b", "hoge"],
  ]);

  e.dispose();
  handle.dispose();
  prototypeCheck.dispose();
  entries.dispose();
  vm.dispose();
});

test("array", async () => {
  const vm = (await getQuickJS()).createVm();
  const isArray = vm.unwrapResult(vm.evalCode(`Array.isArray`));

  const array = [1, "aa"];
  const preMarshal = jest.fn((_, a) => a);

  const handle = marshalJSON(vm, array, preMarshal);
  if (!handle) throw new Error("handle is undefined");

  expect(vm.typeof(handle)).toBe("object");
  expect(vm.getNumber(vm.getProp(handle, 0))).toBe(1);
  expect(vm.getString(vm.getProp(handle, 1))).toBe("aa");
  expect(vm.getNumber(vm.getProp(handle, "length"))).toBe(2);
  expect(preMarshal).toBeCalledTimes(1);
  expect(preMarshal.mock.calls[0][0]).toBe(array);
  expect(preMarshal.mock.calls[0][1] === handle).toBe(true); // avoid freeze
  expect(
    vm.dump(vm.unwrapResult(vm.callFunction(isArray, vm.undefined, handle)))
  ).toBe(true);

  handle.dispose();
  isArray.dispose();
  vm.dispose();
});