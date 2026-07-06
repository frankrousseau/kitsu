// Socket event names shared between the preview-room composables
// (previewRoom.js and annotationBroadcast.js): one definition, no
// stringly-typed duplication.
export const PREVIEW_ROOM_EVENTS = {
  join: 'preview-room:join',
  leave: 'preview-room:leave',
  openPlaylist: 'preview-room:open-playlist',
  closePlaylist: 'preview-room:close-playlist',
  roomUpdated: 'preview-room:room-updated',
  roomPeopleUpdated: 'preview-room:room-people-updated',
  addAnnotation: 'preview-room:add-annotation',
  removeAnnotation: 'preview-room:remove-annotation',
  panzoomChanged: 'preview-room:panzoom-changed',
  comparisonPanzoomChanged: 'preview-room:comparison-panzoom-changed'
}
