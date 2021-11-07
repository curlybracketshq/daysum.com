"use strict";
var DSSVGArc = /** @class */ (function () {
    function DSSVGArc() {
    }
    DSSVGArc.pathD = function () {
        var start = this.pointInCircle(this.RADIUS, this.STATE.startAngle, this.OFFSET);
        var end = this.pointInCircle(this.RADIUS, this.STATE.startAngle + this.STATE.sweep, this.OFFSET);
        var move = "M " + this.OFFSET[0] + " " + this.OFFSET[1];
        var line = "L " + start[0] + " " + start[1];
        var arc = "A " + this.RADIUS + " " + this.RADIUS + " 0 " + (this.STATE.sweep > 180 ? 0 : 1) + " 0 " + end[0] + " " + end[1];
        return move + " " + line + " " + arc + " Z";
    };
    DSSVGArc.toRadians = function (angle) {
        return (Math.PI / 180) * angle;
    };
    DSSVGArc.pointInCircle = function (radius, angle, offset) {
        var x = Math.cos(this.toRadians(angle)) * radius + offset[0];
        var y = Math.sin(this.toRadians(angle)) * radius + offset[1];
        return [x, y];
    };
    DSSVGArc.updateSVG = function () {
        var start = this.pointInCircle(this.RADIUS, this.STATE.startAngle, this.OFFSET);
        var startDot = document.getElementById("start_dot");
        startDot.setAttribute('cx', start[0].toString());
        startDot.setAttribute('cy', start[1].toString());
        var end = this.pointInCircle(this.RADIUS, this.STATE.startAngle + this.STATE.sweep, this.OFFSET);
        var endDot = document.getElementById("end_dot");
        endDot.setAttribute('cx', end[0].toString());
        endDot.setAttribute('cy', end[1].toString());
        var path = document.getElementById("path");
        path.setAttribute('d', this.pathD());
    };
    DSSVGArc.updateForm = function () {
        var startAngleText = document.getElementById("start_angle_text");
        startAngleText.textContent = this.STATE.startAngle.toString();
        var sweepText = document.getElementById("sweep_text");
        sweepText.textContent = this.STATE.sweep.toString();
    };
    DSSVGArc.updateUI = function () {
        this.updateSVG();
        this.updateForm();
    };
    DSSVGArc.onStartAngleChange = function (event) {
        var value = event.target.value;
        this.STATE.startAngle = parseInt(value, 10);
        this.updateUI();
    };
    DSSVGArc.onSweepChange = function (event) {
        var value = event.target.value;
        this.STATE.sweep = parseInt(value, 10);
        this.updateUI();
    };
    DSSVGArc.init = function () {
        var _this = this;
        console.log(this);
        this.updateUI();
        var startAngle = document.getElementById("start_angle");
        startAngle.value = this.STATE.startAngle.toString();
        startAngle.oninput = function (event) { return _this.onStartAngleChange(event); };
        var sweep = document.getElementById("sweep");
        sweep.value = this.STATE.sweep.toString();
        sweep.oninput = function (event) { return _this.onSweepChange(event); };
    };
    DSSVGArc.RADIUS = 150;
    DSSVGArc.OFFSET = [300, 200];
    DSSVGArc.STATE = {
        startAngle: 0,
        sweep: 90,
    };
    return DSSVGArc;
}());
window.onload = function () { return DSSVGArc.init(); };
//# sourceMappingURL=index.js.map