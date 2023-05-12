const WILDCARD = "*";
const DELIMITER = ".";
const SYM_PREFIX = "dot-notation"; // + Math.trunc(Math.random() * 9999_9999);
const SYM_DIRECT_GET = Symbol.for(SYM_PREFIX + ".direct_get");
const SYM_DIRECT_SET = Symbol.for(SYM_PREFIX + ".direct_set");
const SYM_IS_SUPPORT_DOT_NOTATION = Symbol.for(SYM_PREFIX + ".is_support_dot_notation");

/**
 * @enum {Symbol}
 */
const Symbols = {
  directlyGet: SYM_DIRECT_GET,
  directlySet: SYM_DIRECT_SET,
  isSupportDotNotation: SYM_IS_SUPPORT_DOT_NOTATION,
};

const RE_CONTEXT_INDEX = new RegExp(/^\$([0-9]+)$/);

class PropertyName {
  /**
   * @type {string}
   */
  name;
  /**
   * @type {string[]}
   */
  pathNames = [];
  /**
   * @type {string[]}
   */
  parentPathNames = [];
  /**
   * @type {string}
   */
  parentPath;
  /**
   * @type {string[]}
   */
  parentPaths = [];
  /**
   * @type {Set<string>}
   */
  setOfParentPaths;
  /**
   * @type {RegExp}
   */
  regexp;
  /**
   * @type {number}
   */
  level = 0;
  /**
   * @type {boolean}
   */
  isPrimitive;

  /**
   * 
   * @param {string} name 
   */
  constructor(name) {
    this.name = name;
    this.pathNames = name.split(DELIMITER);
    this.parentPathNames = this.pathNames.slice(0, -1);
    this.parentPaths = this.parentPathNames.reduce((paths, pathName) => { 
      paths.push(paths.at(-1)?.concat(pathName) ?? [pathName]);
      return paths;
    }, []).map(paths => paths.join("."));
    this.setOfParentPaths = new Set(this.parentPaths);
    this.parentPath = this.parentPathNames.join(DELIMITER);
    this.lastPathName = this.pathNames.at(-1);
    this.regexp = new RegExp("^" + name.replaceAll(".", "\\.").replaceAll("*", "([0-9a-zA-Z_]*)") + "$");
    this.level = this.pathNames.filter(pathName => pathName === WILDCARD).length;
    this.isPrimitive = (this.pathNames.length === 1);
  }

  findNearestWildcard() {
    return PropertyName.findNearestWildcard(this);
  }

  /**
   * 
   * @param {PropertyName} propName 
   * @returns {PropertyName}
   */
  static findNearestWildcard(propName) {
    let curProp = propName;
    while(true) {
      if (curProp.lastPathName === WILDCARD) return curProp;
      if (curProp.parentPath === "") return undefined;
      curProp = PropertyName.create(curProp.parentPath);
    }
  }

  /**
   * 
   * @param {string} name 
   * @returns {PropertyName}
   */
  static create(name) {
    const propertyName = this.propertyNameByName.get(name);
    if (propertyName) return propertyName;
    const newPropertyName = new PropertyName(name);
    this.propertyNameByName.set(name, newPropertyName);
    return newPropertyName;
  }
  /**
   * @type {Map<string,PropertyName>}
   */
  static propertyNameByName = new Map;

  /**
   * 
   * @param {*} prop 
   * @returns {PropertyAccess}
   */
  static parse(prop) {
    const indexes = [];
    const patternPropElements = [];
    for(const propElement of prop.split(".")) {
      const index = Number(propElement);
      if (isNaN(index)) {
        patternPropElements.push(propElement);
      } else {
        indexes.push(index);
        patternPropElements.push("*");
      }
    }
    return { 
      propName: PropertyName.create(patternPropElements.join(".")),
      indexes
    };
  }
}

/**
 * @typedef {{propName:PropertyName,indexes:number[]}} PropertyAccess
 */

class Handler {
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
        if (typeof parent !== "undefined") {
          const lastName = (propName.lastPathName === WILDCARD) ? this.lastIndexes[propName.level - 1] : propName.lastPathName;
          value = Reflect.get(parent, lastName);
        }
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
    if (Reflect.has(target, propName.name) || propName.isPrimitive) {
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
   * @param {{prop:string,indexes:number[]}} 
   * @param {Proxy<>} receiver 
   * @returns {any}
   */
  [Symbols.directlyGet](target, {prop, indexes}, receiver) {
    const propName = PropertyName.create(prop);
    return this.pushIndexes(indexes, () => this.getByPropertyName(target, { propName }, receiver));
  }

  /**
   * 
   * @param {any} target 
   * @param {{prop:string,indexes:number[],value:any}} 
   * @param {Proxy<>} receiver 
   * @returns {boolean}
   */
  [Symbols.directlySet](target, {prop, indexes, value}, receiver) {
    const propName = PropertyName.create(prop);
    return this.pushIndexes(indexes, () => this.setByPropertyName(target, { propName, value }, receiver));
  }

  /**
   * 
   * @param {any} target 
   * @param {string} prop 
   * @param {Proxy} receiver 
   * @returns {any}
   */
  get(target, prop, receiver) {
    if (typeof prop === "string" && (prop.startsWith("@@__") || prop === "constructor")) {
      return Reflect.get(target, prop, receiver);
    }
    const getFunc = this.getFunc(target, receiver);
    const lastIndexes = this.lastIndexes;
    let match;
    if (prop === Symbols.directlyGet) {
      // プロパティとindexesを直接指定してgetする
      return (prop, indexes) => 
        Reflect.apply(this[Symbols.directlyGet], this, [target, { prop, indexes }, receiver]);
    } else if (prop === Symbols.directlySet) {
      // プロパティとindexesを直接指定してsetする
      return (prop, indexes, value) => 
        Reflect.apply(this[Symbols.directlySet], this, [target, { prop, indexes, value }, receiver]);
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
    if (typeof prop === "string" && (prop.startsWith("@@__") || prop === "constructor")) {
      return Reflect.set(target, prop, value, receiver);
    }
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

export { Handler, PropertyName, RE_CONTEXT_INDEX, Symbols };
