/**
 * Display module for MemeTee landing page.
 * Pure DOM manipulation — no GSAP, no framework.
 * Intended to be loaded as a browser ES module (script type="module").
 */

/**
 * Removes all child nodes from a container element.
 *
 * @param {HTMLElement} container - The element to clear.
 * @returns {void}
 */
function clearContainer(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

/**
 * Creates a placeholder div with class 'result-placeholder'.
 *
 * @returns {HTMLDivElement} The placeholder element.
 */
function createPlaceholder() {
  const placeholder = document.createElement('div');
  placeholder.className = 'result-placeholder';
  return placeholder;
}

/**
 * Clears the container and renders a meme image inside it.
 *
 * @param {string} url - The image URL to display.
 * @param {HTMLElement} container - The element to render into.
 * @returns {void}
 */
export function showMeme(url, container) {
  clearContainer(container);
  const img = document.createElement('img');
  img.src = url;
  img.className = 'result-image';
  container.appendChild(img);
}

/**
 * Clears the container and renders a CSS t-shirt structure with the meme
 * overlaid on the shirt body.
 *
 * Structure:
 *   .tshirt-shape
 *     .tshirt-sleeve  (left)
 *     .tshirt-sleeve  (right)
 *     .tshirt-body
 *       .tshirt-neckline
 *       img.tshirt-meme-overlay
 *
 * @param {string} memeUrl - The meme image URL to overlay on the t-shirt.
 * @param {HTMLElement} container - The element to render into.
 * @returns {void}
 */
export function showTshirt(memeUrl, container) {
  clearContainer(container);

  const shape = document.createElement('div');
  shape.className = 'tshirt-shape';

  const leftSleeve = document.createElement('div');
  leftSleeve.className = 'tshirt-sleeve';

  const rightSleeve = document.createElement('div');
  rightSleeve.className = 'tshirt-sleeve';

  const body = document.createElement('div');
  body.className = 'tshirt-body';

  const neckline = document.createElement('div');
  neckline.className = 'tshirt-neckline';

  const overlay = document.createElement('img');
  overlay.src = memeUrl;
  overlay.className = 'tshirt-meme-overlay';

  body.appendChild(neckline);
  body.appendChild(overlay);

  shape.appendChild(leftSleeve);
  shape.appendChild(rightSleeve);
  shape.appendChild(body);

  container.appendChild(shape);
}

/**
 * Makes the results section visible by setting display to 'block'.
 *
 * @param {HTMLElement} section - The section element to show.
 * @returns {void}
 */
export function showResults(section) {
  section.style.display = 'block';
}

/**
 * Hides the results section by setting display to 'none'.
 *
 * @param {HTMLElement} section - The section element to hide.
 * @returns {void}
 */
export function hideResults(section) {
  section.style.display = 'none';
}

/**
 * Resets both result containers by clearing their content and restoring
 * a placeholder element in each.
 *
 * @param {HTMLElement} memeContainer - The meme result container.
 * @param {HTMLElement} tshirtContainer - The t-shirt result container.
 * @returns {void}
 */
export function resetResults(memeContainer, tshirtContainer) {
  clearContainer(memeContainer);
  memeContainer.appendChild(createPlaceholder());

  clearContainer(tshirtContainer);
  tshirtContainer.appendChild(createPlaceholder());
}
