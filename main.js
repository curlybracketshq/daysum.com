const storage = window.localStorage
const schemaVersion = 1
let isInitialized = false

class DSEvent {
  /**
   * @param {number} id
   * @param {Date} time
   * @param {number} value
   * @param {DSCategory} category
   */
  constructor(id, time, value, category) {
    this.id = id
    this.time = time
    this.value = value
    this.category = category
  }

  /**
   * @type {{ [x: number]: DSEvent; }}
   */
  static records = {}

  /**
   * @type {{ [x: number]: DSEvent[]; }}
   */
  static recordsByCategory = {}

  /**
   * @type {number}
   */
  static currID = 0

  /**
   * @returns {string}
   */
  static key() {
    return "events"
  }

  /**
   * @returns {void}
   */
  static load() {
    const dataStr = storage.getItem(this.key())
    let data = []
    if (dataStr != null) {
      data = parseJSON(dataStr)
    }

    data.forEach((/** @type {{ id: number; time: Date, value: number, category_id: number; }} */ item) => {
      this.set(item.id, item.time, item.value, item.category_id)
    })
  }

  /**
   * @param {number} id
   * @param {Date} time
   * @param {number} value
   * @param {number} categoryID
   */
  static set(id, time, value, categoryID) {
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

  /**
   * @returns {number}
   */
  static nextID() {
    return nextID("events_curr_id")
  }

  /**
   * @param {Date} time
   * @param {number} value
   * @param {number} categoryID
   * @returns {void}
   */
  static create(time, value, categoryID) {
    const category = DSCategory.fetch(categoryID)
    if (category == null) {
      throw "Missing category"
    }

    this.set(this.nextID(), time, value, categoryID)
    this.store()
  }

  /**
   * @returns {void}
   */
  static store() {
    storeRecords(this.key(), this.records)
  }

  /**
   * @returns {string}
   */
  key() {
    return `event_${this.id}`
  }

  /**
   * @returns {Object}
   */
  toJSON() {
    return { id: this.id, time: this.time, value: this.value, category_id: this.category.id }
  }
}

class DSCategory {
  /**
   * @param {number} id
   * @param {string} name
   * @param {?DSCategory} parent
   */
  constructor(id, name, parent) {
    this.id = id
    this.name = name
    this.parent = parent
  }

  /**
   * @type {{ [x: number]: DSCategory; }}
   */
  static records = {}

  /**
   * @type {{ [x: number]: DSCategory[]; }}
   */
  static recordsByParent = {}

  /**
   * @returns {string}
   */
  static key() {
    return "categories"
  }

  /**
   * @returns {void}
   */
  static load() {
    const dataStr = storage.getItem(this.key())
    let data = []
    if (dataStr != null) {
      data = parseJSON(dataStr)
    }

    data.forEach((/** @type {{ id: number; name: string; parent_id: number; }} */ item) => {
      this.set(item.id, item.name, item.parent_id)
    })
  }

  /**
   * @param {number} id
   * @param {string} name
   * @param {number} parentID
   * @returns {void}
   */
  static set(id, name, parentID) {
    const parent = this.records[parentID]
    const category = new this(id, name, parent)
    this.records[id] = category
    const level = parentID ?? -1
    if (this.recordsByParent[level] == null) {
      this.recordsByParent[level] = [category]
    } else {
      this.recordsByParent[level].push(category)
    }
  }

  /**
   * @param {number} id
   * @returns {?DSCategory}
   */
  static fetch(id) {
    return this.records[id]
  }

  /**
   * @returns {number}
   */
  static nextID() {
    return nextID("categories_curr_id")
  }

  /**
   * @returns {void}
   */
  static store() {
    storeRecords(this.key(), this.records)
  }

  /**
   * @param {string} name
   * @param {number} parentID
   * @returns {void}
   */
  static create(name, parentID) {
    if (name.length < 1) {
      throw "Invalid name"
    }

    this.set(this.nextID(), name, parentID)
    this.store()
  }

