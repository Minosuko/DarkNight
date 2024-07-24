/*! Z Template | (c) Daniel Sevcik | MIT License | https://github.com/webdevelopers-eu/z-template | build 2023-07-29T14:11:19+00:00 */
window.zTemplate = function() {
	var _Mathmax = Math.max;

	function tokenize(a) {
		const b = new Tokenizer(a);
		return b.tokenize(), b
	}

	function prepare(a, b) {
		return new Preparator(a, b).prepare()
	}

	function zTemplate(a, b, c = {}) {
		const d = new Map(Object.entries(c || {})),
			e = new Map([...zTemplate.callbacks.entries(), ...d.entries()]),
			f = new Template(a instanceof Document ? a.documentElement : a);
		return f.render(b, e)
	}
	class Tokenizer extends Array {
		#operatorChars = ["!", "=", "<", ">", "~", "|", "&"];
		#quoteChars = ["'", "\""];
		#blockChars = {
			"{": "}",
			"[": "]",
			"(": ")"
		};
		#hardSeparatorChars = [","];
		#softSeparatorChars = [" ", "\t", "\r", "\n"];
		#input;
		#pointer = 0;
		constructor(a) {
			super(), this.#input = (a || "") + ""
		}
		tokenize() {
			for (; !this.#endOfInput();) {
				const a = this.#tokenizeUntil();
				if (null === a) break;
				this.push(a)
			}
		}
		#endOfInput() {
			return this.#pointer >= this.#input.length
		}
		#next() {
			return this.#endOfInput() ? null : this.#input[this.#pointer++]
		}
		#prev() {
			return 0 >= this.#pointer ? null : this.#input[--this.#pointer]
		}
		#tokenizeUntil(a = ",") {
			const b = new Tokenizer(this.#input);
			let c = {
					type: "generic",
					value: ""
				},
				d = !1;
			for (let e = this.#next(); null !== e; e = this.#next())
				if (d || "text" == c.type && e != c.delimiter) c.value += e, d = !1;
				else if ("\\" === e) d = !0;
			else if ("text" == c.type && e == c.delimiter) this.#pushSmart(b, c), c = {
				type: "generic",
				value: ""
			};
			else if (e === a) break;
			else e in this.#blockChars ? (this.#pushSmart(b, c), b.push({
				type: "block",
				value: this.#tokenizeUntil(this.#blockChars[e]),
				start: e,
				end: this.#blockChars[e]
			}), c = {
				type: "generic",
				value: ""
			}) : this.#quoteChars.includes(e) ? (this.#pushSmart(b, c), c = {
				type: "text",
				value: "",
				delimiter: e
			}) : "generic" == c.type && this.#hardSeparatorChars.includes(e) ? (this.#pushSmart(b, c), this.#pushSmart(b, {
				type: "separator",
				value: e
			}), c = {
				type: "generic",
				value: ""
			}) : "generic" == c.type && this.#softSeparatorChars.includes(e) ? (this.#pushSmart(b, c), c = {
				type: "generic",
				value: ""
			}) : "operator" !== c.type && this.#operatorChars.includes(e) ? (this.#pushSmart(b, c), c = {
				type: "operator",
				value: e
			}) : "operator" !== c.type || this.#operatorChars.includes(e) ? c.value += e : (this.#pushSmart(b, c), c = {
				type: "generic",
				value: ""
			}, this.#prev());
			return this.#pushSmart(b, c), b
		}
		#pushSmart(a, b) {
			if ("generic" == b.type) {
				if (b.value = b.value.trim(), !b.value.length) return;
				isNaN(b.value) || (b.type = "text", b.value = new Number(b.value))
			}
			a.push(b)
		}
	}
	class Preparator {
		#vars;
		#tokens;
		#paramShortcuts = {
			"@*": "attr",
			":*": "event",
			"**": "call",
			".*": "class",
			"+": "html",
			".": "text",
			"=": "value",
			"?": "toggle",
			"!": "remove",
			"`": "debugger"
		};
		#operatorsCompare = ["==", "!=", ">", ">=", "<", "<="];
		#operatorsBoolean = ["!", "&&", "||"];
		#data = {
			negateValue: 0,
			variable: null,
			value: null,
			valueBool: null,
			action: "",
			param: null,
			arguments: [],
			condition: null
		};
		constructor(a, b) {
			if ("object" != typeof b) throw new Error(`The variables must be an object. Current argument: ${typeof b}.`);
			this.#vars = b, this.#tokens = a, this.#normalize()
		}
		#normalize() {
			const a = Array.from(this.#tokens);
			let b = this.#nextToken(a, ["operator", "generic", "block", "text"]);
			"operator" === b.type && ["!", "!!"].includes(b.value) && (this.#data.negateValue = b.value.length, b = this.#nextToken(a, ["generic", "block", "text"])), "generic" === b.type ? (this.#data.variable = b.value, this.#data.value = this.#getVariableValue(b.value)) : "block" === b.type ? this.#data.value = this.#prepareBlock(b.value) : this.#data.value = b.value, b = this.#nextToken(a, ["generic", "operator"]);
			const c = b.value.substr(0, 1) + (1 < b.value.length ? "*" : "");
			if ("undefined" != typeof this.#paramShortcuts[c]) this.#data.action = this.#paramShortcuts[c], a.unshift({
				type: "text",
				value: b.value.substr(1),
				info: "Extracted from shortcut"
			});
			else if (Object.values(this.#paramShortcuts).includes(b.value)) this.#data.action = b.value;
			else throw new Error(`Invalid action: ${b.value} . Supported actions: ${Object.keys(this.#paramShortcuts).join(", ")}`);
			b = this.#nextToken(a, ["text", "generic", null], ["block", "operator"]), this.#data.param = b?.value, b = this.#nextToken(a, ["block", "operator", null]), "block" === b?.type && "(" == b.start && (this.#data.arguments = this.#prepareArguments(b.value), b = this.#nextToken(a, ["block", "operator", null]));
			let d = 0;
			if ("operator" === b?.type && ["!", "!!"].includes(b.value) && (d = b.value.length, b = this.#nextToken(a, ["block", null])), "block" === b?.type && "{" == b.start ? (this.#data.condition = this.#prepareBlock(b.value), b = this.#nextToken(a, ["block", null])) : this.#data.condition = !0, this.#data.condition = this.#negate(this.#data.condition, d), "debugger" === this.#data.action && this.#data.valueBool) debugger
		}
		#getTokenValue(a) {
			return "generic" === a.type ? this.#getVariableValue(a.value) : "block" === a.type ? this.#prepareBlock(a.value) : a.value
		}
		#getVariableValue(a) {
			const b = a.split(".");
			switch (b[0]) {
				case "true":
				case "always":
					return !0;
				case "false":
				case "never":
					return !1;
				case "null":
				case "none":
					return null;
				case "undefined":
				case "z":
					return;
			}
			let c = this.#vars;
			for (let d = 0; d < b.length; d++) {
				if ("undefined" == typeof c[b[d]]) return console.warn("Can't find variable " + a + " in data source %o", this.#vars), null;
				c = c[b[d]]
			}
			return c
		}
		prepare() {
			const a = {
				...this.#data
			};
			if ("special" === a.condition.type) return a.action = a.condition.value, a.condition = !0, a;
			switch (a.value = null === a.value && "generic" == a.condition.type ? this.#toValue(a.condition, a.negateValue) : "object" == typeof a.value ? this.#toValue(a.value, a.negateValue) : this.#negate(a.value, a.negateValue), a.valueBool = this.#toBool(a.value), a.condition.type) {
				case "block":
					a.condition = !!this.#prepareBlock(a.condition.value);
					break;
				case "generic":
					a.condition = !!this.#prepareVariable(a.condition.value);
			}
			return a
		}
		#prepareArguments(a) {
			let b = [],
				c = [];
			for (let d = 0; d < a.length; d++) {
				const e = a[d];
				"separator" === e.type ? (b.push(c), c = []) : c.push(e)
			}
			return b.push(c), b = b.map(a => 1 == a.length ? this.#getTokenValue(a[0]) : this.#getTokenValue({
				type: "block",
				value: a
			})), b
		}
		#prepareVariable(a) {
			const b = this.#getVariableValue(a);
			return null === b ? null : this.#toBool(b)
		}
		#toBool(a) {
			switch (typeof a) {
				case "string":
					return 0 !== a.length;
				case "object":
					return null !== a && 0 !== Object.keys(a).length;
				case "number":
					return 0 !== a;
				case "boolean":
					return a;
				default:
					return !1;
			}
		}
		#prepareBlock(tokens) {
			const expression = this.#mkExpression(tokens);
			return eval(expression)
		}
		#mkExpression(a) {
			let b = "";
			for (;;) {
				const c = this.#nextToken(a, ["generic", "block", "text", "operator", null]);
				if (!c) break;
				if (1 < a.length && "operator" === a[0].type && this.#operatorsCompare.includes(a[0].value)) {
					const d = this.#nextToken(a, ["operator"]),
						e = this.#nextToken(a, ["generic", "text"]);
					b += this.#compare(c, d, e) ? 1 : 0;
					continue
				}
				switch (c.type) {
					case "operator":
						if (this.#operatorsBoolean.includes(c.value)) b += c.value;
						else throw new Error(`Invalid operator: ${c.value}. Supported operators: ${this.#operatorsBoolean.join(", ")}`);
						break;
					case "block":
						b += this.#mkExpression(c.value);
						break;
					case "generic":
						b += this.#prepareVariable(c.value) ? 1 : 0;
						break;
					case "text":
						b += this.#toBool(c.value) ? 1 : 0;
				}
			}
			return "(" + (b || "0") + ")"
		}
		#toValue(a, b = 0) {
			let c = a;
			if ("undefined" != typeof a?.type && "undefined" != typeof a?.value) switch (a.type) {
				case "generic":
					c = this.#getVariableValue(a.value);
					break;
				case "text":
					c = a.value;
					break;
				case "block":
					c = this.#prepareBlock(a.value);
					break;
				default:
					throw new Error(`Invalid token type: ${a.type} (value: ${JSON.stringify(a)}).`);
			}
			if (null === c) return c;
			c instanceof Array ? c = c.length : c instanceof Number ? c = c.valueOf() : "object" == typeof c && (c = Object.keys(c).length);
			const d = +c;
			let e = isNaN(d) ? c : d.valueOf();
			return e = this.#negate(e, b), e
		}
		#compare(a, b, c) {
			const d = this.#toValue(a),
				e = this.#toValue(c);
			switch (b.value) {
				case "==":
					return d === e ? 1 : 0;
				case "!=":
					return d === e ? 0 : 1;
				case "<":
					return d < e ? 1 : 0;
				case "<=":
					return d <= e ? 1 : 0;
				case ">":
					return d > e ? 1 : 0;
				case ">=":
					return d >= e ? 1 : 0;
				default:
					throw new Error(`Invalid operator: ${b.value} . Supported operators: ${this.#operatorsCompare.join(", ")}`);
			}
		}
		#nextToken(a, b = [], c = []) {
			const d = a.shift();
			if (c.includes(d?.type)) return a.unshift(d), null;
			if (!b.includes(d ? d.type : null)) throw new Error(`Invalid z-var value: (${d&&d.type}) ${JSON.stringify(d)}. Expected: ${JSON.stringify(b)}`);
			return d
		}
		#negate(a, b = 0) {
			for (let d = b; d; d--) a = !a;
			return a
		}
	}
	class Template {
		#rootElement = null;
		#vars = null;
		#callbacks = {};
		#scopeLevel = 0;
		#templateSelector = "*[starts-with(@template, '{') or starts-with(@template, '[')]";
		#childrenScopeSelector = "*[@z-removed or (@template-scope and @template-scope != 'inherit') or (@z-scope-children and @z-scope-children != 'inherit')]";
		#scopeSelector = `*[self::${this.#templateSelector} or @z-scope or parent::${this.#childrenScopeSelector} or @template-clone or ancestor::*/@z-removed]`;
		#zElementSelector = "*[@z-var]";
		#scopeLevelSelector = `count(ancestor-or-self::${this.#scopeSelector})`;
		constructor(a) {
			if (!(a instanceof Element)) throw new Error("ZTemplate accepts an instance of HTMLElement as constructor argument");
			this.#rootElement = a, this.#scopeLevel = this.#query(this.#scopeLevelSelector, a.hasAttribute("template-scope") || a.hasAttribute("z-scope-children") ? a.firstElementChild : a)
		}
		render(a, b) {
			this.#vars = a, this.#callbacks = b;
			const c = this.#query(`self::${this.#zElementSelector}|descendant-or-self::${this.#zElementSelector}[${this.#scopeLevelSelector} = ${this.#scopeLevel}]`);
			for (let d = 0; d < c.length; d++) this.#processZElement(c[d]);
			const d = this.#query(`self::${this.#templateSelector}|${this.#templateSelector}|descendant-or-self::${this.#templateSelector}[${this.#scopeLevelSelector} = ${this.#scopeLevel} + 1]`);
			for (let c = 0; c < d.length; c++) this.#processTemplate(d[c])
		}
		#processTemplate(a) {
			const b = a.getAttribute("template"),
				c = b.substring(1, b.length - 1);
			if (!c) throw new Error(`Template "${c}" not found (attr template="${b}")`);
			const d = this.#getVariableValue(c);
			if (null === d) return void console.warn(`Template "${c}" not found in data`, this.#vars);
			let e;
			"{" == b.substr(0, 1) ? e = [d] : d && d[Symbol.iterator] ? e = Array.from(d) : "object" == typeof d ? e = Object.entries(d).map(([a, b]) => ({
				key: a,
				value: b
			})) : (console.warn("Template value '%s' is not iterable: %o. Template: %o", c, d, a), e = []);
			const f = this.#getTemplateClones(a, e);
			let g = e.length,
				h = [a];
			for (let b = f.length - 1; 0 <= b; b--) {
				const a = f[b];
				switch (a.action) {
					case "reuse":
					case "add":
						const b = "object" == typeof e[--g] ? e[g] : {
							value: e[g],
							key: g
						};
						b._parent_ = this.#vars;
						for (let c = a.elements.length - 1; 0 <= c; c--) {
							const d = a.elements[c];
							if ("add" == a.action) {
								for (; h.length && !h[0].parentNode;) h.shift();
								h[0].before(d)
							}
							const e = new Template(d);
							e.render(b, this.#callbacks), h.unshift(d)
						}
						break;
					case "remove":
						a.elements.forEach(a => this.#animateRemove(a));
				}
			}
		}
		#getTemplateClones(a, b) {
			const c = b.length,
				d = a.getAttribute("template"),
				e = [],
				f = [];
			let g = a.previousElementSibling,
				h = -1,
				i = -1;
			for (; g && g.getAttribute("template-clone") == d;) {
				const a = g.getAttribute("template-clone-id");
				i = _Mathmax(i, a), g.hasAttribute("z-removed") || (h == a && null !== a ? f[0].unshift(g) : f.unshift([g])), g = g.previousElementSibling, h = a
			}
			const j = b.map(a => this.#getHash(a)),
				k = f.map(a => a[0].getAttribute("template-clone-hash"));
			for (; j.length || k.length;) {
				const b = j.shift(),
					c = k.shift();
				if (b == c) e.push({
					elements: f.shift(),
					action: "reuse"
				});
				else {
					const g = k.indexOf(b),
						h = j.indexOf(c);
					if (b && (!c || -1 != h) && (-1 == g || h < g)) e.push({
						elements: this.#cloneTemplateElement(a, {
							"template-clone": d,
							"template-clone-id": ++i,
							"template-clone-hash": b
						}),
						action: "add"
					}), c && k.unshift(c);
					else {
						const a = f.shift();
						e.push({
							elements: a,
							action: "remove"
						}), b && j.unshift(b)
					}
				}
			}
			return e
		}
		#cloneTemplateElement(a, b) {
			const c = [];
			return a.content instanceof DocumentFragment ? c.push(...Array.from(a.content.children).map(a => a.cloneNode(!0))) : c.push(a.cloneNode(!0)), c.forEach(a => {
				a.classList.add("template-clone"), a.removeAttribute("template");
				for (const [c, d] of Object.entries(b)) a.setAttribute(c, d)
			}), c
		}
		#processZElement(a) {
			const b = a.getAttribute("z-var"),
				c = tokenize(b),
				d = Array.from(c).map(a => prepare(a, this.#vars)),
				e = [],
				f = this.#cloneProto(a);
			d.forEach(a => {
				if (a.condition) {
					if (null === a.value) return void console.warn(`The command %o's value is null. Skipping the condition. Variables: %o`, a, this.#vars);
					switch (a.action) {
						case "attr":
							this.#cmdAttr(f, a);
							break;
						case "text":
							this.#cmdText(f, a);
							break;
						case "html":
							this.#cmdHtml(f, a);
							break;
						case "value":
							this.#cmdValue(f, a);
							break;
						case "class":
							this.#cmdClass(f, a);
							break;
						case "toggle":
							this.#cmdToggle(f, a);
							break;
						case "debugger":
							if (a.valueBool) debugger;
							break;
						case "remove":
						case "event":
						case "call":
							e.push(a);
					}
				}
			}), this.#mergeProto(a, f), e.forEach(b => {
				switch (a.parentNode || console.warn("The element %o was removed from the DOM. Something may break when executing the command %o", a, b), b.action) {
					case "remove":
						this.#cmdRemove(a, b);
						break;
					case "event":
						this.#cmdEvent(a, b);
						break;
					case "call":
						this.#cmdCall(a, b);
				}
			})
		}
		#cmdCall(a, b) {
			const c = this.#callbacks.get(b.param);
			if (!c || "function" != typeof c) return void console.error(`Callback "${b.param}" not found or is not a function in command "${JSON.stringify(b)}"`);
			const d = {
				value: b.value,
				data: this.#vars,
				arguments: b.arguments
			};
			return "function" == typeof c ? void c(a, d) : void console.error(`Callback ${b.param} is not defined`)
		}
		#cmdEvent(a, b) {
			const c = {
					value: b.value,
					data: this.#vars,
					arguments: b.arguments
				},
				d = new CustomEvent(b.param, {
					detail: c,
					bubbles: !0,
					cancelable: !0,
					composed: !1
				});
			a.dispatchEvent(d)
		}
		#cmdRemove(a, b) {
			b.valueBool || this.#animateRemove(a)
		}
		#cmdToggle(a, b) {
			a.classList.contains("z-template-hidden") || (b.valueBool ? (a.classList.add("z-template-visible"), a.classList.remove("z-template-hidden")) : (a.classList.add("z-template-hidden"), a.classList.remove("z-template-visible")))
		}
		#cmdClass(a, b) {
			const c = b.param.trim().split(/[ ,.]+/);
			c.forEach(c => {
				let d = b.valueBool;
				"!" === c.substr(0, 1) && (d = !d, c = c.substr(1)), d ? a.classList.add(c) : a.classList.remove(c)
			})
		}
		#cmdValue(a, b) {
			if (a.matches("input[type=\"checkbox\"], input[type=\"radio\"]")) {
				const c = "boolean" == typeof b.value ? b.value : a.value === b.value;
				c ? a.setAttribute("checked", "checked") : a.removeAttribute("checked")
			} else a.matches("input") ? a.setAttribute("value", b.value) : a.matches("select") ? Array.from(a).filter(a => a.value === b.value).forEach(a => a.setAttribute("selected", "selected")) : a.matches("textarea") ? a.textContent = b.value : a.setAttribute("value", b.value)
		}
		#cmdHtml(a, b) {
			a.innerHTML = b.value
		}
		#cmdText(a, b) {
			a.textContent = this.#getReplaceText(a, a.textContent, b.variable, void 0 === b.value || null === b.value || !1 === b.value ? "" : b.value, "")
		}
		#cmdAttr(a, b) {
			if (!0 === b.value) a.setAttribute(b.param, b.param);
			else if (!1 === b.value) a.removeAttribute(b.param);
			else {
				const c = this.#getReplaceText(a, a.getAttribute(b.param), b.variable, b.value, b.param);
				a.setAttribute(b.param, c)
			}
		}
		#getReplaceText(a, b, c, d, e = "") {
			const f = "${" + c + "}",
				g = "z-var-content" + (e ? "-" + e : "");
			let h;
			return h = c && b && -1 !== b.indexOf(f) ? (b || "").replace(f, d) : c && b && ["src", "href"].includes(e) && -1 !== b.indexOf(encodeURIComponent(f)) ? (b || "").replace(encodeURIComponent(f), encodeURIComponent(d)) : d, b !== h && b && !a.hasAttribute(g) && (-1 !== b.indexOf("${") || -1 !== b.indexOf(encodeURIComponent("${"))) && a.setAttribute(g, b), h
		}
		#mergeProto(a, b) {
			let c = !1;
			a.innerHTML !== b.innerHTML && (a.innerHTML = b.innerHTML, c = !0);
			for (let c = 0; c < b.attributes.length; c++) {
				const d = b.attributes[c];
				a.getAttribute(d.name) !== d.value && a.setAttribute(d.name, d.value)
			}
			for (let c = 0; c < a.attributes.length; c++) {
				const d = a.attributes[c];
				b.hasAttribute(d.name) || a.removeAttribute(d.name)
			}
			if (c) {
				const b = parseInt(a.getAttribute("z-content-rev") || 0) + 1;
				a.removeAttribute("z-content-rev"), setTimeout(() => a.setAttribute("z-content-rev", b), 0)
			}
		}
		#cloneProto(a) {
			const b = a.cloneNode(!0),
				c = [],
				d = Array.from(a.attributes).filter(a => {
					a.name.match(/^z-var-content-?/) && c.push(a), b.setAttribute(a.name, a.value)
				});
			return c.forEach(a => {
				const c = a.name.replace(/^z-var-content-?/, "");
				c ? b.setAttribute(c, a.value) : b.textContent = a.value
			}), b.classList.remove(...["dna-template-visible", "z-template-visible", "dna-template-hidden", "z-template-hidden"]), b
		}
		#query(a, b = null) {
			const c = this.#rootElement.ownerDocument.evaluate(a, b || this.#rootElement, null, XPathResult.ANY_TYPE, null);
			switch (c.resultType) {
				case XPathResult.NUMBER_TYPE:
					return c.numberValue;
				case XPathResult.STRING_TYPE:
					return c.stringValue;
				case XPathResult.BOOLEAN_TYPE:
					return c.booleanValue;
				case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
					for (var d, e = []; d = c.iterateNext(); e.push(d));
					return e;
				default:
					return null;
			}
		}
		#getVariableValue(a) {
			const b = a.split(".");
			let c = this.#vars;
			for (let d = 0; d < b.length; d++) {
				if ("undefined" == typeof c[b[d]]) return console.warn("Can't find variable " + a + " in data source %o", this.#vars), null;
				c = c[b[d]]
			}
			return c
		}
		#getHash(a) {
			let b;
			if ("object" == typeof a && "undefined" != typeof a.id) {
				if ("string" == typeof a.id || "number" == typeof a.id) return a.id;
				b = JSON.stringify(a.id)
			} else b = JSON.stringify(a, (a, b) => "_parent_" == a ? void 0 : b);
			for (var d, e = [], f = 0; 256 > f; f++) {
				d = f;
				for (var g = 0; 8 > g; g++) d = 1 & d ? 3988292384 ^ d >>> 1 : d >>> 1;
				e[f] = d
			}
			for (var h = -1, f = 0; f < b.length; f++) h = h >>> 8 ^ e[255 & (h ^ b.charCodeAt(f))];
			return "" + ((-1 ^ h) >>> 0)
		}
		#animateRemove(a) {
			if (a.hasAttribute("z-removed") || !a.parentNode) return;
			const b = window.getComputedStyle(a).animationName;
			a.setAttribute("z-removed", "true");
			const c = window.getComputedStyle(a),
				d = c.animationName,
				e = 1e3 * ((parseFloat(c.animationDuration) || 0) + (parseFloat(c.animationDelay) || 0)),
				f = _Mathmax(200, e),
				g = new Promise(c => {
					b === d ? c() : (a.addEventListener("animationend", c), a.removeEventListener("animationcancel", c), a.removeEventListener("animationiteration", c))
				}),
				h = new Promise(a => {
					setTimeout(a, f)
				}),
				i = new Promise(b => {
					var d = Math.ceil;
					const e = a.getBoundingClientRect();
					a.style.height = e.height + "px", a.style.width = e.width + "px", a.style.transition = "none", a.style.margin = `${c.marginTop} ${c.marginRight} ${c.marginBottom} ${c.marginLeft}`, a.addEventListener("transitionend", b), a.style.transition = `margin ${f}ms ease-in-out`, a.style.marginRight = `-${d(e.height+parseInt(c.marginLeft))}px`, a.style.marginBottom = `-${d(e.height+parseInt(c.marginTop))}px`
				});
			Promise.any([Promise.all([g, i]), h]).then(() => a.remove())
		}
	}
	return zTemplate.callbacks = new Map, "undefined" == typeof jQuery || jQuery.fn.template || (jQuery.fn.template = function(a) {
		return this.each((b, c) => zTemplate(c, a)), this
	}), zTemplate
}();

