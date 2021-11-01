const storage = window.localStorage
const schemaVersion = 1

interface Serializable {
  toJSON: () => object
}

interface DSEventItem {
  id: number
  time: Date
  value: number
  category_id: number
}

class DSEvent implements Serializable {
  id: number
  time: Date
  value: number
  category: DSCategory

  static records: { [x: number]: DSEvent } = {}
  static recordsByCategory: { [x: number]: DSEvent[] } = {}
  static currID: number = 0

  constructor(id: number, time: Date, value: number, category: DSCategory) {
    this.id = id
    this.time = time
    this.value = value
    this.category = category
  }

  static key(): string {
    return "events"
  }

  static load(): void {
    const dataStr = storage.getItem(this.key())
    let data: DSEventItem[] = []
    if (dataStr != null) {
      data = parseJSON(dataStr)
    }

    data.forEach((item: DSEventItem) => {
      this.set(item.id, item.time, item.value, item.category_id)
    })
  }

  static set(id: number, time: Date, value: number, categoryID: number): void {
    const category = DSCategory.fetch(categoryID)
    if (category == null) {
      return
    }

    const event = new this(id, time, value, category)
    this.records[id] = event
    if (this.recordsByCategory[event.category.id] == null) {
      this.recordsByCategory[event.category.id] = [event]
    } else {
      this.recordsByCategory[event.category.id].push(event)
    }
  }

  static nextID(): number {
    return nextID("events_curr_id")
  }

  static create(time: Date, value: number, categoryID: number): void {
    const category = DSCategory.fetch(categoryID)
    if (category == null) {
      throw "Missing category"
    }

    this.set(this.nextID(), time, value, categoryID)
    this.store()
  }

  static store(): void {
    storeRecords(this.key(), this.records)
  }

  key(): string {
    return `event_${this.id}`
  }

  toJSON(): object {
    return { id: this.id, time: this.time, value: this.value, category_id: this.category.id }
  }
}

interface DSCategoryItem {
  id: number
  name: string
  parent_id: number | null
}

class DSCategory implements Serializable {
  id: number
  name: string
  parent: DSCategory | null

  static records: { [x: number]: DSCategory } = {}
  static recordsByParent: { [x: number]: DSCategory[] } = {}

  constructor(id: number, name: string, parent: DSCategory | null) {
    this.id = id
    this.name = name
    this.parent = parent
  }

  static key(): string {
    return "categories"
  }

  static load(): void {
    const dataStr = storage.getItem(this.key())
    let data: DSCategoryItem[] = []
    if (dataStr != null) {
      data = parseJSON(dataStr)
    }

    data.forEach((item: DSCategoryItem) => {
      this.set(item.id, item.name, item.parent_id)
    })
  }

  static set(id: number, name: string, parentID: number | null): void {
    const parent = parentID == null ? null : this.records[parentID]
    const category = new this(id, name, parent)
    this.records[id] = category
    const level = parentID ?? -1
    if (this.recordsByParent[level] == null) {
      this.recordsByParent[level] = [category]
    } else {
      this.recordsByParent[level].push(category)
    }
  }

  static fetch(id: number): DSCategory | null {
    return this.records[id]
  }

  static nextID(): number {
    return nextID("categories_curr_id")
  }

  static store(): void {
    storeRecords(this.key(), this.records)
  }

  static create(name: string, parentID: number | null): void {
    if (name.length < 1) {
      throw "Invalid name"
    }

    this.set(this.nextID(), name, parentID)
    this.store()
  }

  key(): string {
    return `category_${this.id}`
  }

  toJSON(): object {
    return { id: this.id, name: this.name, parent_id: this.parent?.id }
  }
}

function checkSchemaVersion(): void {
  const schemaVersionData = storage.getItem("schemaVersion")
  if (schemaVersionData == null) {
    storage.setItem("schemaVersion", schemaVersion.toString())
    return
  }

  const localSchemaVersion = parseInt(schemaVersionData, 10)
  if (localSchemaVersion > schemaVersion) {
    throw "Schema version not supported"
  }

  if (localSchemaVersion < schemaVersion) {
    console.warn(
      `Local schema version: ${localSchemaVersion}, migration required`
    )
  }
}

