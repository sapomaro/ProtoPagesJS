/*
# ProtoPagesJS v0.0.1a

## Dynamic template builder for the web powered by JavaScript

https://github.com/sapomaro/ProtoPagesJS
*/


const ProtoPages = {};


///////////////////////
/* Pattern Resolving */
///////////////////////

let templateContext;

const templatePattern = /%\{\s?([^]*?)\s?\}%/g;
const templateSubpatterns = {
	jsonFunc: /^([^\( ]+)\(\s?([\{\[][^]*?[\}\]])(\.\.\.)?\s?\)$/
};

const partial = {};
partial.pattern = /^<%>([^]*?)<\/%>$/g;
partial.stripPattern = /<\/?%>/g;
partial.tags = { start: '<%>', end: '</%>' }
partial.strip = (str) => {
	return str.replace(partial.stripPattern, '');
};

const resolvePattern = (pattern) => {
	pattern = pattern.trim();
	let matches,
		context = templateContext,
		result;
	
	templateSubpatterns.jsonFunc.lastIndex = 0;
	if (matches = templateSubpatterns.jsonFunc.exec(pattern)) {
		const func = matches[1];
		let json = matches[2]
			.replace(/([\{,\"])\s*(\\[\\tn]+)\s*([\},\"])/g, "$1 $3") // cleans up the mess from Parcel
			.replace(/&quot;/ig, '"');

		try {
			json = JSON.parse(json);
		}
		catch (error) {
			console.log(json);
			console.log(error);
			json = {};
		}
		if (typeof context[func] === 'function') {
			if (matches[3] && matches[3] === '...' && json instanceof Array) {
				result = '';
				for (const item of json) {
					result += context[func](item);
				}
			}
			else {
				result = context[func](json);
			}
			result = partial.tags.start + result + partial.tags.end;
		}
	}
	else {
		let props = pattern.trim().split('.');
		for (let i = 0; i < props.length; ++i) {
			if (typeof context[props[i]] !== 'undefined') {
				context = context[props[i]];
			}
		}
		result = context;
		if (typeof result === 'function') {
			result = partial.tags.start + result() + partial.tags.end;
		}
	}
		
	
	if (typeof result === 'string' || typeof result === 'number') {
		return result;
	}
	else {
		return null;
	}
};

const resolveString = (str) => {
	templatePattern.lastIndex = 0;
	if (!templatePattern.test(str)) { 
		return null; 
	}
	let matches, 
		asset, 
		old = str;
		
	templatePattern.lastIndex = 0;
	while (matches = templatePattern.exec(str)) {
		asset = resolvePattern(matches[1]);
		if (asset !== null) {
			str = str.replace(matches[0], asset);
			// subtract pattern length to start next exec from new insertion
			// allows resolving nested patterns
			templatePattern.lastIndex -= matches[0].length; 
			
		}
	}
	if (str !== old) { 
		return str; 
	}
	return null;
};


////////////////////
/* DOM Traversing */
////////////////////

const traverseChildren = (node) => {
	if (!node.childNodes) { return; }
	for (let i = node.childNodes.length - 1; i >= 0; --i) {
		if (node.childNodes[i].nodeType === 1) {
			traverseAttributes(node.childNodes[i]);
			traverseChildren(node.childNodes[i]);
		}
		else if (node.childNodes[i].nodeType === 3) {

			const str = resolveString(node.childNodes[i].textContent);

			if (str !== null) {
				let matches;
				partial.pattern.lastIndex = 0;
				if ((matches = partial.pattern.exec(str.trim())) && node.childNodes.length === 1) {
					
					node.innerHTML = partial.strip(matches[1]);						
				}
				else {
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


ProtoPages.compileAll = (context = window) => {
	templateContext = context;
	traverseChildren(document.head);
	traverseChildren(document.body);
	
	if (document.readyState === 'complete') {
		runTasks(compileTasks);
	}
};

///////////////////
/* Load Handling */
///////////////////

const loadTasks = [];
const compileTasks = [];

const runTasks = (tasks) => {
	for (const { task, context } of tasks) {
		task(context);
	}
};
ProtoPages.onload = (task, context = window) => {
	if (document.readyState === 'interactive' || document.readyState === 'complete') {
		task(context);
	}
	loadTasks.push({ task, context });
};
ProtoPages.oncompiled = (task, context = window) => {
	compileTasks.push({ task, context });
};

ProtoPages.init = (context = window) => {
	if (document.readyState === 'interactive' || document.readyState === 'complete') {
		runTasks(loadTasks);
	}
	else {
		window.addEventListener('DOMContentLoaded', () => {
			runTasks(loadTasks);
		});
		window.addEventListener('load', () => {
			runTasks(loadTasks);
		});
	}
};


ProtoPages.compile = (context = window) => {
	ProtoPages.onload(() => {
		setTimeout(() => { // timer to make compileAll() run in the end
			ProtoPages.compileAll(context);
		}, 1);
	});
};


ProtoPages.init();


export default ProtoPages;



