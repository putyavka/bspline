import { BSplineDescribed } from "./BSplineDescribed";
import type { PointLike } from "./PointLike";
import { showElement } from "./showElement";
import { VertexSet } from "./VertexSet";

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

export interface RenderParams {
    readonly vertexSet: VertexSet;
    readonly curve?: BSplineDescribed;
    readonly progress?: number;
    readonly ruler?: boolean;
}

export class Render {
    public constructor(
        private readonly curveCanvas: HTMLCanvasElement,
        private readonly knotsCanvas: HTMLCanvasElement,
        private readonly description: HTMLElement | null,
        private readonly knotRadius: number
    ) { }

    public run(params: RenderParams): void {
        const { curve, progress } = params;
        this.renderCurve(params);
        showElement(this.knotsCanvas, !!curve);
        if (curve)
            this.renderKnots(curve, progress);
    }

    private renderCurve(params: RenderParams): void {
        const { vertexSet, curve, progress } = params;
        const canvas = this.curveCanvas;
        const ctx = this.startCommon(canvas);
        if (!ctx) return;

        const description = this.description;
        if (description) description.innerHTML = "";

        const CV = vertexSet.vertices;
        if (!CV.length) return;

        if (curve) {
            // guides
            if (progress !== undefined) {
                const G = curve.getGuides(progress);
                ctx.lineWidth = 1;
                ctx.strokeStyle = PROGRESS_GUIDES_COLOR;
                for (let i = 0; i < G.length; i++) {
                    if (G.length < 2) continue;
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
                let knotsStr: string | undefined;
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
                } else {
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

        function drawCV(ctx: CanvasRenderingContext2D, V: PointLike[], closed: boolean, boldFactor: number, color: string) {
            ctx.lineWidth = boldFactor;

            // control cage
            ctx.strokeStyle = color;
            ctx.beginPath();
            V.forEach((v, i) => {
                if (!i) ctx.moveTo(v.x, v.y);
                else ctx.lineTo(v.x, v.y);
            });
            if (closed)
                ctx.lineTo(CV[0]!.x, CV[0]!.y);
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

    private renderKnots(curve: BSplineDescribed, progress?: number): void {
        const canvas = this.knotsCanvas;
        const ctx = this.startCommon(canvas);
        if (!ctx) return;

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

    private startCommon(canvas: HTMLCanvasElement): CanvasRenderingContext2D | undefined {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

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
