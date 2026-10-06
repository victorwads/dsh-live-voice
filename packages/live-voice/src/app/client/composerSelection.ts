/** Preserve browser selection around DSH's synchronous, whole-draft editor write.
 * Selection changes are published back through the editor's normal selectionchange bridge.
 * Capture offsets, not live Ranges: setDraft replaces the underlying text nodes.
 */
export function preserveComposerSelection(write: () => void, doc: Document = document) {
  const active = doc.activeElement as HTMLElement | null;
  const selection = doc.getSelection();
  const editable = active?.closest<HTMLElement>('[contenteditable="true"]');
  const ownsSelection =
    editable &&
    selection?.anchorNode &&
    selection.focusNode &&
    editable.contains(selection.anchorNode) &&
    editable.contains(selection.focusNode);
  const offset = (node: Node, at: number) => {
    const range = doc.createRange();
    range.selectNodeContents(editable!);
    range.setEnd(node, at);
    return range.toString().length;
  };
  const anchor = ownsSelection ? offset(selection!.anchorNode!, selection!.anchorOffset) : null;
  const focus = ownsSelection ? offset(selection!.focusNode!, selection!.focusOffset) : null;
  const outside =
    !ownsSelection && selection?.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
  const input = active as HTMLInputElement | HTMLTextAreaElement | null;
  const inputSelection =
    input && typeof input.selectionStart === 'number'
      ? {
          start: input.selectionStart,
          end: input.selectionEnd!,
          direction: input.selectionDirection!,
        }
      : null;
  const scrollTop = active?.scrollTop,
    scrollLeft = active?.scrollLeft;
  const bookmark = (node: Node, at: number) => {
    const path: number[] = [];
    let child = node;
    while (child !== editable && child.parentNode) {
      path.unshift(Array.prototype.indexOf.call(child.parentNode.childNodes, child));
      child = child.parentNode;
    }
    return { path, at, type: node.nodeType, text: node.textContent };
  };
  const anchorMark = ownsSelection
    ? bookmark(selection!.anchorNode!, selection!.anchorOffset)
    : null;
  const focusMark = ownsSelection ? bookmark(selection!.focusNode!, selection!.focusOffset) : null;
  write();
  if (active?.isConnected && doc.activeElement !== active) active.focus({ preventScroll: true });
  if (ownsSelection && editable!.isConnected) {
    const point = (at: number): [Node, number] => {
      const walker = doc.createTreeWalker(editable!, 4);
      let node: Node | null;
      let last: Node = editable!;
      while ((node = walker.nextNode())) {
        last = node;
        const length = node.textContent?.length ?? 0;
        if (at <= length) return [node, at];
        at -= length;
      }
      return [last, last === editable ? last.childNodes.length : (last.textContent?.length ?? 0)];
    };
    const restorePoint = (mark: NonNullable<typeof anchorMark>, at: number): [Node, number] => {
      let node: Node | undefined = editable!;
      for (const index of mark.path) node = node?.childNodes[index];
      // Preserve paragraph/empty-line boundaries when the rebuilt structure matches.
      if (
        node &&
        node.nodeType === mark.type &&
        (node.nodeType !== 3 || node.textContent?.startsWith(mark.text ?? '')) &&
        mark.at <= (node.nodeType === 3 ? node.textContent!.length : node.childNodes.length)
      )
        return [node, mark.at];
      return point(at);
    };
    const [a, ao] = restorePoint(anchorMark!, anchor!);
    const [f, fo] = restorePoint(focusMark!, focus!);
    selection!.setBaseAndExtent(a, ao, f, fo);
    // Let Lexical adopt the restored DOM selection instead of retaining selectEnd().
    doc.dispatchEvent(new doc.defaultView!.Event('selectionchange'));
  } else if (inputSelection && active?.isConnected) {
    input!.setSelectionRange(inputSelection.start, inputSelection.end, inputSelection.direction);
  } else if (outside?.startContainer.isConnected && outside.endContainer.isConnected) {
    selection?.removeAllRanges();
    selection?.addRange(outside);
  }
  if (active?.isConnected) {
    active.scrollTop = scrollTop!;
    active.scrollLeft = scrollLeft!;
  }
}
