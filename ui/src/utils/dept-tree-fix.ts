/**
 * Force fix for department tree active state in light/dark mode with black theme
 */
export function fixDeptTreeActiveState() {
  // Check current theme mode and color palette
  const themeMode = document.documentElement.getAttribute('data-theme-mode');
  const isBlackPalette = document.documentElement.getAttribute('data-color-palette') === 'black';
  
  // First, restore all tree nodes to default styles
  const allTreeNodes = document.querySelectorAll('.ant-tree-node-content-wrapper');
  allTreeNodes.forEach(node => {
    const element = node as HTMLElement;
    element.style.removeProperty('color');
    element.style.removeProperty('background-color');
    element.style.removeProperty('background');
    
    // Restore styles for all child elements
    const childElements = element.querySelectorAll('*');
    childElements.forEach(child => {
      (child as HTMLElement).style.removeProperty('color');
      (child as HTMLElement).style.removeProperty('background-color');
      (child as HTMLElement).style.removeProperty('background');
    });
  });
  
  // Only apply special styling if we have black color palette
  if (!isBlackPalette) return;
  
  // Find all selected tree nodes
  const selectedNodes = document.querySelectorAll('.ant-tree-node-content-wrapper.ant-tree-node-selected');
  
  selectedNodes.forEach(node => {
    const element = node as HTMLElement;
    
    if (themeMode === 'light') {
      // Light mode + black theme: white text only
      element.style.setProperty('color', '#FFFFFF', 'important');
      
      // Also apply white text to the title and children
      const titleElement = element.querySelector('.ant-tree-title');
      if (titleElement) {
        (titleElement as HTMLElement).style.setProperty('color', '#FFFFFF', 'important');
      }
      
      const childElements = element.querySelectorAll('*');
      childElements.forEach(child => {
        (child as HTMLElement).style.setProperty('color', '#FFFFFF', 'important');
      });
    } else if (themeMode === 'dark') {
      // Dark mode + black theme: white background and black text
      element.style.setProperty('background-color', '#FFFFFF', 'important');
      element.style.setProperty('background', '#FFFFFF', 'important');
      element.style.setProperty('color', '#000000', 'important');
      
      // Also apply styles to the title and children
      const titleElement = element.querySelector('.ant-tree-title');
      if (titleElement) {
        (titleElement as HTMLElement).style.setProperty('color', '#000000', 'important');
      }
      
      const childElements = element.querySelectorAll('*');
      childElements.forEach(child => {
        (child as HTMLElement).style.setProperty('color', '#000000', 'important');
      });
    }
  });
}

// Run the fix immediately and also observe for changes
if (typeof window !== 'undefined') {
  // Run immediately
  setTimeout(fixDeptTreeActiveState, 100);
  
  // Also run when DOM changes (for dynamic content)
  const observer = new MutationObserver(() => {
    setTimeout(fixDeptTreeActiveState, 50);
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'data-theme-mode', 'data-color-palette']
  });
  
  // Also run when theme changes
  const themeObserver = new MutationObserver(() => {
    setTimeout(fixDeptTreeActiveState, 50);
  });
  
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme-mode', 'data-color-palette']
  });
}