function renderCategories(): void {
  const categoriesElement = document.getElementById("categories")
  if (!(categoriesElement instanceof HTMLElement)) {
    throw "Missing element"
  }
  categoriesElement.innerHTML = ""

  const newEventCategoryElement = document.getElementById("new_event_category")
  if (!(newEventCategoryElement instanceof HTMLSelectElement)) {
    throw "Missing element"
  }
  renderCategoriesSelect(newEventCategoryElement, "-- Select a category --")

  const newCategoryParentElement = document.getElementById("new_category_parent")
  if (!(newCategoryParentElement instanceof HTMLSelectElement)) {
    throw "Missing element"
  }
  renderCategoriesSelect(newCategoryParentElement, "-- Select a parent category --")

  if (Object.keys(DSCategory.records).length < 1) {
    let p = document.createElement("p")
    p.textContent =
      "You didn't create any category yet. Create a new category using the form below."
    categoriesElement.append(p)
    return
  }

  categoriesElement.append(renderCategoriesHierarchy(-1));

  for (const key in DSCategory.records) {
    if (Object.hasOwnProperty.call(DSCategory.records, key)) {
      const category = DSCategory.records[key]
      const categoryElement = document.createElement("div")
      categoryElement.id = `category_${category.id}`
      categoriesElement.append(renderCategory(categoryElement, category))
    }
  }
}

function renderCategoriesHierarchy(level: number): HTMLElement | string {
  const children = DSCategory.recordsByParent[level] ?? [];
  if (children.length < 1) {
    return "";
  }

  const categoryReferencesElement = document.createElement("ul")

  DSCategory.recordsByParent[level].forEach((/** @type {DSCategory} */ category: DSCategory) => {
    const categoryReferenceItemElement = document.createElement("li")
    categoryReferencesElement.append(categoryReferenceItemElement)

    const categoryReferenceElement = document.createElement("a")
    categoryReferenceElement.href = `#category_${category.id}`
    categoryReferenceElement.textContent = category.name
    categoryReferenceItemElement.append(categoryReferenceElement)
    categoryReferenceItemElement.append(renderCategoriesHierarchy(category.id))
  });

  return categoryReferencesElement;
}

function renderCategoriesSelect(element: HTMLSelectElement, defaultOption: string): void {
  element.innerHTML = ""

  const defaultOptionElement = document.createElement("option")
  defaultOptionElement.textContent = defaultOption
  defaultOptionElement.value = ""
  element.append(defaultOptionElement)

  for (const key in DSCategory.records) {
    if (Object.hasOwnProperty.call(DSCategory.records, key)) {
      const category = DSCategory.records[key]
      const optionElement = document.createElement("option")
      optionElement.textContent = category.name
      optionElement.value = category.id.toString()
      element.append(optionElement)
    }
  }
}

function renderCategory(element: HTMLElement, category: DSCategory): HTMLElement {
  let categoryName = document.createElement("h3")
  categoryName.textContent = category.name
  element.append(categoryName)

  const events = DSEvent.recordsByCategory[category.id] ?? []
  let categoryMetadata = document.createElement("p")
  categoryMetadata.textContent = `You've done it ${pluralize(
    events.length,
    "time",
    "times"
  )}.`
  element.append(categoryMetadata)

  let categoryForm = document.createElement("form")
  categoryForm.id = `category_${category.id}_form`
  categoryForm.onsubmit = trackNow(category)
  element.append(categoryForm)

  let trackNowButton = document.createElement("input")
  trackNowButton.type = "submit"
  trackNowButton.value = "Track now"
  categoryForm.append(trackNowButton)

  let eventsList = document.createElement("ol")
  events.forEach(function (event) {
    let eventItem = document.createElement("li")
    eventItem.textContent = `Time: ${event.time}, Value: ${event.value}`
    eventsList.append(eventItem)
  })
  element.append(eventsList)

  return element
}

