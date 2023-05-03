import { PropertyName } from "./PropertyName.js";
import { WILDCARD, DELIMITER, RE_CONTEXT_INDEX, Symbols } from "./Const.js";

/**
 * @typedef {{propName:PropertyName,indexes:number[]}} PropertyAccess
 */

export class Handler {
  /**
   * @type {number[][]}
   */
  #stackIndexes = [];
  /**
   * @type {Map<string,PropertyAccess>}
   */
  #matchByName = new Map;

  get lastIndexes() {
    return this.#stackIndexes[this.#stackIndexes.length - 1];
  }

  get stackIndexes() {
    return this.#stackIndexes;
  }

  /**
   * @type {Map<string,PropertyAccess>}
   */
  get matchByName() {
    return this.#matchByName;
  }

  /**
   * 
   * @param {any} target 
   * @param {{propName:PropertyName}}  
   * @param {Proxy} receiver
   * @returns {any}
   */
  getByPropertyName(target, { propName }, receiver) {
    let value = undefined;
    if (Reflect.has(target, propName.name)) {
      value = Reflect.get(target, propName.name, receiver);
    } else {
      if (propName.parentPath !== "") {
        const parentPropName = PropertyName.create(propName.parentPath);
        const parent = this.getByPropertyName(target, { propName:parentPropName }, receiver);
        const lastName = (propName.lastPathName === WILDCARD) ? this.lastIndexes[propName.level - 1] : propName.lastPathName;
        value = Reflect.get(parent, lastName);
      }
    }
    return value;
  }

  /**
   * 
   * @param {any} target 
   * @param {{propName:PropertyName,value:any}}  
   * @param {Proxy} receiver
   * @returns {boolean}
   */
  setByPropertyName(target, { propName, value }, receiver) {
    let result = false;
    if (Reflect.has(target, propName.name)) {
      result = Reflect.set(target, propName.name, value, receiver);
    } else {
      const parentPropName = PropertyName.create(propName.parentPath);
      const parent = this.getByPropertyName(target, { propName:parentPropName }, receiver);
      if (typeof parent !== "undefined") {
        const lastName = (propName.lastPathName === WILDCARD) ? this.lastIndexes[propName.level - 1] : propName.lastPathName;
        result = Reflect.set(parent, lastName, value);
      }
    }
    return result;
  }

  /**
   * 
   * @param {number[]} indexes 
   * @param {()=>{}} callback 
   * @returns 
   */
  pushIndexes(indexes, callback) {
    this.#stackIndexes.push(indexes);
    try {
      return Reflect.apply(callback, this, []);
    } finally {
      this.#stackIndexes.pop();
    }
  }

  /**
   * 
   * @param {any} target 
   * @param {Proxy} receiver 
   * @returns {({}:PropertyAccess) => {any}  }
   */
  getFunc = (target, receiver) => ({propName, indexes}) => 
    this.pushIndexes(indexes, () => this.getByPropertyName(target, { propName }, receiver));

  /**
   * 
   * @param {any} target 
   * @param {Proxy} receiver 
   * @returns {({}:PropertyAccess, value:any) => {boolean}  }
   */
  setFunc = (target, receiver) => ({propName, indexes}, value) => 
    this.pushIndexes(indexes, () => this.setByPropertyName(target, { propName, value }, receiver));

  /**
   * 
   * @param {any} target
   * @param {{propName:PropertyName,indexes:number[]}} 
   * @param {Proxy} receiver
   * @returns {any[]}
   */
  getExpandLastLevel(target, { propName, indexes }, receiver) {
    const getFunc = this.getFunc(target, receiver);
    const wildcardProp = propName.findNearestWildcard();
    if (!wildcardProp) throw new Error(`not found wildcard path of '${propName.name}'`);
    const listProp = PropertyName.create(wildcardProp.parentPath);
    return getFunc({propName:listProp, indexes}).map((value, index) => getFunc({propName, indexes:indexes.concat(index)}));
  }

