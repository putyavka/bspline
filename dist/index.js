(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BSpline = void 0;
////////////////////////////////////////
// BSpline
class BSpline {
    CV;
    closed;
    constructor(CV, maxDegree, closed) {
        this.CV = CV;
        this.closed = closed;
        const p = this.degree = Math.max(0, Math.min(maxDegree, CV.length - 1));
        if (closed) {
            this._CV = CV.concat(CV.slice(0, p));
            this.K = BSpline.createKnotsRegular(this._CV.length + p + 1);
        }
        else {
            this._CV = CV;
            this.K = BSpline.createKnotsClamped(CV.length + p + 1, p);
        }
        this.D.length = this.degree + 1;
    }
    degree;
    get segments() { return this._CV.length - this.degree; }
    get tangent() { return this._tangent; }
    _CV;
    K;
    D = [];
    _tangent = { x: 0, y: 0 };
    get(t) {
        const { D, _CV: C, K, degree: p } = this;
        t = this.normalize(t);
        const k = this.findInterval(t);
        for (let i = 0; i <= p; i++)
            D[i].x = C[i + k - p].x, D[i].y = C[i + k - p].y;
        for (let r = p; r > 0; r--) {
            if (r == 1)
                this._tangent.x = D[1].x - D[0].x,
                    this._tangent.y = D[1].y - D[0].y;
            for (let i = 0; i < r; i++) {
                const i_k = i + k + 1;
                const a = (t - K[i_k - r]) / (K[i_k] - K[i_k - r]);
                const d0 = D[i], d1 = D[i + 1];
                d0.x = (1 - a) * d0.x + a * d1.x;
                d0.y = (1 - a) * d0.y + a * d1.y;
            }
        }
        return D[0];
    }
    normalize(t) {
        t = Math.max(0, Math.min(t, 1));
        const p = this.degree;
        const K = this.K;
        return K[p] + t * (K[K.length - p - 1] - K[p]);
    }
    findInterval(t) {
        const { K, degree: p } = this;
        const n = K.length;
        for (let i = p; i < n - p - 1; i++)
            if (t < K[i + 1])
                return i;
        return n - p - 2;
    }
    static createKnotsClamped(n, p) {
        const K = [];
        const m = p + 1;
        K.length = n;
        K.fill(0, 0, m);
        K.fill(1, n - m);
        for (let i = m; i < n - m; i++)
            K[i] = (i - p) / (n - m - m + 1);
        return K;
    }
    static createKnotsRegular(n) {
        const K = [];
        K.length = n;
        for (let i = 0; i < n; i++)
            K[i] = i / (n - 1);
        return K;
    }
}
exports.BSpline = BSpline;

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BSplineDescribed = void 0;
const BSpline_1 = require("./BSpline");
////////////////////////////////////////
// BSplineDescribed
class BSplineDescribed extends BSpline_1.BSpline {
    constructor(CV, maxDegree, closed) {
        super(CV, maxDegree, closed);
        for (let i = 0; i < this.D.length; i++)
            this.D[i] = { x: 0, y: 0 };
        for (let i = this.degree + 1; i >= 1; i--)
            this.G.push(new Array(i).fill(0).map(_ => ({ x: 0, y: 0 })));
    }
    G = [];
    get knots() { return this.K; }
    getGuides(t) {
        const { G, _CV: C, K, degree: p } = this;
        t = this.normalize(t);
        const k = this.findInterval(t);
        for (let i = 0; i <= p; i++)
            G[0][i].x = C[i + k - p].x, G[0][i].y = C[i + k - p].y;
        for (let r = p; r > 0; r--) {
            const D0 = G[p - r];
            const D1 = G[p - r + 1];
            for (let i = 0; i < r; i++) {
                const i_k = i + k + 1;
                const a = (t - K[i_k - r]) / (K[i_k] - K[i_k - r]);
                D1[i].x = (1 - a) * D0[i].x + a * D0[i + 1].x;
                D1[i].y = (1 - a) * D0[i].y + a * D0[i + 1].y;
            }
        }
        return this.G;
    }
    getSegment(t) {
        return this.findInterval(this.normalize(t)) - this.degree;
    }
    getSegmentControlKnots(iSeg) {
        const start = iSeg + 1;
        return { start, end: start + this.degree * 2 };
    }
    getSegmentKnots() {
        return this.K.slice(this.degree, this.K.length - this.degree);
    }
    getSegmentControlPoints(s_i) {
        s_i = Math.max(0, Math.min(s_i, this.segments - 1));
        const p = this.degree;
        return this._CV.slice(s_i, s_i + p + 1);
    }
    getSegmentIntervals() {
        const K = this.K;
        const I = [];
        const p = this.degree;
        I.length = K.length - 2 * p + 1;
        const len = K[K.length - p - 1] - K[p];
        for (let i = p; i <= K.length - p; i++)
            I[i - p] = (K[i] - K[p]) / len;
        return I;
    }
    getNormalized(t) {
        return this.normalize(t);
    }
}
exports.BSplineDescribed = BSplineDescribed;

},{"./BSpline":1}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Input = exports.InputFlags = void 0;
////////////////////////////////////////
// Input
var InputFlags;
(function (InputFlags) {
    InputFlags[InputFlags["None"] = 0] = "None";
    InputFlags[InputFlags["Control"] = 1] = "Control";
    InputFlags[InputFlags["Shift"] = 2] = "Shift";
    InputFlags[InputFlags["Alt"] = 4] = "Alt";
})(InputFlags || (exports.InputFlags = InputFlags = {}));
class Input {
    tapRegion;
    getDragPoint;
    dragged;
    stopDrag;
    hover;
    flagChanged;
    constructor(tapRegion, getDragPoint, dragged, stopDrag, hover, flagChanged) {
        this.tapRegion = tapRegion;
        this.getDragPoint = getDragPoint;
        this.dragged = dragged;
        this.stopDrag = stopDrag;
        this.hover = hover;
        this.flagChanged = flagChanged;
        this.tapRegion.addEventListener("mousedown", this.onMouseDown.bind(this));
        this.tapRegion.addEventListener("mousemove", this.onMouseMove.bind(this));
        window.addEventListener("mouseup", this.onMouseUp.bind(this));
        document.addEventListener("keydown", this.onKeyChanged.bind(this));
        document.addEventListener("keyup", this.onKeyChanged.bind(this));
    }
    _dragPoint;
    _mouseDownPos = { x: 0, y: 0 };
    _pos = { x: 0, y: 0 };
    _flags = InputFlags.None;
    get flags() { return this._flags; }
    toLocalPos(ev, out) {
        const r = this.tapRegion.getBoundingClientRect();
        const x = ev.clientX - r.x, y = ev.clientY - r.y;
        if (out)
            out.x = x, out.y = y;
        else
            out = { x, y };
        return out;
    }
    onMouseDown(ev) {
        this._mouseDownPos = this.toLocalPos(ev);
        this._dragPoint = this.getDragPoint(this._mouseDownPos);
    }
    onMouseMove(ev) {
        if (!this._dragPoint || !this._mouseDownPos)
            return;
        const pos = this.toLocalPos(ev);
        this.hover?.(pos);
        this.dragged({
            x: this._dragPoint.x + pos.x - this._mouseDownPos.x,
            y: this._dragPoint.y + pos.y - this._mouseDownPos.y
        });
    }
    onMouseUp() {
        if (!this._dragPoint)
            return;
        this._dragPoint = undefined;
        this.stopDrag();
    }
    onKeyChanged(ev) {
        const flags = this.getFlagsFromEvent(ev);
        const changed = flags != this.flags;
        this._flags = flags;
        if (changed)
            this.flagChanged?.(flags);
    }
    getFlagsFromEvent(ev) {
        let flags = InputFlags.None;
        if (ev.ctrlKey)
            flags |= InputFlags.Control;
        if (ev.shiftKey)
            flags |= InputFlags.Shift;
        if (ev.altKey)
            flags |= InputFlags.Alt;
        return flags;
    }
}
exports.Input = Input;

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnotsEditor = void 0;
const Input_1 = require("./Input");
////////////////////////////////////////
// Knots editor
class KnotsEditor {
    knots;
    constructor(tapRegion, tapRadius, knots, onEdit) {
        this.knots = knots;
        const width = tapRegion.clientWidth;
        const dx = tapRadius / width;
        this.input = new Input_1.Input(tapRegion, at => {
            const knots = this.knots;
            const x = at.x / width;
            for (let i = 1; i < knots.length - 1; i++) {
                if (Math.abs(knots[i] - x) < dx) {
                    this._curIndex = i;
                    return { x: knots[i] * width, y: 0 };
                }
            }
        }, p => {
            const knots = this.knots;
            const x = Math.max(0, Math.min(p.x / width, 1));
            for (let i = this._curIndex; i > 0 && x < knots[i]; i--)
                knots[i] = x;
            for (let i = this._curIndex; i < knots.length && x > knots[i]; i++)
                knots[i] = x;
            onEdit();
        }, () => { this._curIndex = -1; });
    }
    input;
    _curIndex = -1;
}
exports.KnotsEditor = KnotsEditor;

},{"./Input":3}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PointSetEditor = void 0;
const Input_1 = require("./Input");
class PointSetEditor {
    pointSet;
    constructor(tapRegion, pointSet, onEdit, onCommit) {
        this.pointSet = pointSet;
        this.input = new Input_1.Input(tapRegion, at => {
            const ctrl = this.input.flags & Input_1.InputFlags.Control;
            const index = pointSet.get(at.x, at.y);
            if (ctrl && index > -1) {
                pointSet.remove(index);
                onEdit?.();
                return;
            }
            const p = pointSet.points[this._curIndex = index]
                || ctrl && pointSet.points[this._curIndex = pointSet.add(at.x, at.y)]
                || undefined;
            if (!p)
                return;
            onEdit?.();
            return { x: p.x, y: p.y };
        }, p => {
            pointSet.set(this._curIndex, p.x, p.y);
            onEdit?.();
        }, () => { this._curIndex = -1; onCommit?.(); });
    }
    input;
    _curIndex = -1;
}
exports.PointSetEditor = PointSetEditor;

},{"./Input":3}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Render = void 0;
const showElement_1 = require("./showElement");
const CURVE_SAMPLES = 1000;
const CURVE_RULER_DOTS = 50;
const CURVE_RULER_DOT_LEN = 6;
const CURVE_RULER_COLOR = "black";
const CURVE_SEGMENT_COLORS = ["red", "blue", "magenta"];
const PROGRESS_GUIDES_COLOR = "gray";
const PROGRESS_POINT_COLOR = "black";
const CV_COLOR = "#008000";
const CV_CURRENT_SEGMENT_COLOR = "#000000";
const KNOT_RANGE_HEIGHT_FACTOR = 0.1;
const KNOT_DRAG_REGION_COLOR = 'rgba(0, 0, 0, 0.2)';
const KNOT_LINE_COLOR = "black";
const KNOT_PROGERSS_LINE_COLOR = "black";
const KNOT_SEGMENT_RANGE_COLOR = 'rgba(0, 0, 0, 0.4)';
const COMMON_CLEAR_COLOR = "white";
const COMMON_FRAME_COLOR = "black";
class Render {
    curveCanvas;
    knotsCanvas;
    description;
    knotRadius;
    constructor(curveCanvas, knotsCanvas, description, knotRadius) {
        this.curveCanvas = curveCanvas;
        this.knotsCanvas = knotsCanvas;
        this.description = description;
        this.knotRadius = knotRadius;
    }
    run(params) {
        const { curve, progress } = params;
        this.renderCurve(params);
        (0, showElement_1.showElement)(this.knotsCanvas, !!curve);
        if (curve)
            this.renderKnots(curve, progress);
    }
    renderCurve(params) {
        const { vertexSet, curve, progress } = params;
        const canvas = this.curveCanvas;
        const ctx = this.startCommon(canvas);
        if (!ctx)
            return;
        const description = this.description;
        if (description)
            description.innerHTML = "";
        const CV = vertexSet.vertices;
        if (!CV.length)
            return;
        if (curve) {
            // guides
            if (progress !== undefined) {
                const G = curve.getGuides(progress);
                ctx.lineWidth = 1;
                ctx.strokeStyle = PROGRESS_GUIDES_COLOR;
                for (let i = 0; i < G.length; i++) {
                    if (G.length < 2)
                        continue;
                    const g = G[i];
                    ctx.beginPath();
                    ctx.moveTo(g[0].x, g[0].y);
                    for (let i = 1; i < g.length; i++)
                        ctx.lineTo(g[i].x, g[i].y);
                    ctx.stroke();
                }
                ctx.fillStyle = PROGRESS_GUIDES_COLOR;
                for (let i = 0; i < G.length; i++) {
                    const g = G[i];
                    for (let i = 0; i < g.length; i++) {
                        ctx.beginPath();
                        ctx.ellipse(g[i].x, g[i].y, devicePixelRatio * 2, devicePixelRatio * 2, 0, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
            // curve
            const SEGMENT_SAMPLES = Math.ceil(CURVE_SAMPLES / curve.segments);
            const I = curve.getSegmentIntervals();
            for (let s_i = 0, s_t = 0; s_i < curve.segments; s_i++, s_t = I[s_i]) {
                const s_len = I[s_i + 1] - I[s_i];
                ctx.strokeStyle = CURVE_SEGMENT_COLORS[s_i % CURVE_SEGMENT_COLORS.length];
                ctx.lineWidth = progress !== undefined && s_t <= progress && progress < s_t + s_len ? 4 : 2;
                ctx.beginPath();
                let p = curve.get(s_t);
                ctx.moveTo(p.x, p.y);
                for (let i = 1; i <= SEGMENT_SAMPLES; i++) {
                    p = curve.get(s_t + s_len * i / SEGMENT_SAMPLES);
                    ctx.lineTo(p.x, p.y);
                }
                ctx.stroke();
            }
            // curve ruler
            if (params.ruler) {
                for (let i = 1; i < CURVE_RULER_DOTS; i++) {
                    const p = curve.get(i / CURVE_RULER_DOTS);
                    const tang = curve.tangent;
                    const lenFactor = CURVE_RULER_DOT_LEN / Math.sqrt(tang.x * tang.x + tang.y * tang.y);
                    const nx = -tang.y * lenFactor, ny = tang.x * lenFactor;
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = CURVE_RULER_COLOR;
                    ctx.beginPath();
                    ctx.moveTo(p.x + nx * 0.5, p.y + ny * 0.5);
                    ctx.lineTo(p.x + nx, p.y + ny);
                    ctx.stroke();
                }
            }
            // progress
            if (progress !== undefined) {
                const R = 1.5 * vertexSet.radius * devicePixelRatio;
                const p = curve.get(progress);
                ctx.lineWidth = 1;
                ctx.fillStyle = PROGRESS_POINT_COLOR;
                ctx.beginPath();
                ctx.ellipse(p.x, p.y, R, R, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            // description
            if (description) {
                const formatter = new Intl.NumberFormat('en-US', {
                    maximumFractionDigits: 2
                });
                const knots = curve.knots.map(v => formatter.format(v).replace("0.", "."));
                let knotsStr;
                let progressStr = '';
                if (progress !== undefined) {
                    const progressFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 });
                    progressStr = `Progress: ${progressFmt.format(progress).replace("0.", ".")}<br/>`;
                    const iSeg = curve.getSegment(progress);
                    const range = curve.getSegmentControlKnots(iSeg);
                    const pre = knots.slice(0, range.start);
                    const mid = knots.slice(range.start, range.end);
                    const post = knots.slice(range.end);
                    knotsStr = `${pre.join(' ')} <b><u>${mid.join(' ')}</u></b> ${post.join(' ')}`;
                }
                else {
                    knotsStr = knots.join(' ');
                }
                description.innerHTML = `
                    Degree: ${curve.degree}<br/>
                    Order: ${curve.degree + 1}<br/>
                    Segments: ${curve.segments}<br/>
                    Knots: ${knotsStr}<br/>
                ` + progressStr;
            }
        }
        function drawCV(ctx, V, closed, boldFactor, color) {
            ctx.lineWidth = boldFactor;
            // control cage
            ctx.strokeStyle = color;
            ctx.beginPath();
            V.forEach((v, i) => {
                if (!i)
                    ctx.moveTo(v.x, v.y);
                else
                    ctx.lineTo(v.x, v.y);
            });
            if (closed)
                ctx.lineTo(CV[0].x, CV[0].y);
            ctx.stroke();
            // control vertices
            ctx.fillStyle = color;
            for (const v of V) {
                const r = vertexSet.radius * devicePixelRatio * boldFactor;
                ctx.fillRect(v.x - r, v.y - r, r * 2, r * 2);
            }
        }
        // All control vertices
        drawCV(ctx, CV, !!curve?.closed, 1, CV_COLOR);
        // Control vertices of the current segment
        if (curve && progress !== undefined)
            drawCV(ctx, curve.getSegmentControlPoints(curve.getSegment(progress)), false, 1.5, CV_CURRENT_SEGMENT_COLOR);
    }
    renderKnots(curve, progress) {
        const canvas = this.knotsCanvas;
        const ctx = this.startCommon(canvas);
        if (!ctx)
            return;
        const knots = curve.knots;
        const width = canvas.width;
        const height = canvas.height;
        const h = progress !== undefined ? height * KNOT_RANGE_HEIGHT_FACTOR : 0;
        const radius = this.knotRadius;
        // All knots control lines
        ctx.lineWidth = 1;
        for (const knot of knots) {
            ctx.fillStyle = KNOT_DRAG_REGION_COLOR;
            const x = knot * width;
            ctx.fillRect(x - radius, h, radius * 2, height - h * 2);
            ctx.strokeStyle = KNOT_LINE_COLOR;
            ctx.beginPath();
            ctx.moveTo(x, h);
            ctx.lineTo(x, height - h);
            ctx.stroke();
        }
        if (progress !== undefined) {
            // Separating lines
            ctx.strokeStyle = COMMON_FRAME_COLOR;
            ctx.beginPath();
            ctx.moveTo(0, h);
            ctx.lineTo(width, h);
            ctx.moveTo(0, height - h);
            ctx.lineTo(width, height - h);
            ctx.stroke();
            // Line + Arrows
            const x = curve.getNormalized(progress) * width;
            ctx.fillStyle = KNOT_PROGERSS_LINE_COLOR;
            ctx.beginPath();
            ctx.moveTo(x, h);
            ctx.lineTo(x + h, 0);
            ctx.lineTo(x - h, 0);
            ctx.closePath();
            ctx.moveTo(x, height - h);
            ctx.lineTo(x + h, height);
            ctx.lineTo(x - h, height);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = KNOT_PROGERSS_LINE_COLOR;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
            // All segments knots range
            const segKnots = curve.getSegmentKnots();
            let xMin = segKnots[0] * width;
            let xMax = segKnots[segKnots.length - 1] * width;
            ctx.fillStyle = KNOT_SEGMENT_RANGE_COLOR;
            ctx.fillRect(xMin, height - h, xMax - xMin, h);
            // Current segment knot range
            if (progress < 1) {
                const iK = curve.getSegment(progress);
                xMin = segKnots[iK] * width;
                xMax = segKnots[iK + 1] * width;
                ctx.fillRect(xMin, 0, xMax - xMin, h);
            }
        }
    }
    startCommon(canvas) {
        const ctx = canvas.getContext("2d");
        if (!ctx)
            return;
        // clear
        ctx.fillStyle = COMMON_CLEAR_COLOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // frame
        ctx.lineWidth = 1;
        ctx.strokeStyle = COMMON_FRAME_COLOR;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        return ctx;
    }
}
exports.Render = Render;

},{"./showElement":10}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VertexSet = void 0;
////////////////////////////////////////
// VertexSet
class VertexSet {
    radius;
    pickRadius;
    onCountChange;
    vertices;
    constructor(radius, pickRadius = radius, onCountChange, vertices = []) {
        this.radius = radius;
        this.pickRadius = pickRadius;
        this.onCountChange = onCountChange;
        this.vertices = vertices;
    }
    get points() { return this.vertices; }
    get(x, y) {
        const r = this.pickRadius * devicePixelRatio;
        let winI = -1, winD = r * r;
        this.points.forEach((p, i) => {
            const dx = x - p.x, dy = y - p.y;
            const d = dx * dx + dy * dy;
            if (d < winD)
                winD = d, winI = i;
        });
        return winI;
    }
    add(x, y) {
        this.points.push({ x, y });
        this.onCountChange?.();
        return this.points.length - 1;
    }
    set(index, x, y) {
        const v = this.vertices[index];
        if (v)
            v.x = x, v.y = y;
    }
    remove(index) {
        this.vertices.splice(index, 1);
        this.onCountChange?.();
    }
}
exports.VertexSet = VertexSet;

},{}],8:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VertexStorage = void 0;
class VertexStorage {
    static CV_KEY = "data.CV";
    static load() {
        try {
            const list = JSON.parse(localStorage[this.CV_KEY]);
            if (!Array.isArray(list))
                return undefined;
            if (list.some(e => typeof (e) !== "object" || typeof (e.x) !== "number" || typeof (e.y) !== "number"))
                return undefined;
            return list;
        }
        catch { }
    }
    static save(list) {
        try {
            localStorage[this.CV_KEY] = JSON.stringify(list);
        }
        catch { }
    }
}
exports.VertexStorage = VertexStorage;

},{}],9:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BSplineDescribed_1 = require("./BSplineDescribed");
const KnotsEditor_1 = require("./KnotsEditor");
const PointSet_1 = require("./PointSet");
const Render_1 = require("./Render");
const showElement_1 = require("./showElement");
const VertexSet_1 = require("./VertexSet");
const VertexStorage_1 = require("./VertexStorage");
const CURVE_DEGREE_DEFAULT = 3;
const CURVE_DEGREE_MAX = 5;
const CV_RADIUS = 2.5;
const CV_PICK_RADIUS = CV_RADIUS * 2;
const KNOT_RADIUS = 5;
function getElement(id, tag = "") {
    return document.querySelector(`${tag}[id="${id}"]`);
}
async function main() {
    const curveCanvas = getElement("spline", "canvas");
    const knotsCanvas = getElement("knots", "canvas");
    if (!curveCanvas || !knotsCanvas)
        return;
    const progressCheckbox = getElement("showProgress", "input");
    const rulerCheckbox = getElement("showRuler", "input");
    const closedCheckbox = getElement("closed", "input");
    const degreeSlider = getElement("degree", "input");
    const clearButton = getElement("clear", "button");
    const progressSlider = getElement("progress", "input");
    const decription = getElement("description");
    let curve;
    let knotsEditor;
    const render = new Render_1.Render(curveCanvas, knotsCanvas, decription, KNOT_RADIUS);
    const updateView = () => {
        if (progressSlider)
            (0, showElement_1.showElement)(progressSlider, progressCheckbox?.checked ?? false);
        const progress = progressCheckbox?.checked ? Number(progressSlider?.value ?? 0) / Number(progressSlider?.max) : undefined;
        render.run({ vertexSet, curve, progress, ruler: rulerCheckbox?.checked });
    };
    const saveVertices = () => VertexStorage_1.VertexStorage.save(vertexSet.vertices);
    const rebuildCurve = () => {
        saveVertices();
        curve = vertexSet.vertices.length > 1
            ? new BSplineDescribed_1.BSplineDescribed(vertexSet.vertices, degreeSlider ? Number(degreeSlider.value) : CURVE_DEGREE_DEFAULT, closedCheckbox?.checked ?? false)
            : undefined;
        (0, showElement_1.showElement)(knotsCanvas, !!curve);
        if (curve)
            knotsEditor.knots = curve.knots;
        updateView();
    };
    const clearCurve = () => {
        vertexSet.vertices.length = 0;
        rebuildCurve();
    };
    const vertexSet = new VertexSet_1.VertexSet(CV_RADIUS, CV_PICK_RADIUS, rebuildCurve, VertexStorage_1.VertexStorage.load());
    closedCheckbox?.addEventListener("change", rebuildCurve);
    if (degreeSlider)
        degreeSlider.max = `${CURVE_DEGREE_MAX}`;
    degreeSlider?.addEventListener("input", rebuildCurve);
    clearButton?.addEventListener("click", clearCurve);
    progressSlider?.addEventListener("input", updateView);
    progressCheckbox?.addEventListener("change", updateView);
    rulerCheckbox?.addEventListener("change", updateView);
    new PointSet_1.PointSetEditor(curveCanvas, vertexSet, updateView, saveVertices);
    knotsEditor = new KnotsEditor_1.KnotsEditor(knotsCanvas, KNOT_RADIUS, [], updateView);
    rebuildCurve();
}
if (document.readyState == "loading")
    document.addEventListener("DOMContentLoaded", main);
else
    main();

},{"./BSplineDescribed":2,"./KnotsEditor":4,"./PointSet":5,"./Render":6,"./VertexSet":7,"./VertexStorage":8,"./showElement":10}],10:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showElement = showElement;
function showElement(element, show) {
    element.style = "display: " + (show ? "inline-block" : "none");
}

},{}]},{},[9]);
