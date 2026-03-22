The viewer deliberately avoids the official mermaid.js renderer to enable:
1. Clickable nodes that navigate between classes
2. Custom `@ref` node rendering (glow, expand, nested group reveal)
3. Fine-grained zoom/pan control and focus-exempt behavior
4. Inline detail sidebar driven by the same class data

The dagre library handles graph layout; the viewer draws SVG manually on top of dagre's position output.
