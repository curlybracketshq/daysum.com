window.onload = function (): void {
  checkSchemaVersion()

  DSCategory.load()
  DSEvent.load()

  const newEventFormElement = document.getElementById("new_event_form")
  if (!(newEventFormElement instanceof HTMLFormElement)) {
    throw "Missing form"
  }
  newEventFormElement.onsubmit = createNewEvent

  const newCategoryFormElement = document.getElementById("new_category_form")
  if (!(newCategoryFormElement instanceof HTMLFormElement)) {
    throw "Missing form"
  }
  newCategoryFormElement.onsubmit = createNewCategory

  renderCategories()
  renderEvents()
}
