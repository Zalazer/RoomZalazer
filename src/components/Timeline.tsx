type TimelineProps = {
  roomId: number
  times: string[]
  timelineClass: (
    roomId: number,
    slot: string
  ) => string
}

function Timeline({
  roomId,
  times,
  timelineClass,
}: TimelineProps) {
  return (
    <div className="timeline">
      {times.map((slot) => (
        <div
          key={slot}
          className={`t ${timelineClass(
            roomId,
            slot
          )}`}
        />
      ))}
    </div>
  )
}

export default Timeline