zTemplate.callbacks
	.set('roller', function(element, detail) {
		const document = element.ownerDocument;
		const speed = detail.arguments[0] || 1000;
		const delay = detail.arguments[1] || 100;
		// Convert value into string
		const sourceText = element.textContent + '';
		const targetText = detail.value + '';
		const len = Math.max(sourceText.length, targetText.length);
		const frag = document.createDocumentFragment();
		const height = element.getBoundingClientRect().height;

		if (sourceText === targetText || sourceText.length === 0) {
			element.textContent = targetText;
			return;
		}

		// Set css variable --z-roller-speed
		element.classList.add('z-roller-rolling');

		for (let i = 0; i < len; i++) {
			const sourceChar = sourceText[i] || '';
			const targetChar = targetText[i] || '';

			const div = frag.appendChild(document.createElement('div'));
			div.setAttribute('data-target', targetChar);
			const {
				direction,
				chars
			} = generateRollerChars(sourceChar, targetChar);
			if (direction === 'up') {
				div.classList.add('z-roller-up', 'z-roller');
			} else {
				div.classList.add('z-roller-down', 'z-roller');
			}

			const charSpan = div.appendChild(document.createElement('span'));
			charSpan.classList.add('z-roller-letter');
			charSpan.textContent = sourceChar;

			// We use :before to avoid multiplying the textContents
			// when multiple callbacks are applied in short succession
			div.style.setProperty('--z-roller-speed', speed + 'ms');
			div.style.setProperty('--z-roller-line-height', height + 'px');
			div.setAttribute('data-z-face', chars.join("\n"));

		}

		element.replaceChildren(frag);
		for (i = 0; i < element.childElementCount; i++) {
			// Get i-th child element
			const child = element.children[i];
			const charDelay = delay * i;
			child.style.setProperty('--z-roller-delay', charDelay + 'ms');
			child.classList.add('z-roller-animate');
			setTimeout(() => child.replaceWith(child.getAttribute('data-target')), charDelay + speed);
		}

		// Generate array of characters between two characters
		function generateRollerChars(fromChar, toChar) {
			let fromCode = (fromChar || ' ').charCodeAt(0);
			let toCode = (toChar || ' ').charCodeAt(0);
			const len = Math.abs(fromCode - toCode);
			const chars = [];

			const direction = fromCode < toCode ? 'up' : 'down';
			if (direction === 'down') {
				[fromCode, toCode] = [toCode, fromCode];
			}

			for (let i = 0; i <= len; i++) {
				chars.push(String.fromCharCode(fromCode + i));
			}
			return {
				direction,
				chars
			};
		}
	});
