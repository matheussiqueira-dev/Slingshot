export class EventBus extends EventTarget {
  emit(type, detail = {}) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  on(type, callback) {
    this.addEventListener(type, callback);
    return () => this.removeEventListener(type, callback);
  }
}
