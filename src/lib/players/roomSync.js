/*
 * Ordering and echo guards for the preview-room "room-updated" events
 * (issue #1574): without them, changing shots quickly floods the room and
 * each client re-applies stale in-flight states and re-broadcasts them,
 * leaving two clients oscillating between the last two videos.
 *
 * The sequence number is a hybrid logical clock: wall-clock milliseconds
 * merged with the highest sequence seen in the room, so values are
 * comparable across clients and strictly monotonic locally.
 *
 * The Zou event server rebuilds the relayed payload from a field
 * whitelist, so a standalone `room_seq` field is stripped in transit on
 * current servers. The sequence therefore also rides inside `local_id`
 * ("<uuid>#<seq>"), which is relayed verbatim. Old clients only compare
 * `local_id` with their own plain uuid, so the suffix is invisible to
 * them, and events without any sequence are always applied.
 */

const SEQ_SEPARATOR = '#'

export const nextRoomSeq = (localSeq = 0, lastAppliedSeq = 0) =>
  Math.max(Date.now(), localSeq + 1, lastAppliedSeq + 1)

export const withRoomSeq = (localId, seq) => `${localId}${SEQ_SEPARATOR}${seq}`

export const senderIdOf = localId => {
  if (typeof localId !== 'string') return localId
  const index = localId.indexOf(SEQ_SEPARATOR)
  return index === -1 ? localId : localId.slice(0, index)
}

export const roomSeqOf = eventData => {
  if (Number.isFinite(eventData?.room_seq)) return eventData.room_seq
  if (typeof eventData?.local_id !== 'string') return null
  const index = eventData.local_id.indexOf(SEQ_SEPARATOR)
  if (index === -1) return null
  const seq = Number(eventData.local_id.slice(index + 1))
  return Number.isFinite(seq) ? seq : null
}

export const shouldApplyRoomUpdate = ({
  localId,
  localSeq = 0,
  lastAppliedSeq = 0,
  eventData
}) => {
  if (!eventData) return false
  // Self-echo: the server sends our own updates back to us.
  if (localId && senderIdOf(eventData.local_id) === localId) return false
  const seq = roomSeqOf(eventData)
  // No sequence: event from an older client, apply as before.
  if (seq === null) return true
  // Stale or out-of-order: older than the last applied remote update or
  // than the user's own last local action.
  return seq > localSeq && seq > lastAppliedSeq
}