/*=================================MAIN=================================*/
function preview(input){
	if (input.files && input.files[0]) {
		var reader = new FileReader();
		reader.onload = function (event){
			$('#preview').attr('src', event.target.result);
			$('#preview').css('display', 'initial');
		}
		reader.readAsDataURL(input.files[0]);
	}
}
$("textarea").each(function() {
	this.setAttribute("style", "height:" + (this.scrollHeight) + "px;overflow-y:hidden;");
}).on("input", function() {
	this.style.height = 0;
	this.style.height = (this.scrollHeight) + "px";
});
function timeConverter(UNIX_timestamp){
	var a = new Date(UNIX_timestamp);
	var year = a.getFullYear();
	var month = a.getMonth() + 1;
	var date = a.getDate();
	var hour = a.getHours();
	var min = a.getMinutes();
	var sec = a.getSeconds();
	var time = date + '/' + month + '/' + year + ' ' + hour + ':' + min + ':' + sec ;
	return time;
}
function birthdateConverter(UNIX_timestamp){
	var a = new Date(UNIX_timestamp);
	var year = a.getFullYear();
	var month = a.getMonth() + 1;
	if(month.toString().length == 1)
		month = '0' + month;
	var date = a.getDate();
	var time = year + '-' + month + '-' + date;
	return time;
}
function timeSince(date) {
	var seconds = Math.floor((new Date() - date) / 1000);
	var interval = seconds / 31536000;
	if (interval > 1) {
		return Math.floor(interval) + " y";
	}
	interval = seconds / 2592000;
	if (interval > 1) {
		return Math.floor(interval) + " m";
	}
	interval = seconds / 86400;
	if (interval > 1) {
		return Math.floor(interval) + " d";
	}
	interval = seconds / 3600;
	if (interval > 1) {
		return Math.floor(interval) + " hr";
	}
	interval = seconds / 60;
	if (interval > 1) {
		return Math.floor(interval) + " min";
	}
	return Math.floor(seconds) + " seconds";
}

