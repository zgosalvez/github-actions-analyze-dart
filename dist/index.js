'use strict';

var require$$0 = require('os');
var require$$0$1 = require('crypto');
var require$$1 = require('fs');
var require$$1$1 = require('path');
var require$$0$3 = require('string_decoder');
var require$$1$2 = require('events');
var require$$2 = require('child_process');
var require$$0$2 = require('assert');
var require$$6 = require('timers');
var require$$1$3 = require('@actions/exec');

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var src = {};

var core = {};

var command = {};

var utils = {};

var hasRequiredUtils;

function requireUtils () {
	if (hasRequiredUtils) return utils;
	hasRequiredUtils = 1;
	// We use any as a valid input type
	/* eslint-disable @typescript-eslint/no-explicit-any */
	Object.defineProperty(utils, "__esModule", { value: true });
	utils.toCommandValue = toCommandValue;
	utils.toCommandProperties = toCommandProperties;
	/**
	 * Sanitizes an input into a string so it can be passed into issueCommand safely
	 * @param input input to sanitize into a string
	 */
	function toCommandValue(input) {
	    if (input === null || input === undefined) {
	        return '';
	    }
	    else if (typeof input === 'string' || input instanceof String) {
	        return input;
	    }
	    return JSON.stringify(input);
	}
	/**
	 *
	 * @param annotationProperties
	 * @returns The command properties to send with the actual annotation command
	 * See IssueCommandProperties: https://github.com/actions/runner/blob/main/src/Runner.Worker/ActionCommandManager.cs#L646
	 */
	function toCommandProperties(annotationProperties) {
	    if (!Object.keys(annotationProperties).length) {
	        return {};
	    }
	    return {
	        title: annotationProperties.title,
	        file: annotationProperties.file,
	        line: annotationProperties.startLine,
	        endLine: annotationProperties.endLine,
	        col: annotationProperties.startColumn,
	        endColumn: annotationProperties.endColumn
	    };
	}
	
	return utils;
}

var hasRequiredCommand;

