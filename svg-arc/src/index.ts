const svgArcRadius = 150
const svgArcOffset: [number, number] = [300, 200]

const svgArcState = {
  startAngle: 0,
  sweep: 90,
}

function pathD(): string {
  const start = pointInCircle(svgArcRadius, svgArcState.startAngle, svgArcOffset)
  const end = pointInCircle(svgArcRadius, svgArcState.startAngle + svgArcState.sweep, svgArcOffset)
  const move = `M ${svgArcOffset[0]} ${svgArcOffset[1]}`
  const line = `L ${start[0]} ${start[1]}`
  const arc = `A ${svgArcRadius} ${svgArcRadius} 0 ${svgArcState.sweep > 180 ? 0 : 1} 0 ${end[0]} ${end[1]}`
  return `${move} ${line} ${arc} Z`
}

function toRadians(angle: number): number {
  return (Math.PI / 180) * angle
}

function pointInCircle(radius: number, angle: number, offset: [number, number]): [number, number] {
  const x = Math.cos(toRadians(angle)) * radius + offset[0]
  const y = Math.sin(toRadians(angle)) * radius + offset[1]
  return [x, y]
}

function updateSVG(): void {
  const start = pointInCircle(svgArcRadius, svgArcState.startAngle, svgArcOffset)
  const startDot = document.getElementById("start_dot") as unknown as SVGCircleElement
  startDot.setAttribute('cx', start[0].toString())
  startDot.setAttribute('cy', start[1].toString())

  const end = pointInCircle(svgArcRadius, svgArcState.startAngle + svgArcState.sweep, svgArcOffset)
  const endDot = document.getElementById("end_dot") as unknown as SVGCircleElement
  endDot.setAttribute('cx', end[0].toString())
  endDot.setAttribute('cy', end[1].toString())

  const path = document.getElementById("path") as unknown as SVGPathElement
  path.setAttribute('d', pathD())
}

function updateForm(): void {
  const startAngleText = document.getElementById("start_angle_text") as HTMLSpanElement
  startAngleText.textContent = svgArcState.startAngle.toString()
  const sweepText = document.getElementById("sweep_text") as HTMLSpanElement
  sweepText.textContent = svgArcState.sweep.toString()
}

function updateUI(): void {
  updateSVG()
  updateForm()
}

function onStartAngleChange(event: Event): void {
  const value = (event.target as HTMLInputElement).value
  svgArcState.startAngle = parseInt(value, 10)
  updateUI()
}

function onSweepChange(event: Event): void {
  const value = (event.target as HTMLInputElement).value
  svgArcState.sweep = parseInt(value, 10)
  updateUI()
}

window.onload = function (): void {
  updateUI()

  const startAngle = document.getElementById("start_angle") as HTMLInputElement
  startAngle.value = svgArcState.startAngle.toString()
  startAngle.oninput = onStartAngleChange

  const sweep = document.getElementById("sweep") as HTMLInputElement
  sweep.value = svgArcState.sweep.toString()
  sweep.oninput = onSweepChange
}
