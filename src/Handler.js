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
   * @type {Set<string>}
   */
  #setOfDefinedProperties;
  /**
   * @type {PropertyName[]}
   */
  #definedPropertyNames;
  /**
   * @type {Map<string,PropertyAccess>}
   */
  #matchByName;

  /**
   * 
   * @param {string[]} definedProperties
   */
  constructor(definedProperties) {
    if (definedProperties == null) throw new Error(`definedProperties is null`);
    this.#setOfDefinedProperties = new Set(definedProperties);
    this.#definedPropertyNames = definedProperties.map(name => PropertyName.create(name));
    this.#matchByName = new Map;
  }

  get lastIndexes() {
    return this.#stackIndexes[this.#stackIndexes.length - 1];
  }

  get stackIndexes() {
    return this.#stackIndexes;
  }

  /**
   * @type {Set<string>}
   */
  get setOfDefinedProperties() {
    return this.#setOfDefinedProperties;
  }

  /**
   * @type {PropertyName[]}
   */
  get definedPropertyNames() {
    return this.#definedPropertyNames;
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
    if (Reflect.has(target, propName.name)) {
      return Reflect.get(target, propName.name, receiver);
    } else {
      if (propName.parentPath === "") return undefined;
      const parentPropName = PropertyName.create(propName.parentPath);
      const parent = this.getByPropertyName(target, { propName:parentPropName }, receiver);
      const lastName = (propName.lastPathName === WILDCARD) ? this.lastIndexes[propName.level - 1] : propName.lastPathName;
      return Reflect.get(parent, lastName);
    }
  }

  /**
   * 
   * @param {any} target 
   * @param {{propName:PropertyName,value:any}}  
   * @param {Proxy} receiver
   * @returns {boolean}
   */
  setByPropertyName(target, { propName, value }, receiver) {
    if (Reflect.has(target, propName.name)) {
      Reflect.set(target, propName.name, value, receiver);
    } else {
      const parentPropName = PropertyName.create(propName.parentPath);
      const parent = this.getByPropertyName(target, { propName:parentPropName }, receiver);
      const lastName = (propName.lastPathName === WILDCARD) ? this.lastIndexes[propName.level - 1] : propName.lastPathName;
      Reflect.set(parent, lastName, value);
    }
    return true;
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
    let match;
    if (prop === Symbols.directlyGet) {
      // プロパティとindexesを直接指定してgetする
      return (prop, indexes) => {
        if (this.#setOfDefinedProperties.has(prop)) {
          return this.pushIndexes(indexes, () => this.getByPropertyName(target, { propName:PropertyName.create(prop) }, receiver));
        }
        throw new Error(`undefined property ${prop}`);
      }
    } else if (prop === Symbols.directlySet) {
      // プロパティとindexesを直接指定してsetする
      return (prop, indexes, value) => {
        if (this.#setOfDefinedProperties.has(prop)) {
          return this.pushIndexes(indexes, () => this.setByPropertyName(target, { propName:PropertyName.create(prop), value }, receiver));
        }
        throw new Error(`undefined property ${prop}`);
      }
    } else if (prop === Symbols.isSupportDotNotation) {
      return true;
    } else if (match = RE_CONTEXT_INDEX.exec(prop)) {
      // $数字のプロパティ
      // indexesへのアクセス
      return this.lastIndexes?.[Number(match[1]) - 1] ?? undefined;
    //} else if (prop.at(0) === "@" && prop.at(1) === "@") {
    } else if (prop.at(0) === "@") {
      const name = prop.slice(1);
      if (!this.#setOfDefinedProperties.has(name)) throw new Error(`undefined property ${name}`);
      const propName = PropertyName.create(name);
      if (((this.lastIndexes?.length ?? 0) + 1) < propName.level) throw new Error(`array level not match`);
      const baseIndexes = this.lastIndexes?.slice(0, propName.level - 1) ?? [];
      return this.getExpandLastLevel(target, { propName, indexes:baseIndexes }, receiver);
    }
    if (this.#setOfDefinedProperties.has(prop)) {
      // 定義済みプロパティに一致
      return this.getByPropertyName(target, { propName:PropertyName.create(prop) }, receiver);
    }
    if (this.#matchByName.has(prop)) {
      return getFunc(this.#matchByName.get(prop));
    }
    for(const propName of this.#definedPropertyNames) {
      // 定義済みプロパティの正規表現に一致する場合、indexesを設定して値を取得
      const match = propName.regexp.exec(prop);
      if (!match) continue;
      const indexes = match.slice(1);
      this.#matchByName.set(prop, {propName, indexes});
      return getFunc({propName, indexes});
    }
    throw new Error(`undefined property ${prop}`);
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
    if (prop.at(0) === "@") {
      const name = prop.slice(1);
      if (!this.#setOfDefinedProperties.has(name)) throw new Error(`undefined property ${name}`);
      const propName = PropertyName.create(name);
      if (((this.lastIndexes?.length ?? 0) + 1) < propName.level) throw new Error(`array level not match`);
      const baseIndexes = this.lastIndexes?.slice(0, propName.level - 1) ?? [];
      return this.setExpandLastLevel(target, { propName, indexes:baseIndexes, values:value }, receiver);
    }
    if (this.#setOfDefinedProperties.has(prop)) {
      // 定義済みプロパティに一致
      return this.setByPropertyName(target, { propName:PropertyName.create(prop), value }, receiver);
    }
    if (this.#matchByName.has(prop)) {
      return setFunc(this.#matchByName.get(prop), value);
    }
    for(const propName of this.#definedPropertyNames) {
      // 定義済みプロパティの正規表現に一致する場合、indexesを設定して値を設定
      const match = propName.regexp.exec(prop);
      if (!match) continue;
      const indexes = match.slice(1);
      this.#matchByName.set(prop, {propName, indexes});
      return setFunc({propName, indexes}, value);
    }
    throw new Error(`undefined property ${prop}`);
  }
}