function requireCommand () {
	if (hasRequiredCommand) return command;
	hasRequiredCommand = 1;
	var __createBinding = (command && command.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (command && command.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (command && command.__importStar) || (function () {
	    var ownKeys = function(o) {
	        ownKeys = Object.getOwnPropertyNames || function (o) {
	            var ar = [];
	            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
	            return ar;
	        };
	        return ownKeys(o);
	    };
	    return function (mod) {
	        if (mod && mod.__esModule) return mod;
	        var result = {};
	        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
	        __setModuleDefault(result, mod);
	        return result;
	    };
	})();
	Object.defineProperty(command, "__esModule", { value: true });
	command.issueCommand = issueCommand;
	command.issue = issue;
	const os = __importStar(require$$0);
	const utils_1 = requireUtils();
	/**
	 * Issues a command to the GitHub Actions runner
	 *
	 * @param command - The command name to issue
	 * @param properties - Additional properties for the command (key-value pairs)
	 * @param message - The message to include with the command
	 * @remarks
	 * This function outputs a specially formatted string to stdout that the Actions
	 * runner interprets as a command. These commands can control workflow behavior,
	 * set outputs, create annotations, mask values, and more.
	 *
	 * Command Format:
	 *   ::name key=value,key=value::message
	 *
	 * @example
	 * ```typescript
	 * // Issue a warning annotation
	 * issueCommand('warning', {}, 'This is a warning message');
	 * // Output: ::warning::This is a warning message
	 *
	 * // Set an environment variable
	 * issueCommand('set-env', { name: 'MY_VAR' }, 'some value');
	 * // Output: ::set-env name=MY_VAR::some value
	 *
	 * // Add a secret mask
	 * issueCommand('add-mask', {}, 'secretValue123');
	 * // Output: ::add-mask::secretValue123
	 * ```
	 *
	 * @internal
	 * This is an internal utility function that powers the public API functions
	 * such as setSecret, warning, error, and exportVariable.
	 */
	function issueCommand(command, properties, message) {
	    const cmd = new Command(command, properties, message);
	    process.stdout.write(cmd.toString() + os.EOL);
	}
	function issue(name, message = '') {
	    issueCommand(name, {}, message);
	}
	const CMD_STRING = '::';
	class Command {
	    constructor(command, properties, message) {
	        if (!command) {
	            command = 'missing.command';
	        }
	        this.command = command;
	        this.properties = properties;
	        this.message = message;
	    }
	    toString() {
	        let cmdStr = CMD_STRING + this.command;
	        if (this.properties && Object.keys(this.properties).length > 0) {
	            cmdStr += ' ';
	            let first = true;
	            for (const key in this.properties) {
	                if (this.properties.hasOwnProperty(key)) {
	                    const val = this.properties[key];
	                    if (val) {
	                        if (first) {
	                            first = false;
	                        }
	                        else {
	                            cmdStr += ',';
	                        }
	                        cmdStr += `${key}=${escapeProperty(val)}`;
	                    }
	                }
	            }
	        }
	        cmdStr += `${CMD_STRING}${escapeData(this.message)}`;
	        return cmdStr;
	    }
	}
	function escapeData(s) {
	    return (0, utils_1.toCommandValue)(s)
	        .replace(/%/g, '%25')
	        .replace(/\r/g, '%0D')
	        .replace(/\n/g, '%0A');
	}
	function escapeProperty(s) {
	    return (0, utils_1.toCommandValue)(s)
	        .replace(/%/g, '%25')
	        .replace(/\r/g, '%0D')
	        .replace(/\n/g, '%0A')
	        .replace(/:/g, '%3A')
	        .replace(/,/g, '%2C');
	}
	
	return command;
}

var fileCommand = {};

var hasRequiredFileCommand;

function requireFileCommand () {
	if (hasRequiredFileCommand) return fileCommand;
	hasRequiredFileCommand = 1;
	// For internal use, subject to change.
	var __createBinding = (fileCommand && fileCommand.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (fileCommand && fileCommand.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (fileCommand && fileCommand.__importStar) || (function () {
	    var ownKeys = function(o) {
	        ownKeys = Object.getOwnPropertyNames || function (o) {
	            var ar = [];
	            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
	            return ar;
	        };
	        return ownKeys(o);
	    };
	    return function (mod) {
	        if (mod && mod.__esModule) return mod;
	        var result = {};
	        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
	        __setModuleDefault(result, mod);
	        return result;
	    };
	})();
	Object.defineProperty(fileCommand, "__esModule", { value: true });
	fileCommand.issueFileCommand = issueFileCommand;
	fileCommand.prepareKeyValueMessage = prepareKeyValueMessage;
	// We use any as a valid input type
	/* eslint-disable @typescript-eslint/no-explicit-any */
	const crypto = __importStar(require$$0$1);
	const fs = __importStar(require$$1);
	const os = __importStar(require$$0);
	const utils_1 = requireUtils();
	function issueFileCommand(command, message) {
	    const filePath = process.env[`GITHUB_${command}`];
	    if (!filePath) {
	        throw new Error(`Unable to find environment variable for file command ${command}`);
	    }
	    if (!fs.existsSync(filePath)) {
	        throw new Error(`Missing file at path: ${filePath}`);
	    }
	    fs.appendFileSync(filePath, `${(0, utils_1.toCommandValue)(message)}${os.EOL}`, {
	        encoding: 'utf8'
	    });
	}
	function prepareKeyValueMessage(key, value) {
	    const delimiter = `ghadelimiter_${crypto.randomUUID()}`;
	    const convertedValue = (0, utils_1.toCommandValue)(value);
	    // These should realistically never happen, but just in case someone finds a
	    // way to exploit uuid generation let's not allow keys or values that contain
	    // the delimiter.
	    if (key.includes(delimiter)) {
	        throw new Error(`Unexpected input: name should not contain the delimiter "${delimiter}"`);
	    }
	    if (convertedValue.includes(delimiter)) {
	        throw new Error(`Unexpected input: value should not contain the delimiter "${delimiter}"`);
	    }
	    return `${key}<<${delimiter}${os.EOL}${convertedValue}${os.EOL}${delimiter}`;
	}
	
	return fileCommand;
}

var summary = {};

var hasRequiredSummary;

function requireSummary () {
	if (hasRequiredSummary) return summary;
	hasRequiredSummary = 1;
	(function (exports$1) {
		var __awaiter = (summary && summary.__awaiter) || function (thisArg, _arguments, P, generator) {
		    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
		    return new (P || (P = Promise))(function (resolve, reject) {
		        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
		        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
		        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
		        step((generator = generator.apply(thisArg, _arguments || [])).next());
		    });
		};
		Object.defineProperty(exports$1, "__esModule", { value: true });
		exports$1.summary = exports$1.markdownSummary = exports$1.SUMMARY_DOCS_URL = exports$1.SUMMARY_ENV_VAR = void 0;
		const os_1 = require$$0;
		const fs_1 = require$$1;
		const { access, appendFile, writeFile } = fs_1.promises;
		exports$1.SUMMARY_ENV_VAR = 'GITHUB_STEP_SUMMARY';
		exports$1.SUMMARY_DOCS_URL = 'https://docs.github.com/actions/using-workflows/workflow-commands-for-github-actions#adding-a-job-summary';
		class Summary {
		    constructor() {
		        this._buffer = '';
		    }
		    /**
		     * Finds the summary file path from the environment, rejects if env var is not found or file does not exist
		     * Also checks r/w permissions.
		     *
		     * @returns step summary file path
		     */
		    filePath() {
		        return __awaiter(this, void 0, void 0, function* () {
		            if (this._filePath) {
		                return this._filePath;
		            }
		            const pathFromEnv = process.env[exports$1.SUMMARY_ENV_VAR];
		            if (!pathFromEnv) {
		                throw new Error(`Unable to find environment variable for $${exports$1.SUMMARY_ENV_VAR}. Check if your runtime environment supports job summaries.`);
		            }
		            try {
		                yield access(pathFromEnv, fs_1.constants.R_OK | fs_1.constants.W_OK);
		            }
		            catch (_a) {
		                throw new Error(`Unable to access summary file: '${pathFromEnv}'. Check if the file has correct read/write permissions.`);
		            }
		            this._filePath = pathFromEnv;
		            return this._filePath;
		        });
		    }
		    /**
		     * Wraps content in an HTML tag, adding any HTML attributes
		     *
		     * @param {string} tag HTML tag to wrap
		     * @param {string | null} content content within the tag
		     * @param {[attribute: string]: string} attrs key-value list of HTML attributes to add
		     *
		     * @returns {string} content wrapped in HTML element
		     */
		    wrap(tag, content, attrs = {}) {
		        const htmlAttrs = Object.entries(attrs)
		            .map(([key, value]) => ` ${key}="${value}"`)
		            .join('');
		        if (!content) {
		            return `<${tag}${htmlAttrs}>`;
		        }
		        return `<${tag}${htmlAttrs}>${content}</${tag}>`;
		    }
		    /**
		     * Writes text in the buffer to the summary buffer file and empties buffer. Will append by default.
		     *
		     * @param {SummaryWriteOptions} [options] (optional) options for write operation
		     *
		     * @returns {Promise<Summary>} summary instance
		     */
		    write(options) {
		        return __awaiter(this, void 0, void 0, function* () {
		            const overwrite = !!(options === null || options === void 0 ? void 0 : options.overwrite);
		            const filePath = yield this.filePath();
		            const writeFunc = overwrite ? writeFile : appendFile;
		            yield writeFunc(filePath, this._buffer, { encoding: 'utf8' });
		            return this.emptyBuffer();
		        });
		    }
		    /**
		     * Clears the summary buffer and wipes the summary file
		     *
		     * @returns {Summary} summary instance
		     */
		    clear() {
		        return __awaiter(this, void 0, void 0, function* () {
		            return this.emptyBuffer().write({ overwrite: true });
		        });
		    }
		    /**
		     * Returns the current summary buffer as a string
		     *
		     * @returns {string} string of summary buffer
		     */
		    stringify() {
		        return this._buffer;
		    }
		    /**
		     * If the summary buffer is empty
		     *
		     * @returns {boolen} true if the buffer is empty
		     */
		    isEmptyBuffer() {
		        return this._buffer.length === 0;
		    }
		    /**
		     * Resets the summary buffer without writing to summary file
		     *
		     * @returns {Summary} summary instance
		     */
		    emptyBuffer() {
		        this._buffer = '';
		        return this;
		    }
		    /**
		     * Adds raw text to the summary buffer
		     *
		     * @param {string} text content to add
		     * @param {boolean} [addEOL=false] (optional) append an EOL to the raw text (default: false)
		     *
		     * @returns {Summary} summary instance
		     */
		    addRaw(text, addEOL = false) {
		        this._buffer += text;
		        return addEOL ? this.addEOL() : this;
		    }
		    /**
		     * Adds the operating system-specific end-of-line marker to the buffer
		     *
		     * @returns {Summary} summary instance
		     */
		    addEOL() {
		        return this.addRaw(os_1.EOL);
		    }
		    /**
		     * Adds an HTML codeblock to the summary buffer
		     *
		     * @param {string} code content to render within fenced code block
		     * @param {string} lang (optional) language to syntax highlight code
		     *
		     * @returns {Summary} summary instance
		     */
		    addCodeBlock(code, lang) {
		        const attrs = Object.assign({}, (lang && { lang }));
		        const element = this.wrap('pre', this.wrap('code', code), attrs);
		        return this.addRaw(element).addEOL();
		    }
		    /**
		     * Adds an HTML list to the summary buffer
		     *
		     * @param {string[]} items list of items to render
		     * @param {boolean} [ordered=false] (optional) if the rendered list should be ordered or not (default: false)
		     *
		     * @returns {Summary} summary instance
		     */
		    addList(items, ordered = false) {
		        const tag = ordered ? 'ol' : 'ul';
		        const listItems = items.map(item => this.wrap('li', item)).join('');
		        const element = this.wrap(tag, listItems);
		        return this.addRaw(element).addEOL();
		    }
		    /**
		     * Adds an HTML table to the summary buffer
		     *
		     * @param {SummaryTableCell[]} rows table rows
		     *
		     * @returns {Summary} summary instance
		     */
		    addTable(rows) {
		        const tableBody = rows
		            .map(row => {
		            const cells = row
		                .map(cell => {
		                if (typeof cell === 'string') {
		                    return this.wrap('td', cell);
		                }
		                const { header, data, colspan, rowspan } = cell;
		                const tag = header ? 'th' : 'td';
		                const attrs = Object.assign(Object.assign({}, (colspan && { colspan })), (rowspan && { rowspan }));
		                return this.wrap(tag, data, attrs);
		            })
		                .join('');
		            return this.wrap('tr', cells);
		        })
		            .join('');
		        const element = this.wrap('table', tableBody);
		        return this.addRaw(element).addEOL();
		    }
		    /**
		     * Adds a collapsable HTML details element to the summary buffer
		     *
		     * @param {string} label text for the closed state
		     * @param {string} content collapsable content
		     *
		     * @returns {Summary} summary instance
		     */
		    addDetails(label, content) {
		        const element = this.wrap('details', this.wrap('summary', label) + content);
		        return this.addRaw(element).addEOL();
		    }
		    /**
		     * Adds an HTML image tag to the summary buffer
		     *
		     * @param {string} src path to the image you to embed
		     * @param {string} alt text description of the image
		     * @param {SummaryImageOptions} options (optional) addition image attributes
		     *
		     * @returns {Summary} summary instance
		     */
		    addImage(src, alt, options) {
		        const { width, height } = options || {};
		        const attrs = Object.assign(Object.assign({}, (width && { width })), (height && { height }));
		        const element = this.wrap('img', null, Object.assign({ src, alt }, attrs));
		        return this.addRaw(element).addEOL();
		    }
		    /**
		     * Adds an HTML section heading element
		     *
		     * @param {string} text heading text
		     * @param {number | string} [level=1] (optional) the heading level, default: 1
		     *
		     * @returns {Summary} summary instance
		     */
		    addHeading(text, level) {
		        const tag = `h${level}`;
		        const allowedTag = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)
		            ? tag
		            : 'h1';
		        const element = this.wrap(allowedTag, text);
		        return this.addRaw(element).addEOL();
		    }
		    /**
		     * Adds an HTML thematic break (<hr>) to the summary buffer
		     *
		     * @returns {Summary} summary instance
		     */
		    addSeparator() {
		        const element = this.wrap('hr', null);
		        return this.addRaw(element).addEOL();
		    }
		    /**
		     * Adds an HTML line break (<br>) to the summary buffer
		     *
		     * @returns {Summary} summary instance
		     */
		    addBreak() {
		        const element = this.wrap('br', null);
		        return this.addRaw(element).addEOL();
		    }
		    /**
		     * Adds an HTML blockquote to the summary buffer
		     *
		     * @param {string} text quote text
		     * @param {string} cite (optional) citation url
		     *
		     * @returns {Summary} summary instance
		     */
		    addQuote(text, cite) {
		        const attrs = Object.assign({}, (cite && { cite }));
		        const element = this.wrap('blockquote', text, attrs);
		        return this.addRaw(element).addEOL();
		    }
		    /**
		     * Adds an HTML anchor tag to the summary buffer
		     *
		     * @param {string} text link text/content
		     * @param {string} href hyperlink
		     *
		     * @returns {Summary} summary instance
		     */
		    addLink(text, href) {
		        const element = this.wrap('a', text, { href });
		        return this.addRaw(element).addEOL();
		    }
		}
		const _summary = new Summary();
		/**
		 * @deprecated use `core.summary`
		 */
		exports$1.markdownSummary = _summary;
		exports$1.summary = _summary;
		
	} (summary));
	return summary;
}

var pathUtils = {};

var hasRequiredPathUtils;

function requirePathUtils () {
	if (hasRequiredPathUtils) return pathUtils;
	hasRequiredPathUtils = 1;
	var __createBinding = (pathUtils && pathUtils.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (pathUtils && pathUtils.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (pathUtils && pathUtils.__importStar) || (function () {
	    var ownKeys = function(o) {
	        ownKeys = Object.getOwnPropertyNames || function (o) {
	            var ar = [];
	            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
	            return ar;
	        };
	        return ownKeys(o);
	    };
	    return function (mod) {
	        if (mod && mod.__esModule) return mod;
	        var result = {};
	        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
	        __setModuleDefault(result, mod);
	        return result;
	    };
	})();
	Object.defineProperty(pathUtils, "__esModule", { value: true });
	pathUtils.toPosixPath = toPosixPath;
	pathUtils.toWin32Path = toWin32Path;
	pathUtils.toPlatformPath = toPlatformPath;
	const path = __importStar(require$$1$1);
	/**
	 * toPosixPath converts the given path to the posix form. On Windows, \\ will be
	 * replaced with /.
	 *
	 * @param pth. Path to transform.
	 * @return string Posix path.
	 */
	function toPosixPath(pth) {
	    return pth.replace(/[\\]/g, '/');
	}
	/**
	 * toWin32Path converts the given path to the win32 form. On Linux, / will be
	 * replaced with \\.
	 *
	 * @param pth. Path to transform.
	 * @return string Win32 path.
	 */
	function toWin32Path(pth) {
	    return pth.replace(/[/]/g, '\\');
	}
	/**
	 * toPlatformPath converts the given path to a platform-specific path. It does
	 * this by replacing instances of / and \ with the platform-specific path
	 * separator.
	 *
	 * @param pth The path to platformize.
	 * @return string The platform-specific path.
	 */
	function toPlatformPath(pth) {
	    return pth.replace(/[/\\]/g, path.sep);
	}
	
	return pathUtils;
}

var platform = {};

var exec = {};

var toolrunner = {};

var io = {};

var ioUtil = {};

var hasRequiredIoUtil;

function requireIoUtil () {
	if (hasRequiredIoUtil) return ioUtil;
	hasRequiredIoUtil = 1;
	(function (exports$1) {
		var __createBinding = (ioUtil && ioUtil.__createBinding) || (Object.create ? (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    var desc = Object.getOwnPropertyDescriptor(m, k);
		    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
		      desc = { enumerable: true, get: function() { return m[k]; } };
		    }
		    Object.defineProperty(o, k2, desc);
		}) : (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    o[k2] = m[k];
		}));
		var __setModuleDefault = (ioUtil && ioUtil.__setModuleDefault) || (Object.create ? (function(o, v) {
		    Object.defineProperty(o, "default", { enumerable: true, value: v });
		}) : function(o, v) {
		    o["default"] = v;
		});
		var __importStar = (ioUtil && ioUtil.__importStar) || (function () {
		    var ownKeys = function(o) {
		        ownKeys = Object.getOwnPropertyNames || function (o) {
		            var ar = [];
		            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
		            return ar;
		        };
		        return ownKeys(o);
		    };
		    return function (mod) {
		        if (mod && mod.__esModule) return mod;
		        var result = {};
		        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
		        __setModuleDefault(result, mod);
		        return result;
		    };
		})();
		var __awaiter = (ioUtil && ioUtil.__awaiter) || function (thisArg, _arguments, P, generator) {
		    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
		    return new (P || (P = Promise))(function (resolve, reject) {
		        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
		        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
		        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
		        step((generator = generator.apply(thisArg, _arguments || [])).next());
		    });
		};
		var _a;
		Object.defineProperty(exports$1, "__esModule", { value: true });
		exports$1.READONLY = exports$1.UV_FS_O_EXLOCK = exports$1.IS_WINDOWS = exports$1.unlink = exports$1.symlink = exports$1.stat = exports$1.rmdir = exports$1.rm = exports$1.rename = exports$1.readdir = exports$1.open = exports$1.mkdir = exports$1.lstat = exports$1.copyFile = exports$1.chmod = void 0;
		exports$1.readlink = readlink;
		exports$1.exists = exists;
		exports$1.isDirectory = isDirectory;
		exports$1.isRooted = isRooted;
		exports$1.tryGetExecutablePath = tryGetExecutablePath;
		exports$1.getCmdPath = getCmdPath;
		const fs = __importStar(require$$1);
		const path = __importStar(require$$1$1);
		_a = fs.promises
		// export const {open} = 'fs'
		, exports$1.chmod = _a.chmod, exports$1.copyFile = _a.copyFile, exports$1.lstat = _a.lstat, exports$1.mkdir = _a.mkdir, exports$1.open = _a.open, exports$1.readdir = _a.readdir, exports$1.rename = _a.rename, exports$1.rm = _a.rm, exports$1.rmdir = _a.rmdir, exports$1.stat = _a.stat, exports$1.symlink = _a.symlink, exports$1.unlink = _a.unlink;
		// export const {open} = 'fs'
		exports$1.IS_WINDOWS = process.platform === 'win32';
		/**
		 * Custom implementation of readlink to ensure Windows junctions
		 * maintain trailing backslash for backward compatibility with Node.js < 24
		 *
		 * In Node.js 20, Windows junctions (directory symlinks) always returned paths
		 * with trailing backslashes. Node.js 24 removed this behavior, which breaks
		 * code that relied on this format for path operations.
		 *
		 * This implementation restores the Node 20 behavior by adding a trailing
		 * backslash to all junction results on Windows.
		 */
		function readlink(fsPath) {
		    return __awaiter(this, void 0, void 0, function* () {
		        const result = yield fs.promises.readlink(fsPath);
		        // On Windows, restore Node 20 behavior: add trailing backslash to all results
		        // since junctions on Windows are always directory links
		        if (exports$1.IS_WINDOWS && !result.endsWith('\\')) {
		            return `${result}\\`;
		        }
		        return result;
		    });
		}
		// See https://github.com/nodejs/node/blob/d0153aee367422d0858105abec186da4dff0a0c5/deps/uv/include/uv/win.h#L691
		exports$1.UV_FS_O_EXLOCK = 0x10000000;
		exports$1.READONLY = fs.constants.O_RDONLY;
		function exists(fsPath) {
		    return __awaiter(this, void 0, void 0, function* () {
		        try {
		            yield (0, exports$1.stat)(fsPath);
		        }
		        catch (err) {
		            if (err.code === 'ENOENT') {
		                return false;
		            }
		            throw err;
		        }
		        return true;
		    });
		}
		function isDirectory(fsPath_1) {
		    return __awaiter(this, arguments, void 0, function* (fsPath, useStat = false) {
		        const stats = useStat ? yield (0, exports$1.stat)(fsPath) : yield (0, exports$1.lstat)(fsPath);
		        return stats.isDirectory();
		    });
		}
		/**
		 * On OSX/Linux, true if path starts with '/'. On Windows, true for paths like:
		 * \, \hello, \\hello\share, C:, and C:\hello (and corresponding alternate separator cases).
		 */
		function isRooted(p) {
		    p = normalizeSeparators(p);
		    if (!p) {
		        throw new Error('isRooted() parameter "p" cannot be empty');
		    }
		    if (exports$1.IS_WINDOWS) {
		        return (p.startsWith('\\') || /^[A-Z]:/i.test(p) // e.g. \ or \hello or \\hello
		        ); // e.g. C: or C:\hello
		    }
		    return p.startsWith('/');
		}
		/**
		 * Best effort attempt to determine whether a file exists and is executable.
		 * @param filePath    file path to check
		 * @param extensions  additional file extensions to try
		 * @return if file exists and is executable, returns the file path. otherwise empty string.
		 */
		function tryGetExecutablePath(filePath, extensions) {
		    return __awaiter(this, void 0, void 0, function* () {
		        let stats = undefined;
		        try {
		            // test file exists
		            stats = yield (0, exports$1.stat)(filePath);
		        }
		        catch (err) {
		            if (err.code !== 'ENOENT') {
		                // eslint-disable-next-line no-console
		                console.log(`Unexpected error attempting to determine if executable file exists '${filePath}': ${err}`);
		            }
		        }
		        if (stats && stats.isFile()) {
		            if (exports$1.IS_WINDOWS) {
		                // on Windows, test for valid extension
		                const upperExt = path.extname(filePath).toUpperCase();
		                if (extensions.some(validExt => validExt.toUpperCase() === upperExt)) {
		                    return filePath;
		                }
		            }
		            else {
		                if (isUnixExecutable(stats)) {
		                    return filePath;
		                }
		            }
		        }
		        // try each extension
		        const originalFilePath = filePath;
		        for (const extension of extensions) {
		            filePath = originalFilePath + extension;
		            stats = undefined;
		            try {
		                stats = yield (0, exports$1.stat)(filePath);
		            }
		            catch (err) {
		                if (err.code !== 'ENOENT') {
		                    // eslint-disable-next-line no-console
		                    console.log(`Unexpected error attempting to determine if executable file exists '${filePath}': ${err}`);
		                }
		            }
		            if (stats && stats.isFile()) {
		                if (exports$1.IS_WINDOWS) {
		                    // preserve the case of the actual file (since an extension was appended)
		                    try {
		                        const directory = path.dirname(filePath);
		                        const upperName = path.basename(filePath).toUpperCase();
		                        for (const actualName of yield (0, exports$1.readdir)(directory)) {
		                            if (upperName === actualName.toUpperCase()) {
		                                filePath = path.join(directory, actualName);
		                                break;
		                            }
		                        }
		                    }
		                    catch (err) {
		                        // eslint-disable-next-line no-console
		                        console.log(`Unexpected error attempting to determine the actual case of the file '${filePath}': ${err}`);
		                    }
		                    return filePath;
		                }
		                else {
		                    if (isUnixExecutable(stats)) {
		                        return filePath;
		                    }
		                }
		            }
		        }
		        return '';
		    });
		}
		function normalizeSeparators(p) {
		    p = p || '';
		    if (exports$1.IS_WINDOWS) {
		        // convert slashes on Windows
		        p = p.replace(/\//g, '\\');
		        // remove redundant slashes
		        return p.replace(/\\\\+/g, '\\');
		    }
		    // remove redundant slashes
		    return p.replace(/\/\/+/g, '/');
		}
		// on Mac/Linux, test the execute bit
		//     R   W  X  R  W X R W X
		//   256 128 64 32 16 8 4 2 1
		function isUnixExecutable(stats) {
		    return ((stats.mode & 1) > 0 ||
		        ((stats.mode & 8) > 0 &&
		            process.getgid !== undefined &&
		            stats.gid === process.getgid()) ||
		        ((stats.mode & 64) > 0 &&
		            process.getuid !== undefined &&
		            stats.uid === process.getuid()));
		}
		// Get the path of cmd.exe in windows
		function getCmdPath() {
		    var _a;
		    return (_a = process.env['COMSPEC']) !== null && _a !== void 0 ? _a : `cmd.exe`;
		}
		
	} (ioUtil));
	return ioUtil;
}

var hasRequiredIo;

function requireIo () {
	if (hasRequiredIo) return io;
	hasRequiredIo = 1;
	var __createBinding = (io && io.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (io && io.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (io && io.__importStar) || (function () {
	    var ownKeys = function(o) {
	        ownKeys = Object.getOwnPropertyNames || function (o) {
	            var ar = [];
	            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
	            return ar;
	        };
	        return ownKeys(o);
	    };
	    return function (mod) {
	        if (mod && mod.__esModule) return mod;
	        var result = {};
	        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
	        __setModuleDefault(result, mod);
	        return result;
	    };
	})();
	var __awaiter = (io && io.__awaiter) || function (thisArg, _arguments, P, generator) {
	    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	Object.defineProperty(io, "__esModule", { value: true });
	io.cp = cp;
	io.mv = mv;
	io.rmRF = rmRF;
	io.mkdirP = mkdirP;
	io.which = which;
	io.findInPath = findInPath;
	const assert_1 = require$$0$2;
	const path = __importStar(require$$1$1);
	const ioUtil = __importStar(requireIoUtil());
	/**
	 * Copies a file or folder.
	 * Based off of shelljs - https://github.com/shelljs/shelljs/blob/9237f66c52e5daa40458f94f9565e18e8132f5a6/src/cp.js
	 *
	 * @param     source    source path
	 * @param     dest      destination path
	 * @param     options   optional. See CopyOptions.
	 */
	function cp(source_1, dest_1) {
	    return __awaiter(this, arguments, void 0, function* (source, dest, options = {}) {
	        const { force, recursive, copySourceDirectory } = readCopyOptions(options);
	        const destStat = (yield ioUtil.exists(dest)) ? yield ioUtil.stat(dest) : null;
	        // Dest is an existing file, but not forcing
	        if (destStat && destStat.isFile() && !force) {
	            return;
	        }
	        // If dest is an existing directory, should copy inside.
	        const newDest = destStat && destStat.isDirectory() && copySourceDirectory
	            ? path.join(dest, path.basename(source))
	            : dest;
	        if (!(yield ioUtil.exists(source))) {
	            throw new Error(`no such file or directory: ${source}`);
	        }
	        const sourceStat = yield ioUtil.stat(source);
	        if (sourceStat.isDirectory()) {
	            if (!recursive) {
	                throw new Error(`Failed to copy. ${source} is a directory, but tried to copy without recursive flag.`);
	            }
	            else {
	                yield cpDirRecursive(source, newDest, 0, force);
	            }
	        }
	        else {
	            if (path.relative(source, newDest) === '') {
	                // a file cannot be copied to itself
	                throw new Error(`'${newDest}' and '${source}' are the same file`);
	            }
	            yield copyFile(source, newDest, force);
	        }
	    });
	}
	/**
	 * Moves a path.
	 *
	 * @param     source    source path
	 * @param     dest      destination path
	 * @param     options   optional. See MoveOptions.
	 */
	function mv(source_1, dest_1) {
	    return __awaiter(this, arguments, void 0, function* (source, dest, options = {}) {
	        if (yield ioUtil.exists(dest)) {
	            let destExists = true;
	            if (yield ioUtil.isDirectory(dest)) {
	                // If dest is directory copy src into dest
	                dest = path.join(dest, path.basename(source));
	                destExists = yield ioUtil.exists(dest);
	            }
	            if (destExists) {
	                if (options.force == null || options.force) {
	                    yield rmRF(dest);
	                }
	                else {
	                    throw new Error('Destination already exists');
	                }
	            }
	        }
	        yield mkdirP(path.dirname(dest));
	        yield ioUtil.rename(source, dest);
	    });
	}
	/**
	 * Remove a path recursively with force
	 *
	 * @param inputPath path to remove
	 */
	function rmRF(inputPath) {
	    return __awaiter(this, void 0, void 0, function* () {
	        if (ioUtil.IS_WINDOWS) {
	            // Check for invalid characters
	            // https://docs.microsoft.com/en-us/windows/win32/fileio/naming-a-file
	            if (/[*"<>|]/.test(inputPath)) {
	                throw new Error('File path must not contain `*`, `"`, `<`, `>` or `|` on Windows');
	            }
	        }
	        try {
	            // note if path does not exist, error is silent
	            yield ioUtil.rm(inputPath, {
	                force: true,
	                maxRetries: 3,
	                recursive: true,
	                retryDelay: 300
	            });
	        }
	        catch (err) {
	            throw new Error(`File was unable to be removed ${err}`);
	        }
	    });
	}
	/**
	 * Make a directory.  Creates the full path with folders in between
	 * Will throw if it fails
	 *
	 * @param   fsPath        path to create
	 * @returns Promise<void>
	 */
	function mkdirP(fsPath) {
	    return __awaiter(this, void 0, void 0, function* () {
	        (0, assert_1.ok)(fsPath, 'a path argument must be provided');
	        yield ioUtil.mkdir(fsPath, { recursive: true });
	    });
	}
	/**
	 * Returns path of a tool had the tool actually been invoked.  Resolves via paths.
	 * If you check and the tool does not exist, it will throw.
	 *
	 * @param     tool              name of the tool
	 * @param     check             whether to check if tool exists
	 * @returns   Promise<string>   path to tool
	 */
	function which(tool, check) {
	    return __awaiter(this, void 0, void 0, function* () {
	        if (!tool) {
	            throw new Error("parameter 'tool' is required");
	        }
	        // recursive when check=true
	        if (check) {
	            const result = yield which(tool, false);
	            if (!result) {
	                if (ioUtil.IS_WINDOWS) {
	                    throw new Error(`Unable to locate executable file: ${tool}. Please verify either the file path exists or the file can be found within a directory specified by the PATH environment variable. Also verify the file has a valid extension for an executable file.`);
	                }
	                else {
	                    throw new Error(`Unable to locate executable file: ${tool}. Please verify either the file path exists or the file can be found within a directory specified by the PATH environment variable. Also check the file mode to verify the file is executable.`);
	                }
	            }
	            return result;
	        }
	        const matches = yield findInPath(tool);
	        if (matches && matches.length > 0) {
	            return matches[0];
	        }
	        return '';
	    });
	}
	/**
	 * Returns a list of all occurrences of the given tool on the system path.
	 *
	 * @returns   Promise<string[]>  the paths of the tool
	 */
	function findInPath(tool) {
	    return __awaiter(this, void 0, void 0, function* () {
	        if (!tool) {
	            throw new Error("parameter 'tool' is required");
	        }
	        // build the list of extensions to try
	        const extensions = [];
	        if (ioUtil.IS_WINDOWS && process.env['PATHEXT']) {
	            for (const extension of process.env['PATHEXT'].split(path.delimiter)) {
	                if (extension) {
	                    extensions.push(extension);
	                }
	            }
	        }
	        // if it's rooted, return it if exists. otherwise return empty.
	        if (ioUtil.isRooted(tool)) {
	            const filePath = yield ioUtil.tryGetExecutablePath(tool, extensions);
	            if (filePath) {
	                return [filePath];
	            }
	            return [];
	        }
	        // if any path separators, return empty
	        if (tool.includes(path.sep)) {
	            return [];
	        }
	        // build the list of directories
	        //
	        // Note, technically "where" checks the current directory on Windows. From a toolkit perspective,
	        // it feels like we should not do this. Checking the current directory seems like more of a use
	        // case of a shell, and the which() function exposed by the toolkit should strive for consistency
	        // across platforms.
	        const directories = [];
	        if (process.env.PATH) {
	            for (const p of process.env.PATH.split(path.delimiter)) {
	                if (p) {
	                    directories.push(p);
	                }
	            }
	        }
	        // find all matches
	        const matches = [];
	        for (const directory of directories) {
	            const filePath = yield ioUtil.tryGetExecutablePath(path.join(directory, tool), extensions);
	            if (filePath) {
	                matches.push(filePath);
	            }
	        }
	        return matches;
	    });
	}
	function readCopyOptions(options) {
	    const force = options.force == null ? true : options.force;
	    const recursive = Boolean(options.recursive);
	    const copySourceDirectory = options.copySourceDirectory == null
	        ? true
	        : Boolean(options.copySourceDirectory);
	    return { force, recursive, copySourceDirectory };
	}
	function cpDirRecursive(sourceDir, destDir, currentDepth, force) {
	    return __awaiter(this, void 0, void 0, function* () {
	        // Ensure there is not a run away recursive copy
	        if (currentDepth >= 255)
	            return;
	        currentDepth++;
	        yield mkdirP(destDir);
	        const files = yield ioUtil.readdir(sourceDir);
	        for (const fileName of files) {
	            const srcFile = `${sourceDir}/${fileName}`;
	            const destFile = `${destDir}/${fileName}`;
	            const srcFileStat = yield ioUtil.lstat(srcFile);
	            if (srcFileStat.isDirectory()) {
	                // Recurse
	                yield cpDirRecursive(srcFile, destFile, currentDepth, force);
	            }
	            else {
	                yield copyFile(srcFile, destFile, force);
	            }
	        }
	        // Change the mode for the newly created directory
	        yield ioUtil.chmod(destDir, (yield ioUtil.stat(sourceDir)).mode);
	    });
	}
	// Buffered file copy
	function copyFile(srcFile, destFile, force) {
	    return __awaiter(this, void 0, void 0, function* () {
	        if ((yield ioUtil.lstat(srcFile)).isSymbolicLink()) {
	            // unlink/re-link it
	            try {
	                yield ioUtil.lstat(destFile);
	                yield ioUtil.unlink(destFile);
	            }
	            catch (e) {
	                // Try to override file permission
	                if (e.code === 'EPERM') {
	                    yield ioUtil.chmod(destFile, '0666');
	                    yield ioUtil.unlink(destFile);
	                }
	                // other errors = it doesn't exist, no work to do
	            }
	            // Copy over symlink
	            const symlinkFull = yield ioUtil.readlink(srcFile);
	            yield ioUtil.symlink(symlinkFull, destFile, ioUtil.IS_WINDOWS ? 'junction' : null);
	        }
	        else if (!(yield ioUtil.exists(destFile)) || force) {
	            yield ioUtil.copyFile(srcFile, destFile);
	        }
	    });
	}
	
	return io;
}

var hasRequiredToolrunner;

function requireToolrunner () {
	if (hasRequiredToolrunner) return toolrunner;
	hasRequiredToolrunner = 1;
	var __createBinding = (toolrunner && toolrunner.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (toolrunner && toolrunner.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (toolrunner && toolrunner.__importStar) || (function () {
	    var ownKeys = function(o) {
	        ownKeys = Object.getOwnPropertyNames || function (o) {
	            var ar = [];
	            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
	            return ar;
	        };
	        return ownKeys(o);
	    };
	    return function (mod) {
	        if (mod && mod.__esModule) return mod;
	        var result = {};
	        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
	        __setModuleDefault(result, mod);
	        return result;
	    };
	})();
	var __awaiter = (toolrunner && toolrunner.__awaiter) || function (thisArg, _arguments, P, generator) {
	    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	Object.defineProperty(toolrunner, "__esModule", { value: true });
	toolrunner.ToolRunner = void 0;
	toolrunner.argStringToArray = argStringToArray;
	const os = __importStar(require$$0);
	const events = __importStar(require$$1$2);
	const child = __importStar(require$$2);
	const path = __importStar(require$$1$1);
	const io = __importStar(requireIo());
	const ioUtil = __importStar(requireIoUtil());
	const timers_1 = require$$6;
	/* eslint-disable @typescript-eslint/unbound-method */
	const IS_WINDOWS = process.platform === 'win32';
	/*
	 * Class for running command line tools. Handles quoting and arg parsing in a platform agnostic way.
	 */
	class ToolRunner extends events.EventEmitter {
	    constructor(toolPath, args, options) {
	        super();
	        if (!toolPath) {
	            throw new Error("Parameter 'toolPath' cannot be null or empty.");
	        }
	        this.toolPath = toolPath;
	        this.args = args || [];
	        this.options = options || {};
	    }
	    _debug(message) {
	        if (this.options.listeners && this.options.listeners.debug) {
	            this.options.listeners.debug(message);
	        }
	    }
	    _getCommandString(options, noPrefix) {
	        const toolPath = this._getSpawnFileName();
	        const args = this._getSpawnArgs(options);
	        let cmd = noPrefix ? '' : '[command]'; // omit prefix when piped to a second tool
	        if (IS_WINDOWS) {
	            // Windows + cmd file
	            if (this._isCmdFile()) {
	                cmd += toolPath;
	                for (const a of args) {
	                    cmd += ` ${a}`;
	                }
	            }
	            // Windows + verbatim
	            else if (options.windowsVerbatimArguments) {
	                cmd += `"${toolPath}"`;
	                for (const a of args) {
	                    cmd += ` ${a}`;
	                }
	            }
	            // Windows (regular)
	            else {
	                cmd += this._windowsQuoteCmdArg(toolPath);
	                for (const a of args) {
	                    cmd += ` ${this._windowsQuoteCmdArg(a)}`;
	                }
	            }
	        }
	        else {
	            // OSX/Linux - this can likely be improved with some form of quoting.
	            // creating processes on Unix is fundamentally different than Windows.
	            // on Unix, execvp() takes an arg array.
	            cmd += toolPath;
	            for (const a of args) {
	                cmd += ` ${a}`;
	            }
	        }
	        return cmd;
	    }
	    _processLineBuffer(data, strBuffer, onLine) {
	        try {
	            let s = strBuffer + data.toString();
	            let n = s.indexOf(os.EOL);
	            while (n > -1) {
	                const line = s.substring(0, n);
	                onLine(line);
	                // the rest of the string ...
	                s = s.substring(n + os.EOL.length);
	                n = s.indexOf(os.EOL);
	            }
	            return s;
	        }
	        catch (err) {
	            // streaming lines to console is best effort.  Don't fail a build.
	            this._debug(`error processing line. Failed with error ${err}`);
	            return '';
	        }
	    }
	    _getSpawnFileName() {
	        if (IS_WINDOWS) {
	            if (this._isCmdFile()) {
	                return process.env['COMSPEC'] || 'cmd.exe';
	            }
	        }
	        return this.toolPath;
	    }
	    _getSpawnArgs(options) {
	        if (IS_WINDOWS) {
	            if (this._isCmdFile()) {
	                let argline = `/D /S /C "${this._windowsQuoteCmdArg(this.toolPath)}`;
	                for (const a of this.args) {
	                    argline += ' ';
	                    argline += options.windowsVerbatimArguments
	                        ? a
	                        : this._windowsQuoteCmdArg(a);
	                }
	                argline += '"';
	                return [argline];
	            }
	        }
	        return this.args;
	    }
	    _endsWith(str, end) {
	        return str.endsWith(end);
	    }
	    _isCmdFile() {
	        const upperToolPath = this.toolPath.toUpperCase();
	        return (this._endsWith(upperToolPath, '.CMD') ||
	            this._endsWith(upperToolPath, '.BAT'));
	    }
	    _windowsQuoteCmdArg(arg) {
	        // for .exe, apply the normal quoting rules that libuv applies
	        if (!this._isCmdFile()) {
	            return this._uvQuoteCmdArg(arg);
	        }
	        // otherwise apply quoting rules specific to the cmd.exe command line parser.
	        // the libuv rules are generic and are not designed specifically for cmd.exe
	        // command line parser.
	        //
	        // for a detailed description of the cmd.exe command line parser, refer to
	        // http://stackoverflow.com/questions/4094699/how-does-the-windows-command-interpreter-cmd-exe-parse-scripts/7970912#7970912
	        // need quotes for empty arg
	        if (!arg) {
	            return '""';
	        }
	        // determine whether the arg needs to be quoted
	        const cmdSpecialChars = [
	            ' ',
	            '\t',
	            '&',
	            '(',
	            ')',
	            '[',
	            ']',
	            '{',
	            '}',
	            '^',
	            '=',
	            ';',
	            '!',
	            "'",
	            '+',
	            ',',
	            '`',
	            '~',
	            '|',
	            '<',
	            '>',
	            '"'
	        ];
	        let needsQuotes = false;
	        for (const char of arg) {
	            if (cmdSpecialChars.some(x => x === char)) {
	                needsQuotes = true;
	                break;
	            }
	        }
	        // short-circuit if quotes not needed
	        if (!needsQuotes) {
	            return arg;
	        }
	        // the following quoting rules are very similar to the rules that by libuv applies.
	        //
	        // 1) wrap the string in quotes
	        //
	        // 2) double-up quotes - i.e. " => ""
	        //
	        //    this is different from the libuv quoting rules. libuv replaces " with \", which unfortunately
	        //    doesn't work well with a cmd.exe command line.
	        //
	        //    note, replacing " with "" also works well if the arg is passed to a downstream .NET console app.
	        //    for example, the command line:
	        //          foo.exe "myarg:""my val"""
	        //    is parsed by a .NET console app into an arg array:
	        //          [ "myarg:\"my val\"" ]
	        //    which is the same end result when applying libuv quoting rules. although the actual
	        //    command line from libuv quoting rules would look like:
	        //          foo.exe "myarg:\"my val\""
	        //
	        // 3) double-up slashes that precede a quote,
	        //    e.g.  hello \world    => "hello \world"
	        //          hello\"world    => "hello\\""world"
	        //          hello\\"world   => "hello\\\\""world"
	        //          hello world\    => "hello world\\"
	        //
	        //    technically this is not required for a cmd.exe command line, or the batch argument parser.
	        //    the reasons for including this as a .cmd quoting rule are:
	        //
	        //    a) this is optimized for the scenario where the argument is passed from the .cmd file to an
	        //       external program. many programs (e.g. .NET console apps) rely on the slash-doubling rule.
	        //
	        //    b) it's what we've been doing previously (by deferring to node default behavior) and we
	        //       haven't heard any complaints about that aspect.
	        //
	        // note, a weakness of the quoting rules chosen here, is that % is not escaped. in fact, % cannot be
	        // escaped when used on the command line directly - even though within a .cmd file % can be escaped
	        // by using %%.
	        //
	        // the saving grace is, on the command line, %var% is left as-is if var is not defined. this contrasts
	        // the line parsing rules within a .cmd file, where if var is not defined it is replaced with nothing.
	        //
	        // one option that was explored was replacing % with ^% - i.e. %var% => ^%var^%. this hack would
	        // often work, since it is unlikely that var^ would exist, and the ^ character is removed when the
	        // variable is used. the problem, however, is that ^ is not removed when %* is used to pass the args
	        // to an external program.
	        //
	        // an unexplored potential solution for the % escaping problem, is to create a wrapper .cmd file.
	        // % can be escaped within a .cmd file.
	        let reverse = '"';
	        let quoteHit = true;
	        for (let i = arg.length; i > 0; i--) {
	            // walk the string in reverse
	            reverse += arg[i - 1];
	            if (quoteHit && arg[i - 1] === '\\') {
	                reverse += '\\'; // double the slash
	            }
	            else if (arg[i - 1] === '"') {
	                quoteHit = true;
	                reverse += '"'; // double the quote
	            }
	            else {
	                quoteHit = false;
	            }
	        }
	        reverse += '"';
	        return reverse.split('').reverse().join('');
	    }
	    _uvQuoteCmdArg(arg) {
	        // Tool runner wraps child_process.spawn() and needs to apply the same quoting as
	        // Node in certain cases where the undocumented spawn option windowsVerbatimArguments
	        // is used.
	        //
	        // Since this function is a port of quote_cmd_arg from Node 4.x (technically, lib UV,
	        // see https://github.com/nodejs/node/blob/v4.x/deps/uv/src/win/process.c for details),
	        // pasting copyright notice from Node within this function:
	        //
	        //      Copyright Joyent, Inc. and other Node contributors. All rights reserved.
	        //
	        //      Permission is hereby granted, free of charge, to any person obtaining a copy
	        //      of this software and associated documentation files (the "Software"), to
	        //      deal in the Software without restriction, including without limitation the
	        //      rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
	        //      sell copies of the Software, and to permit persons to whom the Software is
	        //      furnished to do so, subject to the following conditions:
	        //
	        //      The above copyright notice and this permission notice shall be included in
	        //      all copies or substantial portions of the Software.
	        //
	        //      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	        //      IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	        //      FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	        //      AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	        //      LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
	        //      FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
	        //      IN THE SOFTWARE.
	        if (!arg) {
	            // Need double quotation for empty argument
	            return '""';
	        }
	        if (!arg.includes(' ') && !arg.includes('\t') && !arg.includes('"')) {
	            // No quotation needed
	            return arg;
	        }
	        if (!arg.includes('"') && !arg.includes('\\')) {
	            // No embedded double quotes or backslashes, so I can just wrap
	            // quote marks around the whole thing.
	            return `"${arg}"`;
	        }
	        // Expected input/output:
	        //   input : hello"world
	        //   output: "hello\"world"
	        //   input : hello""world
	        //   output: "hello\"\"world"
	        //   input : hello\world
	        //   output: hello\world
	        //   input : hello\\world
	        //   output: hello\\world
	        //   input : hello\"world
	        //   output: "hello\\\"world"
	        //   input : hello\\"world
	        //   output: "hello\\\\\"world"
	        //   input : hello world\
	        //   output: "hello world\\" - note the comment in libuv actually reads "hello world\"
	        //                             but it appears the comment is wrong, it should be "hello world\\"
	        let reverse = '"';
	        let quoteHit = true;
	        for (let i = arg.length; i > 0; i--) {
	            // walk the string in reverse
	            reverse += arg[i - 1];
	            if (quoteHit && arg[i - 1] === '\\') {
	                reverse += '\\';
	            }
	            else if (arg[i - 1] === '"') {
	                quoteHit = true;
	                reverse += '\\';
	            }
	            else {
	                quoteHit = false;
	            }
	        }
	        reverse += '"';
	        return reverse.split('').reverse().join('');
	    }
	    _cloneExecOptions(options) {
	        options = options || {};
	        const result = {
	            cwd: options.cwd || process.cwd(),
	            env: options.env || process.env,
	            silent: options.silent || false,
	            windowsVerbatimArguments: options.windowsVerbatimArguments || false,
	            failOnStdErr: options.failOnStdErr || false,
	            ignoreReturnCode: options.ignoreReturnCode || false,
	            delay: options.delay || 10000
	        };
	        result.outStream = options.outStream || process.stdout;
	        result.errStream = options.errStream || process.stderr;
	        return result;
	    }
	    _getSpawnOptions(options, toolPath) {
	        options = options || {};
	        const result = {};
	        result.cwd = options.cwd;
	        result.env = options.env;
	        result['windowsVerbatimArguments'] =
	            options.windowsVerbatimArguments || this._isCmdFile();
	        if (options.windowsVerbatimArguments) {
	            result.argv0 = `"${toolPath}"`;
	        }
	        return result;
	    }
	    /**
	     * Exec a tool.
	     * Output will be streamed to the live console.
	     * Returns promise with return code
	     *
	     * @param     tool     path to tool to exec
	     * @param     options  optional exec options.  See ExecOptions
	     * @returns   number
	     */
	    exec() {
	        return __awaiter(this, void 0, void 0, function* () {
	            // root the tool path if it is unrooted and contains relative pathing
	            if (!ioUtil.isRooted(this.toolPath) &&
	                (this.toolPath.includes('/') ||
	                    (IS_WINDOWS && this.toolPath.includes('\\')))) {
	                // prefer options.cwd if it is specified, however options.cwd may also need to be rooted
	                this.toolPath = path.resolve(process.cwd(), this.options.cwd || process.cwd(), this.toolPath);
	            }
	            // if the tool is only a file name, then resolve it from the PATH
	            // otherwise verify it exists (add extension on Windows if necessary)
	            this.toolPath = yield io.which(this.toolPath, true);
	            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
	                this._debug(`exec tool: ${this.toolPath}`);
	                this._debug('arguments:');
	                for (const arg of this.args) {
	                    this._debug(`   ${arg}`);
	                }
	                const optionsNonNull = this._cloneExecOptions(this.options);
	                if (!optionsNonNull.silent && optionsNonNull.outStream) {
	                    optionsNonNull.outStream.write(this._getCommandString(optionsNonNull) + os.EOL);
	                }
	                const state = new ExecState(optionsNonNull, this.toolPath);
	                state.on('debug', (message) => {
	                    this._debug(message);
	                });
	                if (this.options.cwd && !(yield ioUtil.exists(this.options.cwd))) {
	                    return reject(new Error(`The cwd: ${this.options.cwd} does not exist!`));
	                }
	                const fileName = this._getSpawnFileName();
	                const cp = child.spawn(fileName, this._getSpawnArgs(optionsNonNull), this._getSpawnOptions(this.options, fileName));
	                let stdbuffer = '';
	                if (cp.stdout) {
	                    cp.stdout.on('data', (data) => {
	                        if (this.options.listeners && this.options.listeners.stdout) {
	                            this.options.listeners.stdout(data);
	                        }
	                        if (!optionsNonNull.silent && optionsNonNull.outStream) {
	                            optionsNonNull.outStream.write(data);
	                        }
	                        stdbuffer = this._processLineBuffer(data, stdbuffer, (line) => {
	                            if (this.options.listeners && this.options.listeners.stdline) {
	                                this.options.listeners.stdline(line);
	                            }
	                        });
	                    });
	                }
	                let errbuffer = '';
	                if (cp.stderr) {
	                    cp.stderr.on('data', (data) => {
	                        state.processStderr = true;
	                        if (this.options.listeners && this.options.listeners.stderr) {
	                            this.options.listeners.stderr(data);
	                        }
	                        if (!optionsNonNull.silent &&
	                            optionsNonNull.errStream &&
	                            optionsNonNull.outStream) {
	                            const s = optionsNonNull.failOnStdErr
	                                ? optionsNonNull.errStream
	                                : optionsNonNull.outStream;
	                            s.write(data);
	                        }
	                        errbuffer = this._processLineBuffer(data, errbuffer, (line) => {
	                            if (this.options.listeners && this.options.listeners.errline) {
	                                this.options.listeners.errline(line);
	                            }
	                        });
	                    });
	                }
	                cp.on('error', (err) => {
	                    state.processError = err.message;
	                    state.processExited = true;
	                    state.processClosed = true;
	                    state.CheckComplete();
	                });
	                cp.on('exit', (code) => {
	                    state.processExitCode = code;
	                    state.processExited = true;
	                    this._debug(`Exit code ${code} received from tool '${this.toolPath}'`);
	                    state.CheckComplete();
	                });
	                cp.on('close', (code) => {
	                    state.processExitCode = code;
	                    state.processExited = true;
	                    state.processClosed = true;
	                    this._debug(`STDIO streams have closed for tool '${this.toolPath}'`);
	                    state.CheckComplete();
	                });
	                state.on('done', (error, exitCode) => {
	                    if (stdbuffer.length > 0) {
	                        this.emit('stdline', stdbuffer);
	                    }
	                    if (errbuffer.length > 0) {
	                        this.emit('errline', errbuffer);
	                    }
	                    cp.removeAllListeners();
	                    if (error) {
	                        reject(error);
	                    }
	                    else {
	                        resolve(exitCode);
	                    }
	                });
	                if (this.options.input) {
	                    if (!cp.stdin) {
	                        throw new Error('child process missing stdin');
	                    }
	                    cp.stdin.end(this.options.input);
	                }
	            }));
	        });
	    }
	}
	toolrunner.ToolRunner = ToolRunner;
	/**
	 * Convert an arg string to an array of args. Handles escaping
	 *
	 * @param    argString   string of arguments
	 * @returns  string[]    array of arguments
	 */
	function argStringToArray(argString) {
	    const args = [];
	    let inQuotes = false;
	    let escaped = false;
	    let arg = '';
	    function append(c) {
	        // we only escape double quotes.
	        if (escaped && c !== '"') {
	            arg += '\\';
	        }
	        arg += c;
	        escaped = false;
	    }
	    for (let i = 0; i < argString.length; i++) {
	        const c = argString.charAt(i);
	        if (c === '"') {
	            if (!escaped) {
	                inQuotes = !inQuotes;
	            }
	            else {
	                append(c);
	            }
	            continue;
	        }
	        if (c === '\\' && escaped) {
	            append(c);
	            continue;
	        }
	        if (c === '\\' && inQuotes) {
	            escaped = true;
	            continue;
	        }
	        if (c === ' ' && !inQuotes) {
	            if (arg.length > 0) {
	                args.push(arg);
	                arg = '';
	            }
	            continue;
	        }
	        append(c);
	    }
	    if (arg.length > 0) {
	        args.push(arg.trim());
	    }
	    return args;
	}
	class ExecState extends events.EventEmitter {
	    constructor(options, toolPath) {
	        super();
	        this.processClosed = false; // tracks whether the process has exited and stdio is closed
	        this.processError = '';
	        this.processExitCode = 0;
	        this.processExited = false; // tracks whether the process has exited
	        this.processStderr = false; // tracks whether stderr was written to
	        this.delay = 10000; // 10 seconds
	        this.done = false;
	        this.timeout = null;
	        if (!toolPath) {
	            throw new Error('toolPath must not be empty');
	        }
	        this.options = options;
	        this.toolPath = toolPath;
	        if (options.delay) {
	            this.delay = options.delay;
	        }
	    }
	    CheckComplete() {
	        if (this.done) {
	            return;
	        }
	        if (this.processClosed) {
	            this._setResult();
	        }
	        else if (this.processExited) {
	            this.timeout = (0, timers_1.setTimeout)(ExecState.HandleTimeout, this.delay, this);
	        }
	    }
	    _debug(message) {
	        this.emit('debug', message);
	    }
	    _setResult() {
	        // determine whether there is an error
	        let error;
	        if (this.processExited) {
	            if (this.processError) {
	                error = new Error(`There was an error when attempting to execute the process '${this.toolPath}'. This may indicate the process failed to start. Error: ${this.processError}`);
	            }
	            else if (this.processExitCode !== 0 && !this.options.ignoreReturnCode) {
	                error = new Error(`The process '${this.toolPath}' failed with exit code ${this.processExitCode}`);
	            }
	            else if (this.processStderr && this.options.failOnStdErr) {
	                error = new Error(`The process '${this.toolPath}' failed because one or more lines were written to the STDERR stream`);
	            }
	        }
	        // clear the timeout
	        if (this.timeout) {
	            clearTimeout(this.timeout);
	            this.timeout = null;
	        }
	        this.done = true;
	        this.emit('done', error, this.processExitCode);
	    }
	    static HandleTimeout(state) {
	        if (state.done) {
	            return;
	        }
	        if (!state.processClosed && state.processExited) {
	            const message = `The STDIO streams did not close within ${state.delay / 1000} seconds of the exit event from process '${state.toolPath}'. This may indicate a child process inherited the STDIO streams and has not yet exited.`;
	            state._debug(message);
	        }
	        state._setResult();
	    }
	}
	
	return toolrunner;
}

var hasRequiredExec;

function requireExec () {
	if (hasRequiredExec) return exec;
	hasRequiredExec = 1;
	var __createBinding = (exec && exec.__createBinding) || (Object.create ? (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    var desc = Object.getOwnPropertyDescriptor(m, k);
	    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
	      desc = { enumerable: true, get: function() { return m[k]; } };
	    }
	    Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
	    if (k2 === undefined) k2 = k;
	    o[k2] = m[k];
	}));
	var __setModuleDefault = (exec && exec.__setModuleDefault) || (Object.create ? (function(o, v) {
	    Object.defineProperty(o, "default", { enumerable: true, value: v });
	}) : function(o, v) {
	    o["default"] = v;
	});
	var __importStar = (exec && exec.__importStar) || (function () {
	    var ownKeys = function(o) {
	        ownKeys = Object.getOwnPropertyNames || function (o) {
	            var ar = [];
	            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
	            return ar;
	        };
	        return ownKeys(o);
	    };
	    return function (mod) {
	        if (mod && mod.__esModule) return mod;
	        var result = {};
	        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
	        __setModuleDefault(result, mod);
	        return result;
	    };
	})();
	var __awaiter = (exec && exec.__awaiter) || function (thisArg, _arguments, P, generator) {
	    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	Object.defineProperty(exec, "__esModule", { value: true });
	exec.exec = exec$1;
	exec.getExecOutput = getExecOutput;
	const string_decoder_1 = require$$0$3;
	const tr = __importStar(requireToolrunner());
	/**
	 * Exec a command.
	 * Output will be streamed to the live console.
	 * Returns promise with return code
	 *
	 * @param     commandLine        command to execute (can include additional args). Must be correctly escaped.
	 * @param     args               optional arguments for tool. Escaping is handled by the lib.
	 * @param     options            optional exec options.  See ExecOptions
	 * @returns   Promise<number>    exit code
	 */
	function exec$1(commandLine, args, options) {
	    return __awaiter(this, void 0, void 0, function* () {
	        const commandArgs = tr.argStringToArray(commandLine);
	        if (commandArgs.length === 0) {
	            throw new Error(`Parameter 'commandLine' cannot be null or empty.`);
	        }
	        // Path to tool to execute should be first arg
	        const toolPath = commandArgs[0];
	        args = commandArgs.slice(1).concat(args || []);
	        const runner = new tr.ToolRunner(toolPath, args, options);
	        return runner.exec();
	    });
	}
	/**
	 * Exec a command and get the output.
	 * Output will be streamed to the live console.
	 * Returns promise with the exit code and collected stdout and stderr
	 *
	 * @param     commandLine           command to execute (can include additional args). Must be correctly escaped.
	 * @param     args                  optional arguments for tool. Escaping is handled by the lib.
	 * @param     options               optional exec options.  See ExecOptions
	 * @returns   Promise<ExecOutput>   exit code, stdout, and stderr
	 */
	function getExecOutput(commandLine, args, options) {
	    return __awaiter(this, void 0, void 0, function* () {
	        var _a, _b;
	        let stdout = '';
	        let stderr = '';
	        //Using string decoder covers the case where a mult-byte character is split
	        const stdoutDecoder = new string_decoder_1.StringDecoder('utf8');
	        const stderrDecoder = new string_decoder_1.StringDecoder('utf8');
	        const originalStdoutListener = (_a = options === null || options === void 0 ? void 0 : options.listeners) === null || _a === void 0 ? void 0 : _a.stdout;
	        const originalStdErrListener = (_b = options === null || options === void 0 ? void 0 : options.listeners) === null || _b === void 0 ? void 0 : _b.stderr;
	        const stdErrListener = (data) => {
	            stderr += stderrDecoder.write(data);
	            if (originalStdErrListener) {
	                originalStdErrListener(data);
	            }
	        };
	        const stdOutListener = (data) => {
	            stdout += stdoutDecoder.write(data);
	            if (originalStdoutListener) {
	                originalStdoutListener(data);
	            }
	        };
	        const listeners = Object.assign(Object.assign({}, options === null || options === void 0 ? void 0 : options.listeners), { stdout: stdOutListener, stderr: stdErrListener });
	        const exitCode = yield exec$1(commandLine, args, Object.assign(Object.assign({}, options), { listeners }));
	        //flush any remaining characters
	        stdout += stdoutDecoder.end();
	        stderr += stderrDecoder.end();
	        return {
	            exitCode,
	            stdout,
	            stderr
	        };
	    });
	}
	
	return exec;
}

var hasRequiredPlatform;

function requirePlatform () {
	if (hasRequiredPlatform) return platform;
	hasRequiredPlatform = 1;
	(function (exports$1) {
		var __createBinding = (platform && platform.__createBinding) || (Object.create ? (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    var desc = Object.getOwnPropertyDescriptor(m, k);
		    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
		      desc = { enumerable: true, get: function() { return m[k]; } };
		    }
		    Object.defineProperty(o, k2, desc);
		}) : (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    o[k2] = m[k];
		}));
		var __setModuleDefault = (platform && platform.__setModuleDefault) || (Object.create ? (function(o, v) {
		    Object.defineProperty(o, "default", { enumerable: true, value: v });
		}) : function(o, v) {
		    o["default"] = v;
		});
		var __importStar = (platform && platform.__importStar) || (function () {
		    var ownKeys = function(o) {
		        ownKeys = Object.getOwnPropertyNames || function (o) {
		            var ar = [];
		            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
		            return ar;
		        };
		        return ownKeys(o);
		    };
		    return function (mod) {
		        if (mod && mod.__esModule) return mod;
		        var result = {};
		        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
		        __setModuleDefault(result, mod);
		        return result;
		    };
		})();
		var __awaiter = (platform && platform.__awaiter) || function (thisArg, _arguments, P, generator) {
		    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
		    return new (P || (P = Promise))(function (resolve, reject) {
		        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
		        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
		        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
		        step((generator = generator.apply(thisArg, _arguments || [])).next());
		    });
		};
		var __importDefault = (platform && platform.__importDefault) || function (mod) {
		    return (mod && mod.__esModule) ? mod : { "default": mod };
		};
		Object.defineProperty(exports$1, "__esModule", { value: true });
		exports$1.isLinux = exports$1.isMacOS = exports$1.isWindows = exports$1.arch = exports$1.platform = void 0;
		exports$1.getDetails = getDetails;
		const os_1 = __importDefault(require$$0);
		const exec = __importStar(requireExec());
		const getWindowsInfo = () => __awaiter(void 0, void 0, void 0, function* () {
		    const { stdout: version } = yield exec.getExecOutput('powershell -command "(Get-CimInstance -ClassName Win32_OperatingSystem).Version"', undefined, {
		        silent: true
		    });
		    const { stdout: name } = yield exec.getExecOutput('powershell -command "(Get-CimInstance -ClassName Win32_OperatingSystem).Caption"', undefined, {
		        silent: true
		    });
		    return {
		        name: name.trim(),
		        version: version.trim()
		    };
		});
		const getMacOsInfo = () => __awaiter(void 0, void 0, void 0, function* () {
		    var _a, _b, _c, _d;
		    const { stdout } = yield exec.getExecOutput('sw_vers', undefined, {
		        silent: true
		    });
		    const version = (_b = (_a = stdout.match(/ProductVersion:\s*(.+)/)) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : '';
		    const name = (_d = (_c = stdout.match(/ProductName:\s*(.+)/)) === null || _c === void 0 ? void 0 : _c[1]) !== null && _d !== void 0 ? _d : '';
		    return {
		        name,
		        version
		    };
		});
		const getLinuxInfo = () => __awaiter(void 0, void 0, void 0, function* () {
		    const { stdout } = yield exec.getExecOutput('lsb_release', ['-i', '-r', '-s'], {
		        silent: true
		    });
		    const [name, version] = stdout.trim().split('\n');
		    return {
		        name,
		        version
		    };
		});
		exports$1.platform = os_1.default.platform();
		exports$1.arch = os_1.default.arch();
		exports$1.isWindows = exports$1.platform === 'win32';
		exports$1.isMacOS = exports$1.platform === 'darwin';
		exports$1.isLinux = exports$1.platform === 'linux';
		function getDetails() {
		    return __awaiter(this, void 0, void 0, function* () {
		        return Object.assign(Object.assign({}, (yield (exports$1.isWindows
		            ? getWindowsInfo()
		            : exports$1.isMacOS
		                ? getMacOsInfo()
		                : getLinuxInfo()))), { platform: exports$1.platform,
		            arch: exports$1.arch,
		            isWindows: exports$1.isWindows,
		            isMacOS: exports$1.isMacOS,
		            isLinux: exports$1.isLinux });
		    });
		}
		
	} (platform));
	return platform;
}

var hasRequiredCore;

function requireCore () {
	if (hasRequiredCore) return core;
	hasRequiredCore = 1;
	(function (exports$1) {
		var __createBinding = (core && core.__createBinding) || (Object.create ? (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    var desc = Object.getOwnPropertyDescriptor(m, k);
		    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
		      desc = { enumerable: true, get: function() { return m[k]; } };
		    }
		    Object.defineProperty(o, k2, desc);
		}) : (function(o, m, k, k2) {
		    if (k2 === undefined) k2 = k;
		    o[k2] = m[k];
		}));
		var __setModuleDefault = (core && core.__setModuleDefault) || (Object.create ? (function(o, v) {
		    Object.defineProperty(o, "default", { enumerable: true, value: v });
		}) : function(o, v) {
		    o["default"] = v;
		});
		var __importStar = (core && core.__importStar) || (function () {
		    var ownKeys = function(o) {
		        ownKeys = Object.getOwnPropertyNames || function (o) {
		            var ar = [];
		            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
		            return ar;
		        };
		        return ownKeys(o);
		    };
		    return function (mod) {
		        if (mod && mod.__esModule) return mod;
		        var result = {};
		        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
		        __setModuleDefault(result, mod);
		        return result;
		    };
		})();
		var __awaiter = (core && core.__awaiter) || function (thisArg, _arguments, P, generator) {
		    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
		    return new (P || (P = Promise))(function (resolve, reject) {
		        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
		        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
		        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
		        step((generator = generator.apply(thisArg, _arguments || [])).next());
		    });
		};
		Object.defineProperty(exports$1, "__esModule", { value: true });
		exports$1.platform = exports$1.toPlatformPath = exports$1.toWin32Path = exports$1.toPosixPath = exports$1.markdownSummary = exports$1.summary = exports$1.ExitCode = void 0;
		exports$1.exportVariable = exportVariable;
		exports$1.setSecret = setSecret;
		exports$1.addPath = addPath;
		exports$1.getInput = getInput;
		exports$1.getMultilineInput = getMultilineInput;
		exports$1.getBooleanInput = getBooleanInput;
		exports$1.setOutput = setOutput;
		exports$1.setCommandEcho = setCommandEcho;
		exports$1.setFailed = setFailed;
		exports$1.isDebug = isDebug;
		exports$1.debug = debug;
		exports$1.error = error;
		exports$1.warning = warning;
		exports$1.notice = notice;
		exports$1.info = info;
		exports$1.startGroup = startGroup;
		exports$1.endGroup = endGroup;
		exports$1.group = group;
		exports$1.saveState = saveState;
		exports$1.getState = getState;
		exports$1.getIDToken = getIDToken;
		const command_1 = requireCommand();
		const file_command_1 = requireFileCommand();
		const utils_1 = requireUtils();
		const os = __importStar(require$$0);
		const path = __importStar(require$$1$1);
		const oidc_utils_1 = { };
		/**
		 * The code to exit an action
		 */
		var ExitCode;
		(function (ExitCode) {
		    /**
		     * A code indicating that the action was successful
		     */
		    ExitCode[ExitCode["Success"] = 0] = "Success";
		    /**
		     * A code indicating that the action was a failure
		     */
		    ExitCode[ExitCode["Failure"] = 1] = "Failure";
		})(ExitCode || (exports$1.ExitCode = ExitCode = {}));
		//-----------------------------------------------------------------------
		// Variables
		//-----------------------------------------------------------------------
		/**
		 * Sets env variable for this action and future actions in the job
		 * @param name the name of the variable to set
		 * @param val the value of the variable. Non-string values will be converted to a string via JSON.stringify
		 */
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		function exportVariable(name, val) {
		    const convertedVal = (0, utils_1.toCommandValue)(val);
		    process.env[name] = convertedVal;
		    const filePath = process.env['GITHUB_ENV'] || '';
		    if (filePath) {
		        return (0, file_command_1.issueFileCommand)('ENV', (0, file_command_1.prepareKeyValueMessage)(name, val));
		    }
		    (0, command_1.issueCommand)('set-env', { name }, convertedVal);
		}
		/**
		 * Registers a secret which will get masked from logs
		 *
		 * @param secret - Value of the secret to be masked
		 * @remarks
		 * This function instructs the Actions runner to mask the specified value in any
		 * logs produced during the workflow run. Once registered, the secret value will
		 * be replaced with asterisks (***) whenever it appears in console output, logs,
		 * or error messages.
		 *
		 * This is useful for protecting sensitive information such as:
		 * - API keys
		 * - Access tokens
		 * - Authentication credentials
		 * - URL parameters containing signatures (SAS tokens)
		 *
		 * Note that masking only affects future logs; any previous appearances of the
		 * secret in logs before calling this function will remain unmasked.
		 *
		 * @example
		 * ```typescript
		 * // Register an API token as a secret
		 * const apiToken = "abc123xyz456";
		 * setSecret(apiToken);
		 *
		 * // Now any logs containing this value will show *** instead
		 * console.log(`Using token: ${apiToken}`); // Outputs: "Using token: ***"
		 * ```
		 */
		function setSecret(secret) {
		    (0, command_1.issueCommand)('add-mask', {}, secret);
		}
		/**
		 * Prepends inputPath to the PATH (for this action and future actions)
		 * @param inputPath
		 */
		function addPath(inputPath) {
		    const filePath = process.env['GITHUB_PATH'] || '';
		    if (filePath) {
		        (0, file_command_1.issueFileCommand)('PATH', inputPath);
		    }
		    else {
		        (0, command_1.issueCommand)('add-path', {}, inputPath);
		    }
		    process.env['PATH'] = `${inputPath}${path.delimiter}${process.env['PATH']}`;
		}
		/**
		 * Gets the value of an input.
		 * Unless trimWhitespace is set to false in InputOptions, the value is also trimmed.
		 * Returns an empty string if the value is not defined.
		 *
		 * @param     name     name of the input to get
		 * @param     options  optional. See InputOptions.
		 * @returns   string
		 */
		function getInput(name, options) {
		    const val = process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || '';
		    if (options && options.required && !val) {
		        throw new Error(`Input required and not supplied: ${name}`);
		    }
		    if (options && options.trimWhitespace === false) {
		        return val;
		    }
		    return val.trim();
		}
		/**
		 * Gets the values of an multiline input.  Each value is also trimmed.
		 *
		 * @param     name     name of the input to get
		 * @param     options  optional. See InputOptions.
		 * @returns   string[]
		 *
		 */
		function getMultilineInput(name, options) {
		    const inputs = getInput(name, options)
		        .split('\n')
		        .filter(x => x !== '');
		    if (options && options.trimWhitespace === false) {
		        return inputs;
		    }
		    return inputs.map(input => input.trim());
		}
		/**
		 * Gets the input value of the boolean type in the YAML 1.2 "core schema" specification.
		 * Support boolean input list: `true | True | TRUE | false | False | FALSE` .
		 * The return value is also in boolean type.
		 * ref: https://yaml.org/spec/1.2/spec.html#id2804923
		 *
		 * @param     name     name of the input to get
		 * @param     options  optional. See InputOptions.
		 * @returns   boolean
		 */
		function getBooleanInput(name, options) {
		    const trueValue = ['true', 'True', 'TRUE'];
		    const falseValue = ['false', 'False', 'FALSE'];
		    const val = getInput(name, options);
		    if (trueValue.includes(val))
		        return true;
		    if (falseValue.includes(val))
		        return false;
		    throw new TypeError(`Input does not meet YAML 1.2 "Core Schema" specification: ${name}\n` +
		        `Support boolean input list: \`true | True | TRUE | false | False | FALSE\``);
		}
		/**
		 * Sets the value of an output.
		 *
		 * @param     name     name of the output to set
		 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
		 */
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		function setOutput(name, value) {
		    const filePath = process.env['GITHUB_OUTPUT'] || '';
		    if (filePath) {
		        return (0, file_command_1.issueFileCommand)('OUTPUT', (0, file_command_1.prepareKeyValueMessage)(name, value));
		    }
		    process.stdout.write(os.EOL);
		    (0, command_1.issueCommand)('set-output', { name }, (0, utils_1.toCommandValue)(value));
		}
		/**
		 * Enables or disables the echoing of commands into stdout for the rest of the step.
		 * Echoing is disabled by default if ACTIONS_STEP_DEBUG is not set.
		 *
		 */
		function setCommandEcho(enabled) {
		    (0, command_1.issue)('echo', enabled ? 'on' : 'off');
		}
		//-----------------------------------------------------------------------
		// Results
		//-----------------------------------------------------------------------
		/**
		 * Sets the action status to failed.
		 * When the action exits it will be with an exit code of 1
		 * @param message add error issue message
		 */
		function setFailed(message) {
		    process.exitCode = ExitCode.Failure;
		    error(message);
		}
		//-----------------------------------------------------------------------
		// Logging Commands
		//-----------------------------------------------------------------------
		/**
		 * Gets whether Actions Step Debug is on or not
		 */
		function isDebug() {
		    return process.env['RUNNER_DEBUG'] === '1';
		}
		/**
		 * Writes debug message to user log
		 * @param message debug message
		 */
		function debug(message) {
		    (0, command_1.issueCommand)('debug', {}, message);
		}
		/**
		 * Adds an error issue
		 * @param message error issue message. Errors will be converted to string via toString()
		 * @param properties optional properties to add to the annotation.
		 */
		function error(message, properties = {}) {
		    (0, command_1.issueCommand)('error', (0, utils_1.toCommandProperties)(properties), message instanceof Error ? message.toString() : message);
		}
		/**
		 * Adds a warning issue
		 * @param message warning issue message. Errors will be converted to string via toString()
		 * @param properties optional properties to add to the annotation.
		 */
		function warning(message, properties = {}) {
		    (0, command_1.issueCommand)('warning', (0, utils_1.toCommandProperties)(properties), message instanceof Error ? message.toString() : message);
		}
		/**
		 * Adds a notice issue
		 * @param message notice issue message. Errors will be converted to string via toString()
		 * @param properties optional properties to add to the annotation.
		 */
		function notice(message, properties = {}) {
		    (0, command_1.issueCommand)('notice', (0, utils_1.toCommandProperties)(properties), message instanceof Error ? message.toString() : message);
		}
		/**
		 * Writes info to log with console.log.
		 * @param message info message
		 */
		function info(message) {
		    process.stdout.write(message + os.EOL);
		}
		/**
		 * Begin an output group.
		 *
		 * Output until the next `groupEnd` will be foldable in this group
		 *
		 * @param name The name of the output group
		 */
		function startGroup(name) {
		    (0, command_1.issue)('group', name);
		}
		/**
		 * End an output group.
		 */
		function endGroup() {
		    (0, command_1.issue)('endgroup');
		}
		/**
		 * Wrap an asynchronous function call in a group.
		 *
		 * Returns the same type as the function itself.
		 *
		 * @param name The name of the group
		 * @param fn The function to wrap in the group
		 */
		function group(name, fn) {
		    return __awaiter(this, void 0, void 0, function* () {
		        startGroup(name);
		        let result;
		        try {
		            result = yield fn();
		        }
		        finally {
		            endGroup();
		        }
		        return result;
		    });
		}
		//-----------------------------------------------------------------------
		// Wrapper action state
		//-----------------------------------------------------------------------
		/**
		 * Saves state for current action, the state can only be retrieved by this action's post job execution.
		 *
		 * @param     name     name of the state to store
		 * @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
		 */
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		function saveState(name, value) {
		    const filePath = process.env['GITHUB_STATE'] || '';
		    if (filePath) {
		        return (0, file_command_1.issueFileCommand)('STATE', (0, file_command_1.prepareKeyValueMessage)(name, value));
		    }
		    (0, command_1.issueCommand)('save-state', { name }, (0, utils_1.toCommandValue)(value));
		}
		/**
		 * Gets the value of an state set by this action's main execution.
		 *
		 * @param     name     name of the state to get
		 * @returns   string
		 */
		function getState(name) {
		    return process.env[`STATE_${name}`] || '';
		}
		function getIDToken(aud) {
		    return __awaiter(this, void 0, void 0, function* () {
		        return yield oidc_utils_1.OidcClient.getIDToken(aud);
		    });
		}
		/**
		 * Summary exports
		 */
		var summary_1 = requireSummary();
		Object.defineProperty(exports$1, "summary", { enumerable: true, get: function () { return summary_1.summary; } });
		/**
		 * @deprecated use core.summary
		 */
		var summary_2 = requireSummary();
		Object.defineProperty(exports$1, "markdownSummary", { enumerable: true, get: function () { return summary_2.markdownSummary; } });
		/**
		 * Path exports
		 */
		var path_utils_1 = requirePathUtils();
		Object.defineProperty(exports$1, "toPosixPath", { enumerable: true, get: function () { return path_utils_1.toPosixPath; } });
		Object.defineProperty(exports$1, "toWin32Path", { enumerable: true, get: function () { return path_utils_1.toWin32Path; } });
		Object.defineProperty(exports$1, "toPlatformPath", { enumerable: true, get: function () { return path_utils_1.toPlatformPath; } });
		/**
		 * Platform utilities exports
		 */
		exports$1.platform = __importStar(requirePlatform());
		
	} (core));
	return core;
}

var hasRequiredSrc;

function requireSrc () {
	if (hasRequiredSrc) return src;
	hasRequiredSrc = 1;
	const core = requireCore();
	const exec = require$$1$3;
	const path = require$$1$1;

	async function run() {
	  try {
	    const workingDirectory = path.resolve(process.env.GITHUB_WORKSPACE, core.getInput('working-directory'));

	    const [analyzeErrorCount, analyzeWarningCount, analyzeInfoCount] = await analyze(workingDirectory);
	    const formatWarningCount = await format(workingDirectory);

	    const issueCount = analyzeErrorCount + analyzeWarningCount + analyzeInfoCount + formatWarningCount;
	    const failOnInfos = core.getInput('fail-on-infos') === 'true';
	    const failOnWarnings = core.getInput('fail-on-warnings') === 'true';
	    const message = `${issueCount} issue${issueCount === 1 ? '' : 's'} found.`;

	    if (analyzeErrorCount > 0 || ((failOnInfos || failOnWarnings) && issueCount > 0)) {
	      core.setFailed(message);
	    } else {
	      console.log(message);
	    }
	  } catch (error) {
	    core.setFailed(error.message);
	  }
	}

	async function analyze(workingDirectory) {
	  let output = '';

	  const options = { cwd: workingDirectory };
	  options.listeners = {
	    stdout: (data) => {
	      output += data.toString();
	    },
	    stderr: (data) => {
	      output += data.toString();
	    }
	  };

	  const args = ['--no-fatal-warnings', '--format', 'machine'];
	  args.push('.');

	  await exec.exec('dart analyze', args, options);

	  let errorCount = 0;
	  let warningCount = 0;
	  let infoCount = 0;
	  const lines = output.trim().split(/\r?\n/);
	  const dataDelimiter = '|';

	  for (const line of lines) {
	    if (!line.includes(dataDelimiter)) {
	      continue;
	    }

	    const lineData = line.split(dataDelimiter);
	    const lint = lineData[2];
	    const lintLowerCase = lint.toLowerCase();
	    const file = lineData[3].replace(workingDirectory, '');
	    const url = lint === lintLowerCase
	      ? `https://dart-lang.github.io/linter/lints/${lint}.html`
	      : `https://dart.dev/tools/diagnostic-messages#${lintLowerCase}`;
	    const message = `file=${file},line=${lineData[4]},col=${lineData[5]}::${lineData[7]} For more details, see ${url}`;

	    if (lineData[0] === 'ERROR') {
	      console.log(`::error ${message}`);
	      errorCount++;
	    } else if (lineData[0] === 'WARNING') {
	      console.log(`::warning ${message}`);
	      warningCount++;
	    } else {
	      console.log(`::notice ${message}`);
	      infoCount++;
	    }
	  }

	  return [errorCount, warningCount, infoCount];
	}

	async function format(workingDirectory) {
	  let output = '';

	  const options = { cwd: workingDirectory };
	  options.listeners = {
	    stdout: (data) => {
	      output += data.toString();
	    },
	    stderr: (data) => {
	      output += data.toString();
	    }
	  };

	  const args = ['format', '--output=none'];
	  const lineLength = core.getInput('line-length');

	  if (lineLength) {
	    args.push('--line-length');
	    args.push(lineLength);
	  }

	  args.push('.');

	  await exec.exec('dart', args, options);
	  
	  let warningCount = 0;
	  const lines = output.trim().split(/\r?\n/);

	  for (const line of lines) {
	    if (!line.endsWith('.dart')) continue;
	    const file = line.substring(8); // Remove the "Changed " prefix

	    console.log(`::warning file=${file}::Invalid format. For more details, see https://dart.dev/guides/language/effective-dart/style#formatting`);
	    warningCount++;
	  }

	  return warningCount;
	}

	run();
	return src;
}

var srcExports = requireSrc();
var index = /*@__PURE__*/getDefaultExportFromCjs(srcExports);

module.exports = index;
//# sourceMappingURL=index.js.map
