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
  /** @type {string} */
  #name;
  get name() {
    return this.#name;
  }

  /** @type {string[]} */
  #pathNames;
  /** @type {string[]} 名前（name）をドットで区切った配列 */
  get pathNames() {
    return this.#pathNames;
  }

  /** @type {string[] */
  #parentPathNames;
  /** @type {string[]} 名前（name）をドットで区切った配列、最後の要素を含まない */
  get parentPathNames() {
    return this.#parentPathNames;
  }

  /** @type {string} */
  #parentPath;
  /** @type {string} 親の名前、親名前配列（parentPathNames）をjoinしたもの */
  get parentPath() {
    return this.#parentPath;
  }

  /** @type {string[]} */
  #parentPaths;
  /** @type {string[]} 親の名前候補すべて */
  get parentPaths() {
    return this.#parentPaths;
  }

  /** @type {Set<string>} */
  #setOfParentPaths;
  /** @type {Set<string>} 親の名前候補のセット */
  get setOfParentPaths() {
    return this.#setOfParentPaths;
  }

  /** @type {string} */
  #lastPathName;
  /** @type {string} 名前（name）をドットで区切った配列の最後の要素 */
  get lastPathName() {
    return this.#lastPathName;
  }

  /** @type {RegExp} */
  #regexp;
  /** @type {RegExp} ドット記法の書式が一致するかテストするための正規表現 */
  get regexp() {
    return this.#regexp;
  }

  /** @type {number} */
  #level;
  /** @type {number} ループレベル、名前（name）に含むワイルドカード（*）の数 */
  get level() {
    return this.#level;
  }

  /** @type {boolean} */
  #isPrimitive;
  /** @type {boolean} プリミティブかどうか、名前（name）にドット（.）を含まない */
  get isPrimitive() {
    return this.#isPrimitive;
  }

  /** @type {string} */
  #nearestWildcardName;
  /** @type {string}  最後のワイルドカードまでの部分 */
  get nearestWildcardName() {
    return this.#nearestWildcardName;
  }

  /** @type {string} */
  #nearestWildcardParentName;
  /** @type {string}  最後のワイルドカードまでの部分の親 */
  get nearestWildcardParentName() {
    return this.#nearestWildcardParentName;
  }

  /**
   * 
   * @param {string} name プロパティ名
   */
  constructor(name) {
    this.#name = name;
    this.#pathNames = name.split(DELIMITER);
    this.#parentPathNames = this.#pathNames.slice(0, -1);
    this.#parentPaths = this.#parentPathNames.reduce((paths, pathName) => { 
      paths.push(paths.at(-1)?.concat(pathName) ?? [pathName]);
      return paths;
    }, []).map(paths => paths.join("."));
    this.#setOfParentPaths = new Set(this.#parentPaths);
    this.#parentPath = this.#parentPathNames.join(DELIMITER);
    this.#lastPathName = this.#pathNames.at(-1);
    this.#regexp = new RegExp("^" + name.replaceAll(".", "\\.").replaceAll("*", "([0-9a-zA-Z_]*)") + "$");
    this.#level = this.#pathNames.reduce((level, pathName) => level += (pathName === WILDCARD ? 1 : 0), 0);
    this.#isPrimitive = (this.#pathNames.length === 1);
    this.#nearestWildcardName = undefined;
    this.#nearestWildcardParentName = undefined;
    if (this.#level > 0) {
      for(let i = this.#pathNames.length - 1; i >= 0; i--) {
        if (this.#pathNames[i] === WILDCARD) {
          this.#nearestWildcardName = this.#pathNames.slice(0, i + 1).join(".");
          this.#nearestWildcardParentName = this.#pathNames.slice(0, i).join(".");
          break;
        }
      }
    }
  }

  /**
   * 
   * @param {string} name 
   * @returns {PropertyName}
   */
  static create(name) {
    const propertyName = this.#propertyNameByName[name];
    if (typeof propertyName !== "undefined") return propertyName;
    return this.#propertyNameByName[name] = new PropertyName(name);
  }
  /**
   * @type {Object<string,PropertyName>}
   */
  static #propertyNameByName = {};
  static get propertyNameByName() {
    return this.#propertyNameByName;
  }

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

/** @type {(handler:class,target:object,receiver:Proxy<object>)=>(prop:string,indexes:number[])=>any} */
const directlyGetFunc = (handler, target, receiver) => (prop, indexes) => 
  Reflect.apply(handler.directlyGet, handler, [target, { prop, indexes }, receiver]);
