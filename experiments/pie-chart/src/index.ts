class DSPieChart {
  static RADIUS = 150
  static OFFSET: [number, number] = [300, 200]
  static TINT = "#800000"
  static IS_SORTED = false
  static DATA: Array<{ name: string, value: number }> = [
    { name: "Item 1", value: 10 },
    { name: "Item 2", value: 20 },
    { name: "Item 3", value: 30 },
    { name: "Item 4", value: 15 }
  ]

  static getData(): Array<{ name: string, value: number }> {
    if (!this.IS_SORTED) {
      return this.DATA
    }

    return [...this.DATA].sort((a, b) => a.value - b.value)
  }

  static pathD(startAngle: number, sweep: number): string {
    const start = this.pointInCircle(this.RADIUS, startAngle, this.OFFSET)
    const end = this.pointInCircle(this.RADIUS, startAngle + sweep, this.OFFSET)
    const move = `M ${this.OFFSET[0]} ${this.OFFSET[1]}`
    const line = `L ${start[0]} ${start[1]}`
    const arc = `A ${this.RADIUS} ${this.RADIUS} 0 ${sweep <= 180 ? 0 : 1} 0 ${end[0]} ${end[1]}`
    return `${move} ${line} ${arc} Z`
  }

  static toRadians(angle: number): number {
    return (Math.PI / 180) * angle
  }

  static pointInCircle(radius: number, angle: number, offset: [number, number]): [number, number] {
    const x = Math.cos(this.toRadians(angle)) * radius + offset[0]
    const y = -Math.sin(this.toRadians(angle)) * radius + offset[1]
    return [x, y]
  }

  static colorAlpha(index: number, length: number): string {
    const alpha = 32 + 192 * (index / length)
    return Math.floor(alpha).toString(16)
  }

  static color(index: number, length: number): string {
    return `${this.TINT}${this.colorAlpha(index, length)}`
  }

  static updateSVG(): void {
    const tot = this.DATA.reduce((acc, { value }) => acc + value, 0)
    const svg = document.getElementById("svg") as unknown as SVGElement
    svg.innerHTML = ""

    this.getData().reduce((startAngle, { name, value }, index) => {
      const sweep = value / tot * 360
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
      path.setAttribute("d", this.pathD(startAngle, sweep))
      path.style.fill = this.color(index, this.DATA.length)
      path.dataset.name = name
      svg.appendChild(path);
      return startAngle + sweep
    }, 0)
  }

  static updateData(): void {
    const dataElement = document.getElementById("data") as HTMLElement
    dataElement.innerHTML = ""

    this.getData().forEach(({ name, value }, index) => {
      const itemElement = document.createElement("li")
      const color = document.createElement("span")
      color.style.display = "inline-block"
      color.style.marginRight = "4px"
      color.style.width = "20px"
      color.style.height = "20px"
      color.style.backgroundColor = this.color(index, this.DATA.length)
      itemElement.appendChild(color)
      const text = document.createTextNode(`${name}: ${value} `)
      itemElement.appendChild(text)
      const removeButton = document.createElement("button")
      removeButton.textContent = "Remove"
      removeButton.onclick = () => {
        this.DATA.splice(index, 1)
        this.updateUI()
      }
      itemElement.appendChild(removeButton)
      dataElement.appendChild(itemElement)
    })
  }

  static resetForm(): void {
    const newDataNameElement = document.getElementById("new_data_name") as HTMLInputElement
    newDataNameElement.value = ""
    const newDataValueElement = document.getElementById("new_data_value") as HTMLInputElement
    newDataValueElement.value = ""
  }

  static updateUI(): void {
    this.updateSVG()
    this.updateData()
  }

  static validateNewData({ name, value }: { name: string, value: number }): void {
    if (isNaN(value)) {
      throw "Value is not a number"
    }

    if (value < 0) {
      throw "Value is negative"
    }

    if (name.length == 0) {
      throw "Name is empty"
    }
  }

  static onFormSubmit(event: Event): void {
    event.preventDefault()

    const newDataNameElement = document.getElementById("new_data_name") as HTMLInputElement
    const name = newDataNameElement.value
    const newDataValueElement = document.getElementById("new_data_value") as HTMLInputElement
    const value = parseFloat(newDataValueElement.value)

    this.validateNewData({ name, value })
    this.DATA.push({ name, value })

    this.resetForm()
    this.updateUI()
  }

  static onChartTintInput(event: Event): void {
    const chartTintElement = event.target as HTMLInputElement
    this.TINT = chartTintElement.value
    this.updateUI()
  }

  static onIsSortedChange(event: Event): void {
    const isSortedElement = event.target as HTMLInputElement
    this.IS_SORTED = isSortedElement.checked
    this.updateUI()
  }

  static init(): void {
    this.updateUI()

    const newDataFormElement = document.getElementById("new_data_form") as HTMLFormElement
    newDataFormElement.onsubmit = (event) => this.onFormSubmit(event)

    const chartTintElement = document.getElementById("chart_tint") as HTMLInputElement
    chartTintElement.value = this.TINT
    chartTintElement.oninput = (event) => this.onChartTintInput(event)

    const isSortedElement = document.getElementById("is_sorted") as HTMLInputElement
    isSortedElement.checked = this.IS_SORTED
    isSortedElement.onchange = (event) => this.onIsSortedChange(event)
  }
}

window.onload = () => DSPieChart.init()