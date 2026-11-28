export function dialSegmentGeometry(radius = 88, gapDegrees = 1) {
  const innerRadius = 62;
  const segmentDegrees = 360 / 24;
  return Array.from({ length: 24 }, (_, index) => {
    const start = index * segmentDegrees + gapDegrees / 2 - 90;
    const end = (index + 1) * segmentDegrees - gapDegrees / 2 - 90;
    return { index, start, end, outerRadius: radius, innerRadius };
  });
}

export function annularSegmentPath(
  index: number,
  centerX = 115,
  centerY = 115,
) {
  const segment = dialSegmentGeometry(88, 1)[index];
  if (!segment) return "";
  const round = (value: number) => Math.round(value * 1000) / 1000;
  const polar = (radius: number, degrees: number) => ({
    x: round(centerX + radius * Math.cos((degrees * Math.PI) / 180)),
    y: round(centerY + radius * Math.sin((degrees * Math.PI) / 180)),
  });
  const outerStart = polar(segment.outerRadius, segment.start);
  const outerEnd = polar(segment.outerRadius, segment.end);
  const innerEnd = polar(segment.innerRadius, segment.end);
  const innerStart = polar(segment.innerRadius, segment.start);
  const largeArc = segment.end - segment.start <= 180 ? 0 : 1;
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${segment.outerRadius} ${segment.outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${segment.innerRadius} ${segment.innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}