  /**
   * 
   * @param {any} target
   * @param {{propName:PropertyName,indexes:number[],values:any[]}}  
   * @param {Proxy} receiver
   * @returns {boolean}
   */
  setExpandLastLevel(target, { propName, indexes, values }, receiver) {
    const getFunc = this.getFunc(target, receiver);
    const setFunc = this.setFunc(target, receiver);
    const wildcardProp = propName.findNearestWildcard();
    if (!wildcardProp) throw new Error(`not found wildcard path of '${propName.name}'`);
    const listProp = PropertyName.create(wildcardProp.parentPath);
    const listValues = getFunc({propName:listProp, indexes});
    if (wildcardProp.name === propName.name) {
      // propName末尾が*の場合
      setFunc({propName:listProp, indexes}, values);
    } else {
      if (values.length !== listValues.length) throw new Error(`not match value count '${propName.name}'`);
      for(let i in listValues) {
        setFunc({propName, indexes:indexes.concat(Number(i))}, values[i]);
      }
    }
    return true;
  }
  
  /**
   * 
   * @param {any} target 
   * @param {string} prop 
   * @param {Proxy} receiver 
   * @returns {any}
   */
  get(target, prop, receiver) {
    const getFunc = this.getFunc(target, receiver);
    const lastIndexes = this.lastIndexes;
    let match;
    if (prop === Symbols.directlyGet) {
      // プロパティとindexesを直接指定してgetする
      return (prop, indexes) => {
        return this.pushIndexes(indexes, () => this.getByPropertyName(target, { propName:PropertyName.create(prop) }, receiver));
      }
    } else if (prop === Symbols.directlySet) {
      // プロパティとindexesを直接指定してsetする
      return (prop, indexes, value) => {
        return this.pushIndexes(indexes, () => this.setByPropertyName(target, { propName:PropertyName.create(prop), value }, receiver));
      }
    } else if (prop === Symbols.isSupportDotNotation) {
      return true;
    } else if (match = RE_CONTEXT_INDEX.exec(prop)) {
      // $数字のプロパティ
      // indexesへのアクセス
      return lastIndexes?.[Number(match[1]) - 1] ?? undefined;
    //} else if (prop.at(0) === "@" && prop.at(1) === "@") {
    } else if (prop.at(0) === "@") {
      const name = prop.slice(1);
      const propName = PropertyName.create(name);
      if (((lastIndexes?.length ?? 0) + 1) < propName.level) throw new Error(`array level not match`);
      const baseIndexes = lastIndexes?.slice(0, propName.level - 1) ?? [];
      return this.getExpandLastLevel(target, { propName, indexes:baseIndexes }, receiver);
    }
    if (this.#matchByName.has(prop)) {
      return getFunc(this.#matchByName.get(prop));
    }
    const propAccess = PropertyName.parse(prop);
    if (propAccess.propName.level === propAccess.indexes.length) {
      this.#matchByName.set(prop, propAccess);
    }
    propAccess.indexes.push(...lastIndexes?.slice(propAccess.indexes.length) ?? []);
    return getFunc(propAccess);
  }

  /**
   * 
   * @param {object} target 
   * @param {string} prop 
   * @param {any} value 
   * @param {Proxy} receiver 
   */
  set(target, prop, value, receiver) {
    const setFunc = this.setFunc(target, receiver);
    const lastIndexes = this.lastIndexes;
    if (prop.at(0) === "@") {
      const name = prop.slice(1);
      const propName = PropertyName.create(name);
      if (((this.lastIndexes?.length ?? 0) + 1) < propName.level) throw new Error(`array level not match`);
      const baseIndexes = this.lastIndexes?.slice(0, propName.level - 1) ?? [];
      return this.setExpandLastLevel(target, { propName, indexes:baseIndexes, values:value }, receiver);
    }
    if (this.#matchByName.has(prop)) {
      return setFunc(this.#matchByName.get(prop), value);
    }
    const propAccess = PropertyName.parse(prop);
    if (propAccess.propName.level === propAccess.indexes.length) {
      this.#matchByName.set(prop, propAccess);
    }
    this.#matchByName.set(prop, propAccess);
    propAccess.indexes.push(...lastIndexes?.slice(propAccess.indexes.length) ?? []);
    return setFunc(propAccess, value);
  }
}