function _like(id) {
	$.get("worker/likes.php?post_id=" + id, function(data) {
		var splt = data.split(";");
		var post_like = document.getElementById("post-like-" + id);
		var class_l = "icon-heart fa-heart icon-click";
		if (splt[0] === "1") {
			post_like.className = class_l + " fa-solid p-heart";
			post_like.classList.toggle("active");
		} else {
			post_like.className = class_l + " fa-regular white-col";
		}
		zTemplate(document.getElementById("post-like-count-" + id), {
			"counter": parseInt(splt[1])
		});
	});
}
localStorage.setItem("cgurl",0);
function changeUrl(url) {
	localStorage.setItem("cgurl",1);
	$.ajax({
		url: url,
		type: 'GET',
		success: function(res) {
			_online();
			processAjaxData(res, url);
			localStorage.setItem("cgurl",0);
		},
		error: function(){
			localStorage.setItem("cgurl",0);
		}
	});
}
$(window).on("popstate", function (event, state) {
	var url = new URL(window.location.href);
	var urlPath = url.pathname + url.search;
	if(localStorage.getItem("cgurl") == 0)
		changeUrl(urlPath);
});
function fetch_pfp_box(){
	$.get("worker/profile_image.php", function(data) {
		var pfp_box = document.getElementById('pfp_box');
		if(pfp_box != null){
			if (data['pfp_media_id'] > 0) {
				pfp_box.src = 'data/images.php?t=profile&id=' + data['pfp_media_id'] + "&h=" + data['pfp_media_hash'];
			} else {
				if (data['user_gender'] == 'M')
					pfp_box.src = 'data/images.php?t=default_M';
				else if (data['user_gender'] == 'F')
					pfp_box.src = 'data/images.php?t=default_F';
			}
		}
	});
}
function fetch_post(loc) {
	fetch_pfp_box();
	$.get("worker/" + loc, function(data) {
		var post_feed = '';
		var post_length = Object.keys(data).length;
		var page = document.getElementById('page');
		var end_of_page = false;
		if (data["success"] == 1) {
			for (let i = 0; i < (post_length - 1); i++) {
				var post_adata = data[i];
				var share_id = 0;
				var share_able = true;
				var post_a = "";
				post_a += '<div class="post">';
				post_a += '<div class="header">';
				if (post_adata['pfp_media_id'] > 0) {
					post_a += '<img class="pfp" src="' + "data/images.php?t=profile&id=" + post_adata['pfp_media_id'] + "&h=" + post_adata['pfp_media_hash'] + '" width="40px" height="40px">';
				} else {
					if (post_adata['user_gender'] == 'M')
						post_a += '<img class="pfp" src="data/images.php?t=default_M" width="40px" height="40px">';
					else if (post_adata['user_gender'] == 'F')
						post_a += '<img class="pfp" src="data/images.php?t=default_F" width="40px" height="40px">';
				}
				post_a += '<a class="fname profilelink" href="profile.php?id=' + post_adata['user_id'] + '">' + post_adata['user_firstname'] + ' ' + post_adata['user_lastname'];
				if(post_adata['verified'] > 0)
					post_a += '<i class="fa-solid fa-badge-check verified_color_' + post_adata['verified'] + '" title="verified"></i>';
				post_a += '<span class="nickname">@' + post_adata['user_nickname'] + '</span>';
				post_a += '</a>';
				post_a += '<a class="public">';
				post_a += '<span class="postedtime" title="' + timeConverter(post_adata['post_time'] * 1000) + '">';
				switch(Number(post_adata['post_public'])){
					case 2:
						post_a += '<i class="fa-solid fa-earth-americas" title="Public"></i>';
						break;
					case 1:
						post_a += '<i class="fa-solid fa-user-group" title="Friend only"></i>';
						break;
					default:
						post_a += '<i class="fa-solid fa-lock" title="Private"></i>';
						break;
				}
				post_a += " " + timeSince(post_adata['post_time'] * 1000) + '</span>';;
				post_a += '</a>';
				post_a += '</div>';
				post_a += '<br>';
				if (post_adata['post_media'] != 0) {
					if(post_adata['post_caption'].split(/\r\n|\r|\n/).length > 13 || post_adata['post_caption'].length > 1196){
						post_a += '<div class="caption_box" id="caption_box-'+post_adata['post_id']+'">';
						post_a += '<div class="caption_box_shadow" id="caption_box_shadow-'+post_adata['post_id']+'"><p onclick="showMore(\''+post_adata['post_id']+'\')">Show more</p></div>';
					}else{
						post_a += '<div class="caption_box" style="height: 100%">';
					}
					post_a += '<pre class="caption">' + post_adata['post_caption'] + '</pre></div>';
					post_a += '<center>';
					post_a += '<img src="' + "data/images.php?t=media&id=" + post_adata['post_media'] + "&h=" + post_adata['media_hash'] + '" style="max-width:100%;">';
					post_a += '<br><br>';
					post_a += '</center>';
				} else {
					if(post_adata['is_share'] == 0 && post_adata['post_caption'].replace(/^\s+|\s+$/gm,'').length < 20){
						post_a += '<center>';
						if(post_adata['post_caption'].split(/\r\n|\r|\n/).length > 3){
							post_a += '<div class="caption_box" id="caption_box-'+post_adata['post_id']+'">';
							post_a += '<div class="caption_box_shadow" id="caption_box_shadow-'+post_adata['post_id']+'"><p onclick="showMore(\''+post_adata['post_id']+'\')">Show more</p></div>';
						}else{
							post_a += '<div class="caption_box" style="height: 100%">';
						}
						post_a += '<pre class="caption" style="font-size: 300%">' + post_adata['post_caption'] + '</pre></div>';
						post_a += '</center>';
					}else{
						if(post_adata['post_caption'].split(/\r\n|\r|\n/).length > 13 || post_adata['post_caption'].length > 1196){
							post_a += '<div class="caption_box" id="caption_box-'+post_adata['post_id']+'">';
							post_a += '<div class="caption_box_shadow" id="caption_box_shadow-'+post_adata['post_id']+'"><p onclick="showMore(\''+post_adata['post_id']+'\')">Show more</p></div>';
						}else{
							post_a += '<div class="caption_box" style="height: 100%">';
						}
						post_a += '<pre class="caption">' + post_adata['post_caption'] + '</pre></div>';
					}
				}
				post_a += '<br>';

				if (post_adata['is_share'] != 0) {
					var pflag = false;
					pflag = post_adata['share']["pflag"];
					post_a += '<div class="share-post">';
					if (pflag) {
						post_a += '<div class="header">';

						if (post_adata['share']['pfp_media_id'] > 0) {
							post_a += '<img class="pfp" src="' + "data/images.php?t=profile&id=" + post_adata['share']['pfp_media_id'] + "&h=" + post_adata['share']['pfp_media_hash'] + '" width="40px" height="40px">';
						} else {
							if (post_adata['share']['user_gender'] == 'M')
								post_a += '<img class="pfp" src="data/images.php?t=default_M" width="40px" height="40px">';
							else if (post_adata['share']['user_gender'] == 'F')
								post_a += '<img class="pfp" src="data/images.php?t=default_F" width="40px" height="40px">';
						}

						post_a += '<a class="fname profilelink" href="profile.php?id=' + post_adata['share']['user_id'] + '">' + post_adata['share']['user_firstname'] + ' ' + post_adata['share']['user_lastname'];
						if(post_adata['share']['verified'] > 0)
							post_a += '<i class="fa-solid fa-badge-check verified_color_' + post_adata['share']['verified'] + '" title="verified"></i>';
						post_a += '<span class="nickname">@' + post_adata['share']['user_nickname'] + '</span>';
						post_a += '</a>';
						post_a += '<a class="public">';
						post_a += '<span class="postedtime" title="' + timeConverter(post_adata['share']['post_time'] * 1000) + '">';
						if (post_adata['share']['post_public'] == 2) {
							post_a += '<i class="fa-solid fa-earth-americas" title="Public"></i>';
						} else if (post_adata['share']['post_public'] == 1) {
							post_a += '<i class="fa-solid fa-user-group" title="Friend only"></i>';
						} else {
							post_a += '<i class="fa-solid fa-lock" title="Private"></i>';
						}
						post_a += " " + timeSince(post_adata['share']['post_time'] * 1000) + '</span>';;
						post_a += '</a>';
						post_a += '<br>';
						post_a += '</div>';
						if (post_adata['post_media'] !== 0) {
							if(post_adata['share']['post_caption'].split(/\r\n|\r|\n/).length > 13 || post_adata['share']['post_caption'].length > 1196){
								post_a += '<div class="caption_box" id="caption_box-'+post_adata['is_share']+'shd">';
								post_a += '<div class="caption_box_shadow" id="caption_box_shadow-'+post_adata['is_share']+'shd"><p onclick="showMore(\''+post_adata['is_share']+'shd\')">Show more</p></div>';
							}else{
								post_a += '<div class="caption_box" style="height: 100%">';
							}
							post_a += '<pre class="caption">' + post_adata['share']['post_caption'] + '</pre></div>';

							post_a += '<center>';
							post_a += '<img src="' + "data/images.php?t=media&id=" + post_adata['share']['post_media'] + "&h=" + post_adata['share']['media_hash'] + '" style="max-width:100%;">';
							post_a += '<br><br>';
							post_a += '</center>';
						} else {
							post_a += '<center>';
							if(post_adata['share']['post_caption'].split(/\r\n|\r|\n/).length > 3 || post_adata['share']['post_caption'].length > 60){
								post_a += '<div class="caption_box" id="caption_box-'+post_adata['is_share']+'shd">';
								post_a += '<div class="caption_box_shadow" id="caption_box_shadow-'+post_adata['is_share']+'shd"><p onclick="showMore(\''+post_adata['is_share']+'shd\')">Show more</p></div>';
							}else{
								post_a += '<div class="caption_box" style="height: 100%">';
							}
							post_a += '<pre class="caption" style="font-size: 300%">' + post_adata['share']['post_caption'] + '</pre></div>';
							post_a += '</center>';
						}
						post_a += '<br>';

					} else {
						share_able = false;
						post_a += '<p style="font-size: 150%;text-align: center">Cant display this post </p>';
					}
					post_a += '</div>';
					share_id = post_adata['is_share'];
				}else{
					share_id = post_adata['post_id'];
				}

				post_a += '<div class="bottom">';
				post_a += '<div class="reaction-bottom">';
				var liked = '';
				if (post_adata['is_liked'] == 1)
					liked = 'p-heart fa-solid';
				else
					liked = 'white-col fa-regular';

				post_a += '<div class="reaction-box likes">';
				post_a += '<i onclick="_like(' + post_adata['post_id'] + ')" class="' + liked + ' icon-heart fa-heart icon-click" id="post-like-' + post_adata['post_id'] + '"></i>';
				post_a += ' <a z-var="counter call roller" id="post-like-count-' + post_adata['post_id'] + '">' + post_adata['total_like'] + '</a>';
				post_a += '</div>';

				post_a += '<div class="reaction-box comment">';
				post_a += '<i onclick="_open_post(' + post_adata['post_id'] + ')" class="fa-regular fa-comment icon-click" id="post-comment-' + post_adata['post_id'] + '"></i>';
				post_a += ' <a z-var="counter call roller" id="post-comment-count-' + post_adata['post_id'] + '">' + post_adata['total_comment'] + '</a>';
				post_a += '</div>';
				if(share_able){
					post_a += '<div class="reaction-box share">';
					post_a += '<i onclick="_share(' + share_id + ')" class="fa-regular fa-share icon-click" id="post-share-' + post_adata['post_id'] + '"></i>';
					post_a += ' <a z-var="counter call roller" id="post-share-count-' + post_adata['post_id'] + '">' + post_adata['total_share'] + '</a>';
					post_a += '</div>';
				}

				post_a += '</div>';
				post_a += '</div>';
				post_a += '</div>';
				post_a += '</br>';
				post_feed += post_a;
			}
		} else {
			end_of_page = true;
			post_feed += '<div class="post">';
			post_feed += '<h1>Nothing new yet...</h1>';
			post_feed += '</div>';
		}
		if(page.value != -1){
			if(end_of_page)
				 page.value = -1;
			document.getElementById("feed").innerHTML += post_feed;
			hljs.highlightAll();
		}
		if(isMobile()){
			$(".post").each(function() {
				this.style.border = "none";
				this.style.borderLeft = "none";
				this.style.borderRight = "none";
				this.style.width = "100%";
				this.style.marginRight = "0";
			});
			$(".header .pfp").each(function() {
				this.style.height = "80px";
				this.style.width = "80px";
			});
			$(".postedtime").each(function() {
				this.style.marginLeft = "85px";
			});
			$(".caption_box_shadow").each(function() {
				this.style.width = "calc(97.9%)";
			});
			$(".fname").each(function() {
				this.style.marginTop = "-85px";
				this.style.marginLeft = "85px";
			});
			$("pre.caption").each(function() {
				this.style.width = "calc(97.9%)";
			});
		}
		changeUrlWork();
	});
}
function get(name){
	if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search))
		return decodeURIComponent(name[1]);
}
function processAjaxData(response, urlPath) {
	var title = $(response).filter('title').text();
	document.title = title;
	window.history.pushState({
		"html": response,
		"pageTitle": title
	}, "", urlPath);
	document.getElementsByTagName("html")[0].innerHTML = response;
	if (urlPath.substring(0,13) === "/settings.php" || urlPath.substring(0,12) === "settings.php")
		_load_settings();
	if (urlPath === "/home.php" || urlPath === "home.php")
		fetch_post("fetch_post.php");
	if (urlPath === "/logout.php" || urlPath === "logout.php")
		location.reload();
	if (urlPath === "/friends.php" || urlPath === "friends.php")
		fetch_friend_list('fetch_friend_list.php');
	if (urlPath === "/requests.php" || urlPath === "requests.php")
		fetch_friend_request('fetch_friend_request.php');
	if (urlPath.substring(0,12) === "/profile.php" || urlPath.substring(0,11) === "profile.php"){
		var add_header = "";
		if(urlPath.substring(0,16) === "/profile.php?id=" || urlPath.substring(0,15) === "profile.php?id=")
			add_header = "?id=" + get("id");
		fetch_profile("fetch_profile_info.php" + add_header);
		fetch_post("fetch_profile_post.php" + add_header);
	}
	if (urlPath.substring(0,9) === "/post.php" || urlPath.substring(0,8) === "post.php"){
		if(urlPath.substring(0,13) === "/post.php?id=" || urlPath.substring(0,12) === "post.php?id=")
			_load_post(get("id"));
		else
			window.history.go(-1);
	}
	changeUrlWork();
}
function modal_close() {
	document.getElementById("modal").style.display = "none";
}
function _load_comment(id, page){
	$.get("worker/fetch_comment.php?id=" + id + "&page=" + page, function(data) {
		var cmt_box = document.getElementById("comment-box");
		var cmt_a = '';
		if(data['success'] == 2)
			document.getElementById('page').value = -1;
		if(data['success'] == 1){
			for (let i = 0; i < (Object.keys(data).length - 1); i++) {
				cmt_a += '<div class="comment">';
				if (data[i]['pfp_media_id'] > 0) {
					cmt_a += '<img class="pfp comment-pfp" src="' + "data/images.php?t=profile&id=" + data[i]['pfp_media_id'] + "&h=" + data[i]['pfp_media_hash'] + '" width="40px" height="40px">';
				} else {
					if (data[i]['user_gender'] == 'M')
						cmt_a += '<img class="pfp comment-pfp" src="data/images.php?t=default_M" width="40px" height="40px">';
					else if (data[i]['user_gender'] == 'F')
						cmt_a += '<img class="pfp comment-pfp" src="data/images.php?t=default_F" width="40px" height="40px">';
				}
				cmt_a += '<a class="profilelink cmt_user_name" href="profile.php?id=' + data[i]['user_id'] + '">' + data[i]['user_firstname'] + ' ' + data[i]['user_lastname'];
				if(data[i]['verified'] > 0)
					cmt_a += '<i class="fa-solid fa-badge-check verified_color_' + data[i]['verified'] + '" title="verified"></i>';
				cmt_a += '<span class="nickname">@' + data[i]['user_nickname'] + '</span>';
				cmt_a += '</a>';
				cmt_a += '<span class="cmt_postedtime" title="' + timeConverter(data[i]['comment_time'] * 1000) + '">' + timeSince(data[i]['comment_time'] * 1000) + '</span>';
				cmt_a += '<pre class="comment-text">' + data[i]['comment'] + '</pre>';
				cmt_a += '</div>';
				cmt_a += '<hr/>';
			}
		}
		cmt_box.innerHTML += cmt_a;
		cmt_box.style.height = (Math.max(document.documentElement.clientHeight, window.innerHeight || 0) + 55) + "px";
		changeUrlWork();
	});
}
function _share(id) {
	$.get("worker/fetch_post_info.php?id=" + id, function(data) {
		document.getElementById("modal").style.display = "block";
		var post_adata = data;
		var post_a = "";
		
		post_a += '	<div class="createpost_box">';
		post_a += '		<div>';
		post_a += '		<br>';
		post_a += '		<br>';
		post_a += '			<span style="float:right; color:black">';
		post_a += '			<input type="hidden" name="post_id" id="post_id" value="'+post_adata['post_id']+'">';
		post_a += '			<select name="private" id="private">';
		post_a += '				<option value="2">public</option>';
		post_a += '				<option value="1">friend</option>';
		post_a += '				<option value="0">private</option>';
		post_a += '			</select>';
		post_a += '			</span>';
		post_a += '			<img class="pfp" src="' + document.getElementById('pfp_box').src + '" width="40px" height="40px"><a class="fname">' + document.getElementById('fullname').value + "</a>";
		post_a += '			<span class="required" style="display:none;"> *You can\'t Leave the Caption Empty.</span><br>';
		post_a += '			<textarea rows="6" name="caption" class="caption" placeholder="Write something..."></textarea>';
		post_a += '			<center><img src="" id="preview" style="max-width:580px; display:none;"></center>';
		post_a += '			<div class="createpostbuttons">';
		post_a += '				<label>';
		post_a += '					<i class="fa-regular fa-image"></i>';
		post_a += '					<input type="file" name="fileUpload" id="imagefile">';
		post_a += '				</label>';
		post_a += '				<input type="button" value="Share" name="post" onclick="return validatePost(1)">';
		post_a += '			</div>';
		post_a += '		</div>';
		post_a += '		<br>';
	
		post_a += '<div class="post">';
		post_a += '<div class="header">';
		if (post_adata['pfp_media_id'] > 0) {
			post_a += '<img class="pfp" src="' + "data/images.php?t=profile&id=" + post_adata['pfp_media_id'] + "&h=" + post_adata['pfp_media_hash'] + '" width="40px" height="40px">';
		} else {
			if (post_adata['user_gender'] == 'M')
				post_a += '<img class="pfp" src="data/images.php?t=default_M" width="40px" height="40px">';
			else if (post_adata['user_gender'] == 'F')
				post_a += '<img class="pfp" src="data/images.php?t=default_F" width="40px" height="40px">';
		}
		post_a += '<a class="fname profilelink" href="profile.php?id=' + post_adata['user_id'] + '">' + post_adata['user_firstname'] + ' ' + post_adata['user_lastname'];
		if(post_adata['verified'] > 0)
			post_a += '<i class="fa-solid fa-badge-check verified_color_' + post_adata['verified'] + '" title="verified"></i>';
		post_a += '<span class="nickname">@' + post_adata['user_nickname'] + '</span>';
		post_a += '</a>';
		post_a += '<a class="public">';
		post_a += '<span class="postedtime" title="' + timeConverter(post_adata['post_time'] * 1000) + '">';
		switch(Number(post_adata['post_public'])){
			case 2:
				post_a += '<i class="fa-solid fa-earth-americas" title="Public"></i>';
				break;
			case 1:
				post_a += '<i class="fa-solid fa-user-group" title="Friend only"></i>';
				break;
			default:
				post_a += '<i class="fa-solid fa-lock" title="Private"></i>';
				break;
		}
		post_a += " " + timeSince(post_adata['post_time'] * 1000) + '</span>';;
		post_a += '</a>';
		post_a += '</div>';
		post_a += '<br>';
		if (post_adata['post_media'] != 0) {
			if(post_adata['post_caption'].split(/\r\n|\r|\n/).length > 13 || post_adata['post_caption'].length > 1196){
				post_a += '<div class="caption_box" id="caption_box-'+post_adata['post_id']+'">';
				post_a += '<div class="caption_box_shadow" id="caption_box_shadow-'+post_adata['post_id']+'"><p onclick="showMore(\''+post_adata['post_id']+'\')">Show more</p></div>';
			}else{
				post_a += '<div class="caption_box" style="height: 100%">';
			}
			post_a += '<pre class="caption" style="font-size: 300%">' + post_adata['post_caption'] + '</pre></div>';
			post_a += '<center>';
			post_a += '<img src="' + "data/images.php?t=media&id=" + post_adata['post_media'] + "&h=" + post_adata['media_hash'] + '" style="max-width:100%;">';
			post_a += '<br><br>';
			post_a += '</center>';
		} else {
			post_a += '<center>';
			if(post_adata['post_caption'].split(/\r\n|\r|\n/).length > 3 || post_adata['post_caption'].length > 60){
				post_a += '<div class="caption_box" id="caption_box-'+post_adata['post_id']+'">';
				post_a += '<div class="caption_box_shadow" id="caption_box_shadow-'+post_adata['post_id']+'"><p onclick="showMore(\''+post_adata['post_id']+'\')">Show more</p></div>';
			}else{
				post_a += '<div class="caption_box" style="height: 100%">';
			}
			post_a += '<pre class="caption" style="font-size: 300%">' + post_adata['post_caption'] + '</pre></div>';
			post_a += '</center>';
		}
		
		post_a += '	</div>';
		
		document.getElementById("modal_content").innerHTML = post_a;
		
		$(document).ready(function(){
				$('#imagefile').change(function(){
					preview(this);
				});
			});
		var textarea = document.getElementsByTagName("textarea")[0];
		textarea.oninput = function() {
			textarea.style.height = "";
			textarea.style.height = Math.min(textarea.scrollHeight, 1280) + "px";
		};
	});
}
function make_post(){
	document.getElementById("modal").style.display = "block";
	var post_a = "";
	post_a += '	<div class="createpost_box">';
	post_a += '		<div>';
	post_a += '		<br>';
	post_a += '		<br>';
	post_a += '			<h2>Make Post</h2>';
	post_a += '			<hr>';
	post_a += '			<span style="float:right; color:black">';
	post_a += '			<select name="private" id="private">';
	post_a += '				<option value="2">public</option>';
	post_a += '				<option value="1">friend</option>';
	post_a += '				<option value="0">private</option>';
	post_a += '			</select>';
	post_a += '			</span>';
	post_a += '			<img class="pfp" src="' + document.getElementById('pfp_box').src + '" width="40px" height="40px"><a class="fname">' + document.getElementById('fullname').value + "</a>";
	post_a += '			<span class="required" style="display:none;"> *You can\'t Leave the Caption Empty.</span><br>';
	post_a += '			<textarea rows="6" name="caption" class="caption" placeholder="Write something..."></textarea>';
	post_a += '			<center><img src="" id="preview" style="max-width:100%; display:none;"></center>';
	post_a += '			<div class="createpostbuttons">';
	post_a += '				<label>';
	post_a += '					<i class="fa-regular fa-image"></i>';
	post_a += '					<input type="file" name="fileUpload" id="imagefile">';
	post_a += '				</label>';
	post_a += '				<input type="button" value="Post" name="post" onclick="return validatePost(0)">';
	post_a += '			</div>';
	post_a += '		</div>';
	post_a += '	</div>';
	document.getElementById("modal_content").innerHTML = post_a;
	$(document).ready(function(){
			$('#imagefile').change(function(){
				preview(this);
			});
		});
	var textarea = document.getElementsByTagName("textarea")[0];
	textarea.oninput = function() {
		textarea.style.height = "";
		textarea.style.height = Math.min(textarea.scrollHeight, 1280) + "px";
	};
}
function _open_post(id){
	changeUrl("post.php?id=" + id);
	_load_post(id);
}
function fetch_friend_list(loc){
	$.get("worker/" + loc, function(data) {
		var friend_list = document.getElementById("friend_list");
		var frl_a = '';
		frl_a += '<center>';
		if(data['success'] == 2){
			frl_a += '<div class="post">';
			frl_a += 'You don\'t yet have any friends.';
			frl_a += '</div>';
		} else if(data['success'] == 1){
			for (let i = 0; i < (Object.keys(data).length - 1); i++) {
				frl_a += '<div class="frame">';
				frl_a += '<center>';
				frl_a += '<div class="pfp-box">';
				if(data[i]['pfp_media_id'] > 0) {
					frl_a += '<img class="pfp" src="data/images.php?t=profile&id=' + data[i]['pfp_media_id'] + "&h=" + data[i]['pfp_media_hash'] + '" width="168px" height="168px"	id="pfp"/>';
				} else {
					if(data[i]['user_gender'] == 'M')
						frl_a += '<img class="pfp" src="data/images.php?t=default_M" width="168px" height="168px" id="pfp"/>';
					else if (data[i]['user_gender'] == 'F')
						frl_a += '<img class="pfp" src="data/images.php?t=default_F" width="168px" height="168px" id="pfp"/>';
				}
				frl_a += '<div class="status-circle ' + ( (data[i]['is_online']) ? 'online' : 'offline') + '-status-circle"></div>';
				frl_a += '</div>';
				frl_a += '<br>';
				frl_a += '<a class="flist_link" href="profile.php?id=' + data[i]['user_id'] + '">' + data[i]['user_firstname'] + ' ' + data[i]['user_lastname'];
				if(data[i]['verified'] > 0)
					frl_a += '<i class="fa-solid fa-badge-check verified_color_' + data[i]['verified'] + '" title="verified"></i>'; 
				frl_a += '<span class="nickname">@' + data[i]['user_nickname'] + '</span>';
				frl_a += '</a>';
				frl_a += '</center>';
				frl_a += '</div>';
			}
		}
			
		frl_a += '</center>';
		friend_list.innerHTML += frl_a;
		changeUrlWork();
	});
}
function fetch_friend_request(loc){
	$.get("worker/" + loc, function(data) {
		var friend_reqest_list = document.getElementById("friend_reqest_list");
		var frl_a = '';
		frl_a += '<center>';
		if(data['success'] == 2){
			frl_a += '<div class="userquery">';
			frl_a += 'You have no pending friend requests.';
			frl_a += '<br><br>';
			frl_a += '</div>';
		}else if(data['success'] == 1){
			for (let i = 0; i < (Object.keys(data).length - 1); i++) {
				frl_a += '<div class="userquery">';
				if(data[i]['pfp_media_id'] > 0) {
					frl_a += '<img class="pfp" src="data/images.php?t=profile&id=' + data[i]['pfp_media_id'] + "&h=" + data[i]['pfp_media_hash'] + '" width="168px" height="168px"	id="pfp"/>';
				} else {
					if(data[i]['user_gender'] == 'M')
						frl_a += '<img class="pfp" src="data/images.php?t=default_M" width="168px" height="168px" id="pfp"/>';
					else if (data['user_gender'] == 'F')
						frl_a += '<img class="pfp" src="data/images.php?t=default_F" width="168px" height="168px"	id="pfp"/>';
				}
				frl_a += '<br>';
				frl_a += '<a class="profilelink" href="profile.php?id=' + data[i]['user_id'] +'">' + data[i]['user_firstname'] + ' ' + data[i]['user_lastname'];
				if(data[i]['verified'] > 0) 
					frl_a += '<i class="fa-solid fa-badge-check verified_color_'+data[i]['verified']+'" title="verified"></i>';
				frl_a += '<span class="nickname">@' + data['user_nickname'] + '</span>';
				frl_a += '<a>';
				frl_a += '<div id="toggle-fr-' + data[i]['user_id'] + '">';
				frl_a += '<input type="submit" value="Accept" onclick="_friend_request_toggle(' + data[i]['user_id'] + ',1)" name="accept">';
				frl_a += '<br><br>';
				frl_a += '<input type="submit" value="Ignore" onclick="_friend_request_toggle(' + data[i]['user_id'] + ',0)" name="ignore">';
				frl_a += '<br><br>';
				frl_a +='</div>';
				frl_a += '</div>';
				frl_a += '<br>';
			}
		}
			
		frl_a += '</center>';
		friend_reqest_list.innerHTML += frl_a;
		changeUrlWork();
	});
}
function fetch_profile(loc){
	$.get("worker/" + loc, function(data) {
		if(data['success'] != 1) 
			window.history.go(-1);
		var profile = document.getElementById("profile");
		var profile_cover = document.getElementById("profile_cover");
		var pfp_a = '';
		pfp_a += '<center>';
		pfp_a += '<div class="profile_head">';
		if(data['pfp_media_id'] > 0) {
			pfp_a += '<img class="pfp" src="data/images.php?t=profile&id=' + data['pfp_media_id'] + '&h=' + data['pfp_media_hash'] + '" width="200px" height="200px"	id="pfp"/>';
		} else {
			if(data['user_gender'] == 'M')
				pfp_a += '<img class="pfp" src="data/images.php?t=default_M" width="200px" height="200px" id="pfp"/>';
			else if (data['user_gender'] == 'F')
				pfp_a += '<img class="pfp" src="data/images.php?t=default_F" width="200px" height="200px"	id="pfp"/>';
		}
		if(data['cover_media_id'] > 0)
			profile_cover.style.backgroundImage = 'url("data/images.php?t=profile&id=' + data['cover_media_id'] + '&h=' + data['cover_media_hash'] + '")';
		
		pfp_a += "<div class='user_name'>";
		pfp_a += data['user_firstname'] + ' ' + data['user_lastname'];
		
		if(data['verified'] > 0)
			pfp_a += '<i class="fa-solid fa-badge-check verified_color_' + data['verified'] + '" title="verified"></i>';
		pfp_a += '<span class="nickname">@' + data['user_nickname'] + '</span>';
		pfp_a += "</div>";
		pfp_a += '</div>';
		pfp_a += '<br>';
		pfp_a += '<br>';
		pfp_a += '<div class="about_me">';
		if(data['user_about'] != ''){
			pfp_a += '<h2>About me:</h2>';
			pfp_a += data['user_about'];
		}
		pfp_a += '<br>';
		pfp_a += '<br>';
		pfp_a += '<br>';
		if(data['user_gender'] == "M")
			pfp_a += 'Male';
		else if(data['user_gender'] == "F")
			pfp_a += 'Female';
		pfp_a += '<br>';
		if(data['user_status'] != ''){
			switch(data['user_status']){
				case "S":
					pfp_a += 'Single';
					break;
				case "E":
					pfp_a += 'Engaged';
					break;
				case "M":
					pfp_a += 'Married';
					break;
				case "L":
					pfp_a += 'In Love';
					break;
				default:
				case "U":
					pfp_a += 'Unknown';
					break;
			}
			pfp_a += '<br>';
		}
		pfp_a += birthdateConverter(data['user_birthdate'] * 1000);
		if(data['user_hometown'] == ''){
			pfp_a += '<br>';
			pfp_a += data['user_hometown'];
		}
		if(data['flag'] == 1){
			pfp_a += '<br>';
			if(data['friendship_status'] != null) {
				pfp_a += '<div>';
				pfp_a += (data['friendship_status'] == 1) ? '<input type="submit" onclick="_friend_toggle()" value="Friends" name="remove" id="special" class="fr_button">' : '<input type="submit" onclick="_friend_toggle()" value="Request Pending" name="remove" id="special" class="fr_button">';
				pfp_a += '</div>';
			} else {
				pfp_a += '<div>';
				pfp_a += '<input type="submit" onclick="_friend_toggle()" value="Send Friend Request" name="request" id="special" class="fr_button">';
				pfp_a += '</div>';
			}
		}
		pfp_a += '</center>';
		profile.innerHTML = pfp_a;
		if(isMobile()){
			var pfp_head = document.getElementsByClassName('profile_head')[0];
			var user_name = document.getElementsByClassName('user_name')[0];
			var about_me = document.getElementsByClassName('about_me')[0];
			var nickname = document.getElementsByClassName('nickname')[0];
			var feed = document.getElementById('feed');
			pfp_head.style.marginLeft = "auto";
			user_name.style.marginTop = "0";
			user_name.style.marginLeft = "0";
			user_name.style.margin = "auto";
			user_name.style.width = "100%";
			about_me.style.marginLeft = "0";
			about_me.style.marginTop = "100px";
			about_me.style.width = "100%";
			about_me.style.borderRadius = "0";
			pfp_head.insertBefore(document.createElement("br"),pfp_head.children[1]);
			nickname.style.display = "block";
			profile.style.padding = "0px";
			profile.style.width = "100%";
			feed.style.marginTop = "20px";
		}
		changeUrlWork();
		onResizeEvent();
	});
}
function _load_post(id){
	$.get("worker/fetch_post_info.php?id=" + id, function(data) {
		if(data['success'] == 2)
			window.history.go(-1);
		var _content_left = document.getElementById("_content_left");
		var _content_right = document.getElementById("_content_right");
		var post_a = '';
		post_a += '<div class="header" style="margin: 15px">';
		document.getElementById("_content_left").style.height = ($(window).height() - 56) + "px";
		_content_right.style.height = ($(window).height() - 56) + "px";
		if(data['post_media'] > 0 || data['is_share'] > 0){
			var picture = document.getElementById("picture");
			if(data['is_share'] > 0){
				post_a += '<a style="text-align: center;" href="post.php?id='+data['is_share'] +'">View original post</a>';
				post_a += '<hr>';
				picture.src = "data/images.php?t=media&id=" + data['share']['post_media'] + "&h=" + data['share']['media_hash'];
			}else
				picture.src = "data/images.php?t=media&id=" + data['post_media'] + "&h=" + data['media_hash'];
		}else{
			_content_left.style.display = 'none';
			_content_right.style.float = 'unset';
			_content_right.style.right = 'unset';
			_content_right.style.width = '80%';
			_content_right.style.margin = 'auto';
			_content_right.style.position = 'relative';
			post_a += '<style>.caption_box{overflow-y: auto;}.caption_box_shadow{margin-top:540px;width:99%;}.comment-form{width: calc(80% - 10px);}</style>';
		}
		if (data['pfp_media_id'] > 0) {
			post_a += '<img class="pfp" src="' + "data/images.php?t=profile&id=" + data['pfp_media_id'] + "&h=" + data['pfp_media_hash'] + '" width="40px" height="40px">';
		} else {
			if (data['user_gender'] == 'M')
				post_a += '<img class="pfp" src="data/images.php?t=default_M" width="40px" height="40px">';
			else if (data['user_gender'] == 'F')
				post_a += '<img class="pfp" src="data/images.php?t=default_F" width="40px" height="40px">';
		}
		post_a += '<a class="fname profilelink" href="profile.php?id=' + data['user_id'] + '">' + data['user_firstname'] + ' ' + data['user_lastname'];
		if(data['verified'] > 0)
			post_a += '<i class="fa-solid fa-badge-check verified_color_' + data['verified'] + '" title="verified"></i>';
		post_a += '<span class="nickname">@' + data['user_nickname'] + '</span>';
		post_a += '</a>';
		post_a += '<a class="public">';
		post_a += '<span class="postedtime" title="' + timeConverter(data['post_time'] * 1000) + '">';
		switch(Number(data['post_public'])){
			case 2:
				post_a += '<i class="fa-solid fa-earth-americas" title="Public"></i>';
				break;
			case 1:
				post_a += '<i class="fa-solid fa-user-group" title="Friend only"></i>';
				break;
			default:
				post_a += '<i class="fa-solid fa-lock" title="Private"></i>';
				break;
		}
		post_a += " " + timeSince(data['post_time'] * 1000) + '</span>';
		post_a += '</a>';
		post_a += '</div>';
		post_a += '<br>';
		if(data['post_caption'].split(/\r\n|\r|\n/).length > 13 || data['post_caption'].length > 1196){
			post_a += '<div class="caption_box" id="caption_box-'+data['post_id']+'">';
			post_a += '<div class="caption_box_shadow" id="caption_box_shadow-'+data['post_id']+'"><p onclick="showMore(\''+data['post_id']+'\')">Show more</p></div>';
		}else{
			post_a += '<div class="caption_box">';
		}
		post_a += '<pre class="caption">' + data['post_caption'] + '</pre></div>';
		
		post_a += '<hr />';
		post_a += '<div class="comment-box" id="comment-box">';
		post_a += '</div>';
		post_a += '<div class="comment-form">';
		post_a += '<textarea class="comment-form-text" placeholder="Comment something..." id="comment-form-text"></textarea>';
		post_a += '<div class="send-btn" onclick="send_comment()"><i class="fa-solid fa-paper-plane-top"></i></div>';
		post_a += '</div>';
		
		_content_right.innerHTML = post_a;
		_load_comment(data['post_id'],0);
		
		if(isMobile()){
			_content_right.style.float = 'unset';
			_content_right.style.right = 'unset';
			_content_left.style.width = '100%';
			_content_right.style.width = '100%';
			_content_right.style.borderLeft = 'none';
			_content_right.style.borderRight = 'none';
			_content_right.style.margin = 'auto';
			_content_right.style.position = 'relative';
			document.getElementsByClassName('comment-form')[0].style.width = "100%";
		}
		$("#comment-box").scroll(function() {
			var obj = this;
			if(obj.scrollTop === (obj.scrollHeight - obj.offsetHeight)){
				var page = document.getElementById('page');
				if(page != -1){
					var nextPage = Number(page.value) + 1;
					_load_comment(get('id'), nextPage);
				}
			}
		});
		
		$("textarea").each(function() {
			this.setAttribute("style", "height:" + (this.scrollHeight*2.1) + "px;overflow-y:hidden;");
		}).on("input", function() {
			if(this.scrollHeight < 525){
				this.style.height = 0;
				this.style.height = (this.scrollHeight*2.1) + "px";
			}else{
				this.setAttribute("style", "height:525px;overflow-y:auto;");
			}
		});
		hljs.highlightAll();
		changeUrlWork();
	});
}
function _friend_request_toggle(id,accept){
	var ac = '';
	if(accept == 1)
		ac = 'accept';
	else
		ac = 'ignore';
	$.get("worker/friend_request_toggle.php?id=" + id + "&" + ac, function(data) {
		if(data['success'] == 1){
			var tgf = document.getElementById('toggle-fr-' + data['id']);
			var tgf_a = '';
			tgf_a += '<center>';
			tgf_a += 'accepted';
			tgf_a += '</center>';
			tgf.innerHTML = tgf_a;
		}
	});
}
function send_comment(){
	var text = document.getElementById("comment-form-text").value;
	var form_data = new FormData();
	form_data.append('comment', text);
	$.ajax({
		type: "POST",
		url: "/worker/comment.php?id=" + get("id"),
		processData: false,
		mimeType: "multipart/form-data",
		contentType: false,
		data: form_data,
		success: function (response) {
			$.get("worker/fetch_profile_info.php", function(data) {
				var cmt_box = document.getElementById('comment-box');
				var cmt_a = '';
				cmt_a += '<div class="comment">';
				if (data['pfp_media_id'] > 0) {
					cmt_a += '<img class="pfp comment-pfp" src="' + "data/images.php?t=profile&id=" + data['pfp_media_id'] + "&h=" + data['pfp_media_hash'] + '" width="40px" height="40px">';
				} else {
					if (data['user_gender'] == 'M')
						cmt_a += '<img class="pfp comment-pfp" src="data/images.php?t=default_M" width="40px" height="40px">';
					else if (data['user_gender'] == 'F')
						cmt_a += '<img class="pfp comment-pfp" src="data/images.php?t=default_F" width="40px" height="40px">';
				}
				cmt_a += '<a class="profilelink cmt_user_name" href="profile.php?id=' + data['user_id'] + '">' + data['user_firstname'] + ' ' + data['user_lastname'];
				if(data['verified'] > 0)
					cmt_a += '<i class="fa-solid fa-badge-check verified_color_' + data['verified'] + '" title="verified"></i>';
				cmt_a += '<span class="nickname">@' + data['user_nickname'] + '</span>';
				cmt_a += '</a>';
				cmt_a += '<span class="cmt_postedtime" title="' + timeConverter(Date.now()) + '">' + timeSince(Date.now()) + '</span>';
				cmt_a += '<pre class="comment-text">' + document.getElementById("comment-form-text").value + '</pre>';
				cmt_a += '</div>';
				cmt_a += '<hr/>';
				cmt_box.innerHTML = cmt_box.innerHTML + cmt_a;
				document.getElementById("comment-form-text").value = '';
				cmt_box.style.height = (Math.max(document.documentElement.clientHeight, window.innerHeight || 0) + 55) + "px";
				changeUrlWork();
			});
		}
	});
}
function _friend_toggle(){
	var special = document.getElementById("special");
	var form_data = new FormData();
	form_data.append(special.name, '1');
	$.ajax({
		type: "POST",
		url: "/worker/friend_toggle.php?id=" + get("id"),
		processData: false,
		mimeType: "multipart/form-data",
		contentType: false,
		data: form_data,
		success: function (response) {
			var special = document.getElementById("special");
			if(special.name == "request"){
				special.name = "remove";
				special.value = "Request Pending";
			}else{
				special.name = "request";
				special.value = "Send Friend Request";
			}
		}
	});
}
function showMore(id){
	var cap = document.getElementById('caption_box-' + id);
	cap.style.height = (cap.children[1].clientHeight + 15) + "px";
	document.getElementById('caption_box_shadow-' + id).style.display = "none";
}
function _online(){
	$.ajax({
		url: "/worker/online.php",
		type: 'GET'
	});
	changeUrlWork();
}
function _fr_count(){
	$.ajax({
		url: "/worker/friend_request_count.php",
		type: 'GET',
		success: function(res) {
			document.getElementById('friend_req_count').innerHTML = res;
		}
	});
}
function _load_hljs(){
	$.ajax({
		url: "/worker/hljs_lang_list.php",
		type: 'GET',
		success: function(res) {
			var hljs_lang_list= document.getElementById('hljs_lang_list');
			for(let i = 0; i < res.length; i++){
				var ScriptLink = document.createElement("script");
				ScriptLink.src = "/resources/js/highlight/"+res[i];
				hljs_lang_list.appendChild(ScriptLink);
			}
		}
	});
	changeUrlWork();
}
function _load_settings(){
	var tab = get("tab");
	if(tab == undefined)
		tab = 'account';
	var current_tab = document.getElementById('tab-' + tab);
	if(current_tab != null)
		current_tab.classList.add("active");
	var current_setting_tab = document.getElementById('setting-tab-' + tab);
	if(current_setting_tab != null)
		current_setting_tab.style.display = "block";
	$.ajax({
		url: "/worker/fetch_profile_setting_info.php",
		type: 'GET',
		success: function(res) {
			var usernickname = document.getElementById('usernickname');
			var userfirstname = document.getElementById('userfirstname');
			var userlastname = document.getElementById('userlastname');
			var malegender = document.getElementById('malegender');
			var femalegender = document.getElementById('femalegender');
			var email = document.getElementById('email');
			var user_hometown = document.getElementById('userhometown');
			var user_about = document.getElementById('userabout');
			var verified = document.getElementById('verified');
			var verified_text = document.getElementById('verified-text');
			var birthday = document.getElementById('birthday');
			var profile_picture = document.getElementById('profile_picture');
			var setting_profile_cover = document.getElementById('setting_profile_cover');
			var psrc = '';
			user_about.value = res['user_about'];
			user_hometown.value = res['user_hometown'];
			usernickname.value = res['user_nickname'];
			userfirstname.value = res['user_firstname'];
			userlastname.value = res['user_lastname'];
			email.value = res['user_email'];
			if(res['cover_media_id'] > 0)
				setting_profile_cover.style.backgroundImage = 'url("data/images.php?t=profile&id=' + res['cover_media_id'] + '&h=' + res['cover_media_hash'] + '")';
			if (res['pfp_media_id'] > 0) {
				psrc = 'data/images.php?t=profile&id=' + res['pfp_media_id'] + "&h=" + res['pfp_media_hash'];
			} else {
				if (res['user_gender'] == 'M')
					psrc = 'data/images.php?t=default_M';
				else if (res['user_gender'] == 'F')
					psrc = 'data/images.php?t=default_F';
			}
			profile_picture.src = psrc;
			birthday.value = birthdateConverter(res['user_birthdate'] * 1000);
			if(res['user_gender'] == 'F')
				femalegender.checked = true;
			else
				malegender.checked = true;
			if(res['verified'] > 0){
				switch(Number(res['verified'])){
					case 1:
						verified_text.innerText = "Standard Verified";
						break;
					case 2:
						verified_text.innerText = "Moderator Verified";
						break;
					case 20:
						verified_text.innerText = "Admin Verified";
						break;
					default:
						verified_text.innerText = "Special Verified";
						break;
				}
				verified.classList.add("fa-solid");
				verified.classList.add("fa-badge-check");
				verified.classList.add('verified_color_' + res['verified']);
			}else{
				verified_text.innerText = "Not Verified";
				verified.classList.add("fa-solid");
				verified.classList.add("fa-x");
			}
			
				
		}
	});
	changeUrlWork();
}