function trackNow(category: DSCategory): (event: Event) => void {
  return function (event: Event) {
    event.preventDefault()

    DSEvent.create(new Date(), 1, category.id)

    const categoryContainer = document.getElementById(`category_${category.id}`)
    if (!(categoryContainer instanceof HTMLElement)) {
      throw "Missing element"
    }
    categoryContainer.innerHTML = ""
    renderCategory(categoryContainer, category)
  }
}

function renderEvents(): void {
  const eventsElement = document.getElementById("events")
  if (!(eventsElement instanceof HTMLElement)) {
    throw "Missing element"
  }

  const eventsList = document.createElement("ol")
  eventsElement.append(eventsList)
  for (const key in DSEvent.records) {
    if (Object.hasOwnProperty.call(DSEvent.records, key)) {
      const event = DSEvent.records[key];
      const eventItem = document.createElement("li")
      eventsList.append(eventItem)
      const text = document.createTextNode(`Time: ${event.time}, Value: ${event.value}, Category: `)
      eventItem.append(text)
      const categoryReferenceElement = document.createElement("a")
      categoryReferenceElement.href = `#category_${event.category.id}`
      categoryReferenceElement.textContent = event.category.name
      eventItem.append(categoryReferenceElement)
    }
  }
}

function createNewEvent(event: Event): void {
  event.preventDefault()

  const newEventTimeElement = document.getElementById("new_event_time")
  if (!(newEventTimeElement instanceof HTMLInputElement)) {
    throw "Missing field"
  }
  let newEventTime = new Date()
  if (newEventTimeElement.value.length > 1) {
    newEventTime = new Date(newEventTimeElement.value)
  }

  const newEventValueElement = document.getElementById("new_event_value")
  if (!(newEventValueElement instanceof HTMLInputElement)) {
    throw "Missing field"
  }
  const newEventValue = parseFloat(newEventValueElement.value)

  const newEventCategoryElement = document.getElementById("new_event_category")
  if (!(newEventCategoryElement instanceof HTMLSelectElement)) {
    throw "Missing field"
  }
  const newEventCategoryID = parseInt(newEventCategoryElement.value, 10)
  const category = DSCategory.fetch(newEventCategoryID);
  if (category == null) {
    throw "Invalid category"
  }

  DSEvent.create(newEventTime, newEventValue, newEventCategoryID)
  renderEvents()

  const categoryContainer = document.getElementById(`category_${category.id}`)
  if (!(categoryContainer instanceof HTMLElement)) {
    throw "Missing element"
  }
  categoryContainer.innerHTML = ""
  renderCategory(categoryContainer, category)

  // clear form
  newEventTimeElement.value = ""
  newEventValueElement.value = ""
  newEventCategoryElement.value = ""
}

function createNewCategory(event: Event): void {
  event.preventDefault()

  const newCategoryNameElement = document.getElementById("new_category_name")
  if (!(newCategoryNameElement instanceof HTMLInputElement)) {
    throw "Missing field"
  }
  const newCategoryName = newCategoryNameElement.value

  const newCategoryParentElement = document.getElementById("new_category_parent")
  if (!(newCategoryParentElement instanceof HTMLSelectElement)) {
    throw "Missing field"
  }
  const newCategoryParentID = parseInt(newCategoryParentElement.value, 10)

  DSCategory.create(newCategoryName, isNaN(newCategoryParentID) ? null : newCategoryParentID)
  renderCategories()

  // clear form
  newCategoryNameElement.value = ""
  newCategoryParentElement.value = ""
}

function nextID(key: string): number {
  const currIDData = storage.getItem(key)
  let currID
  if (currIDData == null) {
    currID = 0
  } else {
    currID = parseInt(currIDData, 10)
  }

  currID++
  storage.setItem(key, currID.toString())
  return currID
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count == 1 ? singular : plural}`
}

function deserializeDate(key: string, value: string | number): string | number | Date {
  if (key === "time") {
    return new Date(value)
  }

  return value
}

function parseJSON(data: string): any {
  return JSON.parse(data, deserializeDate)
}

function storeRecords(key: string, records: { [x: string]: Serializable }): void {
  let data = []
  for (const key in records) {
    if (Object.hasOwnProperty.call(records, key)) {
      const record = records[key]
      data.push(record.toJSON())
    }
  }
  storage.setItem(key, JSON.stringify(data))
}