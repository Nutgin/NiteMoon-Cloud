/**
 * Force fix for menu active state in dark mode with black theme
 */
export function fixMenuActiveState() {
  // Check if we're in dark mode with black color palette
  const isDarkMode = document.documentElement.getAttribute('data-theme-mode') === 'dark';
  const isBlackPalette = document.documentElement.getAttribute('data-color-palette') === 'black';
  
  if (!isDarkMode || !isBlackPalette) return;
  
  // First, clear all previously forced styles from all menu items
  const allMenuItems = document.querySelectorAll('[class*="bg-action-hover"], [class*="bg-primary"][class*="hover"]');
  allMenuItems.forEach(item => {
    const element = item as HTMLElement;
    // Remove forced styles
    element.style.removeProperty('background-color');
    element.style.removeProperty('background');
    element.style.backgroundColor = '';
    element.style.background = '';
    
    // Remove forced text colors from children
    const childElements = item.querySelectorAll('*');
    childElements.forEach(child => {
      const childElement = child as HTMLElement;
      childElement.style.removeProperty('color');
      childElement.style.color = '';
    });
  });
  
  // Then, apply white background only to currently active menu items
  const activeMenuItems = document.querySelectorAll('.dark-black-theme-active-menu');
  
  activeMenuItems.forEach(item => {
    // Force white background
    (item as HTMLElement).style.backgroundColor = '#FFFFFF';
    (item as HTMLElement).style.background = '#FFFFFF';
    (item as HTMLElement).style.setProperty('background-color', '#FFFFFF', 'important');
    (item as HTMLElement).style.setProperty('background', '#FFFFFF', 'important');
    
    // Force black text for all child elements
    const childElements = item.querySelectorAll('*');
    childElements.forEach(child => {
      (child as HTMLElement).style.color = '#000000';
      (child as HTMLElement).style.setProperty('color', '#000000', 'important');
    });
  });
}

// Run the fix immediately and also observe for changes
if (typeof window !== 'undefined') {
  // Run immediately
  setTimeout(fixMenuActiveState, 100);
  
  // Also run when DOM changes (for dynamic content)
  const observer = new MutationObserver(() => {
    setTimeout(fixMenuActiveState, 50);
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });
}