function _post_feed(){
	var file_data = document.getElementById("imagefile");
	var is_private = document.getElementById('private').value;
	var form_data = new FormData();
	form_data.append("post", 'post');
	form_data.append("private", is_private);
	form_data.append("caption", document.getElementsByTagName("textarea")[0].value);
	if(file_data.files.length > 0)
		form_data.append("fileUpload", file_data.files[0]);
	$.ajax({
		type: "POST",
		url: "/worker/post.php",
		processData: false,
		mimeType: "multipart/form-data",
		contentType: false,
		data: form_data,
		success: function (response) {
			if(response == "success")
				fetch_post("fetch_post.php");
		}
	});
}
function _share_feed(){
	var file_data = document.getElementById("imagefile");
	var is_private = document.getElementById('private').value;
	var post_id = document.getElementById('post_id').value;
	var form_data = new FormData();
	form_data.append("post", 'post');
	form_data.append("private", is_private);
	form_data.append("post_id", post_id);
	form_data.append("caption", document.getElementsByTagName("textarea")[0].value);
	if(file_data.files.length > 0)
		form_data.append("fileUpload", file_data.files[0]);
	$.ajax({
		type: "POST",
		url: "/worker/share.php",
		processData: false,
		mimeType: "multipart/form-data",
		contentType: false,
		data: form_data,
		success: function (response) {
			var id = document.getElementById('post_id').value;
			var splt = data.split(";");
			zTemplate(document.getElementById("post-share-count-" + id), {
				"counter": parseInt(splt[1])
			});
			setTimeout(null,100);
			fetch_post("fetch_post.php");
		}
	});
}