/** @type {(handler:class,target:object,receiver:Proxy<object>)=>(prop:string,indexes:number[],value:any)=>boolean} */
const directlySetFunc = (handler, target, receiver) => (prop, indexes, value) =>
  Reflect.apply(handler.directlySet, handler, [target, { prop, indexes, value }, receiver]);
/** @type {(handler:class,target:object,receiver:Proxy<object>)=>boolean} */
const isSupportDotNotation = (handler, target, receiver) => true;

/** @type {Object<key:symbol,(handler:class,target:object,receiver:Proxy<object>)=>any>} */
const funcBySymbol = {
  [Symbols.directlyGet]: directlyGetFunc,
  [Symbols.directlySet]: directlySetFunc,
  [Symbols.isSupportDotNotation]: isSupportDotNotation,
};

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

  /** @type {string} */
  #lastIndexesString;
  get lastIndexesString() {
    if (typeof this.#lastIndexesString === "undefined") {
      this.#lastIndexesString = this.lastIndexes?.join(",");
    }
    return this.#lastIndexesString;
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
    const value = Reflect.get(target, propName.name, receiver);
    if (typeof value !== "undefined") return value;
    if (propName.parentPath === "") return undefined;
    const parent = this.getByPropertyName(target, { propName:PropertyName.create(propName.parentPath) }, receiver);
    if (typeof parent === "undefined") return undefined;
    const lastName = (propName.lastPathName === WILDCARD) ? this.lastIndexes[propName.level - 1] : propName.lastPathName;
    return parent[lastName];
  }

  /**
   * 
   * @param {any} target 
   * @param {{propName:PropertyName,value:any}}  
   * @param {Proxy} receiver
   * @returns {boolean}
   */
  setByPropertyName(target, { propName, value }, receiver) {
    if (Reflect.has(target, propName.name) || propName.isPrimitive) {
      return Reflect.set(target, propName.name, value, receiver);
    } else {
      const parent = this.getByPropertyName(target, { propName:PropertyName.create(propName.parentPath) }, receiver);
      if (typeof parent === "undefined") return false;
      const lastName = (propName.lastPathName === WILDCARD) ? this.lastIndexes[propName.level - 1] : propName.lastPathName;
      parent[lastName] = value;
      return true;
    }
  }

  /**
   * 
   * @param {number[]} indexes 
   * @param {()=>{}} callback 
   * @returns 
   */
  #pushIndexes(indexes, callback) {
    this.#lastIndexesString = undefined;
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
  #getFunc = (target, receiver) => ({propName, indexes}) => 
    this.#pushIndexes(indexes, () => this.getByPropertyName(target, { propName }, receiver));

  /**
   * 
   * @param {any} target 
   * @param {Proxy} receiver 
   * @returns {({}:PropertyAccess, value:any) => {boolean}  }
   */
  #setFunc = (target, receiver) => ({propName, indexes}, value) => 
    this.#pushIndexes(indexes, () => this.setByPropertyName(target, { propName, value }, receiver));

  /**
   * 
   * @param {any} target
   * @param {{propName:PropertyName,indexes:number[]}} 
   * @param {Proxy} receiver
   * @returns {any[]}
   */
  #getExpandLastLevel(target, { propName, indexes }, receiver) {
    const getFunc = this.#getFunc(target, receiver);
    if (typeof propName.nearestWildcardName === "undefined") throw new Error(`not found wildcard path of '${propName.name}'`);
    const listProp = PropertyName.create(propName.nearestWildcardParentName);
    return getFunc({propName:listProp, indexes}).map((value, index) => getFunc({propName, indexes:indexes.concat(index)}));
  }

  /**
   * 
   * @param {any} target
   * @param {{propName:PropertyName,indexes:number[],values:any[]}}  
   * @param {Proxy} receiver
   * @returns {boolean}
   */
  #setExpandLastLevel(target, { propName, indexes, values }, receiver) {
    const getFunc = this.#getFunc(target, receiver);
    const setFunc = this.#setFunc(target, receiver);
    if (typeof propName.nearestWildcardName === "undefined") throw new Error(`not found wildcard path of '${propName.name}'`);
    const listProp = PropertyName.create(propName.nearestWildcardParentName);
    const listValues = getFunc({propName:listProp, indexes});
    const newValues = Array.isArray(values) ? values : [...Array(listValues.length)].map(v => values);
    if (propName.nearestWildcardName === propName.name) {
      // propName末尾が*の場合
      setFunc({propName:listProp, indexes}, newValues);
    } else {
      if (newValues.length !== listValues.length) throw new Error(`not match array count '${propName.name}'`);
      for(let i in listValues) {
        setFunc({propName, indexes:indexes.concat(Number(i))}, newValues[i]);
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
  directlyGet(target, {prop, indexes}, receiver) {
    const propName = PropertyName.create(prop);
    return this.#pushIndexes(indexes, () => this.getByPropertyName(target, { propName }, receiver));
  }

  /**
   * 
   * @param {any} target 
   * @param {{prop:string,indexes:number[],value:any}} 
   * @param {Proxy<>} receiver 
   * @returns {boolean}
   */
  directlySet(target, {prop, indexes, value}, receiver) {
    const propName = PropertyName.create(prop);
    return this.#pushIndexes(indexes, () => this.setByPropertyName(target, { propName, value }, receiver));
  }

  /**
   * 
   * @param {any} target 
   * @param {string} prop 
   * @param {Proxy} receiver 
   * @returns {any}
   */
  get(target, prop, receiver) {
    const isPropString = typeof prop === "string";
    if (isPropString && (prop.startsWith("@@__") || prop === "constructor")) {
      return Reflect.get(target, prop, receiver);
    }
    const func = funcBySymbol[prop];
    if (typeof func !== "undefined") {
      return func(this, target, receiver);
    }
    const getFunc = this.#getFunc(target, receiver);
    const lastIndexes = this.lastIndexes;
    let match;
    if (isPropString) {
      if (prop[0] === "$"  && (match = RE_CONTEXT_INDEX.exec(prop))) {
        // $数字のプロパティ
        // indexesへのアクセス
        return lastIndexes?.[Number(match[1]) - 1] ?? undefined;
      //} else if (prop.at(0) === "@" && prop.at(1) === "@") {
      } else if (prop[0] === "@") {
        const name = prop.slice(1);
        const propName = PropertyName.create(name);
        if (((lastIndexes?.length ?? 0) + 1) < propName.level) throw new Error(`array level not match`);
        const baseIndexes = lastIndexes?.slice(0, propName.level - 1) ?? [];
        return this.#getExpandLastLevel(target, { propName, indexes:baseIndexes }, receiver);
      }
      const propAccess = this.#matchByName.get(prop);
      if (typeof propAccess !== "undefined") {
        return getFunc(this.#matchByName.get(prop));
      } else {
        const propAccess = PropertyName.parse(prop);
        if (propAccess.propName.level === propAccess.indexes.length) {
          this.#matchByName.set(prop, propAccess);
          return getFunc(propAccess);
        } else {
          return getFunc({
            propName:propAccess.propName,
            indexes:propAccess.indexes.concat(lastIndexes?.slice(propAccess.indexes.length) ?? [])
          });
        }
      }

    } else {
      return Reflect.get(target, prop, receiver);
    }
  }

  /**
   * 
   * @param {object} target 
   * @param {string} prop 
   * @param {any} value 
   * @param {Proxy} receiver 
   */
  set(target, prop, value, receiver) {
    const isPropString = typeof prop === "string";
    if (isPropString) {
      if (prop.startsWith("@@__") || prop === "constructor") {
        return Reflect.set(target, prop, value, receiver);
      }
      const setFunc = this.#setFunc(target, receiver);
      const lastIndexes = this.lastIndexes;
      if (prop.at(0) === "@") {
        const name = prop.slice(1);
        const propName = PropertyName.create(name);
        if (((this.lastIndexes?.length ?? 0) + 1) < propName.level) throw new Error(`array level not match`);
        const baseIndexes = this.lastIndexes?.slice(0, propName.level - 1) ?? [];
        return this.#setExpandLastLevel(target, { propName, indexes:baseIndexes, values:value }, receiver);
      }
      if (this.#matchByName.has(prop)) {
        return setFunc(this.#matchByName.get(prop), value);
      }
      const propAccess = PropertyName.parse(prop);
      if (propAccess.propName.level === propAccess.indexes.length) {
        this.#matchByName.set(prop, propAccess);
        return setFunc(propAccess, value);
        } else {
        return setFunc({
          propName:propAccess.propName,
          indexes:propAccess.indexes.concat(lastIndexes?.slice(propAccess.indexes.length) ?? [])
        }, value);
      }
    } else {
      return Reflect.set(target, prop, value, receiver);
    }
 }
}

export { Handler, PropertyName, RE_CONTEXT_INDEX, Symbols };
