export default defineContentScript({
  matches: ['*://*/*'],
  runAt: 'document_idle',
  main() {
    console.log('[css-snap] content ready');
  },
});