function validatePost(type){
	var required = document.getElementsByClassName("required");
	var caption = document.getElementsByTagName("textarea")[0].value;
	required[0].style.display = "none";
	if(type == 0)
		_post_feed();
	else
		_share_feed();
	document.getElementById("imagefile").value = null;
	caption.value = '';
	document.getElementById("imagefile").style.display = 'none';
	modal_close();
	return false;
}
window.onload = function() {
	_load_hljs();
}
document.addEventListener('readystatechange', function(e){
	if(document.readyState == "complete"){
		_online();
		_fr_count();
		if(document.getElementById("online_status").value == 1)
			setInterval(_online, 300000);
		setInterval(_fr_count, 300000);
		onResizeEvent();
		changeUrlWork();
	}
});
function isMobile() {
	let check = false;
	(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
				
	return check;
};
function changeUrlWork(){
	if(isMobile()){
		var cpost_box = document.getElementsByClassName('createpost_box');
		if(cpost_box != null){
			if(cpost_box.length > 0){
				cpost_box[0].style.width = "90%";
				var ipb = document.getElementsByClassName('input_box');
				ipb[0].style.height = "80px";
				ipb[0].style.marginLeft = "88px";
				ipb[0].style.marginTop = "-90px";
				ipb[0].style.width = "88%";
				var pfp_box = document.getElementById('pfp_box');
				pfp_box.style.height = "80px";
				pfp_box.style.width = "80px";
			}
		}
		document.getElementsByClassName('usernav')[0].style.fontSize = "150%";
		var container = document.getElementsByClassName('container');
		if(container != null){
			container[0].style.width = "100%";
		}
		document.getElementsByTagName('body')[0].style.zoom = "0.5";;
		document.getElementsByTagName('body')[0].style.fontSize = "200%";
	}
	$("a").each(function() {
		if(this.href != '' && this.className != "post-link"){
			if(!this.hasAttribute("linked")){
				this.setAttribute("linked", "true");
				this.addEventListener("click", function(e) {
					e.preventDefault();
					changeUrl(this.pathname + this.search);
				});
			}
		}
	});
}
window.addEventListener ("resize", onResizeEvent, true);
function onResizeEvent() {
	if(!isMobile()){
		var bodyElement = document.getElementsByTagName("BODY")[0];
		newWidth = bodyElement.offsetWidth;
		var feed = document.getElementById('feed');
		var custom_style = document.getElementById('custom_style');
		if(feed != null && custom_style != null) feed.style.marginTop = "-230px";
		if(custom_style != null) custom_style.innerHTML = "<style>#feed>.post{margin-right:20% !important;}</style>";
		if(newWidth < 1708 && newWidth < 1350 && newWidth < 1670){
			if(feed != null) feed.style.marginTop = "0px";
		}else if(newWidth >= 1350 && newWidth < 1708 && newWidth < 1670){
			if(custom_style != null) custom_style.innerHTML = "<style>#feed>.post{margin-right:5% !important;}</style>";
		}else if(newWidth >= 1350 && newWidth < 1708 && newWidth >= 1670){
			if(custom_style != null) custom_style.innerHTML = "<style>#feed>.post{margin-right:15% !important;}</style>";
		}
	}
}
function isBottom() {
	var calc = $(window).scrollTop()*2.15 + $(window).height() > $(document).height() - 200;
	return calc;
}
$(window).scroll(function() {
	var urlPath = window.location.pathname;
	if($(window).height() != $(document).height()){
		if((($(window).scrollTop() + $(window).height() > $(document).height() - 100) && !isMobile()) || (isBottom() && isMobile())) {
			if ((urlPath === "/home.php" || urlPath === "home.php") || (urlPath.substring(0,12) === "/profile.php" || urlPath.substring(0,11) === "profile.php")){
				var page = document.getElementById('page');
				if(page.value != -1){
					var nextPage = Number(page.value) + 1;
					if (urlPath.substring(0,12) === "/profile.php" || urlPath.substring(0,11) === "profile.php"){
						var add_header = "";
						if(urlPath.substring(0,16) === "/profile.php?id=" || urlPath.substring(0,15) === "profile.php?id=")
							add_header = "&id=" + get("id");
						fetch_post("fetch_profile_post.php?page=" + nextPage + add_header);
					}else{
						fetch_post("fetch_post.php?page=" + nextPage);
					}
					page.value = nextPage;
				}
			} else if(urlPath === "/friends.php" || urlPath === "friends.php"){
				var page = document.getElementById('page');
				if(page.value != -1){
					var nextPage = Number(page.value) + 1;
					fetch_friend_list('fetch_friend_list.php?page=' + nextPage);
					page.value = nextPage;
				}
			}else if(urlPath === "/requests.php" || urlPath === "requests.php"){
				var page = document.getElementById('page');
				if(page.value != -1){
					var nextPage = Number(page.value) + 1;
					fetch_friend_request('fetch_friend_request.php?page=' + nextPage);
					page.value = nextPage;
				}
			}
		}
	}
});
