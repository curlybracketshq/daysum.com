"use strict";
var storage = window.localStorage;
var schemaVersion = 1;
var DSEvent = /** @class */ (function () {
    function DSEvent(id, time, value, category) {
        this.id = id;
        this.time = time;
        this.value = value;
        this.category = category;
    }
    DSEvent.key = function () {
        return "events";
    };
    DSEvent.load = function () {
        var _this = this;
        var dataStr = storage.getItem(this.key());
        var data = [];
        if (dataStr != null) {
            data = parseJSON(dataStr);
        }
        data.forEach(function (item) {
            _this.set(item.id, item.time, item.value, item.category_id);
        });
    };
    DSEvent.set = function (id, time, value, categoryID) {
        var category = DSCategory.fetch(categoryID);
        if (category == null) {
            return;
        }
        var event = new this(id, time, value, category);
        this.records[id] = event;
        if (this.recordsByCategory[event.category.id] == null) {
            this.recordsByCategory[event.category.id] = [event];
        }
        else {
            this.recordsByCategory[event.category.id].push(event);
        }
    };
    DSEvent.nextID = function () {
        return nextID("events_curr_id");
    };
    DSEvent.create = function (time, value, categoryID) {
        var category = DSCategory.fetch(categoryID);
        if (category == null) {
            throw "Missing category";
        }
        this.set(this.nextID(), time, value, categoryID);
        this.store();
    };
    DSEvent.store = function () {
        storeRecords(this.key(), this.records);
    };
    DSEvent.prototype.key = function () {
        return "event_" + this.id;
    };
    DSEvent.prototype.toJSON = function () {
        return { id: this.id, time: this.time, value: this.value, category_id: this.category.id };
    };
    DSEvent.records = {};
    DSEvent.recordsByCategory = {};
    DSEvent.currID = 0;
    return DSEvent;
}());
var DSCategory = /** @class */ (function () {
    function DSCategory(id, name, parent) {
        this.id = id;
        this.name = name;
        this.parent = parent;
    }
    DSCategory.key = function () {
        return "categories";
    };
    DSCategory.load = function () {
        var _this = this;
        var dataStr = storage.getItem(this.key());
        var data = [];
        if (dataStr != null) {
            data = parseJSON(dataStr);
        }
        data.forEach(function (item) {
            _this.set(item.id, item.name, item.parent_id);
        });
    };
    DSCategory.set = function (id, name, parentID) {
        var parent = parentID == null ? null : this.records[parentID];
        var category = new this(id, name, parent);
        this.records[id] = category;
        var level = parentID !== null && parentID !== void 0 ? parentID : -1;
        if (this.recordsByParent[level] == null) {
            this.recordsByParent[level] = [category];
        }
        else {
            this.recordsByParent[level].push(category);
        }
    };
    DSCategory.fetch = function (id) {
        return this.records[id];
    };
    DSCategory.nextID = function () {
        return nextID("categories_curr_id");
    };
    DSCategory.store = function () {
        storeRecords(this.key(), this.records);
    };
    DSCategory.create = function (name, parentID) {
        if (name.length < 1) {
            throw "Invalid name";
        }
        this.set(this.nextID(), name, parentID);
        this.store();
    };
    DSCategory.prototype.key = function () {
        return "category_" + this.id;
    };
    DSCategory.prototype.toJSON = function () {
        var _a;
        return { id: this.id, name: this.name, parent_id: (_a = this.parent) === null || _a === void 0 ? void 0 : _a.id };
    };
    DSCategory.records = {};
    DSCategory.recordsByParent = {};
    return DSCategory;
}());
function checkSchemaVersion() {
    var schemaVersionData = storage.getItem("schemaVersion");
    if (schemaVersionData == null) {
        storage.setItem("schemaVersion", schemaVersion.toString());
        return;
    }
    var localSchemaVersion = parseInt(schemaVersionData, 10);
    if (localSchemaVersion > schemaVersion) {
        throw "Schema version not supported";
    }
    if (localSchemaVersion < schemaVersion) {
        console.warn("Local schema version: " + localSchemaVersion + ", migration required");
    }
}
function renderCategories() {
    var categoriesElement = document.getElementById("categories");
    if (!(categoriesElement instanceof HTMLElement)) {
        throw "Missing element";
    }
    categoriesElement.innerHTML = "";
    var newEventCategoryElement = document.getElementById("new_event_category");
    if (!(newEventCategoryElement instanceof HTMLSelectElement)) {
        throw "Missing element";
    }
    renderCategoriesSelect(newEventCategoryElement, "-- Select a category --");
    var newCategoryParentElement = document.getElementById("new_category_parent");
    if (!(newCategoryParentElement instanceof HTMLSelectElement)) {
        throw "Missing element";
    }
    renderCategoriesSelect(newCategoryParentElement, "-- Select a parent category --");
    if (Object.keys(DSCategory.records).length < 1) {
        var p = document.createElement("p");
        p.textContent =
            "You didn't create any category yet. Create a new category using the form below.";
        categoriesElement.append(p);
        return;
    }
    categoriesElement.append(renderCategoriesHierarchy(-1));
    for (var key in DSCategory.records) {
        if (Object.hasOwnProperty.call(DSCategory.records, key)) {
            var category = DSCategory.records[key];
            var categoryElement = document.createElement("div");
            categoryElement.id = "category_" + category.id;
            categoriesElement.append(renderCategory(categoryElement, category));
        }
    }
}
function renderCategoriesHierarchy(level) {
    var _a;
    var children = (_a = DSCategory.recordsByParent[level]) !== null && _a !== void 0 ? _a : [];
    if (children.length < 1) {
        return "";
    }
    var categoryReferencesElement = document.createElement("ul");
    DSCategory.recordsByParent[level].forEach(function (/** @type {DSCategory} */ category) {
        var categoryReferenceItemElement = document.createElement("li");
        categoryReferencesElement.append(categoryReferenceItemElement);
        var categoryReferenceElement = document.createElement("a");
        categoryReferenceElement.href = "#category_" + category.id;
        categoryReferenceElement.textContent = category.name;
        categoryReferenceItemElement.append(categoryReferenceElement);
        categoryReferenceItemElement.append(renderCategoriesHierarchy(category.id));
    });
    return categoryReferencesElement;
}
function renderCategoriesSelect(element, defaultOption) {
    element.innerHTML = "";
    var defaultOptionElement = document.createElement("option");
    defaultOptionElement.textContent = defaultOption;
    defaultOptionElement.value = "";
    element.append(defaultOptionElement);
    for (var key in DSCategory.records) {
        if (Object.hasOwnProperty.call(DSCategory.records, key)) {
            var category = DSCategory.records[key];
            var optionElement = document.createElement("option");
            optionElement.textContent = category.name;
            optionElement.value = category.id.toString();
            element.append(optionElement);
        }
    }
}
function renderCategory(element, category) {
    var _a;
    var categoryName = document.createElement("h3");
    categoryName.textContent = category.name;
    element.append(categoryName);
    var events = (_a = DSEvent.recordsByCategory[category.id]) !== null && _a !== void 0 ? _a : [];
    var categoryMetadata = document.createElement("p");
    categoryMetadata.textContent = "You've done it " + pluralize(events.length, "time", "times") + ".";
    element.append(categoryMetadata);
    var categoryForm = document.createElement("form");
    categoryForm.id = "category_" + category.id + "_form";
    categoryForm.onsubmit = trackNow(category);
    element.append(categoryForm);
    var trackNowButton = document.createElement("input");
    trackNowButton.type = "submit";
    trackNowButton.value = "Track now";
    categoryForm.append(trackNowButton);
    var eventsList = document.createElement("ol");
    events.forEach(function (event) {
        var eventItem = document.createElement("li");
        eventItem.textContent = "Time: " + event.time + ", Value: " + event.value;
        eventsList.append(eventItem);
    });
    element.append(eventsList);
    return element;
}
function trackNow(category) {
    return function (event) {
        event.preventDefault();
        DSEvent.create(new Date(), 1, category.id);
        var categoryContainer = document.getElementById("category_" + category.id);
        if (!(categoryContainer instanceof HTMLElement)) {
            throw "Missing element";
        }
        categoryContainer.innerHTML = "";
        renderCategory(categoryContainer, category);
    };
}
function renderEvents() {
    var eventsElement = document.getElementById("events");
    if (!(eventsElement instanceof HTMLElement)) {
        throw "Missing element";
    }
    var eventsList = document.createElement("ol");
    eventsElement.append(eventsList);
    for (var key in DSEvent.records) {
        if (Object.hasOwnProperty.call(DSEvent.records, key)) {
            var event_1 = DSEvent.records[key];
            var eventItem = document.createElement("li");
            eventsList.append(eventItem);
            var text = document.createTextNode("Time: " + event_1.time + ", Value: " + event_1.value + ", Category: ");
            eventItem.append(text);
            var categoryReferenceElement = document.createElement("a");
            categoryReferenceElement.href = "#category_" + event_1.category.id;
            categoryReferenceElement.textContent = event_1.category.name;
            eventItem.append(categoryReferenceElement);
        }
    }
}
function createNewEvent(event) {
    event.preventDefault();
    var newEventTimeElement = document.getElementById("new_event_time");
    if (!(newEventTimeElement instanceof HTMLInputElement)) {
        throw "Missing field";
    }
    var newEventTime = new Date();
    if (newEventTimeElement.value.length > 1) {
        newEventTime = new Date(newEventTimeElement.value);
    }
    var newEventValueElement = document.getElementById("new_event_value");
    if (!(newEventValueElement instanceof HTMLInputElement)) {
        throw "Missing field";
    }
    var newEventValue = parseFloat(newEventValueElement.value);
    var newEventCategoryElement = document.getElementById("new_event_category");
    if (!(newEventCategoryElement instanceof HTMLSelectElement)) {
        throw "Missing field";
    }
    var newEventCategoryID = parseInt(newEventCategoryElement.value, 10);
    var category = DSCategory.fetch(newEventCategoryID);
    if (category == null) {
        throw "Invalid category";
    }
    DSEvent.create(newEventTime, newEventValue, newEventCategoryID);
    renderEvents();
    var categoryContainer = document.getElementById("category_" + category.id);
    if (!(categoryContainer instanceof HTMLElement)) {
        throw "Missing element";
    }
    categoryContainer.innerHTML = "";
    renderCategory(categoryContainer, category);
    // clear form
    newEventTimeElement.value = "";
    newEventValueElement.value = "";
    newEventCategoryElement.value = "";
}
function createNewCategory(event) {
    event.preventDefault();
    var newCategoryNameElement = document.getElementById("new_category_name");
    if (!(newCategoryNameElement instanceof HTMLInputElement)) {
        throw "Missing field";
    }
    var newCategoryName = newCategoryNameElement.value;
    var newCategoryParentElement = document.getElementById("new_category_parent");
    if (!(newCategoryParentElement instanceof HTMLSelectElement)) {
        throw "Missing field";
    }
    var newCategoryParentID = parseInt(newCategoryParentElement.value, 10);
    DSCategory.create(newCategoryName, isNaN(newCategoryParentID) ? null : newCategoryParentID);
    renderCategories();
    // clear form
    newCategoryNameElement.value = "";
    newCategoryParentElement.value = "";
}
function nextID(key) {
    var currIDData = storage.getItem(key);
    var currID;
    if (currIDData == null) {
        currID = 0;
    }
    else {
        currID = parseInt(currIDData, 10);
    }
    currID++;
    storage.setItem(key, currID.toString());
    return currID;
}
function pluralize(count, singular, plural) {
    return count + " " + (count == 1 ? singular : plural);
}
function deserializeDate(key, value) {
    if (key === "time") {
        return new Date(value);
    }
    return value;
}
function parseJSON(data) {
    return JSON.parse(data, deserializeDate);
}
function storeRecords(key, records) {
    var data = [];
    for (var key_1 in records) {
        if (Object.hasOwnProperty.call(records, key_1)) {
            var record = records[key_1];
            data.push(record.toJSON());
        }
    }
    storage.setItem(key, JSON.stringify(data));
}
//# sourceMappingURL=main.js.map