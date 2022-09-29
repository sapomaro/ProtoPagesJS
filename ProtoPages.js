/*
# ProtoPagesJS v0.0.2a

## Dynamic template builder for the web powered by JavaScript

https://github.com/sapomaro/ProtoPagesJS

*/

const ProtoPages = {};
const PP = ProtoPages;

PP.context = {};

const PP_PATTERN = /%\{\s?([^]*?)\s?\}%/g;
const PP_SUBPATTERN_JSONFUNC = /^([^( ]+)\(\s?([{[][^]*?[}\]])(\.\.\.)?\s?\)$/;

const PP_PARTIAL_PATTERN = /^<%>([^]*?)<\/%>$/g;
const PP_PARTIAL_TAG_OPEN = '<%>';
const PP_PARTIAL_TAG_CLOSE = '</%>';

const stripPartialTags = (str) => {
  return str.replace(/<\/?%>/g, '');
};

PP.JSON = {};
PP.JSON.parse = (data) => {
  try {
    return JSON.parse(data);
  } catch (error) {
    console.log(data);
    console.error(error);
    return {};
  }
};
PP.JSON.stringify = (data) => {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.log(data);
    console.error(error);
    return '{}';
  }
};

const resolvePattern = (pattern) => {
  let context = PP.context;
  let matches;
  let result;

  PP_SUBPATTERN_JSONFUNC.lastIndex = 0;
  if (matches = PP_SUBPATTERN_JSONFUNC.exec(pattern)) {
    const func = matches[1];
    // cleans up the mess from Parcel:
    const jsonStr = matches[2]
        .replace(/([{,"])\s*(\\[\\tn]+)\s*([},"])/g, '$1 $3')
        .replace(/&quot;/ig, '"');
    const unwrapRule = matches[3];

    const jsonObj = PP.JSON.parse(jsonStr);

    if (typeof context[func] === 'function') {
      if (unwrapRule && unwrapRule === '...' && jsonObj instanceof Array) {
        result = '';
        for (const item of jsonObj) {
          result += context[func](item);
        }
      } else {
        result = context[func](jsonObj);
      }
      result = PP_PARTIAL_TAG_OPEN + result + PP_PARTIAL_TAG_CLOSE;
    }
  } else {
    const props = pattern.split('.');
    for (let i = 0; i < props.length; ++i) {
      if (typeof context[props[i]] !== 'undefined') {
        context = context[props[i]];
      }
    }
    result = context;
    if (typeof result === 'function') {
      result = PP_PARTIAL_TAG_OPEN + result() + PP_PARTIAL_TAG_CLOSE;
    }
  }
  if (typeof result === 'string' || typeof result === 'number') {
    return result;
  }
  return null;
};

const resolveString = (str) => {
  PP_PATTERN.lastIndex = 0;
  if (!PP_PATTERN.test(str)) {
    return null;
  }
  let matches;
  let asset;
  const old = str;

  PP_PATTERN.lastIndex = 0;
  while (matches = PP_PATTERN.exec(str)) {
    asset = resolvePattern(matches[1].trim());
    if (asset !== null) {
      str = str.replace(matches[0], asset);
      // subtract pattern length to start next exec from new insertion
      // allows resolving nested patterns
      PP_PATTERN.lastIndex -= matches[0].length;
    }
  }
  if (str !== old) {
    return str;
  }
  return null;
};

const traverseChildren = (node) => {
  if (!node.childNodes) {
    return;
  }
  for (let i = node.childNodes.length - 1; i >= 0; --i) {
    if (node.childNodes[i].nodeType === 1) {
      traverseAttributes(node.childNodes[i]);
      traverseChildren(node.childNodes[i]);
    } else if (node.childNodes[i].nodeType === 3) {
      const str = resolveString(node.childNodes[i].textContent);
      if (str !== null) {
        let matches;
        PP_PARTIAL_PATTERN.lastIndex = 0;
        if ((matches = PP_PARTIAL_PATTERN.exec(str.trim())) &&
            node.childNodes.length === 1) {
          node.innerHTML = stripPartialTags(matches[1]);
        } else {
          node.childNodes[i].textContent = str;
        }
      }
    }
  }
};

const traverseAttributes = (node) => {
  for (let i = node.attributes.length - 1; i >= 0; --i) {
    const attr = resolveString(node.attributes[i].nodeValue);
    if (attr !== null) {
      node.setAttribute(node.attributes[i].nodeName, attr);
    }
  }
};

PP.compileAll = (context = window) => {
  PP.context = context;
  traverseChildren(document.head);
  traverseChildren(document.body);
  runTasks(tasks.compile);
};

let DOMLoaded = false;

const tasks = {
  init: [],
  load: [],
  compile: [],
};

const runTasks = (...args) => {
  for (const actions of args) {
    for (const task of actions) {
      task();
    }
  }
};

const isDOMReady = () => {
  if (document.readyState === 'interactive' &&
      typeof document.body !== 'undefined' &&
      typeof document.head !== 'undefined') {
    return true;
  } else if (document.readyState === 'complete') {
    return true;
  } else {
    return false;
  }
};

PP.on = (event, task) => {
  if (event === 'init' || event === 'load') {
    if (isDOMReady()) {
      task();
      DOMLoaded = true;
    }
  }
  tasks[event].push(task);
};

PP.init = () => {
  if (isDOMReady()) {
    runTasks(tasks.init, tasks.load);
    DOMLoaded = true;
  } else {
    window.addEventListener('DOMContentLoaded', () => {
      if (isDOMReady()) {
        runTasks(tasks.init, tasks.load);
        DOMLoaded = true;
      }
    });
    window.addEventListener('load', () => {
      if (!DOMLoaded) {
        runTasks(tasks.init, tasks.load);
        DOMLoaded = true;
      }
    });
  }
};

PP.compile = (context = window) => {
  PP.on('load', () => {
    PP.compileAll(context);
  });
};

PP.init();

export {ProtoPages};
