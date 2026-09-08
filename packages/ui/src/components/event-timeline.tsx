type TimelineTone = "neutral" | "warning" | "critical";
type TimelineEvent = { time: string; channel: string; event: string; detail: string; tone: TimelineTone };

export function EventTimeline({ events }: { events: TimelineEvent[] }) {
  return <div className="event-timeline">{events.map((event, index) => <div className="timeline-event" key={`${event.time}-${event.event}`}><div className={`timeline-marker ${event.tone}`} />{index < events.length - 1 && <div className="timeline-line" />}<div className="timeline-time mono">{event.time}</div><div className="timeline-content"><div><strong>{event.event}</strong><span className="channel-chip">{event.channel}</span></div><span className="muted">{event.detail}</span></div></div>)}</div>;
}
