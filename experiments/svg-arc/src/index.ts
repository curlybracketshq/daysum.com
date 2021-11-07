class DSSVGArc {
  static RADIUS = 150
  static OFFSET: [number, number] = [300, 200]
  static STATE = {
    startAngle: 0,
    sweep: 90,
  }

  static pathD(): string {
    const start = this.pointInCircle(this.RADIUS, this.STATE.startAngle, this.OFFSET)
    const end = this.pointInCircle(this.RADIUS, this.STATE.startAngle + this.STATE.sweep, this.OFFSET)
    const move = `M ${this.OFFSET[0]} ${this.OFFSET[1]}`
    const line = `L ${start[0]} ${start[1]}`
    const arc = `A ${this.RADIUS} ${this.RADIUS} 0 ${this.STATE.sweep > 180 ? 0 : 1} 0 ${end[0]} ${end[1]}`
    return `${move} ${line} ${arc} Z`
  }

  static toRadians(angle: number): number {
    return (Math.PI / 180) * angle
  }

  static pointInCircle(radius: number, angle: number, offset: [number, number]): [number, number] {
    const x = Math.cos(this.toRadians(angle)) * radius + offset[0]
    const y = Math.sin(this.toRadians(angle)) * radius + offset[1]
    return [x, y]
  }

  static updateSVG(): void {
    const start = this.pointInCircle(this.RADIUS, this.STATE.startAngle, this.OFFSET)
    const startDot = document.getElementById("start_dot") as unknown as SVGCircleElement
    startDot.setAttribute('cx', start[0].toString())
    startDot.setAttribute('cy', start[1].toString())

    const end = this.pointInCircle(this.RADIUS, this.STATE.startAngle + this.STATE.sweep, this.OFFSET)
    const endDot = document.getElementById("end_dot") as unknown as SVGCircleElement
    endDot.setAttribute('cx', end[0].toString())
    endDot.setAttribute('cy', end[1].toString())

    const path = document.getElementById("path") as unknown as SVGPathElement
    path.setAttribute('d', this.pathD())
  }

  static updateForm(): void {
    const startAngleText = document.getElementById("start_angle_text") as HTMLSpanElement
    startAngleText.textContent = this.STATE.startAngle.toString()
    const sweepText = document.getElementById("sweep_text") as HTMLSpanElement
    sweepText.textContent = this.STATE.sweep.toString()
  }

  static updateUI(): void {
    this.updateSVG()
    this.updateForm()
  }

  static onStartAngleChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value
    this.STATE.startAngle = parseInt(value, 10)
    this.updateUI()
  }

  static onSweepChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value
    this.STATE.sweep = parseInt(value, 10)
    this.updateUI()
  }

  static init(): void {
    console.log(this)
    this.updateUI()

    const startAngle = document.getElementById("start_angle") as HTMLInputElement
    startAngle.value = this.STATE.startAngle.toString()
    startAngle.oninput = (event) => this.onStartAngleChange(event)

    const sweep = document.getElementById("sweep") as HTMLInputElement
    sweep.value = this.STATE.sweep.toString()
    sweep.oninput = (event) => this.onSweepChange(event)
  }
}

window.onload = () => DSSVGArc.init()