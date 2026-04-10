import { BSplineDescribed } from "./BSplineDescribed";
import { KnotsEditor } from "./KnotsEditor";
import { PointSetEditor } from "./PointSet";
import { Render } from "./Render";
import { showElement } from "./showElement";
import { VertexSet } from "./VertexSet";
import { VertexStorage } from "./VertexStorage";

const CURVE_DEGREE_DEFAULT = 3;
const CURVE_DEGREE_MAX = 5;
const CV_RADIUS = 2.5;
const CV_PICK_RADIUS = CV_RADIUS * 2;
const KNOT_RADIUS = 5;

function getElement<T extends HTMLElement>(id: string, tag = ""): T | null {
    return document.querySelector(`${tag}[id="${id}"]`) as (T | null);
}

async function main() {
    const curveCanvas = getElement<HTMLCanvasElement>("spline", "canvas");
    const knotsCanvas = getElement<HTMLCanvasElement>("knots", "canvas");
    if (!curveCanvas || !knotsCanvas) return;
    const progressCheckbox = getElement<HTMLInputElement>("showProgress", "input");
    const rulerCheckbox = getElement<HTMLInputElement>("showRuler", "input");
    const closedCheckbox = getElement<HTMLInputElement>("closed", "input");
    const degreeSlider = getElement<HTMLInputElement>("degree", "input");
    const clearButton = getElement<HTMLButtonElement>("clear", "button");
    const progressSlider = getElement<HTMLInputElement>("progress", "input");
    const decription = getElement("description");

    let curve: BSplineDescribed | undefined;
    let knotsEditor: KnotsEditor;
    const render = new Render(curveCanvas, knotsCanvas, decription, KNOT_RADIUS);
    const updateView = () => {
        if (progressSlider) showElement(progressSlider, progressCheckbox?.checked ?? false);
        const progress = progressCheckbox?.checked ? Number(progressSlider?.value ?? 0) / Number(progressSlider?.max) : undefined;
        render.run({ vertexSet, curve, progress, ruler: rulerCheckbox?.checked });
    }
    const saveVertices = () => VertexStorage.save(vertexSet.vertices);
    const rebuildCurve = () => {
        saveVertices();
        curve = vertexSet.vertices.length > 1
            ? new BSplineDescribed(
                vertexSet.vertices,
                degreeSlider ? Number(degreeSlider.value) : CURVE_DEGREE_DEFAULT,
                closedCheckbox?.checked ?? false)
            : undefined;
        showElement(knotsCanvas, !!curve);
        if (curve) knotsEditor.knots = curve.knots;
        updateView();
    }
    const clearCurve = () => {
        vertexSet.vertices.length = 0;
        rebuildCurve();
    }
    const vertexSet = new VertexSet(CV_RADIUS, CV_PICK_RADIUS,  rebuildCurve, VertexStorage.load());
    closedCheckbox?.addEventListener("change", rebuildCurve);
    if (degreeSlider) degreeSlider.max = `${CURVE_DEGREE_MAX}`;
    degreeSlider?.addEventListener("input", rebuildCurve);
    clearButton?.addEventListener("click", clearCurve);
    progressSlider?.addEventListener("input", updateView);
    progressCheckbox?.addEventListener("change", updateView);
    rulerCheckbox?.addEventListener("change", updateView);
    new PointSetEditor(curveCanvas, vertexSet, updateView, saveVertices);
    knotsEditor = new KnotsEditor(knotsCanvas, KNOT_RADIUS, [], updateView);
    rebuildCurve();
}

if (document.readyState == "loading")
    document.addEventListener("DOMContentLoaded", main);
else
    main();