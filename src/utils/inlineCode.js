// Rich text: `cmd` -> <code class="inline-code">cmd</code>. Style .inline-code in the Designer.
export function initInlineCode() {
  document.querySelectorAll('.w-richtext').forEach((rt) => {
    const walker = document.createTreeWalker(rt, NodeFilter.SHOW_TEXT, {
      // Skip real code blocks, their backticks are content.
      acceptNode: (node) =>
        node.parentElement.closest('pre, code') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
    });
    const nodes = [];
    while (walker.nextNode()) {
      if (/`[^`]+`/.test(walker.currentNode.nodeValue)) nodes.push(walker.currentNode);
    }

    nodes.forEach((node) => {
      const frag = document.createDocumentFragment();
      node.nodeValue.split(/`([^`]+)`/).forEach((part, i) => {
        if (i % 2) {
          const code = document.createElement('code');
          code.className = 'inline-code';
          code.textContent = part;
          frag.appendChild(code);
        } else if (part) frag.appendChild(document.createTextNode(part));
      });
      node.parentNode.replaceChild(frag, node);
    });
  });
}
