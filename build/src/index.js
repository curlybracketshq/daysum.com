"use strict";
window.onload = function () {
    checkSchemaVersion();
    DSCategory.load();
    DSEvent.load();
    var newEventFormElement = document.getElementById("new_event_form");
    if (!(newEventFormElement instanceof HTMLFormElement)) {
        throw "Missing form";
    }
    newEventFormElement.onsubmit = createNewEvent;
    var newCategoryFormElement = document.getElementById("new_category_form");
    if (!(newCategoryFormElement instanceof HTMLFormElement)) {
        throw "Missing form";
    }
    newCategoryFormElement.onsubmit = createNewCategory;
    renderCategories();
    renderEvents();
};
//# sourceMappingURL=index.js.map