"use strict";
var svgArcRadius = 150;
var svgArcOffset = [300, 200];
var svgArcState = {
    startAngle: 0,
    sweep: 90,
};
function pathD() {
    var start = pointInCircle(svgArcRadius, svgArcState.startAngle, svgArcOffset);
    var end = pointInCircle(svgArcRadius, svgArcState.startAngle + svgArcState.sweep, svgArcOffset);
    var move = "M " + svgArcOffset[0] + " " + svgArcOffset[1];
    var line = "L " + start[0] + " " + start[1];
    var arc = "A " + svgArcRadius + " " + svgArcRadius + " 0 " + (svgArcState.sweep > 180 ? 0 : 1) + " 0 " + end[0] + " " + end[1];
    return move + " " + line + " " + arc + " Z";
}
function toRadians(angle) {
    return (Math.PI / 180) * angle;
}
function pointInCircle(radius, angle, offset) {
    var x = Math.cos(toRadians(angle)) * radius + offset[0];
    var y = Math.sin(toRadians(angle)) * radius + offset[1];
    return [x, y];
}
function updateSVG() {
    var start = pointInCircle(svgArcRadius, svgArcState.startAngle, svgArcOffset);
    var startDot = document.getElementById("start_dot");
    startDot.setAttribute('cx', start[0].toString());
    startDot.setAttribute('cy', start[1].toString());
    var end = pointInCircle(svgArcRadius, svgArcState.startAngle + svgArcState.sweep, svgArcOffset);
    var endDot = document.getElementById("end_dot");
    endDot.setAttribute('cx', end[0].toString());
    endDot.setAttribute('cy', end[1].toString());
    var path = document.getElementById("path");
    path.setAttribute('d', pathD());
}
function updateForm() {
    var startAngleText = document.getElementById("start_angle_text");
    startAngleText.textContent = svgArcState.startAngle.toString();
    var sweepText = document.getElementById("sweep_text");
    sweepText.textContent = svgArcState.sweep.toString();
}
function updateUI() {
    updateSVG();
    updateForm();
}
function onStartAngleChange(event) {
    var value = event.target.value;
    svgArcState.startAngle = parseInt(value, 10);
    updateUI();
}
function onSweepChange(event) {
    var value = event.target.value;
    svgArcState.sweep = parseInt(value, 10);
    updateUI();
}
window.onload = function () {
    updateUI();
    var startAngle = document.getElementById("start_angle");
    startAngle.value = svgArcState.startAngle.toString();
    startAngle.oninput = onStartAngleChange;
    var sweep = document.getElementById("sweep");
    sweep.value = svgArcState.sweep.toString();
    sweep.oninput = onSweepChange;
};
//# sourceMappingURL=index.js.map