  /**
   * @returns {string}
   */
  key() {
    return `category_${this.id}`
  }

  /**
   * @returns {Object}
   */
  toJSON() {
    return { id: this.id, name: this.name, parent_id: this.parent?.id }
  }
}


/**
 * @returns {void}
 */
function init() {
  if (isInitialized) {
    throw "App already initialized"
  }

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

  isInitialized = true
}

/**
 * @returns {void}
 */
function checkSchemaVersion() {
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

/**
 * @returns {void}
 */
function renderCategories() {
  const categoriesElement = document.getElementById("categories")
  if (!(categoriesElement instanceof HTMLElement)) {
    throw "Missing element"
  }
  categoriesElement.innerHTML = ""

  if (Object.keys(DSCategory.records).length < 1) {
    let p = document.createElement("p")
    p.textContent =
      "You didn't create any category yet. Create a new category using the form below."
    categoriesElement.append(p)
    return
  }

  categoriesElement.append(renderCategoriesHierarchy(-1));

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

  for (const key in DSCategory.records) {
    if (Object.hasOwnProperty.call(DSCategory.records, key)) {
      const category = DSCategory.records[key]
      const categoryElement = document.createElement("div")
      categoryElement.id = `category_${category.id}`
      categoriesElement.append(renderCategory(categoryElement, category))
    }
  }
}

/**
 * @param {number} level
 * @returns {HTMLElement | string}
 */
function renderCategoriesHierarchy(level) {
  const children = DSCategory.recordsByParent[level] ?? [];
  if (children.length < 1) {
    return "";
  }

  const categoryReferencesElement = document.createElement("ul")

  DSCategory.recordsByParent[level].forEach((/** @type {DSCategory} */ category) => {
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

/**
 * @param {HTMLSelectElement} element
 * @param {string} defaultOption
 * @returns {void}
 */
function renderCategoriesSelect(element, defaultOption) {
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

/**
 * @param {HTMLElement} element
 * @param {DSCategory} category
 * @returns {HTMLElement}
 */
function renderCategory(element, category) {
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

/**
 * @param {DSCategory} category
 * @returns {(event: { preventDefault: () => void; }) => void}
 */
function trackNow(category) {
  return function (/** @type {{ preventDefault: () => void; }} */ event) {
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

/**
 * @returns {void}
 */
function renderEvents() {
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

/**
 * @param {{ preventDefault: () => void; }} event
 * @returns {void}
 */
function createNewEvent(event) {
  event.preventDefault()

  if (!isInitialized) {
    throw "App not initialized"
  }

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

/**
 * @param {{ preventDefault: () => void; }} event
 * @returns {void}
 */
function createNewCategory(event) {
  event.preventDefault()

  if (!isInitialized) {
    throw "App not initialized"
  }

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

  DSCategory.create(newCategoryName, newCategoryParentID)
  renderCategories()

  // clear form
  newCategoryNameElement.value = ""
  newCategoryParentElement.value = ""
}


/**
 * @param {string} key
 * @returns {number}
 */
function nextID(key) {
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

/**
 * @param {number} count
 * @param {string} singular
 * @param {string} plural
 * @returns {string}
 */
function pluralize(count, singular, plural) {
  return `${count} ${count == 1 ? singular : plural}`
}

/**
 * @param {string} key
 * @param {string | number} value
 * @returns {string | number | Date}
 */
function deserializeDate(key, value) {
  if (key === "time") {
    return new Date(value)
  }

  return value
}

/**
 * @param {string} data
 * @returns {Object}
 */
function parseJSON(data) {
  return JSON.parse(data, deserializeDate)
}

/**
 * @param {string} key
 * @param {{ [x: string]: { toJSON: () => string; }; }} records
 * @returns {void}
 */
function storeRecords(key, records) {
  let data = []
  for (const key in records) {
    if (Object.hasOwnProperty.call(records, key)) {
      const record = records[key]
      data.push(record.toJSON())
    }
  }
  storage.setItem(key, JSON.stringify(data))
}

window.onload = init
