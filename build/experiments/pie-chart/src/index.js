"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var DSPieChart = /** @class */ (function () {
    function DSPieChart() {
    }
    DSPieChart.getData = function () {
        if (!this.IS_SORTED) {
            return this.DATA;
        }
        return __spreadArray([], this.DATA, true).sort(function (a, b) { return a.value - b.value; });
    };
    DSPieChart.pathD = function (startAngle, sweep) {
        var start = this.pointInCircle(this.RADIUS, startAngle, this.OFFSET);
        var end = this.pointInCircle(this.RADIUS, startAngle + sweep, this.OFFSET);
        var move = "M " + this.OFFSET[0] + " " + this.OFFSET[1];
        var line = "L " + start[0] + " " + start[1];
        var arc = "A " + this.RADIUS + " " + this.RADIUS + " 0 " + (sweep <= 180 ? 0 : 1) + " 0 " + end[0] + " " + end[1];
        return move + " " + line + " " + arc + " Z";
    };
    DSPieChart.toRadians = function (angle) {
        return (Math.PI / 180) * angle;
    };
    DSPieChart.pointInCircle = function (radius, angle, offset) {
        var x = Math.cos(this.toRadians(angle)) * radius + offset[0];
        var y = -Math.sin(this.toRadians(angle)) * radius + offset[1];
        return [x, y];
    };
    DSPieChart.colorAlpha = function (index, length) {
        var alpha = 32 + 192 * (index / length);
        return Math.floor(alpha).toString(16);
    };
    DSPieChart.color = function (index, length) {
        return "" + this.TINT + this.colorAlpha(index, length);
    };
    DSPieChart.updateSVG = function () {
        var _this = this;
        var tot = this.DATA.reduce(function (acc, _a) {
            var value = _a.value;
            return acc + value;
        }, 0);
        var svg = document.getElementById("svg");
        svg.innerHTML = "";
        this.getData().reduce(function (startAngle, _a, index) {
            var name = _a.name, value = _a.value;
            var sweep = value / tot * 360;
            var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", _this.pathD(startAngle, sweep));
            path.style.fill = _this.color(index, _this.DATA.length);
            path.dataset.name = name;
            svg.appendChild(path);
            return startAngle + sweep;
        }, 0);
    };
    DSPieChart.updateData = function () {
        var _this = this;
        var dataElement = document.getElementById("data");
        dataElement.innerHTML = "";
        this.getData().forEach(function (_a, index) {
            var name = _a.name, value = _a.value;
            var itemElement = document.createElement("li");
            var color = document.createElement("span");
            color.style.display = "inline-block";
            color.style.marginRight = "4px";
            color.style.width = "20px";
            color.style.height = "20px";
            color.style.backgroundColor = _this.color(index, _this.DATA.length);
            itemElement.appendChild(color);
            var text = document.createTextNode(name + ": " + value + " ");
            itemElement.appendChild(text);
            var removeButton = document.createElement("button");
            removeButton.textContent = "Remove";
            removeButton.onclick = function () {
                _this.DATA.splice(index, 1);
                _this.updateUI();
            };
            itemElement.appendChild(removeButton);
            dataElement.appendChild(itemElement);
        });
    };
    DSPieChart.resetForm = function () {
        var newDataNameElement = document.getElementById("new_data_name");
        newDataNameElement.value = "";
        var newDataValueElement = document.getElementById("new_data_value");
        newDataValueElement.value = "";
    };
    DSPieChart.updateUI = function () {
        this.updateSVG();
        this.updateData();
    };
    DSPieChart.validateNewData = function (_a) {
        var name = _a.name, value = _a.value;
        if (isNaN(value)) {
            throw "Value is not a number";
        }
        if (value < 0) {
            throw "Value is negative";
        }
        if (name.length == 0) {
            throw "Name is empty";
        }
    };
    DSPieChart.onFormSubmit = function (event) {
        event.preventDefault();
        var newDataNameElement = document.getElementById("new_data_name");
        var name = newDataNameElement.value;
        var newDataValueElement = document.getElementById("new_data_value");
        var value = parseFloat(newDataValueElement.value);
        this.validateNewData({ name: name, value: value });
        this.DATA.push({ name: name, value: value });
        this.resetForm();
        this.updateUI();
    };
    DSPieChart.onChartTintInput = function (event) {
        var chartTintElement = event.target;
        this.TINT = chartTintElement.value;
        this.updateUI();
    };
    DSPieChart.onIsSortedChange = function (event) {
        var isSortedElement = event.target;
        this.IS_SORTED = isSortedElement.checked;
        this.updateUI();
    };
    DSPieChart.init = function () {
        var _this = this;
        this.updateUI();
        var newDataFormElement = document.getElementById("new_data_form");
        newDataFormElement.onsubmit = function (event) { return _this.onFormSubmit(event); };
        var chartTintElement = document.getElementById("chart_tint");
        chartTintElement.value = this.TINT;
        chartTintElement.oninput = function (event) { return _this.onChartTintInput(event); };
        var isSortedElement = document.getElementById("is_sorted");
        isSortedElement.checked = this.IS_SORTED;
        isSortedElement.onchange = function (event) { return _this.onIsSortedChange(event); };
    };
    DSPieChart.RADIUS = 150;
    DSPieChart.OFFSET = [300, 200];
    DSPieChart.TINT = "#800000";
    DSPieChart.IS_SORTED = false;
    DSPieChart.DATA = [
        { name: "Item 1", value: 10 },
        { name: "Item 2", value: 20 },
        { name: "Item 3", value: 30 },
        { name: "Item 4", value: 15 }
    ];
    return DSPieChart;
}());
window.onload = function () { return DSPieChart.init(); };
//# sourceMappingURL=index.js.map